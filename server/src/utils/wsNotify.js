// WebSocket Notification Helpers
// Use these in your API endpoints to trigger real-time updates

const wsManager = require('./websocket');

/**
 * Notify about registration changes
 */
function notifyRegistrationChange(branchId, action = 'created', registrationId = null) {
  const event = `registration:${action}`; // created, updated, deleted
  wsManager.notifyBranch(branchId, event, { targetId: registrationId });
}

/**
 * Notify about test changes
 */
function notifyTestChange(branchId, action = 'created', testId = null) {
  const event = `test:${action}`; // created, updated, deleted
  wsManager.notifyBranch(branchId, event, { targetId: testId });
}

/**
 * Notify about patient updates
 */
function notifyPatientUpdate(branchId, patientId = null) {
  wsManager.notifyBranch(branchId, 'patient:updated', { targetId: patientId });
}

/**
 * Notify about inquiry changes
 */
function notifyInquiryChange(branchId, action = 'created', inquiryId = null) {
  const event = `inquiry:${action}`; // created, updated
  wsManager.notifyBranch(branchId, event, { targetId: inquiryId });
}

/**
 * Notify about payment/collection
 */
function notifyPaymentCreated(branchId, paymentId = null) {
  wsManager.notifyBranch(branchId, 'payment:created', { targetId: paymentId });
}

/**
 * Notify about approval status changes
 */
function notifyApprovalChange(branchId, action = 'pending', approvalId = null) {
  const event = `approval:${action}`; // pending, resolved
  wsManager.notifyBranch(branchId, event, { targetId: approvalId });
}

/**
 * Notify specific employee about new notification
 */
function notifyNewNotification(employeeId, notificationId = null) {
  wsManager.notifyEmployee(employeeId, 'notification:new', { targetId: notificationId });
}

/**
 * Notify about schedule updates
 */
function notifyScheduleUpdate(branchId) {
  wsManager.notifyBranch(branchId, 'schedule:updated');
}

module.exports = {
  notifyRegistrationChange,
  notifyTestChange,
  notifyPatientUpdate,
  notifyInquiryChange,
  notifyPaymentCreated,
  notifyApprovalChange,
  notifyNewNotification,
  notifyScheduleUpdate,
};
