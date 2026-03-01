import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_BASE_URL, authFetch } from '../config';

export interface Patient {
    patient_id: number;
    patient_uid: string;
    patient_name: string;
    branch_id?: number;
    patient_phone: string;
    patient_gender: string;
    patient_age: number;
    patient_photo_path: string;
    assigned_doctor: string;
    service_type: string;
    service_track_id?: number;
    treatment_time_slot?: string;
    registration_id?: number;
    master_patient_id?: number | string;
    treatment_type: string;
    treatment_cost_per_day: string;
    package_cost: string;
    treatment_days: number;
    total_amount: string;
    advance_payment: string;
    discount_percentage: string;
    due_amount: string;
    effective_balance: number;
    attendance_count: number;
    patient_status: string;
    start_date: string;
    end_date: string;
    today_attendance: string | null;
    has_token_today: boolean;
    print_count: number;
    cost_per_day: number;
    patient_condition?: string;
    referral_source?: string;
    remarks?: string;
    last_visit?: string;
    discount_amount?: string;
    referralSource?: string;
    reffered_by?: string;
    email?: string;
    occupation?: string;
    address?: string;
    phone_number?: string;
    age?: number;
    gender?: string;
    chief_complain?: string;
    total_consumed?: number;
    total_paid?: number;
    created_at?: string;
}

export interface MetaData {
    doctors: string[];
    statuses: string[];
    services: string[];
    treatments: (string | { label: string; value: string })[];
    referrers: string[];
    payment_methods: { method_id: number; method_name: string }[];
    counts?: {
        new_today: number;
        active_count: number;
        inactive_count: number;
        terminated_count: number;
        total_count: number;
    };
}

export interface FilterState {
    search: string;
    service_type: string;
    doctor: string;
    treatment: string;
    status: string;
}

interface PatientState {
    patients: Patient[];
    isLoading: boolean;
    pagination: {
        page: number;
        limit: number;
        total_records: number;
        total_pages: number;
    };
    filters: FilterState;
    metaData: MetaData;
    selectedPatient: Patient | null;
    isDetailsModalOpen: boolean;
    patientDetails: (Patient & {
        payments: any[];
        history: any[];
        attendance: any[];
        tests: any[];
    }) | null;
    isLoadingDetails: boolean;

    // Actions
    setFilters: (filters: Partial<FilterState>) => void;
    setPage: (page: number) => void;
    fetchPatients: (branchId: number) => Promise<void>;
    fetchMetaData: (branchId: number) => Promise<void>;
    fetchPatientDetails: (patientId: number | null, patientName?: string, phone?: string) => Promise<void>;
    billingViewMode: 'treatment' | 'test';
    setBillingViewMode: (mode: 'treatment' | 'test') => void;
    openPatientDetails: (patient: Patient, mode?: 'treatment' | 'test') => void;
    closePatientDetails: () => void;
    refreshPatients: (branchId: number) => Promise<void>;
    markAttendance: (patientId: number, branchId: number, status?: string) => Promise<boolean>;
    updateLocalPatientStatus: (patientId: number, newStatus: string) => void;
    updateLocalPatientAttendance: (patientId: number, status: string, countChange: number, balanceChange?: number) => void;
    clearStore: () => void;
}

export const usePatientStore = create<PatientState>()(
  persist(
    (set, get) => ({
    patients: [],
    isLoading: false,
    pagination: {
        page: 1,
        limit: 16,
        total_records: 0,
        total_pages: 1,
    },
    filters: {
        search: '',
        service_type: '',
        doctor: '',
        treatment: '',
        status: '',
    },
    metaData: {
        doctors: [],
        statuses: [],
        services: [],
        treatments: [],
        referrers: [],
        payment_methods: [],
        counts: {
            new_today: 0,
            active_count: 0,
            inactive_count: 0,
            terminated_count: 0,
            total_count: 0
        }
    },
    selectedPatient: null,
    isDetailsModalOpen: false,
    patientDetails: null,
    isLoadingDetails: false,
    billingViewMode: 'treatment',

    setBillingViewMode: (mode) => set({ billingViewMode: mode }),

    setFilters: (newFilters) => {
        set((state) => ({ 
            filters: { ...state.filters, ...newFilters },
            pagination: { ...state.pagination, page: 1 } // Reset to page 1 on filter change
        }));
    },

    setPage: (page) => {
        set((state) => ({ pagination: { ...state.pagination, page } }));
    },

    fetchPatients: async (branchId: number) => {
        const { pagination, filters } = get();
        
        // Only show loading if we don't have existing memory data to prevent screen flash while background fetching SQLite locally
        if (get().patients.length === 0) {
            set({ isLoading: true });
        }
        
        try {
            const response = await authFetch(`${API_BASE_URL}/reception/patients`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'fetch',
                    branch_id: branchId,
                    page: pagination.page,
                    limit: pagination.limit,
                    ...filters
                })
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                set({ 
                    patients: result.data,
                    pagination: {
                        page: result.pagination.page,
                        limit: result.pagination.limit,
                        total_records: result.pagination.total,
                        total_pages: result.pagination.total_pages
                    },
                    isLoading: false
                });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Failed to fetch patients:', error);
            set({ isLoading: false });
        }
    },

    fetchMetaData: async (branchId: number) => {
        if (get().metaData.doctors.length > 0) return;

        try {
            const response = await authFetch(`${API_BASE_URL}/reception/patients`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'fetch_filters',
                    branch_id: branchId
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                set({ metaData: result.data });
            }
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
        }
    },

    fetchPatientDetails: async (patientId: number | null, patientName?: string, phone?: string) => {
        set({ isLoadingDetails: true });
        try {
            const response = await authFetch(`${API_BASE_URL}/reception/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'fetch_details',
                    patient_id: patientId,
                    patient_name: patientName,
                    phone_number: phone
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                set({ patientDetails: result.data, isLoadingDetails: false });
            } else {
                set({ isLoadingDetails: false });
            }
        } catch (error) {
            console.error('Failed to fetch details:', error);
            set({ isLoadingDetails: false });
        }
    },

    openPatientDetails: (patient, mode = 'treatment') => {
        set({ selectedPatient: patient, isDetailsModalOpen: true, patientDetails: null, billingViewMode: mode });
        get().fetchPatientDetails(patient.patient_id, patient.patient_name, patient.patient_phone || patient.phone_number);
    },

    closePatientDetails: () => {
        set({ selectedPatient: null, isDetailsModalOpen: false });
    },

    refreshPatients: async (branchId: number) => {
        await get().fetchPatients(branchId);
    },

    markAttendance: async (patientId: number, branchId: number, status = 'present') => {
        try {
            const response = await authFetch(`${API_BASE_URL}/reception/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'mark',
                    branch_id: branchId,
                    patient_id: patientId,
                    status
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                // Refresh the specific patient in the list (optimistic or re-fetch)
                await get().fetchPatients(branchId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Attendance mark error:', error);
            return false;
        }
    },

    updateLocalPatientStatus: (patientId, newStatus) => {
        set((state) => ({
            patients: state.patients.map(p => p.patient_id === patientId ? { ...p, patient_status: newStatus } : p),
            selectedPatient: state.selectedPatient?.patient_id === patientId ? { ...state.selectedPatient, patient_status: newStatus } : state.selectedPatient && state.selectedPatient,
            patientDetails: state.patientDetails?.patient_id === patientId ? { ...state.patientDetails, patient_status: newStatus } : state.patientDetails
        }));
    },

    updateLocalPatientAttendance: (patientId: number, status: string, countChange: number, balanceChange: number = 0) => {
        set((state) => ({
            patients: state.patients.map(p => 
                p.patient_id === patientId 
                ? { 
                    ...p, 
                    today_attendance: status, 
                    patient_status: "active",
                    attendance_count: (p.attendance_count || 0) + countChange,
                    effective_balance: parseFloat(String(p.effective_balance || 0)) + balanceChange 
                  } 
                : p
            ),
            selectedPatient: state.selectedPatient?.patient_id === patientId 
                ? { 
                    ...state.selectedPatient, 
                    today_attendance: status, 
                    patient_status: "active",
                    attendance_count: (state.selectedPatient.attendance_count || 0) + countChange,
                    effective_balance: parseFloat(String(state.selectedPatient.effective_balance || 0)) + balanceChange 
                  } 
                : state.selectedPatient && state.selectedPatient,
            patientDetails: state.patientDetails?.patient_id === patientId 
                ? { 
                    ...state.patientDetails, 
                    today_attendance: status, 
                    patient_status: "active",
                    attendance_count: (state.patientDetails.attendance_count || 0) + countChange,
                    effective_balance: parseFloat(String(state.patientDetails.effective_balance || 0)) + balanceChange 
                  } 
                : state.patientDetails
        }));
    },

    clearStore: () => set({
        patients: [],
        isLoading: false,
        pagination: { page: 1, limit: 16, total_records: 0, total_pages: 1 },
        filters: { search: '', service_type: '', doctor: '', treatment: '', status: '' },
        metaData: {
            doctors: [], statuses: [], services: [], treatments: [], referrers: [], payment_methods: [],
            counts: { new_today: 0, active_count: 0, inactive_count: 0, terminated_count: 0, total_count: 0 }
        },
        selectedPatient: null,
        isDetailsModalOpen: false,
        patientDetails: null,
        isLoadingDetails: false,
    }),
}),
    {
      name: 'patient-cache',
    }
  )
);
