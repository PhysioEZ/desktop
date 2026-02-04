// Custom Hooks for API Mutations
// Provides type-safe mutations with automatic cache invalidation

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, authFetch } from '../config';
import { queryKeys } from '../lib/queryKeys';
import { toast } from 'sonner';

// ============ REGISTRATION MUTATIONS ============

interface RegistrationPayload {
  branch_id: number;
  employee_id: number;
  patient_name: string;
  age: string;
  gender: string;
  phone: string;
  address?: string;
  chief_complaint?: string;
  referral_source?: string;
  consultation_type?: string;
  appointment_date: string;
  appointment_time?: string;
  amount: string;
  payment_method?: string;
  payment_splits?: Record<string, number>;
  photo_data?: string | null;
}

export function useCreateRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegistrationPayload) => {
      const response = await authFetch(
        `${API_BASE_URL}/reception/registration_submit`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      if (!result.success && result.status !== 'success') {
        throw new Error(result.message || 'Registration failed');
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.byBranch(variables.branch_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.registrations.byBranch(variables.branch_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.schedule.byBranch(variables.branch_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.patients.byBranch(variables.branch_id) 
      });
      
      toast.success('Registration created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create registration');
    },
  });
}

// ============ TEST MUTATIONS ============

interface TestPayload {
  branch_id: number;
  employee_id: number;
  patient_name: string;
  age: string;
  gender: string;
  phone: string;
  visit_date: string;
  assigned_date?: string;
  selected_tests: Record<string, { checked: boolean; amount: string }>;
  limb_type?: string;
  done_by?: string;
  total_amount: string;
  advance_amount?: string;
  discount_amount?: string;
  due_amount?: string;
  payment_splits?: Record<string, number>;
  other_test_name?: string;
}

export function useCreateTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TestPayload) => {
      const response = await authFetch(
        `${API_BASE_URL}/reception/test_submit`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      if (!result.success && result.status !== 'success') {
        throw new Error(result.message || 'Test creation failed');
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.byBranch(variables.branch_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.tests.byBranch(variables.branch_id) 
      });
      
      toast.success('Test created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create test');
    },
  });
}

// ============ INQUIRY MUTATIONS ============

interface InquiryPayload {
  branch_id: number;
  employee_id: number;
  patient_name: string;
  age: string;
  gender: string;
  phone: string;
  inquiry_date: string;
  service_type?: string;
  chief_complaint?: string;
  referral_source?: string;
  communication_type?: string;
  notes?: string;
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InquiryPayload) => {
      const response = await authFetch(
        `${API_BASE_URL}/reception/inquiry_submit`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      if (!result.success && result.status !== 'success') {
        throw new Error(result.message || 'Inquiry creation failed');
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.byBranch(variables.branch_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.inquiries.byBranch(variables.branch_id) 
      });
      
      toast.success('Inquiry created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create inquiry');
    },
  });
}

// ============ TEST INQUIRY MUTATIONS ============

interface TestInquiryPayload {
  branch_id: number;
  employee_id: number;
  patient_name: string;
  age: string;
  gender: string;
  phone: string;
  inquiry_date: string;
  test_name: string;
  notes?: string;
}

export function useCreateTestInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TestInquiryPayload) => {
      const response = await authFetch(
        `${API_BASE_URL}/reception/test_inquiry_submit`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      if (!result.success && result.status !== 'success') {
        throw new Error(result.message || 'Test inquiry creation failed');
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.byBranch(variables.branch_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.inquiries.byBranch(variables.branch_id) 
      });
      
      toast.success('Test inquiry created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create test inquiry');
    },
  });
}

// ============ APPROVAL MUTATIONS ============

interface ApprovalPayload {
  approval_id: number;
  action: 'approve' | 'reject';
  branch_id: number;
  employee_id: number;
}

export function useUpdateApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ApprovalPayload) => {
      const response = await authFetch(
        `${API_BASE_URL}/reception/update_approval`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Approval update failed');
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.approvals.byBranch(variables.branch_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dashboard.byBranch(variables.branch_id) 
      });
      
      toast.success(`Successfully ${variables.action}d`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update approval');
    },
  });
}

// ============ NOTIFICATION MUTATIONS ============

interface MarkNotificationReadPayload {
  notification_id: number;
  employee_id: number;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkNotificationReadPayload) => {
      const response = await authFetch(
        `${API_BASE_URL}/reception/mark_notification_read`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to mark notification as read');
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.notifications.byEmployee(variables.employee_id) 
      });
    },
    onError: (error: Error) => {
      console.error('Failed to mark notification as read:', error);
    },
  });
}
