import { create } from 'zustand';
import { API_BASE_URL, authFetch } from '../config';

export interface Patient {
    patient_id: number;
    patient_uid: string;
    patient_name: string;
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
    }) | null;
    isLoadingDetails: boolean;

    // Actions
    setFilters: (filters: Partial<FilterState>) => void;
    setPage: (page: number) => void;
    fetchPatients: (branchId: number) => Promise<void>;
    fetchMetaData: (branchId: number) => Promise<void>;
    fetchPatientDetails: (patientId: number) => Promise<void>;
    openPatientDetails: (patient: Patient) => void;
    closePatientDetails: () => void;
    refreshPatients: (branchId: number) => Promise<void>;
    markAttendance: (patientId: number, branchId: number, status?: string) => Promise<boolean>;
    updateLocalPatientStatus: (patientId: number, newStatus: string) => void;
}

export const usePatientStore = create<PatientState>((set, get) => ({
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
        set({ isLoading: true });
        
        try {
            const response = await authFetch(`${API_BASE_URL}/reception/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
        try {
            const response = await authFetch(`${API_BASE_URL}/reception/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    fetchPatientDetails: async (patientId: number) => {
        set({ isLoadingDetails: true });
        try {
            const response = await authFetch(`${API_BASE_URL}/reception/patients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'fetch_details',
                    patient_id: patientId
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

    openPatientDetails: (patient) => {
        set({ selectedPatient: patient, isDetailsModalOpen: true, patientDetails: null });
        get().fetchPatientDetails(patient.patient_id);
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
    }
}));
