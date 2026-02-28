import { useState, useCallback } from "react";
import { API_BASE_URL, authFetch } from "../config";
import { toast } from "sonner";

/**
 * useSmartRefresh Hook
 * 
 * Provides a unified refresh mechanism that:
 * 1. Flushes any pending local mutations to the server (Push)
 * 2. Pulls fresh data for specific tables (Pull)
 * 3. Shows consistent loading states and toasts
 */
export const useSmartRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const smartRefresh = useCallback(async (tableName: string | null = null, options: {
    silent?: boolean;
    onSuccess?: (data: any) => void;
    onError?: (err: any) => void;
  } = {}) => {
    const { silent = false, onSuccess, onError } = options;

    if (isRefreshing) return;
    setIsRefreshing(true);

    if (!silent) {
       toast.loading(`Refreshing ${tableName || 'data'}...`, { id: "smart-refresh" });
    }

    try {
      // Single call to the unified sync endpoint
      // This endpoint handles the "push pending -> pull fresh" sequence on the server
      const res = await authFetch(`${API_BASE_URL}/reception/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: tableName }),
      });

      const data = await res.json();

      if (data.success) {
        if (!silent) {
          toast.success("Synchronized with server", { id: "smart-refresh" });
        }
        if (onSuccess) onSuccess(data);
      } else {
        throw new Error(data.message || "Sync failed");
      }
    } catch (err: any) {
      console.error("[SmartRefresh] Error:", err);
      if (!silent) {
        toast.error(`Refresh failed: ${err.message}`, { id: "smart-refresh" });
      }
      if (onError) onError(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  return { smartRefresh, isRefreshing };
};
