// Query Key Factory
// Centralized query key management for consistent cache invalidation

export const queryKeys = {
  // Dashboard queries
  dashboard: {
    all: ['dashboard'] as const,
    byBranch: (branchId: number) => ['dashboard', branchId] as const,
  },
  
  // Form options (dropdowns, etc.)
  formOptions: {
    all: ['formOptions'] as const,
    byBranch: (branchId: number, date?: string) => 
      ['formOptions', branchId, date] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    byEmployee: (employeeId: number) => ['notifications', employeeId] as const,
  },
  
  // Approvals
  approvals: {
    all: ['approvals'] as const,
    byBranch: (branchId: number) => ['approvals', branchId] as const,
  },
  
  // Time slots
  slots: {
    all: ['slots'] as const,
    byDate: (date: string) => ['slots', date] as const,
  },
  
  // Registrations
  registrations: {
    all: ['registrations'] as const,
    byBranch: (branchId: number) => ['registrations', branchId] as const,
    detail: (registrationId: number) => ['registrations', 'detail', registrationId] as const,
  },
  
  // Tests
  tests: {
    all: ['tests'] as const,
    byBranch: (branchId: number) => ['tests', branchId] as const,
    detail: (testId: number) => ['tests', 'detail', testId] as const,
  },
  
  // Patients
  patients: {
    all: ['patients'] as const,
    byBranch: (branchId: number) => ['patients', branchId] as const,
    detail: (patientId: number) => ['patients', 'detail', patientId] as const,
  },
  
  // Inquiries
  inquiries: {
    all: ['inquiries'] as const,
    byBranch: (branchId: number) => ['inquiries', branchId] as const,
    detail: (inquiryId: number) => ['inquiries', 'detail', inquiryId] as const,
  },
  
  // Collections/Billing
  collections: {
    all: ['collections'] as const,
    byBranch: (branchId: number) => ['collections', branchId] as const,
  },
  
  // Schedule
  schedule: {
    all: ['schedule'] as const,
    byBranch: (branchId: number, date?: string) => 
      ['schedule', branchId, date] as const,
  },
  
  // Billing
  billing: {
    all: ['billing'] as const,
    byBranch: (branchId: number) => ['billing', branchId] as const,
    filtered: (branchId: number, filters?: any) => 
      ['billing', branchId, filters] as const,
    stats: (branchId: number, startDate?: string, endDate?: string) =>
      ['billing', 'stats', branchId, startDate, endDate] as const,
  },
} as const;
