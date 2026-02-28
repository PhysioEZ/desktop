const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
require('./scripts/syncEngine');
const authRoutes = require('./api/auth/router');

const app = express();
app.disable('etag');
const PORT = process.env.PORT || 3000;


// Force fresh data for all API requests
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});


// Rate Turners
const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 1000, // Relaxed limit for navigation
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 50, // More breathing room for login attempts/tabs
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Employee-ID', 'X-Branch-ID', 'X-Refresh', 'X-Force-Remote'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for photo uploads
app.use(morgan('dev'));

const pool = require('./config/db');
app.use((req, res, next) => {
    const forceRemote = req.headers['x-force-remote'] === 'true' || req.headers['x-refresh'] === 'true';
    if (forceRemote) {
        // Trigger a background sync immediately so the data is fresh for the next query
        if (global.triggerFastSync) global.triggerFastSync();

        pool.queryContext.run({ forceRemote: true }, next);
    } else {
        next();
    }
});

// Apply Global Rate Limiter to all requests
app.use(globalLimiter);

// Static Files - Serve uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
