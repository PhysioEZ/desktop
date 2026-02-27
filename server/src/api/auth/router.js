const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const loginController = require('./login');
const { clearCache } = require('./clearCache');

// Strict Rate Limit for Login (5 requests per minute)
const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: {
        status: 'error',
        message: 'Too many login attempts, please try again later.'
    }
});

router.post('/login', loginLimiter, loginController.login);
router.post('/clear-cache', clearCache);

module.exports = router;
