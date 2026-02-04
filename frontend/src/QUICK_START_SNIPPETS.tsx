// QUICK START: Add these snippets to your Dashboard.tsx

// ============================================
// 1. ADD TO IMPORTS (top of file, around line 1-57)
// ============================================

import { useWebSocket } from "../hooks/useWebSocket";
import {
    useCreateRegistration,
    useCreateTest,
    useCreateInquiry,
    useCreateTestInquiry,
} from "../hooks/useMutations";

// ============================================
// 2. ADD AFTER YOUR EXISTING HOOKS (around line 268)
// ============================================

// WebSocket for real-time updates
useWebSocket({
    enabled: !!user,
    branchId: user?.branch_id,
    employeeId: user?.employee_id,
    role: user?.role || 'reception',
    authToken: user?.token,
});

// ============================================
// 3. ADD AFTER YOUR QUERIES (around line 443)
// ============================================

// Mutations for create operations
const createRegistration = useCreateRegistration();
const createTest = useCreateTest();
const createInquiry = useCreateInquiry();
const createTestInquiry = useCreateTestInquiry();

// ============================================
// 4. REPLACE YOUR handleSubmit FUNCTION (lines 763-950)
// ============================================

const handleSubmit = async () => {
    if (!formRef.current || !user?.branch_id || !user?.employee_id) return;
    const formData = new FormData(formRef.current);
    const formObject: Record<string, string> = {};
    formData.forEach((value, key) => {
        formObject[key] = value.toString();
    });

    try {
        if (activeModal === "registration") {
            const totalReq = parseFloat(formObject.amount) || 0;
            let finalSplits = { ...regPaymentSplits };
            if (Object.keys(finalSplits).length === 1) {
                const m = Object.keys(finalSplits)[0];
                finalSplits[m] = totalReq;
            }

            const currentSum = Object.values(finalSplits).reduce((a, b) => a + b, 0);
            if (currentSum !== totalReq) {
                setSubmitMessage({
                    type: "error",
                    text: `Payment split total (₹${currentSum}) does not match Consultation Amount (₹${totalReq})`,
                });
                return;
            }

            await createRegistration.mutateAsync({
                branch_id: user.branch_id,
                employee_id: user.employee_id,
                patient_name: formObject.patient_name,
                phone: formObject.phone,
                email: formObject.email || "",
                gender: formObject.gender,
                age: formObject.age,
                conditionType: formObject.conditionType,
                conditionType_other: formObject.conditionType_other || "",
                referralSource: formObject.referralSource,
                referred_by: formObject.referred_by || "",
                occupation: formObject.occupation || "",
                address: formObject.address || "",
                inquiry_type: formObject.inquiry_type,
                appointment_date: formObject.appointment_date || null,
                appointment_time: formObject.appointment_time || null,
                amount: formObject.amount || "0",
                payment_method: Object.keys(finalSplits).join(","),
                payment_amounts: finalSplits,
                remarks: formObject.remarks || "",
                patient_photo_data: photoData || "",
            });

            closeModal();

        } else if (activeModal === "test") {
            const testNames = Object.entries(selectedTests)
                .filter(([, val]) => val.checked)
                .map(([key]) => key);
            const testAmounts: Record<string, number> = {};
            Object.entries(selectedTests).forEach(([key, val]) => {
                if (val.checked && val.amount)
                    testAmounts[key] = parseFloat(val.amount) || 0;
            });

            const totalReq = parseFloat(advanceAmount) || 0;
            let finalSplits = { ...testPaymentSplits };
            if (Object.keys(finalSplits).length === 1) {
                const m = Object.keys(finalSplits)[0];
                finalSplits[m] = totalReq;
            }

            const currentSum = Object.values(finalSplits).reduce((a, b) => a + b, 0);
            if (currentSum !== totalReq) {
                setSubmitMessage({
                    type: "error",
                    text: `Payment split total (₹${currentSum}) does not match Advance Amount (₹${totalReq})`,
                });
                return;
            }

            await createTest.mutateAsync({
                branch_id: user.branch_id,
                employee_id: user.employee_id,
                patient_name: formObject.patient_name,
                age: formObject.age,
                gender: formObject.gender,
                dob: formObject.dob || null,
                parents: formObject.parents || "",
                relation: formObject.relation || "",
                phone_number: formObject.phone_number || "",
                alternate_phone_no: formObject.alternate_phone_no || "",
                address: formObject.address || "",
                referred_by: formObject.referred_by || "",
                limb: formObject.limb || null,
                test_names: testNames,
                test_amounts: testAmounts,
                other_test_name: otherTestName,
                visit_date: formObject.visit_date,
                assigned_test_date: formObject.assigned_test_date,
                test_done_by: formObject.test_done_by,
                total_amount: parseFloat(totalAmount) || 0,
                advance_amount: parseFloat(advanceAmount) || 0,
                discount: parseFloat(discountAmount) || 0,
                payment_method: Object.keys(finalSplits).join(","),
                payment_amounts: finalSplits,
            });

            closeModal();

        } else if (activeModal === "inquiry") {
            await createInquiry.mutateAsync({
                branch_id: user.branch_id,
                employee_id: user.employee_id,
                patient_name: formObject.patient_name,
                age: formObject.age,
                gender: formObject.gender,
                phone: formObject.phone,
                inquiry_type: formObject.inquiry_type || null,
                communication_type: formObject.communication_type || null,
                referralSource: formObject.referralSource || "self",
                conditionType: formObject.conditionType || "",
                conditionType_other: formObject.conditionType_other || "",
                remarks: formObject.remarks || "",
                expected_date: formObject.expected_date || null,
            });

            closeModal();

        } else if (activeModal === "test_inquiry") {
            await createTestInquiry.mutateAsync({
                branch_id: user.branch_id,
                employee_id: user.employee_id,
                patient_name: formObject.patient_name,
                age: formObject.age,
                gender: formObject.gender,
                phone: formObject.phone,
                inquiry_date: formObject.inquiry_date,
                test_name: formObject.test_name,
                notes: formObject.notes || "",
            });

            closeModal();
        }
    } catch (error) {
        console.error("Submission error:", error);
    }
};

// ============================================
// 5. UPDATE SUBMIT BUTTON (in your modal JSX)
// ============================================

// Find your submit button and update the disabled prop:
<button
    onClick={handleSubmit}
    disabled={
        createRegistration.isPending ||
        createTest.isPending ||
        createInquiry.isPending ||
        createTestInquiry.isPending
    }
    className="your-button-classes"
>
    {createRegistration.isPending ||
        createTest.isPending ||
        createInquiry.isPending ||
        createTestInquiry.isPending
        ? "Submitting..."
        : "Submit"}
</button>

// ============================================
// 6. OPTIONAL: Add WebSocket status indicator
// ============================================

// Add this to your header/status bar:
const { isConnected } = useWebSocket({
    enabled: !!user,
    branchId: user?.branch_id,
    employeeId: user?.employee_id,
    role: user?.role || 'reception',
    authToken: user?.token,
});

// In your JSX:
<div className="status-indicator">
    <span className={isConnected ? "text-green-500" : "text-red-500"}>
        {isConnected ? "🟢 Live" : "🔴 Offline"}
    </span>
</div>
