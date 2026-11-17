'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { resolveUploadDir } = require('../src/helpers/multer.helpers');

test('resolveUploadDir creates the requested upload folder', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'media-uploads-'));

  try {
    const qrDir = resolveUploadDir(tempDir, 'qr');
    const nestedDir = resolveUploadDir(tempDir, 'images/a');
    const defaultDir = resolveUploadDir(tempDir);

    assert.equal(qrDir, path.join(tempDir, 'qr'));
    assert.equal(nestedDir, path.join(tempDir, 'images', 'a'));
    assert.equal(defaultDir, tempDir);
    assert.equal(fs.statSync(qrDir).isDirectory(), true);
    assert.equal(fs.statSync(nestedDir).isDirectory(), true);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('resolveUploadDir rejects paths that escape the upload directory', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'media-uploads-'));

  try {
    assert.throws(
      () => resolveUploadDir(tempDir, '../outside'),
      /valid relative path/
    );
    assert.throws(
      () => resolveUploadDir(tempDir, 'images\\a'),
      /valid relative path/
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
