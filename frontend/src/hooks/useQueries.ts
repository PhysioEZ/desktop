// Custom Hooks for API Queries
// Provides type-safe queries with optimized caching

import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, authFetch } from '../config';
import { queryKeys } from '../lib/queryKeys';

// ============ DASHBOARD QUERY ============

interface DashboardData {
  registration: {
    today_total: number;
    pending: number;
    consulted: number;
    month_total: number;
    approval_pending: number;
  };
  inquiry: { total_today: number; quick: number; test: number };
  patients: {
    today_attendance: number;
    total_ever: number;
    active: number;
    inactive: number;
    paid_today: number;
    new_month: number;
  };
  tests: {
    today_total: number;
    pending: number;
    completed: number;
    revenue_today: number;
    total_month: number;
    approval_pending: number;
  };
  collections: {
    reg_amount: number;
    treatment_amount: number;
    test_amount: number;
    today_total: number;
    today_dues: number;
    patient_dues: number;
    test_dues: number;
    month_total: number;
  };
  schedule: Array<{
    id: number;
    patient_name: string;
    appointment_time: string;
    status: string;
    approval_status: string;
  }>;
  weekly: Array<{ date: string; day: string; total: number }>;
}

export function useDashboard(branchId?: number) {
  return useQuery<DashboardData | null>({
    queryKey: queryKeys.dashboard.byBranch(branchId!),
    queryFn: async () => {
      if (!branchId) return null;
      const res = await authFetch(
        `${API_BASE_URL}/reception/dashboard?branch_id=${branchId}`
      );
      const json = await res.json();
      return json.status === 'success' ? json.data : null;
    },
    enabled: !!branchId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// ============ FORM OPTIONS QUERY ============

interface FormOptions {
  referrers: string[];
  paymentMethods: Array<{ method_code: string; method_name: string }>;
  staffMembers: Array<{
    staff_id: number;
    staff_name: string;
    job_title: string;
  }>;
  testTypes: Array<{
    test_type_id: number;
    test_name: string;
    test_code: string;
    default_cost: string | number;
    requires_limb_selection: boolean;
  }>;
  limbTypes: Array<{
    limb_type_id: number;
    limb_name: string;
    limb_code: string;
  }>;
  chiefComplaints: Array<{ complaint_code: string; complaint_name: string }>;
  referralSources: Array<{ source_code: string; source_name: string }>;
  consultationTypes: Array<{
    consultation_code: string;
    consultation_name: string;
  }>;
  inquiryServiceTypes: Array<{ service_code: string; service_name: string }>;
  timeSlots: Array<{ value: string; label: string; booked: boolean }>;
}

export function useFormOptions(branchId?: number, appointmentDate?: string) {
  return useQuery<FormOptions | null>({
    queryKey: queryKeys.formOptions.byBranch(branchId!, appointmentDate),
    queryFn: async () => {
      if (!branchId) return null;
      const res = await authFetch(
        `${API_BASE_URL}/reception/form_options?branch_id=${branchId}&appointment_date=${appointmentDate || ''}&service_type=physio`
      );
      const json = await res.json();
      return json.status === 'success' ? json.data : null;
    },
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // 5 minutes (form options change rarely)
  });
}

// ============ NOTIFICATIONS QUERY ============

interface Notification {
  notification_id: number;
  message: string;
  link_url: string | null;
  is_read: number;
  created_at: string;
  time_ago: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

export function useNotifications(employeeId?: number) {
  return useQuery<NotificationsResponse>({
    queryKey: queryKeys.notifications.byEmployee(employeeId!),
    queryFn: async () => {
      const res = await authFetch(
        `${API_BASE_URL}/reception/notifications?employee_id=${employeeId || ''}`
      );
      const json = await res.json();
      return json.success || json.status === 'success' 
        ? json 
        : { notifications: [], unread_count: 0 };
    },
    enabled: !!employeeId,
    staleTime: 30 * 1000, // 30 seconds (notifications need to be fresher)
    refetchInterval: 60 * 1000, // Refetch every minute as backup to WebSocket
  });
}

// ============ APPROVALS QUERY ============

interface Approval {
  approval_id: number;
  category: string;
  patient_name: string;
  details: string;
  requested_by: string;
  requested_at: string;
  status: string;
}

export function useApprovals(branchId?: number) {
  return useQuery<Approval[]>({
    queryKey: queryKeys.approvals.byBranch(branchId!),
    queryFn: async () => {
      if (!branchId) return [];
      const res = await authFetch(
        `${API_BASE_URL}/reception/get_pending_approvals?branch_id=${branchId}`
      );
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: !!branchId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============ TIME SLOTS QUERY ============

interface TimeSlot {
  time: string;
  label: string;
  disabled: boolean;
}

export function useTimeSlots(date?: string) {
  return useQuery<TimeSlot[]>({
    queryKey: queryKeys.slots.byDate(date!),
    queryFn: async () => {
      if (!date) return [];
      const res = await authFetch(
        `${API_BASE_URL}/reception/get_slots?date=${date}`
      );
      const json = await res.json();
      return json.success ? json.slots : [];
    },
    enabled: !!date,
    staleTime: 1 * 60 * 1000, // 1 minute (slots can change frequently)
  });
}

// ============ REGISTRATIONS QUERY ============

export function useRegistrations(branchId?: number) {
  return useQuery({
    queryKey: queryKeys.registrations.byBranch(branchId!),
    queryFn: async () => {
      if (!branchId) return [];
      const res = await authFetch(
        `${API_BASE_URL}/reception/registrations?branch_id=${branchId}`
      );
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: !!branchId,
    staleTime: 3 * 60 * 1000,
  });
}

// ============ TESTS QUERY ============

export function useTests(branchId?: number) {
  return useQuery({
    queryKey: queryKeys.tests.byBranch(branchId!),
    queryFn: async () => {
      if (!branchId) return [];
      const res = await authFetch(
        `${API_BASE_URL}/reception/tests?branch_id=${branchId}`
      );
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: !!branchId,
    staleTime: 3 * 60 * 1000,
  });
}

// ============ PATIENTS QUERY ============

export function usePatients(branchId?: number) {
  return useQuery({
    queryKey: queryKeys.patients.byBranch(branchId!),
    queryFn: async () => {
      if (!branchId) return [];
      const res = await authFetch(
        `${API_BASE_URL}/reception/patients?branch_id=${branchId}`
      );
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: !!branchId,
    staleTime: 3 * 60 * 1000,
  });
}

// ============ INQUIRIES QUERY ============

export function useInquiries(branchId?: number) {
  return useQuery({
    queryKey: queryKeys.inquiries.byBranch(branchId!),
    queryFn: async () => {
      if (!branchId) return [];
      const res = await authFetch(
        `${API_BASE_URL}/reception/inquiries?branch_id=${branchId}`
      );
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: !!branchId,
    staleTime: 3 * 60 * 1000,
  });
}
