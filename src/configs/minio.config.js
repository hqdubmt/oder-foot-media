
'use strict';

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const appHelper = require('../helpers/app.helper');

// ========================================
// 1. ENVIRONMENT CONFIGURATION
// ========================================

const createEnvironmentConfig = (environment) => {
  const prefix = `AWS_${environment.toUpperCase()}_`;

  const getEnv = (key, fallback) =>
    process.env[`${prefix}${key}`] ||
    process.env[`AWS_${key}`] ||
    fallback;

  const endpoint =
    getEnv('ENDPOINT') ||
    (process.env.MINIO_ENDPOINT
      ? `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT || 9000}`
      : undefined);

  const accessKeyId =
    getEnv('ACCESS_KEY_ID') ||
    process.env.MINIO_ACCESS_KEY ||
    process.env.MINIO_ROOT_USER;

  const secretAccessKey =
    getEnv('SECRET_ACCESS_KEY') ||
    process.env.MINIO_SECRET_KEY ||
    process.env.MINIO_ROOT_PASSWORD;

  if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
    throw new Error(
      `${prefix}ACCESS_KEY_ID and ${prefix}SECRET_ACCESS_KEY must be configured together`
    );
  }

  const forcePathStyleValue = getEnv(
    'S3_FORCE_PATH_STYLE',
    endpoint ? 'true' : 'false'
  );

  return {
    ENV: environment,

    region:
      getEnv('REGION') ||
      process.env.MINIO_REGION ||
      'us-east-1',

    endpoint,

    accessKeyId,
    secretAccessKey,

    s3ForcePathStyle: forcePathStyleValue === 'true',

    DEFAULT_BUCKET:
      getEnv('S3_BUCKET') ||
      process.env.MINIO_BUCKET ||
      'media-bucket'
  };
};

// ========================================
// 2. LOAD ENVIRONMENT
// ========================================

const Dev = createEnvironmentConfig('Dev');
const Prod = createEnvironmentConfig('Prod');

const configMapping = { Dev, Prod };

const currentEnv = process.env.APP_ENV || 'Dev';

const environmentConfig = appHelper.getConfig(
  currentEnv,
  configMapping
);

// ========================================
// 3. CREATE S3 CLIENT
// ========================================

const minioConfig = {
  region: environmentConfig.region,
  s3ForcePathStyle: environmentConfig.s3ForcePathStyle
};

if (environmentConfig.endpoint) {
  minioConfig.endpoint = environmentConfig.endpoint;
}

if (environmentConfig.accessKeyId) {
  minioConfig.accessKeyId = environmentConfig.accessKeyId;
  minioConfig.secretAccessKey = environmentConfig.secretAccessKey;
}

const s3 = new AWS.S3(minioConfig);

const DEFAULT_BUCKET = environmentConfig.DEFAULT_BUCKET;

const PUBLIC_READ_POLICY = 'public-read';
const PRIVATE_POLICY = 'private';

// ========================================
// 4. MINIO STORAGE CLASS
// ========================================

class MinioStorage {

  // --------------------------------------
  // Get S3 Client
  // --------------------------------------

  static getClient() {
    return s3;
  }

  // --------------------------------------
  // Get Public URL
  // --------------------------------------

  static getPublicUrl(bucketName, objectName) {
    if (!bucketName || !objectName) return '';

    const encodedObjectName = objectName
      .split('/')
      .map(encodeURIComponent)
      .join('/');

    if (environmentConfig.endpoint) {
      const base = environmentConfig.endpoint.replace(/\/+$/, '');

      return `${base}/${bucketName}/${encodedObjectName}`;
    }

    return `https://${bucketName}.s3.${environmentConfig.region}.amazonaws.com/${encodedObjectName}`;
  }

  // --------------------------------------
  // Normalize Object Name
  // --------------------------------------

  static normalizeObjectName(prefix = 'uploads', fileName = 'file') {
    const cleanPrefix = String(prefix || 'uploads')
      .replace(/^\/+|\/+$/g, '');

    const safeFileName = path.basename(fileName || 'file')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    return `${cleanPrefix}/${Date.now()}-${safeFileName || 'file'}`;
  }

  // --------------------------------------
  // Ensure Bucket
  // --------------------------------------

  static async ensureBucket(
    bucketName = DEFAULT_BUCKET,
    policy = PRIVATE_POLICY
  ) {
    const name = bucketName || DEFAULT_BUCKET;

    try {
      await s3.headBucket({
        Bucket: name
      }).promise();

    } catch (error) {

      // Only create when bucket does not exist.
      if (
        error.code !== 'NotFound' &&
        error.code !== 'NoSuchBucket' &&
        error.statusCode !== 404
      ) {
        throw error;
      }

      const params = {
        Bucket: name
      };

      if (environmentConfig.region !== 'us-east-1') {
        params.CreateBucketConfiguration = {
          LocationConstraint: environmentConfig.region
        };
      }

      try {
        await s3.createBucket(params).promise();

      } catch (createError) {
        if (
          createError.code !== 'BucketAlreadyOwnedByYou' &&
          createError.code !== 'BucketAlreadyExists'
        ) {
          throw createError;
        }
      }
    }

    if (policy === PUBLIC_READ_POLICY) {
      await s3.putBucketPolicy({
        Bucket: name,

        Policy: JSON.stringify({
          Version: '2012-10-17',

          Statement: [{
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${name}/*`]
          }]
        })
      }).promise();
    }

    return name;
  }

  // --------------------------------------
  // Upload Buffer
  // --------------------------------------

  static async uploadBuffer({
    bucketName = DEFAULT_BUCKET,
    objectName,
    fileBuffer,
    contentType,
    metadata = {}
  }) {
    if (!Buffer.isBuffer(fileBuffer)) {
      throw new Error('fileBuffer must be a Buffer instance');
    }

    const bucket = await this.ensureBucket(bucketName);

    const key = objectName ||
      this.normalizeObjectName('uploads', 'file');

    await s3.putObject({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType || 'application/octet-stream',
      Metadata: metadata
    }).promise();

    return {
      bucket,
      objectName: key,
      url: this.getPublicUrl(bucket, key)
    };
  }

  // --------------------------------------
  // Upload Local File
  // --------------------------------------

  static async uploadFromLocalFile({
    bucketName = DEFAULT_BUCKET,
    filePath,
    objectName,
    contentType,
    metadata = {}
  }) {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error('File path không tồn tại hoặc không hợp lệ');
    }

    const fileBuffer = await fs.promises.readFile(filePath);

    return this.uploadBuffer({
      bucketName,

      objectName: objectName ||
        this.normalizeObjectName(
          'uploads',
          path.basename(filePath)
        ),

      fileBuffer,
      contentType,
      metadata
    });
  }

  // --------------------------------------
  // Remove Object
  // --------------------------------------

  static async removeObject(
    bucketName = DEFAULT_BUCKET,
    objectName
  ) {
    if (!objectName) {
      throw new Error('objectName is required');
    }

    await s3.deleteObject({
      Bucket: bucketName,
      Key: objectName
    }).promise();

    return true;
  }

  // --------------------------------------
  // Get Object URL
  // --------------------------------------

  static async getObjectUrl(
    bucketName = DEFAULT_BUCKET,
    objectName
  ) {
    if (!objectName) return '';

    return this.getPublicUrl(bucketName, objectName);
  }

  // --------------------------------------
  // Get Presigned URL
  // --------------------------------------

  static async getPresignedObjectUrl(
    bucketName = DEFAULT_BUCKET,
    objectName,
    expiresIn = 3600
  ) {
    if (!objectName) {
      throw new Error('objectName is required');
    }

    if (
      !Number.isInteger(expiresIn) ||
      expiresIn < 1 ||
      expiresIn > 604800
    ) {
      throw new RangeError(
        'expiresIn must be between 1 and 604800 seconds'
      );
    }

    return s3.getSignedUrlPromise('getObject', {
      Bucket: bucketName,
      Key: objectName,
      Expires: expiresIn
    });
  }

  // --------------------------------------
  // List Objects
  // --------------------------------------

  static async listObjects(
    bucketName = DEFAULT_BUCKET,
    prefix = ''
  ) {
    const objects = [];

    let continuationToken;

    do {
      const result = await s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken
      }).promise();

      objects.push(
        ...(result.Contents || []).map((object) => ({
          name: object.Key,
          size: object.Size,
          lastModified: object.LastModified,
          etag: object.ETag,
          bucket: bucketName,
          url: this.getPublicUrl(bucketName, object.Key)
        }))
      );

      continuationToken = result.IsTruncated
        ? result.NextContinuationToken
        : undefined;

    } while (continuationToken);

    return objects;
  }
}

// ========================================
// 5. EXPORT CONFIGURATION
// ========================================

MinioStorage.config = minioConfig;
MinioStorage.environment = environmentConfig.ENV;
MinioStorage.configMapping = configMapping;

MinioStorage.constants = {
  DEFAULT_BUCKET,
  PUBLIC_READ_POLICY,
  PRIVATE_POLICY
};

module.exports = MinioStorage;
