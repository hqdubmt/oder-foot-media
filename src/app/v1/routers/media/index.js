const express = require('express');
const asyncHandler = require('../../../../utils/asyncHandler.utils');
const MediaControllers = require('../../controllers/media.controllers');
const { uploadSingle, uploadMultiple } = require('../../../../helpers/multer.helpers');

const router = express.Router();

router.post('/upload', uploadSingle('file'), asyncHandler(MediaControllers.uploadSingle));
router.post('/uploads', uploadMultiple('files', 5), asyncHandler(MediaControllers.uploadMultiple));
router.get('/', asyncHandler(MediaControllers.list));
router.get('/:id', asyncHandler(MediaControllers.getById));
router.delete('/:id', asyncHandler(MediaControllers.delete));

module.exports = router;
