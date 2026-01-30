const express = require('express');
const router = express.Router();

const dashboardController = require('./dashboard');
const formOptionsController = require('./formOptions');
const fetchDataController = require('./fetchData');
const chatController = require('./chat');
const registrationController = require('./registration');
const inquiryController = require('./inquiry');
const testsController = require('./tests');
const patientsController = require('./patients');
const treatmentPlansController = require('./treatmentPlans');
const tokensController = require('./tokens');
const attendanceController = require('./attendance');
const paymentsController = require('./payments');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer
const uploadDir = path.join(__dirname, '../../../uploads/chat_uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, "");
        cb(null, `chat-${Date.now()}-${safeName}`);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 75 * 1024 * 1024 } // 75MB max
});

// GET /api/reception/dashboard
router.get('/dashboard', dashboardController.getDashboardData);

// GET /api/reception/form_options
router.get('/form_options', formOptionsController.getFormOptions);

// GET /api/reception/notifications
router.get('/notifications', fetchDataController.getNotifications);
router.get('/get_pending_approvals', fetchDataController.getPendingApprovals);

// Slots & Search
router.get('/get_slots', fetchDataController.getSlots);
router.get('/get_treatment_slots', fetchDataController.getTreatmentSlots);
router.get('/search_patients', fetchDataController.handleSearchPatients);
router.get('/get_payment_methods', fetchDataController.handleGetPaymentMethods);

// Submissions
router.post('/registration_submit', registrationController.submitRegistration);
router.post('/quick_add_patient', registrationController.quickAddPatient);
router.post('/inquiry_submit', inquiryController.submitInquiry);
router.post('/test_inquiry_submit', inquiryController.submitTestInquiry);
router.post('/test_submit', testsController.submitTest);
router.post('/add_test_for_patient', testsController.addTestForPatient);

// Patients & Attendance/Tokens
router.all('/patients', patientsController.handlePatientsRequest);
router.all('/treatment_plans', treatmentPlansController.handleTreatmentPlanRequest);
router.all('/tokens', tokensController.handleTokensRequest);
router.post('/attendance', attendanceController.handleAttendanceRequest);

// Payments
router.post('/add_payment', paymentsController.handleAddPayment);

// Chat Routes
router.get('/chat/users', chatController.getUsers);
router.get('/chat/fetch', chatController.fetchMessages);
router.get('/chat/unread', chatController.unreadCount);
router.post('/chat/send', upload.single('chat_file'), chatController.sendMessage);

// Schedule Routes
const scheduleController = require('./schedule');
router.get('/schedule', scheduleController.fetchSchedule);
router.get('/schedule/slots', scheduleController.getSlots);
router.post('/schedule/reschedule', scheduleController.reschedule);

// Unified Request Handlers (Page Managers)
const registrationManager = require('./registration_manager');
router.post('/inquiry', inquiryController.handleInquiryRequest);
router.post('/registration', registrationManager.handleRegistrationRequest);

module.exports = router;
