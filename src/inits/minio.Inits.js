const MinioStorage = require('../configs/minio.config');

const initializeMinio = async () => {
  const bucketName = MinioStorage.constants.DEFAULT_BUCKET;
  await MinioStorage.ensureBucket(bucketName);
  await MinioStorage.getClient().headBucket({ Bucket: bucketName }).promise();

  return bucketName;
};

module.exports = initializeMinio;