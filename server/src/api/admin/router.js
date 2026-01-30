const express = require('express');
const router = express.Router();
const servicesController = require('./services');
const dashboardController = require('./dashboard');

// Dashboard
router.get('/dashboard', dashboardController.getDashboardData);

// Services (Dynamic Tracks) Routes
router.all('/services', servicesController.handleServicesRequest);

module.exports = router;
