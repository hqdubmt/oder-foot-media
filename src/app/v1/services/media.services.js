
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MinioStorage = require('../../../configs/minio.config');
const Media = require('../models/media.models');

class MediaServices {

  // ========================================
  // 1. SANITIZE FILE NAME
  // ========================================

  static sanitizeFileName(fileName = 'media-file') {
    const base = path.basename(fileName || 'media-file');

    return base
      .normalize('NFKC')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '') || 'media-file';
  }

  // ========================================
  // 2. CREATE MEDIA MODEL
  // ========================================

  createMedia(fileData = {}) {
    return Media.fromFile(fileData);
  }

  // ========================================
  // 3. UPLOAD SINGLE FILE
  // ========================================

  async uploadSingle(file, options = {}) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const {
      bucketName = MinioStorage.constants.DEFAULT_BUCKET,
      folder = 'uploads',
      objectName,
      metadata = {},
      uploadedBy = null
    } = options;

    const fileName = file.originalname || file.filename || 'media-file';

    const safeName = MediaServices.sanitizeFileName(fileName);

    const cleanFolder = String(folder || 'uploads')
      .replace(/^\/+|\/+$/g, '');

    const finalObjectName = objectName ||
      MinioStorage.normalizeObjectName(cleanFolder, safeName);

    let fileBuffer;

    try {
      // Read uploaded file
      if (file.buffer && Buffer.isBuffer(file.buffer)) {
        fileBuffer = file.buffer;
      } else if (file.path) {
        fileBuffer = await fs.promises.readFile(file.path);
      } else {
        throw new Error('File buffer or file path is required');
      }

      // Upload to MinIO
      const uploadResult = await MinioStorage.uploadBuffer({
        bucketName,
        objectName: finalObjectName,
        fileBuffer,
        contentType: file.mimetype || 'application/octet-stream',
        metadata: {
          'original-name': safeName,
          source: 'multer',
          ...metadata
        }
      });

      // Generate temporary access URL
      const displayUrl = await MinioStorage.getPresignedObjectUrl(
        uploadResult.bucket,
        uploadResult.objectName
      );

      // Create Media Model
      const media = this.createMedia({
        id: `media-${crypto.randomUUID()}`,
        name: safeName,
        originalName: file.originalname || safeName,
        mimeType: file.mimetype,
        size: file.size ?? fileBuffer.length,
        path: uploadResult.objectName,
        url: displayUrl,
        bucket: uploadResult.bucket,
        folder: cleanFolder,
        uploadedBy,
        createdAt: new Date().toISOString()
      });

      return {
        ...media.toJSON(),
        objectName: uploadResult.objectName
      };

    } finally {
      // Remove temporary local file
      if (file.path) {
        await fs.promises.unlink(file.path).catch((error) => {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        });
      }
    }
  }

  // ========================================
  // 4. UPLOAD MULTIPLE FILES
  // ========================================

  async uploadMultiple(files = [], options = {}) {
    console.log('FILES:', files.length);
    console.log('FILE NAMES:', files.map(file => file.originalname));
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('At least one file is required');
    }

    const results = [];

    for (const file of files) {
      results.push(await this.uploadSingle(file, options));
    }

    return results;
  }

  // ========================================
  // 5. FORMAT OBJECT TO MEDIA
  // ========================================

  async formatMedia(object, prefix = 'uploads/') {
    const presignedUrl = await MinioStorage.getPresignedObjectUrl(
      object.bucket,
      object.name
    );

    return this.createMedia({
      id: object.name,
      name: path.basename(object.name),
      originalName: path.basename(object.name),
      mimeType: 'application/octet-stream',
      size: object.size,
      path: object.name,
      url: presignedUrl,
      bucket: object.bucket,
      folder: path.posix.dirname(object.name),
      createdAt: object.lastModified
        ? new Date(object.lastModified).toISOString()
        : undefined
    }).toJSON();
  }

  // ========================================
  // 6. LIST MEDIA
  // ========================================

  async listMedia(
    bucketName = MinioStorage.constants.DEFAULT_BUCKET,
    prefix = 'uploads/'
  ) {
    const objects = await MinioStorage.listObjects(
      bucketName,
      prefix
    );

    return Promise.all(
      objects.map((object) => this.formatMedia(object, prefix))
    );
  }

  // ========================================
  // 7. GET MEDIA BY ID
  // ========================================

  async getMediaById(
    id,
    bucketName = MinioStorage.constants.DEFAULT_BUCKET,
    prefix = 'uploads/'
  ) {
    if (!id) return null;

    const objects = await MinioStorage.listObjects(
      bucketName,
      prefix
    );

    const object = objects.find(
      (item) => String(item.name) === String(id)
    );

    if (!object) return null;

    return this.formatMedia(object, prefix);
  }

  // ========================================
  // 8. DELETE MEDIA
  // ========================================

  async deleteMedia(
    id,
    bucketName = MinioStorage.constants.DEFAULT_BUCKET
  ) {
    if (!id) return false;

    // Check object existence
    const result = await MinioStorage.getClient().headObject({
      Bucket: bucketName,
      Key: id
    }).promise().catch((error) => {
      if (
        error.code === 'NotFound' ||
        error.code === 'NoSuchKey' ||
        error.statusCode === 404
      ) {
        return null;
      }

      throw error;
    });

    if (!result) return false;

    await MinioStorage.removeObject(bucketName, id);

    return true;
  }
}

// ========================================
// 9. EXPORT
// ========================================

module.exports = new MediaServices();
module.exports.MediaServices = MediaServices;
