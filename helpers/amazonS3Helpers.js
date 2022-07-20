const s3 = require("../services/amazonS3");

exports.deleteDirectoryFromS3Bucket = async (bucket, dir, res) => {
  const listParams = {
    Bucket: bucket,
    Prefix: dir
  };

  const listedObjects = await s3.listObjectsV2(listParams).promise();

  if (listedObjects.Contents.length === 0) return;

  const deleteParams = {
    Bucket: bucket,
    Delete: { Objects: [] }
  };

  listedObjects.Contents.forEach(({ Key }) => {
    deleteParams.Delete.Objects.push({ Key });
  });

  await s3.deleteObjects(deleteParams).promise();

  if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir);
};

exports.isDirectoryInS3Bucket = async (directory, bucket) => {
  const Prefix = `${directory}/`;

  const MaxKeys = 1;
  const params = {
    Bucket: bucket,
    Prefix,
    MaxKeys
  };

  const data = await s3.listObjectsV2(params).promise();
  const directoryExists = data.Contents.length > 0;

  return directoryExists;
};

exports.deleteImageFromS3 = async (bucket, key) => {
  const params = {
    Bucket: bucket,
    Key: key
  };

  await s3.deleteObject(params).promise();
};
