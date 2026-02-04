// EXAMPLE: How to integrate WebSocket notifications in your API endpoints
// Add these calls after successful database operations

const db = require('../config/database'); // Your DB connection
const {
  notifyRegistrationChange,
  notifyTestChange,
  notifyInquiryChange,
  notifyApprovalChange,
  notifyPaymentCreated,
} = require('../utils/wsNotify');

// ============================================
// EXAMPLE 1: Registration Submit
// ============================================
async function registrationSubmit(req, res) {
  const { branch_id, patient_name, phone, amount, ...otherData } = req.body;

  try {
    // 1. Insert into database
    const [result] = await db.query(
      `INSERT INTO registrations (branch_id, patient_name, phone, amount, ...) VALUES (?, ?, ?, ?, ...)`,
      [branch_id, patient_name, phone, amount, ...]
    );

    const registrationId = result.insertId;

    // 2. ✅ TRIGGER WEBSOCKET NOTIFICATION
    notifyRegistrationChange(branch_id, 'created', registrationId);

    // 3. Send response
    res.json({
      success: true,
      message: 'Registration created successfully',
      registration_id: registrationId,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ============================================
// EXAMPLE 2: Test Submit
// ============================================
async function testSubmit(req, res) {
  const { branch_id, patient_name, selected_tests, total_amount, ...otherData } = req.body;

  try {
    // 1. Insert test record
    const [result] = await db.query(
      `INSERT INTO tests (branch_id, patient_name, total_amount, ...) VALUES (?, ?, ?, ...)`,
      [branch_id, patient_name, total_amount, ...]
    );

    const testId = result.insertId;

    // 2. ✅ TRIGGER WEBSOCKET NOTIFICATION
    notifyTestChange(branch_id, 'created', testId);

    res.json({
      success: true,
      message: 'Test created successfully',
      test_id: testId,
    });
  } catch (error) {
    console.error('Test creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ============================================
// EXAMPLE 3: Inquiry Submit
// ============================================
async function inquirySubmit(req, res) {
  const { branch_id, patient_name, phone, service_type, ...otherData } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO inquiries (branch_id, patient_name, phone, service_type, ...) VALUES (?, ?, ?, ?, ...)`,
      [branch_id, patient_name, phone, service_type, ...]
    );

    const inquiryId = result.insertId;

    // ✅ TRIGGER WEBSOCKET NOTIFICATION
    notifyInquiryChange(branch_id, 'created', inquiryId);

    res.json({
      success: true,
      message: 'Inquiry created successfully',
      inquiry_id: inquiryId,
    });
  } catch (error) {
    console.error('Inquiry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ============================================
// EXAMPLE 4: Update Approval Status
// ============================================
async function updateApproval(req, res) {
  const { approval_id, action, branch_id } = req.body;

  try {
    const status = action === 'approve' ? 'approved' : 'rejected';

    await db.query(
      `UPDATE approvals SET status = ?, updated_at = NOW() WHERE approval_id = ?`,
      [status, approval_id]
    );

    // ✅ TRIGGER WEBSOCKET NOTIFICATION
    notifyApprovalChange(branch_id, 'resolved', approval_id);

    res.json({
      success: true,
      message: `Approval ${status} successfully`,
    });
  } catch (error) {
    console.error('Approval update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ============================================
// EXAMPLE 5: Payment/Collection
// ============================================
async function recordPayment(req, res) {
  const { branch_id, patient_id, amount, payment_method } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO payments (branch_id, patient_id, amount, payment_method, ...) VALUES (?, ?, ?, ?, ...)`,
      [branch_id, patient_id, amount, payment_method, ...]
    );

    const paymentId = result.insertId;

    // ✅ TRIGGER WEBSOCKET NOTIFICATION
    notifyPaymentCreated(branch_id, paymentId);

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      payment_id: paymentId,
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// ============================================
// HOW TO INTEGRATE IN YOUR EXISTING CODE:
// ============================================
/*
1. Find your API endpoint file (e.g., registration.js, tests.js, inquiry.js)
2. Import the notification helpers at the top:
   const { notifyRegistrationChange, notifyTestChange, ... } = require('../../utils/wsNotify');

3. After successful database INSERT/UPDATE/DELETE, add the notification call:
   notifyRegistrationChange(branch_id, 'created', registrationId);

4. That's it! The frontend will automatically receive the update and refresh the cache.

IMPORTANT: Only call notifications AFTER successful database operations, not before!
*/

module.exports = {
  registrationSubmit,
  testSubmit,
  inquirySubmit,
  updateApproval,
  recordPayment,
};
