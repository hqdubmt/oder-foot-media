module.exports = {
  DEFAULT: process.env.AWS_S3_BUCKET || process.env.MINIO_BUCKET || 'media-bucket',
  POLICY: {
    PUBLIC_READ: 'public-read',
    PRIVATE: 'private'
  }
};
