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
    this.id = id || `media-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    this.name = name || originalName || 'unnamed-file';
    this.originalName = originalName || this.name;
    this.mimeType = mimeType || 'application/octet-stream';
    this.size = Number(size) || 0;
    this.path = path || '';
    this.url = url || '';
    this.bucket = bucket || 'default';
    this.folder = folder || 'uploads';
    this.uploadedBy = uploadedBy || null;
    this.createdAt = createdAt || new Date().toISOString();
  }

  static fromFile(file, extra = {}) {
    const filePath = file && (file.path || file.destination || '');
    const url = file && file.url ? file.url : '';

    return new Media({
      id: extra.id || file?.id || undefined,
      name: extra.name || file?.filename || file?.originalname || file?.name,
      originalName: extra.originalName || file?.originalname || file?.name,
      mimeType: extra.mimeType || file?.mimetype || 'application/octet-stream',
      size: extra.size ?? file?.size ?? 0,
      path: extra.path || filePath,
      url: extra.url || url,
      bucket: extra.bucket || file?.bucket || 'default',
      folder: extra.folder || file?.folder || 'uploads',
      uploadedBy: extra.uploadedBy || file?.uploadedBy || null,
      createdAt: extra.createdAt || file?.createdAt || new Date().toISOString()
    });
  }

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
}

module.exports = Media;
module.exports.Media = Media;
