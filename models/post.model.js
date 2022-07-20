const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    text: {
      type: String
    },
    imageUrl: {
      type: String
    },
    likes: [{ type: mongoose.Schema.ObjectId, ref: "user" }],
    comments: [
      {
        text: String,
        created: { type: Date, default: Date.now },
        postedBy: { type: mongoose.Schema.ObjectId, ref: "user" }
      }
    ],
    postedBy: { type: mongoose.Schema.ObjectId, ref: "user" }
  },
  { timestamps: true }
);

const Post = mongoose.model("post", PostSchema);

module.exports = Post;
