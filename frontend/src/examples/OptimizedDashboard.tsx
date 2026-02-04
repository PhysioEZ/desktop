// OPTIMIZED DASHBOARD EXAMPLE
// This shows how to refactor your existing Dashboard.tsx to use the new optimization system

import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useWebSocket } from "../hooks/useWebSocket";
import {
    useDashboard,
    useFormOptions,
    useNotifications,
    useApprovals,
    useTimeSlots,
} from "../hooks/useQueries";
import {
    useCreateRegistration,
    useCreateTest,
    useCreateInquiry,
    useCreateTestInquiry,
    useUpdateApproval,
} from "../hooks/useMutations";

function OptimizedDashboard() {
    const { user } = useAuthStore();
    const [activeModal, setActiveModal] = useState<"registration" | "test" | "inquiry" | null>(null);
    const [appointmentDate, setAppointmentDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    // ============================================
    // 1. SETUP WEBSOCKET (Once per app/dashboard)
    // ============================================
    const { isConnected } = useWebSocket({
        enabled: !!user,
        branchId: user?.branch_id,
        employeeId: user?.employee_id,
        role: user?.role,
        authToken: user?.token,
    });

    // ============================================
    // 2. FETCH DATA WITH CACHING (No more useEffect!)
    // ============================================

    // Dashboard stats - cached for 3 minutes
    const { data: dashboardData, isLoading: isDashboardLoading } = useDashboard(
        user?.branch_id
    );

    // Form options - cached for 5 minutes
    const { data: formOptions, isLoading: isFormLoading } = useFormOptions(
        user?.branch_id,
        appointmentDate
    );

    // Notifications - cached for 30 seconds, auto-refetch every minute
    const { data: notificationsData } = useNotifications(user?.employee_id);

    // Approvals - cached for 2 minutes
    const { data: approvals } = useApprovals(user?.branch_id);

    // Time slots - cached for 1 minute
    const { data: timeSlots } = useTimeSlots(appointmentDate);

    // ============================================
    // 3. SETUP MUTATIONS (Replace manual fetch calls)
    // ============================================

    const createRegistration = useCreateRegistration();
    const createTest = useCreateTest();
    const createInquiry = useCreateInquiry();
    const createTestInquiry = useCreateTestInquiry();
    const updateApproval = useUpdateApproval();

    // ============================================
    // 4. HANDLE FORM SUBMISSIONS
    // ============================================

    const handleRegistrationSubmit = async (formData: any) => {
        if (!user?.branch_id || !user?.employee_id) return;

        try {
            await createRegistration.mutateAsync({
                branch_id: user.branch_id,
                employee_id: user.employee_id,
                patient_name: formData.patient_name,
                age: formData.age,
                gender: formData.gender,
                phone: formData.phone,
                address: formData.address,
                chief_complaint: formData.chief_complaint,
                referral_source: formData.referral_source,
                consultation_type: formData.consultation_type,
                appointment_date: appointmentDate,
                appointment_time: formData.appointment_time,
                amount: formData.amount,
                payment_method: formData.payment_method,
                payment_splits: formData.payment_splits,
                photo_data: formData.photo_data,
            });

            // ✅ Success! The mutation hook automatically:
            // - Shows success toast
            // - Invalidates dashboard cache
            // - Invalidates registrations cache
            // - Invalidates schedule cache
            // - Triggers WebSocket notification to other users

            setActiveModal(null);
            // No need to manually refetch data!
        } catch (error) {
            // ✅ Error toast shown automatically by mutation hook
            console.error("Registration failed:", error);
        }
    };

    const handleTestSubmit = async (formData: any) => {
        if (!user?.branch_id || !user?.employee_id) return;

        try {
            await createTest.mutateAsync({
                branch_id: user.branch_id,
                employee_id: user.employee_id,
                patient_name: formData.patient_name,
                age: formData.age,
                gender: formData.gender,
                phone: formData.phone,
                visit_date: formData.visit_date,
                assigned_date: formData.assigned_date,
                selected_tests: formData.selected_tests,
                limb_type: formData.limb_type,
                done_by: formData.done_by,
                total_amount: formData.total_amount,
                advance_amount: formData.advance_amount,
                discount_amount: formData.discount_amount,
                due_amount: formData.due_amount,
                payment_splits: formData.payment_splits,
                other_test_name: formData.other_test_name,
            });

            setActiveModal(null);
        } catch (error) {
            console.error("Test creation failed:", error);
        }
    };

    const handleInquirySubmit = async (formData: any) => {
        if (!user?.branch_id || !user?.employee_id) return;

        try {
            await createInquiry.mutateAsync({
                branch_id: user.branch_id,
                employee_id: user.employee_id,
                patient_name: formData.patient_name,
                age: formData.age,
                gender: formData.gender,
                phone: formData.phone,
                inquiry_date: formData.inquiry_date,
                service_type: formData.service_type,
                chief_complaint: formData.chief_complaint,
                referral_source: formData.referral_source,
                communication_type: formData.communication_type,
                notes: formData.notes,
            });

            setActiveModal(null);
        } catch (error) {
            console.error("Inquiry creation failed:", error);
        }
    };

    const handleApprovalAction = async (approvalId: number, action: "approve" | "reject") => {
        if (!user?.branch_id || !user?.employee_id) return;

        try {
            await updateApproval.mutateAsync({
                approval_id: approvalId,
                action,
                branch_id: user.branch_id,
                employee_id: user.employee_id,
            });
            // Approvals list automatically refreshed!
        } catch (error) {
            console.error("Approval update failed:", error);
        }
    };

    // ============================================
    // 5. RENDER UI
    // ============================================

    const isLoading = isDashboardLoading || isFormLoading;

    return (
        <div className="dashboard">
            {/* WebSocket Status Indicator (optional) */}
            <div className="status-bar">
                <span className={isConnected ? "connected" : "disconnected"}>
                    {isConnected ? "🟢 Live" : "🔴 Offline"}
                </span>
            </div>

            {/* Loading State */}
            {isLoading && <div>Loading dashboard...</div>}

            {/* Dashboard Stats */}
            {dashboardData && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Registrations Today</h3>
                        <p>{dashboardData.registration.today_total}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Tests Today</h3>
                        <p>{dashboardData.tests.today_total}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Collections Today</h3>
                        <p>₹{dashboardData.collections.today_total}</p>
                    </div>
                    {/* Add more stats as needed */}
                </div>
            )}

            {/* Notifications */}
            {notificationsData && (
                <div className="notifications">
                    <h3>Notifications ({notificationsData.unread_count})</h3>
                    {notificationsData.notifications.map((notif) => (
                        <div key={notif.notification_id} className="notification-item">
                            {notif.message}
                        </div>
                    ))}
                </div>
            )}

            {/* Approvals */}
            {approvals && approvals.length > 0 && (
                <div className="approvals">
                    <h3>Pending Approvals ({approvals.length})</h3>
                    {approvals.map((approval) => (
                        <div key={approval.approval_id} className="approval-item">
                            <p>{approval.patient_name} - {approval.details}</p>
                            <button
                                onClick={() => handleApprovalAction(approval.approval_id, "approve")}
                                disabled={updateApproval.isPending}
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => handleApprovalAction(approval.approval_id, "reject")}
                                disabled={updateApproval.isPending}
                            >
                                Reject
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Action Buttons */}
            <div className="actions">
                <button onClick={() => setActiveModal("registration")}>
                    New Registration
                </button>
                <button onClick={() => setActiveModal("test")}>New Test</button>
                <button onClick={() => setActiveModal("inquiry")}>New Inquiry</button>
            </div>

            {/* Modals */}
            {activeModal === "registration" && (
                <RegistrationModal
                    formOptions={formOptions}
                    timeSlots={timeSlots}
                    onSubmit={handleRegistrationSubmit}
                    onClose={() => setActiveModal(null)}
                    isSubmitting={createRegistration.isPending}
                />
            )}

            {activeModal === "test" && (
                <TestModal
                    formOptions={formOptions}
                    onSubmit={handleTestSubmit}
                    onClose={() => setActiveModal(null)}
                    isSubmitting={createTest.isPending}
                />
            )}

            {activeModal === "inquiry" && (
                <InquiryModal
                    formOptions={formOptions}
                    onSubmit={handleInquirySubmit}
                    onClose={() => setActiveModal(null)}
                    isSubmitting={createInquiry.isPending}
                />
            )}
        </div>
    );
}

export default OptimizedDashboard;

// ============================================
// KEY DIFFERENCES FROM OLD CODE:
// ============================================

/*
❌ OLD WAY:
- useEffect with fetch calls
- Manual state management (setData, setLoading)
- Polling with setInterval
- Manual refetching after mutations
- No real-time updates
- Duplicate API calls

✅ NEW WAY:
- useQuery hooks (automatic caching)
- No manual state management
- No polling (WebSocket handles updates)
- Automatic cache invalidation
- Real-time updates across all users
- Minimal API calls

MIGRATION STEPS:
1. Replace all useEffect fetch calls with useQuery hooks
2. Replace all manual POST/PUT/DELETE with useMutation hooks
3. Add useWebSocket at top level
4. Remove manual refetch logic
5. Remove polling intervals
6. Add WebSocket notifications to backend endpoints
*/
