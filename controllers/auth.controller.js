const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const User = require("../models/user.model");
const signInValidation = require("../validation/signInValidation");
const formatErrorMessage = require("../helpers/formatErrorMessage");

exports.signin = async (req, res) => {
  const { error } = signInValidation(req.body);
  if (error) return res.status(422).json(formatErrorMessage(error));

  try {
    const user = await User.findOne({
      email: req.body.email,
    });

    if (!user)
      return res.status(401).json({
        email: "User not found",
      });

    if (!user.authenticate(req.body.password)) {
      return res.status(422).send({
        password: "Email and password don't match.",
      });
    }

    const userDetails = { ...user.toObject() };
    delete userDetails.salt;
    delete userDetails.hashedPassword;
    userDetails.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const token = jwt.sign(userDetails, process.env.JWT_SECRET_KEY);

    return res.json({ token });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      error: "Could not sign in",
    });
  }
};

exports.requireSignin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Please sign in" });

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err)
      return res.status(401).json({ error: "Invalid token, please sign in" });

    const currentTime = Date.now();
    if (user.expiresAt < currentTime)
      return res.status(401).json({ error: "Token expired, Please sign in" });

    req.user = user;
    next();
  });
};

exports.hasAuthorization = (req, res, next) => {
  const authorized = req.profile && req.user && req.profile._id == req.user._id;
  if (!authorized) {
    return res.status(403).json({
      error: "User is not authorized",
    });
  }
  next();
};
