const AWS = require("aws-sdk");
const dotenv = require("dotenv");

dotenv.config();
AWS.config.setPromisesDependency();

const s3 = new AWS.S3({
  accessKeyId: process.env.AMAZON_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AMAZON_S3_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
  endpoint: process.env.AMAZON_S3_ENDPOINT,
  region: process.env.AMAZON_S3_REGION,
});

module.exports = s3;
