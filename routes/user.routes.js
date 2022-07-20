const express = require("express");
const authCtrl = require("../controllers/auth.controller");
const userCtrl = require("../controllers/user.controller");

const router = express.Router();

router.param("userId", userCtrl.userByID);

router
  .route("/users")
  .post(userCtrl.createUser)
  .get(userCtrl.getUsers);

router.route("/users/follow").put(authCtrl.requireSignin, userCtrl.followUser);

router
  .route("/users/unfollow")
  .put(authCtrl.requireSignin, userCtrl.unfollowUser);

router
  .route("/users/:userId")
  .get(userCtrl.getUser)
  .put(authCtrl.requireSignin, authCtrl.hasAuthorization, userCtrl.updateUser)
  .delete(
    authCtrl.requireSignin,
    authCtrl.hasAuthorization,
    userCtrl.deleteUser
  );

module.exports = router;
