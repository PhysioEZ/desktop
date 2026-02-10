const express = require("express");
const router = express.Router();
const authenticate = require("../../middleware/auth");

const dashboardController = require("./dashboard");
const formOptionsController = require("./formOptions");
const fetchDataController = require("./fetchData");
const chatController = require("./chat");
const registrationController = require("./registration");
const inquiryController = require("./inquiry");
const testsController = require("./tests");
const patientsController = require("./patients");
const treatmentPlansController = require("./treatmentPlans");
const tokensController = require("./tokens");
const attendanceController = require("./attendance");
const paymentsController = require("./payments");
const insightsController = require("./insights");
const profileController = require("./profile");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure Multer
const uploadDir = path.join(__dirname, "../../../uploads/chat_uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, "");
    cb(null, `chat-${Date.now()}-${safeName}`);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 75 * 1024 * 1024 }, // 75MB max
});

const notesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const notesDir = path.join(__dirname, "../../../uploads/note_attachments");
    if (!fs.existsSync(notesDir)) fs.mkdirSync(notesDir, { recursive: true });
    cb(null, notesDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, "");
    cb(null, `note-${Date.now()}-${safeName}`);
  },
});
const uploadNotes = multer({
  storage: notesStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

// GET /api/reception/dashboard
router.get("/dashboard", dashboardController.getDashboardData);

// GET /api/reception/check_updates
const checkUpdatesController = require("./checkUpdates");
router.get("/check_updates", checkUpdatesController.checkUpdates);

// GET /api/reception/form_options
router.get("/form_options", formOptionsController.getFormOptions);
router.get("/daily_intelligence", insightsController.getDailyIntelligence);
router.get("/profile", profileController.getProfileData);

// GET /api/reception/notifications
router.get("/notifications", fetchDataController.getNotifications);
router.get("/get_pending_approvals", fetchDataController.getPendingApprovals);

// Slots & Search
router.get("/get_slots", fetchDataController.getSlots);
router.get("/get_treatment_slots", fetchDataController.getTreatmentSlots);
router.get("/search_patients", fetchDataController.handleSearchPatients);
router.get("/get_payment_methods", fetchDataController.handleGetPaymentMethods);

// Submissions
router.post("/registration_submit", registrationController.submitRegistration);
router.post("/quick_add_patient", registrationController.quickAddPatient);
router.post("/inquiry_submit", inquiryController.submitInquiry);
router.post("/test_inquiry_submit", inquiryController.submitTestInquiry);
router.post("/test_submit", testsController.submitTest);
router.post("/add_test_for_patient", testsController.addTestForPatient);

// Patients & Attendance/Tokens
router.all("/patients", patientsController.handlePatientsRequest);
router.all("/treatment_plans", treatmentPlansController.handleTreatmentPlanRequest);
router.post("/edit_treatment_plan", (req, res) => {
  req.body.action = "edit_plan";
  treatmentPlansController.handleTreatmentPlanRequest(req, res);
});
router.all("/tokens", tokensController.handleTokensRequest);
router.post("/attendance", attendanceController.handleAttendanceRequest);

// Payments
router.post("/add_payment", paymentsController.handleAddPayment);

// Chat Routes
router.get("/chat/users", chatController.getUsers);
router.get("/chat/fetch", chatController.fetchMessages);
router.get("/chat/unread", chatController.unreadCount);
router.post("/chat/send", upload.single("chat_file"), chatController.sendMessage);
router.post("/chat/delete", chatController.deleteMessage);

// Schedule Routes
const scheduleController = require("./schedule");
router.get("/schedule", scheduleController.fetchSchedule);
router.get("/schedule/slots", scheduleController.getSlots);
router.post("/schedule/reschedule", scheduleController.reschedule);

// Unified Request Handlers (Page Managers)
const registrationManager = require("./registration_manager");
router.post("/inquiry", inquiryController.handleInquiryRequest);
router.post("/registration", registrationManager.handleRegistrationRequest);

const billingController = require("./billing");
const notesController = require("./notes");
const getAttendanceDataController = require("./getAttendanceData");
const getAttendanceHistoryController = require("./getAttendanceHistory");

// Notes Routes
router.get("/notes", authenticate, notesController.getNotes);
router.get("/notes/users", authenticate, notesController.getBranchUsers);
router.post("/notes", authenticate, uploadNotes.single("attachment"), notesController.addNote);
router.delete("/notes/:id", authenticate, notesController.deleteNote);

router.get("/attendance_data", authenticate, getAttendanceDataController.getAttendanceData);
router.get("/get_attendance_history", authenticate, getAttendanceHistoryController.getAttendanceHistory);
router.post("/billing", authenticate, billingController.handleBillingRequest);

module.exports = router;
