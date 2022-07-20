const express = require("express");
const userCtrl = require("../controllers/user.controller");
const authCtrl = require("../controllers/auth.controller");
const postCtrl = require("../controllers/post.controller");

const router = express.Router();

router.param("userId", userCtrl.userByID);
router.param("postId", postCtrl.postByID);

router.route("/posts/new").post(authCtrl.requireSignin, postCtrl.createPost);

router.route("/posts/:userId").get(postCtrl.getPostsOfUser);

router
  .route("/posts/feed/:userId")
  .get(
    authCtrl.requireSignin,
    authCtrl.hasAuthorization,
    postCtrl.getPostsFeed
  );

router.route("/posts/post/:postId").get(postCtrl.getPost);

router.route("/posts/like").put(authCtrl.requireSignin, postCtrl.likePost);
router.route("/posts/unlike").put(authCtrl.requireSignin, postCtrl.unlikePost);

router.route("/posts/comment").put(authCtrl.requireSignin, postCtrl.comment);
router
  .route("/posts/uncomment")
  .put(authCtrl.requireSignin, postCtrl.uncomment);

router
  .route("/posts/:postId")
  .delete(authCtrl.requireSignin, postCtrl.deletePost);

module.exports = router;
