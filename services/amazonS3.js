const AWS = require("aws-sdk");
const keys = require("../config/keys");

AWS.config.setPromisesDependency();

const s3 = new AWS.S3({
  accessKeyId: keys.amazonS3AccessKeyID,
  secretAccessKey: keys.amazonS3SecretAccessKey,
  signatureVersion: "v4",
  endpoint: keys.amazonS3Endpoint,
  region: keys.amazonS3Region
});

module.exports = s3;
