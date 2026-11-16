const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const DEFAULT_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/quicktime',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/octet-stream'
]);

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

const resolveUploadDir = (customDir = 'uploads') => {
  const uploadDir = path.resolve(process.cwd(), customDir);
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
};

const buildStorage = (customDir = 'uploads') =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const targetDir = resolveUploadDir(customDir);
        cb(null, targetDir);
      } catch (error) {
        cb(error, null);
      }
    },
    filename: (req, file, cb) => {
      try {
        const originalName = path.basename(file.originalname || 'file');
        const extension = path.extname(originalName) || '';
        const baseName = path.basename(originalName, extension);
        const safeBase = baseName
          .replace(/\s+/g, '-')
          .replace(/[^a-zA-Z0-9._-]+/g, '')
          .toLowerCase() || 'file';

        const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
        cb(null, `${uniqueSuffix}-${safeBase}${extension}`);
      } catch (error) {
        cb(error, null);
      }
    }
  });

const createFileFilter = (allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES) => (req, file, cb) => {
  if (!file || !file.mimetype) {
    return cb(new Error('Không xác định được loại file'));
  }

  const whitelist = allowedMimeTypes instanceof Set ? allowedMimeTypes : new Set(allowedMimeTypes || []);

  if (whitelist.size === 0 || whitelist.has(file.mimetype)) {
    return cb(null, true);
  }

  return cb(new Error(`Loại file không được hỗ trợ: ${file.mimetype}`));
};

const createUpload = ({
  customDir = 'uploads',
  allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  maxFiles = 10
} = {}) => {
  const storage = buildStorage(customDir);
  const fileFilter = createFileFilter(allowedMimeTypes);

  return multer({
    storage,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    },
    fileFilter
  });
};

const upload = createUpload();
const uploadSingle = (fieldName = 'file', options = {}) => createUpload(options).single(fieldName);
const uploadMultiple = (fieldName = 'files', maxCount = 5, options = {}) => createUpload({ ...options, maxFiles: maxCount }).array(fieldName, maxCount);
const uploadFields = (fields = [{ name: 'file', maxCount: 1 }], options = {}) => createUpload(options).fields(fields);

module.exports = {
  DEFAULT_ALLOWED_MIME_TYPES,
  DEFAULT_MAX_FILE_SIZE,
  resolveUploadDir,
  buildStorage,
  createFileFilter,
  createUpload,
  multer,
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields
};
