const { Ok, Created } = require('../../../cors/sycessReponse.cors');
const MediaServices = require('../services/media.services');

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
    const media = await MediaServices.uploadSingle(file, { bucketName, folder });

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
    const mediaList = await MediaServices.uploadMultiple(files, { bucketName, folder });

    return new Created({
      message: 'Media uploaded successfully',
      description: 'Danh sách file đã được upload lên storage thành công.',
      metadata: { files: mediaList }
    }).send(res);
  }

  async list(req, res) {
    const bucketName = req.query.bucket || undefined;
    const prefix = req.query.prefix || 'uploads/';
    const mediaList = await MediaServices.listMedia(bucketName, prefix);

    return new Ok({
      message: 'Media list retrieved successfully',
      description: 'Lấy danh sách media thành công.',
      metadata: { files: mediaList }
    }).send(res);
  }

  async getById(req, res) {
    const bucketName = req.query.bucket || undefined;
    const prefix = req.query.prefix || 'uploads/';
    const media = await MediaServices.getMediaById(req.params.id, bucketName, prefix);

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

  async delete(req, res) {
    const mediaId = req.params.id;
    const bucketName = req.query.bucket || undefined;
    const deleted = await MediaServices.deleteMedia(mediaId, bucketName);

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
      metadata: { deletedId: mediaId }
    }).send(res);
  }
}

module.exports = new MediaControllers();
module.exports.MediaControllers = MediaControllers;
