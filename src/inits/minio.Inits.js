
'use strict';

const MinioStorage = require('../configs/minio.config');

const initializeMinio = async () => {
  try {
    // 1. Get default bucket
    const bucketName = MinioStorage.constants.DEFAULT_BUCKET;

    // 2. Create bucket if it does not exist
    await MinioStorage.ensureBucket(bucketName);

    // 3. Verify bucket connection
    await MinioStorage.getClient()
      .headBucket({ Bucket: bucketName })
      .promise();

    // 4. Return initialization result
    console.log(`[MINIO] Initialized successfully`);
    console.log(`[MINIO] Environment: ${MinioStorage.environment}`);
    console.log(`[MINIO] Bucket: ${bucketName}`);

    return {
      success: true,
      bucket: bucketName
    };

  } catch (error) {
    console.error('[MINIO] Initialization failed:', error.message);

    throw error;
  }
};

module.exports = initializeMinio;
