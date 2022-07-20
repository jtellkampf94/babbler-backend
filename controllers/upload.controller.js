const s3 = require("../services/amazonS3");
const uuid = require("uuid/v1");
const keys = require("../config/keys");

exports.getPresignedURL = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const key = `${userId}/${uuid()}.jpg`;
    const presignedUrl = await s3.getSignedUrl("putObject", {
      Bucket: keys.amazonS3BucketName,
      ContentType: "image/jpeg",
      Expires: 60,
      Key: key
    });
    return res.status(200).json({ presignedUrl, key });
  } catch (error) {
    console.log(error);
  }
};
