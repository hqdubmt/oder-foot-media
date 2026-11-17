const fs = require('fs');
const { Ok, Created } = require('../../../cors/sycessReponse.cors');
const { BadRequestError } = require('../../../cors/reasonPhrases.cors');
const MediaServices = require('../services/media.services');

const validateObjectName = (objectName) => {
  if (
    typeof objectName !== 'string' ||
    objectName.length === 0 ||
    objectName.trim() !== objectName ||
    objectName.startsWith('/') ||
    objectName.includes('\\') ||
    objectName.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    throw new BadRequestError('Each objectName must be a valid object key');
  }

  return objectName;
};

const parseObjectNames = (value) => {
  let objectNames = value;

  if (typeof objectNames === 'string') {
    try {
      objectNames = JSON.parse(objectNames);
    } catch {
      throw new BadRequestError('objectNames must be a JSON array of object keys');
    }
  }

  if (
    !Array.isArray(objectNames) ||
    objectNames.length === 0
  ) {
    throw new BadRequestError('objectNames must be a non-empty array of object keys');
  }

  return objectNames.map(validateObjectName);
};

const getDeleteObjectNames = (req) => {
  const value = req.body?.objectNames ?? req.query.objectNames;
  if (value !== undefined) {
    if (req.method === 'DELETE' && typeof value === 'string') {
      try {
        return parseObjectNames(value);
      } catch (error) {
        if (!(req.query.objectNames === value && !value.startsWith('['))) {
          throw error;
        }
        return [validateObjectName(value)];
      }
    }

    return parseObjectNames(value);
  }

  if (req.query.id === undefined) return undefined;

  const ids = Array.isArray(req.query.id) ? req.query.id : [req.query.id];
  const prefixes = Array.isArray(req.query.prefix)
    ? req.query.prefix
    : [req.query.prefix];

  return ids.map((id, index) => {
    if (typeof id !== 'string' || id.includes('/')) {
      return validateObjectName(id);
    }

    const prefix = prefixes[index] || prefixes[0] || 'uploads/';
    if (typeof prefix !== 'string') {
      throw new BadRequestError('prefix must be a string');
    }

    return validateObjectName(`${prefix.replace(/\/+$/, '')}/${id}`);
  });
};

const cleanupUploadedFiles = async (files) => {
  for (const file of files) {
    if (!file.path) continue;

    try {
      await fs.promises.unlink(file.path);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
};

const deleteObject = async (objectName, bucketName, res) => {
  const deleted = await MediaServices.deleteMedia(objectName, bucketName);

  if (!deleted) {
    return new Ok({
      status: 404,
      code: 404000,
      message: 'Media not found',
      description: 'Không thể xóa media vì object không tồn tại.',
      metadata: null
    }).send(res);
  }

  return new Ok({
    message: 'Media deleted successfully',
    description: 'Xóa media thành công.',
    metadata: { deletedObjectName: objectName }
  }).send(res);
};

class MediaControllers {
  async uploadSingle(req, res) {
    const file = req.file || (req.files && req.files[0]);

    if (!file) {
      return new Ok({
        status: 400,
        code: 400000,
        message: 'No file uploaded',
        description: 'Vui lòng gửi file media cần upload.',
        metadata: null
      }).send(res);
    }

    const bucketName = req.query.bucket || req.body?.bucket || undefined;
    const folder = req.query.folder || req.body?.folder || 'uploads';
    const objectName = req.query.objectName ?? req.body?.objectName;
    const media = await MediaServices.uploadSingle(file, {
      bucketName,
      folder,
      objectName: objectName === undefined
        ? undefined
        : validateObjectName(objectName)
    });

    return new Created({
      message: 'Media uploaded successfully',
      description: 'File đã được upload lên storage thành công.',
      metadata: { media }
    }).send(res);
  }

  async uploadMultiple(req, res) {
    const files = Array.isArray(req.files) ? req.files : [];

    if (!files.length) {
      return new Ok({
        status: 400,
        code: 400000,
        message: 'No files uploaded',
        description: 'Vui lòng gửi ít nhất một file media.',
        metadata: null
      }).send(res);
    }

    const bucketName = req.query.bucket || req.body?.bucket || undefined;
    const folder = req.query.folder || req.body?.folder || 'uploads';
    let objectNames;
    try {
      objectNames = req.body?.objectNames !== undefined
        ? parseObjectNames(req.body.objectNames)
        : undefined;

      if (objectNames && objectNames.length !== files.length) {
        throw new BadRequestError('objectNames count must match the uploaded files count');
      }
    } catch (error) {
      await cleanupUploadedFiles(files);
      throw error;
    }

    const mediaList = await MediaServices.uploadMultiple(files, {
      bucketName,
      folder,
      objectNames
    });

    return new Created({
      message: 'Media uploaded successfully',
      description: 'Danh sách file đã được upload lên storage thành công.',
      metadata: { files: mediaList }
    }).send(res);
  }

  async uploadMultipleByObjectNames(req, res) {
    if (req.body?.objectNames === undefined) {
      const queryObjectNames = req.query.objectNames;
      let objectNames;

      if (queryObjectNames !== undefined) {
        const values = Array.isArray(queryObjectNames)
          ? queryObjectNames
          : [queryObjectNames];

        if (values.length === 1 && typeof values[0] === 'string') {
          try {
            const parsed = JSON.parse(values[0]);
            objectNames = Array.isArray(parsed) ? parsed : values;
          } catch {
            objectNames = values;
          }
        } else {
          objectNames = values;
        }
      } else if (req.query.id !== undefined) {
        const ids = Array.isArray(req.query.id) ? req.query.id : [req.query.id];
        const prefixes = Array.isArray(req.query.prefix)
          ? req.query.prefix
          : [req.query.prefix];

        objectNames = ids.map((id, index) => {
          if (typeof id !== 'string' || id.includes('/')) return id;

          const prefix = prefixes[index] || prefixes[0] || 'uploads/';
          if (typeof prefix !== 'string') return id;

          return `${prefix.replace(/\/+$/, '')}/${id}`;
        });
      }

      if (objectNames !== undefined) {
        req.body = { ...req.body, objectNames };
      }
    }

    if (req.body?.objectNames === undefined) {
      await cleanupUploadedFiles(Array.isArray(req.files) ? req.files : []);
      throw new BadRequestError('objectNames is required');
    }

    return this.uploadMultiple(req, res);
  }

  async getFile(req, res) {
    const bucketName = req.query.bucket || undefined;
    const objectName = `uploads/${req.params.fileName}`;
    const url = await MediaServices.getMediaDownloadUrl(objectName, bucketName);

    if (!url) {
      return new Ok({
        status: 404,
        code: 404000,
        message: 'Media not found',
        description: 'Không tìm thấy media với đường dẫn tương ứng.',
        metadata: null
      }).send(res);
    }

    return res.redirect(302, url);
  }

  async list(req, res) {const bucketName = req.query.bucket || undefined;

  const prefix = typeof req.query.prefix === 'string'
    ? req.query.prefix
    : 'uploads/';

  const mediaList = await MediaServices.listMedia(bucketName, prefix);

  return new Ok({
    message: 'Media list retrieved successfully',
    description: 'Lấy danh sách media thành công.',
    metadata: { files: mediaList }
  }).send(res);
  }

  async getById(req, res) {
  const mediaId = req.query.id || req.params.id;
  const bucketName = req.query.bucket || undefined;

  const prefix = typeof req.query.prefix === 'string'
    ? req.query.prefix
    : 'uploads/';

  const media = await MediaServices.getMediaById(
    mediaId,
    bucketName,
    prefix
  );

  if (!media) {
    return new Ok({
      status: 404,
      code: 404000,
      message: 'Media not found',
      description: 'Không tìm thấy media với id tương ứng.',
      metadata: null
    }).send(res);
  }

  return new Ok({
    message: 'Media retrieved successfully',
    description: 'Lấy thông tin media thành công.',
    metadata: { media }
  }).send(res);
}

  async getByObjectNames(req, res) {
  const queryObjectNames = req.query.objectNames;
  const objectNames = (
    Array.isArray(queryObjectNames)
      ? queryObjectNames
      : [queryObjectNames]
  ).map(validateObjectName);
  const bucketName = req.query.bucket || undefined;
  const results = await MediaServices.getMediaByObjectNames(
    objectNames,
    bucketName
  );

  return new Ok({
    message: 'Media retrieved successfully',
    description: 'Metadata và signed URL được trả về cho từng objectName.',
    metadata: {
      results,
      summary: {
        found: results.filter((result) => result.status === 'found').length,
        notFound: results.filter((result) => result.status === 'not_found').length,
        failed: results.filter((result) => result.status === 'error').length
      }
    }
  }).send(res);
  }

  async delete(req, res) {
    return deleteObject(req.params.id, req.query.bucket || undefined, res);
  }

  async deleteFile(req, res) {
    const objectName = `uploads/${req.params.fileName}`;
    return deleteObject(objectName, req.query.bucket || undefined, res);
  }

  async deleteMultiple(req, res) {
    const objectNames = getDeleteObjectNames(req);
    if (
      !Array.isArray(objectNames) ||
      objectNames.length === 0
    ) {
      throw new BadRequestError(
        'objectNames must be a non-empty array of object keys'
      );
    }

    const bucketName = req.query.bucket || req.body?.bucket || undefined;
    const results = await MediaServices.deleteMultipleMedia(
      objectNames,
      bucketName
    );

    return new Ok({
      message: 'Media deletion completed',
      description: 'Kết quả xóa từng media được trả về trong results.',
      metadata: {
        results,
        summary: {
          deleted: results.filter((result) => result.status === 'deleted').length,
          notFound: results.filter((result) => result.status === 'not_found').length,
          failed: results.filter((result) => result.status === 'error').length
        }
      }
    }).send(res);
  }
}

module.exports = new MediaControllers();
module.exports.MediaControllers = MediaControllers;
