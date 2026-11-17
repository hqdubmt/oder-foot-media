'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { MediaServices } = require('../src/app/v1/services/media.services');
const MinioStorage = require('../src/configs/minio.config');

test('deleteMultipleMedia reports each object outcome', async () => {
  const mediaServices = new MediaServices();
  const originalDeleteMedia = mediaServices.deleteMedia;
  const originalConsoleError = console.error;

  mediaServices.deleteMedia = async (objectName) => {
    if (objectName === 'uploads/missing.jpg') return false;
    if (objectName === 'uploads/failure.jpg') throw new Error('storage error');
    return true;
  };
  console.error = () => {};

  try {
    const results = await mediaServices.deleteMultipleMedia([
      'uploads/deleted.jpg',
      'uploads/missing.jpg',
      'uploads/failure.jpg'
    ]);

    assert.deepEqual(results, [
      { objectName: 'uploads/deleted.jpg', status: 'deleted' },
      { objectName: 'uploads/missing.jpg', status: 'not_found' },
      { objectName: 'uploads/failure.jpg', status: 'error' }
    ]);
  } finally {
    mediaServices.deleteMedia = originalDeleteMedia;
    console.error = originalConsoleError;
  }
});

test('uploadMultiple applies objectNames to files in the same order', async () => {
  const mediaServices = new MediaServices();
  const originalUploadSingle = mediaServices.uploadSingle;
  const originalConsoleLog = console.log;
  const calls = [];

  mediaServices.uploadSingle = async (file, options) => {
    calls.push({ file, objectName: options.objectName });
    return options.objectName;
  };
  console.log = () => {};

  try {
    const objectNames = ['uploads/one.jpg', 'uploads/two.jpg'];
    const results = await mediaServices.uploadMultiple(
      [{ originalname: 'one.jpg' }, { originalname: 'two.jpg' }],
      { objectNames }
    );

    assert.deepEqual(results, objectNames);
    assert.deepEqual(calls.map((call) => call.objectName), objectNames);
  } finally {
    mediaServices.uploadSingle = originalUploadSingle;
    console.log = originalConsoleLog;
  }
});

test('getMediaByObjectNames returns signed metadata and per-object status', async () => {
  const mediaServices = new MediaServices();
  const originalGetClient = MinioStorage.getClient;
  const originalGetPresignedObjectUrl = MinioStorage.getPresignedObjectUrl;
  const originalConsoleError = console.error;

  MinioStorage.getClient = () => ({
    headObject: ({ Key }) => ({
      promise: async () => {
        if (Key.endsWith('missing.jpg')) {
          throw Object.assign(new Error('not found'), {
            code: 'NotFound',
            statusCode: 404
          });
        }
        if (Key.endsWith('error.jpg')) throw new Error('storage error');
        return {
          ContentLength: 12,
          ContentType: 'image/jpeg',
          LastModified: new Date('2026-01-01T00:00:00.000Z')
        };
      }
    })
  });
  MinioStorage.getPresignedObjectUrl = async (bucket, key) =>
    `signed:${bucket}/${key}`;
  console.error = () => {};

  try {
    const results = await mediaServices.getMediaByObjectNames([
      'uploads/found.jpg',
      'uploads/missing.jpg',
      'uploads/error.jpg'
    ], 'test-bucket');

    assert.equal(results[0].status, 'found');
    assert.equal(results[0].media.mimeType, 'image/jpeg');
    assert.equal(results[0].media.url, 'signed:test-bucket/uploads/found.jpg');
    assert.deepEqual(results[1], {
      objectName: 'uploads/missing.jpg',
      status: 'not_found'
    });
    assert.deepEqual(results[2], {
      objectName: 'uploads/error.jpg',
      status: 'error'
    });
  } finally {
    MinioStorage.getClient = originalGetClient;
    MinioStorage.getPresignedObjectUrl = originalGetPresignedObjectUrl;
    console.error = originalConsoleError;
  }
});
