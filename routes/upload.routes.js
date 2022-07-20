const express = require("express");
const uploadCtrl = require("../controllers/upload.controller");
const authCtrl = require("../controllers/auth.controller");

const router = express.Router();

router.route("/upload").get(authCtrl.requireSignin, uploadCtrl.getPresignedURL);

module.exports = router;
