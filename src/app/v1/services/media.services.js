const fs = require('fs');
const path = require('path');
const MinioStorage = require('../../../configs/minio.config');

class MediaServices {
  static sanitizeFileName(fileName = 'media-file') {
    const base = path.basename(fileName || 'media-file');
    return base.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
  }

  async createMedia(fileData = {}) {
    const file = fileData || {};
    return {
      id: file.id || `media-${Date.now()}`,
      name: file.name || file.originalname || 'media-file',
      originalName: file.originalname || file.name || 'media-file',
      mimeType: file.mimetype || 'application/octet-stream',
      size: Number(file.size) || 0,
      path: file.path || '',
      url: file.url || '',
      bucket: file.bucket || MinioStorage.constants.DEFAULT_BUCKET,
      folder: file.folder || 'uploads',
      createdAt: file.createdAt || new Date().toISOString()
    };
  }

  async uploadSingle(file, options = {}) {
    const {
      bucketName = MinioStorage.constants.DEFAULT_BUCKET,
      folder = 'uploads',
      objectName,
      metadata = {}
    } = options;

    if (!file) {
      throw new Error('No file uploaded');
    }

    const fileName = file.originalname || file.filename || 'media-file';
    const safeName = MediaServices.sanitizeFileName(fileName);
    const finalObjectName = objectName || `${folder}/${Date.now()}-${safeName}`;

    const fileBuffer = fs.readFileSync(file.path);
    const uploadResult = await MinioStorage.uploadBuffer({
      bucketName,
      objectName: finalObjectName,
      fileBuffer,
      contentType: file.mimetype || 'application/octet-stream',
      metadata: {
        'x-amz-meta-original-name': file.originalname || safeName,
        'x-amz-meta-source': 'multer',
        ...metadata
      }
    });

    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    const displayUrl = await MinioStorage.getPresignedObjectUrl(
      uploadResult.bucket,
      uploadResult.objectName
    );

    return {
      ...(await this.createMedia({
        id: `media-${Date.now()}`,
        name: safeName,
        originalname: file.originalname || safeName,
        mimetype: file.mimetype || 'application/octet-stream',
        size: file.size,
        path: uploadResult.objectName,
        url: displayUrl,
        bucket: uploadResult.bucket,
        folder,
        createdAt: new Date().toISOString()
      })),
      objectName: uploadResult.objectName,
      bucket: uploadResult.bucket,
      url: displayUrl
    };
  }

  async uploadMultiple(files = [], options = {}) {
    const result = [];

    for (const file of files) {
      result.push(await this.uploadSingle(file, options));
    }

    return result;
  }

  async listMedia(bucketName = MinioStorage.constants.DEFAULT_BUCKET, prefix = 'uploads/') {
    const objects = await MinioStorage.listObjects(bucketName, prefix);

    return Promise.all(objects.map(async (obj) => ({
      id: obj.name,
      name: path.basename(obj.name),
      originalName: path.basename(obj.name),
      mimeType: 'application/octet-stream',
      size: obj.size || 0,
      path: obj.name,
      url: await MinioStorage.getPresignedObjectUrl(obj.bucket, obj.name),
      bucket: obj.bucket,
      folder: prefix || 'uploads',
      createdAt: new Date().toISOString()
    })));
  }

  async getMediaById(id, bucketName = MinioStorage.constants.DEFAULT_BUCKET, prefix = 'uploads/') {
    const objects = await MinioStorage.listObjects(bucketName, prefix);
    const item = objects.find((obj) => String(obj.name) === String(id));

    if (!item) return null;

    return {
      id: item.name,
      name: path.basename(item.name),
      originalName: path.basename(item.name),
      mimeType: 'application/octet-stream',
      size: item.size || 0,
      path: item.name,
      url: await MinioStorage.getPresignedObjectUrl(item.bucket, item.name),
      bucket: item.bucket,
      folder: prefix || 'uploads',
      createdAt: new Date().toISOString()
    };
  }

  async deleteMedia(id, bucketName = MinioStorage.constants.DEFAULT_BUCKET) {
    if (!id) return false;
    await MinioStorage.removeObject(bucketName, id);
    return true;
  }
}

module.exports = new MediaServices();
module.exports.MediaServices = MediaServices;
