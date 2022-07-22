const Post = require("../models/post.model");
const createPostValidation = require("../validation/createPostValidation");
const formatErrorMessage = require("../helpers/formatErrorMessage");
const getErrorMessage = require("../helpers/dbErrorHandler");
const { deleteImageFromS3 } = require("../helpers/amazonS3Helpers");
const dotenv = require("dotenv");

dotenv.config();

exports.postByID = async (req, res, next, id) => {
  try {
    const post = await Post.findById(id)
      .populate("postedBy", "_id name username profilePictureUrl")
      .populate("comments.postedBy", "_id name username profilePictureUrl");
    if (!post)
      return res.status(401).json({
        error: "Post not found",
      });
    req.post = post;
    next();
  } catch (err) {
    return res.status(400).json({
      error: "Could not retrieve use post",
    });
  }
};

exports.createPost = async (req, res, next) => {
  const { error } = createPostValidation(req.body);
  if (error) return res.status(422).json(formatErrorMessage(error));

  try {
    const post = new Post({ ...req.body, postedBy: req.user._id });
    await post.save();
    return res.status(200).json(post);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getPostsOfUser = async (req, res, next) => {
  try {
    const posts = await Post.find({ postedBy: req.profile._id })
      .populate("postedBy", "_id name username profilePictureUrl")
      .sort("-createdAt");
    return res.status(200).json(posts);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getPostsFeed = async (req, res, next) => {
  const following = req.user.following;
  following.push(req.user._id);
  try {
    const posts = await Post.find({ postedBy: { $in: req.user.following } })
      .populate("postedBy", "_id name username profilePictureUrl")
      .sort("-createdAt");
    return res.status(200).json(posts);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

exports.getPost = (req, res, next) => {
  return res.status(200).json(req.post);
};

exports.likePost = async (req, res, next) => {
  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      { $push: { likes: req.user._id } },
      { new: true }
    );
    res.status(200).json(result);
  } catch (err) {
    const { message, changeErrCode } = getErrorMessage(err);
    const code = changeErrCode ? 500 : 400;
    return res.status(code).json({
      error: message,
    });
  }
};

exports.deletePost = async (req, res, next) => {
  const isPoster =
    req.post &&
    req.user &&
    req.post.postedBy._id.toString() === req.user._id.toString();

  if (!isPoster) {
    return res.status(403).json({
      error: "Unauthorized",
    });
  }

  try {
    const post = req.post;
    if (post.imageUrl) {
      const startingIndex = post.imageUrl.indexOf(".com/") + 5;
      const imageKey = post.imageUrl.slice(startingIndex);
      deleteImageFromS3(process.env.AMAZON_S3_BUCKET_NAME, imageKey);
    }
    const deletedPost = post.remove();
    res.status(200).json(deletedPost);
  } catch (err) {
    const { message, changeErrCode } = getErrorMessage(err);
    const code = changeErrCode ? 500 : 400;
    return res.status(code).json({
      error: message,
    });
  }
};

exports.unlikePost = async (req, res) => {
  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      { $pull: { likes: req.user._id } },
      { new: true }
    );
    res.status(200).json(result);
  } catch (err) {
    const { message, changeErrCode } = getErrorMessage(err);
    const code = changeErrCode ? 500 : 400;
    return res.status(code).json({
      error: message,
    });
  }
};

exports.comment = async (req, res, next) => {
  const comment = { text: req.body.comment };
  comment.postedBy = req.user._id;
  console.log(comment);
  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      { $push: { comments: comment } },
      { new: true }
    )
      .populate("comments.postedBy", "_id name username profilePictureUrl")
      .populate("postedBy", "_id name username profilePictureUrl");

    return res.status(200).json(result);
  } catch (err) {
    const { message, changeErrCode } = getErrorMessage(err);
    const code = changeErrCode ? 500 : 400;
    return res.status(code).json({
      error: message,
    });
  }
};

exports.uncomment = async (req, res) => {
  console.log(req.body.commentId);
  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      { $pull: { comments: { _id: req.body.commentId } } },
      { new: true }
    )
      .populate("comments.postedBy", "_id name username profilePictureUrl")
      .populate("postedBy", "_id name username profilePictureUrl");

    return res.json(result);
  } catch (err) {
    const { message, changeErrCode } = getErrorMessage(err);
    const code = changeErrCode ? 500 : 400;
    return res.status(code).json({
      error: message,
    });
  }
};
