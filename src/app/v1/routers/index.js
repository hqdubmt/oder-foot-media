const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API v1 is running',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/media', require('./media'));

module.exports = router;
