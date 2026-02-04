// Additional Query Hooks for Billing Page
// Add these to your existing useQueries.ts file

import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, authFetch } from '../config';
import { queryKeys } from '../lib/queryKeys';

// ============ BILLING QUERIES ============

interface BillingStats {
  today_collection: number;
  range_billed: number;
  range_paid: number;
  range_due: number;
}

interface BillingRecord {
  patient_id: number;
  patient_name: string;
  phone_number: string;
  total_amount: string;
  total_paid: string;
  due_amount: number;
  status: string;
  has_payment_today: number;
  created_at: string;
  branch_id: number;
}

interface BillingData {
  stats: BillingStats;
  records: BillingRecord[];
}

interface BillingFilters {
  startDate: string;
  endDate: string;
  search?: string;
  status?: string;
  paymentFilter?: 'today' | 'all';
}

export function useBillingData(branchId?: number, filters?: BillingFilters) {
  return useQuery<BillingData | null>({
    queryKey: queryKeys.billing.filtered(branchId!, filters),
    queryFn: async () => {
      if (!branchId || !filters) return null;
      
      const res = await authFetch(`${API_BASE_URL}/reception/billing`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'fetch_overview',
          startDate: filters.startDate,
          endDate: filters.endDate,
          search: filters.search || '',
          status: filters.status || '',
          paymentFilter: filters.paymentFilter || 'all',
        }),
      });
      
      const json = await res.json();
      return json.status === 'success' ? json.data : null;
    },
    enabled: !!branchId && !!filters,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

// ============ BILLING STATS ONLY (for quick refresh) ============

export function useBillingStats(branchId?: number, startDate?: string, endDate?: string) {
  return useQuery<BillingStats | null>({
    queryKey: queryKeys.billing.stats(branchId!, startDate, endDate),
    queryFn: async () => {
      if (!branchId || !startDate || !endDate) return null;
      
      const res = await authFetch(`${API_BASE_URL}/reception/billing_stats`, {
        method: 'POST',
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      });
      
      const json = await res.json();
      return json.status === 'success' ? json.data.stats : null;
    },
    enabled: !!branchId && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes (stats change more frequently)
  });
}
