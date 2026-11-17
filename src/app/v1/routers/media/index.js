const express = require('express');
const asyncHandler = require('../../../../utils/asyncHandler.utils');
const MediaControllers = require('../../controllers/media.controllers');
const { uploadSingle, uploadMultiple } = require('../../../../helpers/multer.helpers');

const router = express.Router();

router.post('/upload', uploadSingle('file'), asyncHandler(MediaControllers.uploadSingle));
router.post('/uploads', uploadMultiple('files', 5), asyncHandler(MediaControllers.uploadMultiple));
router.get('/uploads/:fileName', asyncHandler(MediaControllers.getFile));
router.delete('/uploads/:fileName', asyncHandler(MediaControllers.deleteFile));
router.delete('/', asyncHandler(MediaControllers.deleteMultiple));

router.post(
  '/objects',
  uploadMultiple('files', 5),
  asyncHandler((req, res) => MediaControllers.uploadMultipleByObjectNames(req, res))
);
router.delete('/objects', asyncHandler(MediaControllers.deleteMultiple));
router.get('/objects', asyncHandler(MediaControllers.getByObjectNames));
router.get('/', asyncHandler(MediaControllers.list));
router.get('/detail', asyncHandler(MediaControllers.getById));
router.get('/:id', asyncHandler(MediaControllers.getById));
router.delete('/:id', asyncHandler(MediaControllers.delete));


module.exports = router;
