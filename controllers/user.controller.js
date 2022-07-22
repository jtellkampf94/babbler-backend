const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const signUpValidation = require("../validation/signUpValidation");
const updateUserValidation = require("../validation/updateUserValidation");
const formatErrorMessage = require("../helpers/formatErrorMessage");
const dbErrorHandler = require("../helpers/dbErrorHandler");
const s3Helpers = require("../helpers/amazonS3Helpers");

dotenv.config();

exports.createUser = async (req, res, next) => {
  const data = { ...req.body };

  if (!data.step)
    return res.status(400).json({ error: "Sign up step required" });

  if (data.step === 1) {
    delete data.step;
    const { error } = signUpValidation.stepOne(data);
    if (error) return res.status(422).json(formatErrorMessage(error));

    try {
      const users = await User.find({
        $or: [{ username: data.username }, { email: data.email }],
      });

      if (users.length > 0) {
        let errorArray = users.map((user) => {
          if (user.email === data.email) {
            return { email: "Email already taken" };
          }
          if (user.username === data.username) {
            return { username: "Username already taken" };
          }
        });

        let errors = {};
        errorArray.forEach((error) => Object.assign(errors, error));

        return res.status(422).json(errors);
      }
    } catch (err) {
      console.log(err);
    }

    return res.status(200).json({ message: "success" });
  }

  if (data.step === 2) {
    delete data.step;
    const { error } = signUpValidation.stepTwo(data);
    if (error) return res.status(422).json(formatErrorMessage(error));
    return res.status(200).json({ message: "success" });
  }

  if (data.step === 4) {
    delete data.step;
    const { error } = signUpValidation.stepFour(data);
    if (error) return res.status(422).json(formatErrorMessage(error));

    try {
      const user = new User(data);
      await user.save();

      const userDetails = { ...user.toObject() };
      delete userDetails.salt;
      delete userDetails.hashedPassword;
      userDetails.expiresAt = Date.now + 24 * 60 * 60 * 1000;
      const token = jwt.sign(userDetails, process.env.JWT_SECRET_KEY);

      return res.status(200).json({ token });
    } catch (err) {
      if (err.code === 11000 && err.message.includes("email"))
        return res.status(422).json({ email: "Email is already taken" });

      if (err.code === 11000 && err.message.includes("username"))
        return res.status(422).json({ username: "Username is already taken" });
      next(err);
    }
  }
};

exports.userByID = async (req, res, next, id) => {
  try {
    const user = await User.findById(id)
      .populate("following", "_id name username profilePictureUrl followers")
      .populate("followers", "_id name username profilePictureUrl followers");

    if (!user)
      return res.status(404).json({
        error: "User not found",
      });
    req.profile = user;
    next();
  } catch (err) {
    return res.status(404).json({
      error: "Could not retrieve user",
    });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const user = req.profile;
    const data = req.body;
    //validate input
    const { error } = updateUserValidation(data);
    if (error) return res.status(422).json(formatErrorMessage(error));
    //check if username or email is unique
    if (data.username) {
      const isUsernameTaken = await User.find({ username: data.username });

      if (isUsernameTaken) {
        if (isUsernameTaken.length === 1) {
          if (isUsernameTaken[0]._id.toString() !== req.user._id.toString()) {
            return res.status(422).json({ username: "Username already taken" });
          }
        } else if (isUsernameTaken.length > 0) {
          return res.status(422).json({ username: "Username already taken" });
        }
      }
    }

    if (data.email) {
      const isEmailTaken = await User.find({ email: data.email });

      if (isEmailTaken) {
        if (isEmailTaken.length === 1) {
          if (isEmailTaken[0]._id.toString() !== req.user._id.toString()) {
            return res.status(422).json({ email: "Email already taken" });
          }
        } else if (isEmailTaken.length > 0) {
          return res.status(422).json({ email: "Email already taken" });
        }
      }
    }

    //check if previous password matches
    if (data.password || data.currentPassword) {
      if (!data.currentPassword)
        return res
          .status(422)
          .json({ currentPassword: "Please enter your current password" });

      if (!user.authenticate(data.currentPassword)) {
        return res.status(422).send({
          currentPassword: "Password incorrect",
        });
      }

      delete data.currentPassword;
    } else {
      delete data.currentPassword;
      delete data.password;
    }

    //4. if any new header or profile images delete old ones from s3
    if (data.profilePictureUrl && user.profilePictureUrl) {
      const startingIndex = user.profilePictureUrl.indexOf(".com/") + 5;
      const imageKey = user.profilePictureUrl.slice(startingIndex);
      await s3Helpers.deleteImageFromS3(
        process.env.AMAZON_S3_BUCKET_NAME,
        imageKey
      );
    }

    if (data.headerImageUrl && user.headerImageUrl) {
      const startingIndex = user.headerImageUrl.indexOf(".com/") + 5;
      const imageKey = user.headerImageUrl.slice(startingIndex);
      await s3Helpers.deleteImageFromS3(
        process.env.AMAZON_S3_BUCKET_NAME,
        imageKey
      );
    }

    //5. updateUser and save
    const fields = Object.keys(data);
    fields.forEach((field) => {
      user[field] = data[field];
    });

    await user.save();
    //6. return new token
    const userDetails = { ...user.toObject() };
    delete userDetails.salt;
    delete userDetails.hashedPassword;
    userDetails.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const token = jwt.sign(userDetails, process.env.JWT_SECRET_KEY);

    return res.status(200).json({ token });
  } catch (error) {
    console.log(error);
    const { message, changeErrCode } = dbErrorHandler(error);
    let errCode = changeErrCode ? 500 : 422;
    return res.status(errCode).json({ error: message });
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = req.profile;
    const deletedUser = { ...user.toObject() };

    // delete images of user on s3 if user has directory in bucket
    const directoryExists = await s3Helpers.isDirectoryInS3Bucket(
      user._id.toString(),
      process.env.AMAZON_S3_BUCKET_NAME
    );

    if (directoryExists) {
      await s3Helpers.deleteDirectoryFromS3Bucket(
        process.env.AMAZON_S3_BUCKET_NAME,
        user._id.toString()
      );
    }
    // delete user
    await user.remove();

    // return deleted user
    delete deletedUser.hashed_password;
    delete deletedUser.salt;
    return res.status(200).json(deletedUser);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getUser = async (req, res, next) => {
  const user = { ...req.profile.toObject() };
  delete user.hashedPassword;
  delete user.salt;
  return res.status(200).json(user);
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select(
      "name username profilePictureUrl followers"
    );
    return res.status(200).json(users);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

exports.followUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $push: { following: req.body.userId },
    });

    await User.findByIdAndUpdate(req.body.userId, {
      $push: { followers: req.user._id },
    });
    const following = await User.findById(req.body.userId)
      .populate("following", "_id name username profilePictureUrl followers")
      .populate("followers", "_id name username profilePictureUrl followers");

    const follower = await User.findById(req.user._id)
      .populate("following", "_id name username profilePictureUrl followers")
      .populate("followers", "_id name username profilePictureUrl followers");

    const followerObj = { ...follower.toObject() };
    const followersMapped = followerObj.followers.map(
      (follower) => follower._id
    );
    const followingMapped = followerObj.following.map(
      (following) => following._id
    );
    followerObj.followers = followersMapped;
    followerObj.following = followingMapped;
    delete followerObj.hashedPassword;
    delete followerObj.salt;
    followerObj.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const token = jwt.sign(followerObj, process.env.JWT_SECRET_KEY);

    const followerRes = { ...follower.toObject() };
    delete followerRes.hashedPassword;
    delete followerRes.salt;

    const followingObj = { ...following.toObject() };
    delete followingObj.hashedPassword;
    delete followingObj.salt;

    return res
      .status(200)
      .json({ token, following: followingObj, follower: followerRes });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

exports.unfollowUser = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { following: req.body.userId },
    });

    await User.findByIdAndUpdate(req.body.userId, {
      $pull: { followers: req.user._id },
    });
    const unfollowing = await User.findById(req.body.userId)
      .populate("following", "_id name username profilePictureUrl followers")
      .populate("followers", "_id name username profilePictureUrl followers");

    const unfollower = await User.findById(req.user._id)
      .populate("following", "_id name username profilePictureUrl followers")
      .populate("followers", "_id name username profilePictureUrl followers");

    const unfollowerObj = { ...unfollower.toObject() };
    const followers = unfollowerObj.followers.map((follower) => follower._id);
    const following = unfollowerObj.following.map((following) => following._id);
    unfollowerObj.followers = followers;
    unfollowerObj.following = following;
    delete unfollowerObj.hashedPassword;
    delete unfollowerObj.salt;
    unfollowerObj.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const token = jwt.sign(unfollowerObj, process.env.JWT_SECRET_KEY);

    const unfollowerRes = { ...unfollower.toObject() };
    delete unfollowerRes.hashedPassword;
    delete unfollowerRes.salt;

    const unfollowingObj = { ...unfollowing.toObject() };
    delete unfollowingObj.hashedPassword;
    delete unfollowingObj.salt;

    return res
      .status(200)
      .json({ token, unfollowing: unfollowingObj, unfollower: unfollowerRes });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getFollowData = async (req, res, next) => {
  try {
    const user = await req.profile;
    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
