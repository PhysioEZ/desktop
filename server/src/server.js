const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// CRASH GUARD: Catch background sync errors that would otherwise kill the process
process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});


const authRoutes = require('./api/auth/router');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate Turners
const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 1 minute)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 10, // Strict limit for auth routes
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins in production or check against environment variable
        if (!origin || process.env.NODE_ENV === 'production' || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Employee-ID', 'X-Branch-ID'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for photo uploads
app.use(morgan('dev'));

// Apply Global Rate Limiter to all requests
app.use(globalLimiter);

// Static Files - Serve uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes
// We mount auth routes at /api/auth
// So /api/auth/login will be the endpoint
const receptionRoutes = require('./api/reception/router');
const authMiddleware = require('./middleware/auth');

const adminRoutes = require('./api/admin/router');
const systemRoutes = require('./api/system/router');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/reception', authMiddleware, receptionRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/system', systemRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'PhysioEZ Node Server Running' });
});

// Serve Frontend Static Files
const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendBuildPath));

// Handle SPA routing - redirect all non-api routes to index.html
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/uploads') || req.url.startsWith('/assets')) {
        return next();
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// 404 Handler (only for /api routes now since others go to index.html)
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        res.status(404).json({ status: 'error', message: 'Not found' });
    } else {
        next();
    }
});

// Error Handler
app.use((err, req, res, next) => {
    const fs = require('fs');
    const logEntry = `\n[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack}\n`;
    fs.appendFileSync(path.join(__dirname, '../error.log'), logEntry);
    console.error(err.stack);
    res.status(500).json({ status: 'error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test Health: http://localhost:${PORT}/health`);
    console.log(`Test Login: http://localhost:${PORT}/api/auth/login`);
});
