const mongoose = require("mongoose");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String
    },
    username: {
      type: String,
      unique: "Username already exists",
      required: "Email is required"
    },
    email: {
      type: String,
      unique: "Email already exists",
      match: [/.+\@.+\..+/, "Please fill a valid email address"],
      required: "Email is required"
    },
    hashedPassword: {
      type: String,
      required: "Password is required"
    },
    profilePictureUrl: {
      type: String
    },
    headerImageUrl: {
      type: String
    },
    salt: String,
    bio: {
      type: String
    },
    following: [{ type: mongoose.Schema.ObjectId, ref: "user" }],
    followers: [{ type: mongoose.Schema.ObjectId, ref: "user" }]
  },
  { timestamps: true }
);

UserSchema.virtual("password")
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

UserSchema.methods = {
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },
  encryptPassword: function(password) {
    if (!password) return "";
    try {
      return crypto
        .createHmac("sha1", this.salt)
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },
  makeSalt: function() {
    return Math.round(new Date().valueOf() * Math.random()) + "";
  }
};

const User = mongoose.model("user", UserSchema);

module.exports = User;
