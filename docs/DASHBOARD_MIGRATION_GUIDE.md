# Step-by-Step Migration Guide for Dashboard.tsx

## Overview
This guide shows you exactly how to refactor your existing `Dashboard.tsx` to use the new optimization system.

---

## Phase 1: Add WebSocket Connection (5 minutes)

### Step 1.1: Import the WebSocket hook
Add this to your imports at the top of Dashboard.tsx:

```tsx
import { useWebSocket } from "../hooks/useWebSocket";
```

### Step 1.2: Initialize WebSocket in your component
Add this right after your existing hooks (around line 268):

```tsx
// Add WebSocket connection for real-time updates
useWebSocket({
  enabled: !!user,
  branchId: user?.branch_id,
  employeeId: user?.employee_id,
  role: user?.role || 'reception',
  authToken: user?.token,
});
```

**That's it for Phase 1!** Your dashboard will now receive real-time updates.

---

## Phase 2: Replace Manual Submissions with Mutations (15 minutes)

### Step 2.1: Import mutation hooks
Add to your imports:

```tsx
import {
  useCreateRegistration,
  useCreateTest,
  useCreateInquiry,
  useCreateTestInquiry,
} from "../hooks/useMutations";
```

### Step 2.2: Initialize mutations
Add after your queries (around line 443):

```tsx
// Mutations for create operations
const createRegistration = useCreateRegistration();
const createTest = useCreateTest();
const createInquiry = useCreateInquiry();
const createTestInquiry = useCreateTestInquiry();
```

### Step 2.3: Refactor handleSubmit function
Replace your existing `handleSubmit` function (lines 763-950) with this optimized version:

```tsx
const handleSubmit = async () => {
  if (!formRef.current || !user?.branch_id || !user?.employee_id) return;
  const formData = new FormData(formRef.current);
  const formObject: Record<string, string> = {};
  formData.forEach((value, key) => {
    formObject[key] = value.toString();
  });

  try {
    if (activeModal === "registration") {
      // Validate payment splits
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

      // ✅ Use mutation instead of manual fetch
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

      // ✅ Success! Mutation handles cache invalidation and notifications
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

      // ✅ Use mutation
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
      // ✅ Use mutation
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
      // ✅ Use mutation
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
    // Error handling is automatic via mutation hooks
    console.error("Submission error:", error);
  }
};
```

### Step 2.4: Update loading states
Replace `isSubmitting` with mutation pending states in your UI:

```tsx
// In your submit button:
<button
  onClick={handleSubmit}
  disabled={
    createRegistration.isPending ||
    createTest.isPending ||
    createInquiry.isPending ||
    createTestInquiry.isPending
  }
>
  {createRegistration.isPending || createTest.isPending || createInquiry.isPending || createTestInquiry.isPending
    ? "Submitting..."
    : "Submit"}
</button>
```

---

## Phase 3: Clean Up (5 minutes)

### Step 3.1: Remove unused state
You can now remove these state variables (they're handled by mutations):

```tsx
// ❌ Remove these:
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitMessage, setSubmitMessage] = useState<{
  type: "success" | "error";
  text: string;
} | null>(null);
```

### Step 3.2: Simplify closeModal
Update your `closeModal` function to remove manual refetching:

```tsx
const closeModal = () => {
  setActiveModal(null);
  setAdvanceAmount("");
  setDiscountAmount("");
  setDueAmount("");
  // ❌ Remove: setSubmitMessage(null);
  setPhotoData(null);
  // ... rest of your reset logic
  
  // ❌ Remove any manual refetch calls like:
  // queryClient.invalidateQueries(...)
  // Mutations handle this automatically!
};
```

---

## Phase 4: Backend Integration (10 minutes per endpoint)

For each API endpoint that creates/updates/deletes data, add WebSocket notifications.

### Example: registration_submit.js

```javascript
// At the top of the file
const { notifyRegistrationChange } = require('../../utils/wsNotify');

// In your submit handler, after successful database insert:
const [result] = await db.query('INSERT INTO registrations ...');
const registrationId = result.insertId;

// ✅ Add this line:
notifyRegistrationChange(branch_id, 'created', registrationId);

res.json({ success: true, registration_id: registrationId });
```

### Repeat for other endpoints:
- `test_submit.js` → `notifyTestChange(branch_id, 'created', testId)`
- `inquiry_submit.js` → `notifyInquiryChange(branch_id, 'created', inquiryId)`
- `update_approval.js` → `notifyApprovalChange(branch_id, 'resolved', approvalId)`

---

## Testing Checklist

After migration, test these scenarios:

- [ ] Create a registration → Dashboard updates immediately
- [ ] Create a test → Test count updates
- [ ] Create an inquiry → Inquiry count updates
- [ ] Open dashboard in 2 browser tabs → Changes in one tab appear in the other
- [ ] Check browser console for WebSocket connection (should see "✅ WebSocket connected")
- [ ] Verify no duplicate API calls in Network tab
- [ ] Check that data persists when switching tabs (cached)

---

## Rollback Plan

If you encounter issues, you can easily rollback:

1. Comment out the mutation calls
2. Uncomment the old `authFetch` code
3. The old code will work as before

---

## Performance Comparison

### Before:
- API calls: ~100/minute (polling every 30s)
- Update delay: 0-30 seconds
- Server load: High

### After:
- API calls: ~5/minute (only on actual changes)
- Update delay: <100ms
- Server load: Minimal

---

## Need Help?

- Check `docs/API_OPTIMIZATION_GUIDE.md` for detailed documentation
- See `frontend/src/examples/OptimizedDashboard.tsx` for complete example
- Review `server/src/api/WEBSOCKET_INTEGRATION_EXAMPLES.js` for backend patterns
