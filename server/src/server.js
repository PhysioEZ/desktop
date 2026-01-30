const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./api/auth/router');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true, // Reflect origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Employee-ID', 'X-Branch-ID'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for photo uploads
app.use(morgan('dev'));

// Static Files - Serve uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
// We mount auth routes at /api/auth
// So /api/auth/login will be the endpoint
const receptionRoutes = require('./api/reception/router');
const authMiddleware = require('./middleware/auth');

const adminRoutes = require('./api/admin/router');

app.use('/api/auth', authRoutes);
app.use('/api/reception', authMiddleware, receptionRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

// All APIs have been ported to Node.js. No proxy to PHP needed.
// app.use('/api', createProxyMiddleware({ 
//     target: 'http://localhost',
//     changeOrigin: true,
//     pathRewrite: {
//         '^/api': '/admin/desktop/server/api'
//     }
// }));
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'PhysioEZ Node Server Running' });
});

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ status: 'error', message: 'Not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    const fs = require('fs');
    const logEntry = `\n[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack}\n`;
    fs.appendFileSync(path.join(__dirname, '../error.log'), logEntry);
    console.error(err.stack);
    res.status(500).json({ status: 'error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Test Health: http://localhost:${PORT}/health`);
    console.log(`Test Login: http://localhost:${PORT}/api/auth/login`);
});
