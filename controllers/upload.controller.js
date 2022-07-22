const s3 = require("../services/amazonS3");
const uuid = require("uuid/v1");
const dotenv = require("dotenv");

dotenv.config();

exports.getPresignedURL = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const key = `${userId}/${uuid()}.jpg`;
    const presignedUrl = await s3.getSignedUrl("putObject", {
      Bucket: process.env.AMAZON_S3_BUCKET_NAME,
      ContentType: "image/jpeg",
      Expires: 60,
      Key: key,
    });
    return res.status(200).json({ presignedUrl, key });
  } catch (error) {
    console.log(error);
  }
};
