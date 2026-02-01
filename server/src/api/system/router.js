const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/status', controller.getSystemStatus);

module.exports = router;
