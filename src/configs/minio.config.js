const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const appHelper = require('../helpers/app.helper');

const createEnvironmentConfig = (environment) => {
  const prefix = `AWS_${environment.toUpperCase()}_`;
  const endpoint = process.env[`${prefix}ENDPOINT`]
    || process.env.AWS_ENDPOINT
    || (process.env.MINIO_ENDPOINT
      ? `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT || 9000}`
      : undefined);
  const accessKeyId = process.env[`${prefix}ACCESS_KEY_ID`]
    || process.env.AWS_ACCESS_KEY_ID
    || process.env.MINIO_ACCESS_KEY
    || process.env.MINIO_ROOT_USER;
  const secretAccessKey = process.env[`${prefix}SECRET_ACCESS_KEY`]
    || process.env.AWS_SECRET_ACCESS_KEY
    || process.env.MINIO_SECRET_KEY
    || process.env.MINIO_ROOT_PASSWORD;
  const forcePathStyle = process.env[`${prefix}S3_FORCE_PATH_STYLE`]
    ? process.env[`${prefix}S3_FORCE_PATH_STYLE`] === 'true'
    : process.env.AWS_S3_FORCE_PATH_STYLE
      ? process.env.AWS_S3_FORCE_PATH_STYLE === 'true'
      : Boolean(endpoint);

  if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
    throw new Error(`${prefix}ACCESS_KEY_ID and ${prefix}SECRET_ACCESS_KEY must be configured together`);
  }

  const config = {
    ENV: environment,
    region: process.env[`${prefix}REGION`]
      || process.env.AWS_REGION
      || process.env.MINIO_REGION
      || 'us-east-1',
    s3ForcePathStyle: forcePathStyle,
    endpoint,
    DEFAULT_BUCKET: process.env[`${prefix}S3_BUCKET`]
      || process.env.AWS_S3_BUCKET
      || process.env.MINIO_BUCKET
      || 'media-bucket'
  };

  if (accessKeyId && secretAccessKey) {
    config.accessKeyId = accessKeyId;
    config.secretAccessKey = secretAccessKey;
  }

  return config;
};

const Dev = createEnvironmentConfig('Dev');
const Prod = createEnvironmentConfig('Prod');
const configMapping = { Dev, Prod };
const currentEnv = process.env.APP_ENV || 'Dev';
const environmentConfig = appHelper.getConfig(currentEnv, configMapping);

const minioConfig = {
  region: environmentConfig.region,
  s3ForcePathStyle: environmentConfig.s3ForcePathStyle
};

if (environmentConfig.endpoint) {
  minioConfig.endpoint = new AWS.Endpoint(environmentConfig.endpoint);
}

if (environmentConfig.accessKeyId && environmentConfig.secretAccessKey) {
  minioConfig.accessKeyId = environmentConfig.accessKeyId;
  minioConfig.secretAccessKey = environmentConfig.secretAccessKey;
}

const DEFAULT_BUCKET = environmentConfig.DEFAULT_BUCKET;
const PUBLIC_READ_POLICY = 'public-read';
const PRIVATE_POLICY = 'private';
const s3 = new AWS.S3(minioConfig);

class MinioStorage {
  static getClient() {
    return s3;
  }

  static getPublicUrl(bucketName, objectName) {
    if (!bucketName || !objectName) return '';

    if (minioConfig.endpoint) {
      const base = minioConfig.endpoint.href.replace(/\/+$/, '');
      return `${base}/${bucketName}/${encodeURI(objectName)}`;
    }

    return `https://${bucketName}.s3.${minioConfig.region}.amazonaws.com/${encodeURI(objectName)}`;
  }

  static normalizeObjectName(prefix = 'uploads', fileName = 'file') {
    const cleanPrefix = (prefix || 'uploads').replace(/^\/+|\/+$/g, '');
    const safeFileName = path.basename(fileName || 'file')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]+/g, '');
    return `${cleanPrefix}/${Date.now()}-${safeFileName}`;
  }

  static async ensureBucket(bucketName = DEFAULT_BUCKET, policy = PRIVATE_POLICY) {
    const name = bucketName || DEFAULT_BUCKET;

    try {
      await s3.headBucket({ Bucket: name }).promise();
    } catch (error) {
      const params = minioConfig.region === 'us-east-1'
        ? { Bucket: name }
        : {
            Bucket: name,
            CreateBucketConfiguration: {
              LocationConstraint: minioConfig.region
            }
          };
      try {
        await s3.createBucket(params).promise();
      } catch (createError) {
        if (createError.code !== 'BucketAlreadyOwnedByYou'
          && createError.code !== 'BucketAlreadyExists') {
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
    const key = objectName || this.normalizeObjectName('uploads', 'file');
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

    return this.uploadBuffer({
      bucketName,
      objectName: objectName || this.normalizeObjectName('uploads', path.basename(filePath)),
      fileBuffer: fs.readFileSync(filePath),
      contentType,
      metadata
    });
  }

  static async removeObject(bucketName = DEFAULT_BUCKET, objectName) {
    if (!objectName) {
      throw new Error('objectName is required');
    }

    const bucket = await this.ensureBucket(bucketName);
    await s3.deleteObject({ Bucket: bucket, Key: objectName }).promise();
    return true;
  }

  static async getObjectUrl(bucketName = DEFAULT_BUCKET, objectName) {
    if (!objectName) return '';
    const bucket = await this.ensureBucket(bucketName);
    return this.getPublicUrl(bucket, objectName);
  }

  static async getPresignedObjectUrl(bucketName = DEFAULT_BUCKET, objectName, expiresIn = 3600) {
    if (!objectName) {
      throw new Error('objectName is required');
    }

    if (!Number.isInteger(expiresIn) || expiresIn < 1 || expiresIn > 604800) {
      throw new RangeError('expiresIn must be an integer between 1 and 604800 seconds');
    }

    const bucket = bucketName || DEFAULT_BUCKET;
    return s3.getSignedUrlPromise('getObject', {
      Bucket: bucket,
      Key: objectName,
      Expires: expiresIn
    });
  }

  static async listObjects(bucketName = DEFAULT_BUCKET, prefix = '') {
    const bucket = await this.ensureBucket(bucketName);
    const objects = [];
    let continuationToken;

    do {
      const result = await s3.listObjectsV2({
        Bucket: bucket,
        Prefix: prefix || '',
        ContinuationToken: continuationToken
      }).promise();

      objects.push(...(result.Contents || []).map((object) => ({
        name: object.Key,
        size: object.Size,
        lastModified: object.LastModified,
        etag: object.ETag,
        bucket,
        url: this.getPublicUrl(bucket, object.Key)
      })));
      continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (continuationToken);

    return objects;
  }
}

MinioStorage.config = minioConfig;
MinioStorage.environment = environmentConfig.ENV;
MinioStorage.configMapping = configMapping;
MinioStorage.constants = {
  DEFAULT_BUCKET,
  PUBLIC_READ_POLICY,
  PRIVATE_POLICY
};

module.exports = MinioStorage;