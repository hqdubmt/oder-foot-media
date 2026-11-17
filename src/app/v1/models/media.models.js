
'use strict';

const crypto = require('crypto');

class Media {
  constructor({
    id,
    name,
    originalName,
    mimeType,
    size,
    path,
    url,
    bucket,
    folder,
    uploadedBy,
    createdAt
  } = {}) {

    this.id = id || Media.generateId();

    this.name = name || originalName || 'unnamed-file';

    this.originalName = originalName || this.name;

    this.mimeType = mimeType || 'application/octet-stream';

    this.size = Number(size) || 0;

    this.path = path || '';

    this.url = url || '';

    this.bucket = bucket || 'default';

    this.folder = folder || 'uploads';

    this.uploadedBy = uploadedBy ?? null;

    this.createdAt = createdAt || new Date().toISOString();
  }

  // ========================================
  // 1. GENERATE ID
  // ========================================

  static generateId() {
    return `media-${Date.now()}-${crypto.randomUUID()}`;
  }

  // ========================================
  // 2. CREATE MEDIA FROM FILE
  // ========================================

  static fromFile(file, extra = {}) {
    if (!file) {
      throw new Error('File is required to create Media');
    }

    return new Media({
      id: extra.id || file.id,

      name:
        extra.name ||
        file.filename ||
        file.originalname ||
        file.name,

      originalName:
        extra.originalName ||
        file.originalname ||
        file.name,

      mimeType:
        extra.mimeType ||
        file.mimetype ||
        'application/octet-stream',

      size: extra.size ?? file.size ?? 0,

      path:
        extra.path ||
        file.path ||
        '',

      url:
        extra.url ||
        file.url ||
        '',

      bucket:
        extra.bucket ||
        file.bucket ||
        'default',

      folder:
        extra.folder ||
        file.folder ||
        'uploads',

      uploadedBy:
        extra.uploadedBy ??
        file.uploadedBy ??
        null,

      createdAt:
        extra.createdAt ||
        file.createdAt ||
        new Date().toISOString()
    });
  }

  // ========================================
  // 3. SERIALIZE TO JSON
  // ========================================

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      originalName: this.originalName,
      mimeType: this.mimeType,
      size: this.size,
      path: this.path,
      url: this.url,
      bucket: this.bucket,
      folder: this.folder,
      uploadedBy: this.uploadedBy,
      createdAt: this.createdAt
    };
  }

  // ========================================
  // 4. VALIDATE MEDIA
  // ========================================

  isValid() {
    return Boolean(
      this.id &&
      this.name &&
      this.mimeType &&
      this.size >= 0 &&
      this.bucket &&
      this.folder
    );
  }
}

// ========================================
// 5. EXPORT
// ========================================

module.exports = Media;
module.exports.Media = Media;
