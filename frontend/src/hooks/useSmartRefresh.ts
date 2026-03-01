import { useState, useCallback } from "react";
import { toast } from "sonner";

/**
 * useSmartRefresh Hook
 * 
 * Re-implemented for server-only architecture.
 * Simply triggers the provided fetch logic while maintaining UI consistency.
 */
export const useSmartRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const smartRefresh = useCallback(async (tableName: string | null = null, options: {
    silent?: boolean;
    onSuccess?: (data?: any) => void;
    onError?: (err: any) => void;
  } = {}) => {
    const { silent = false, onSuccess, onError } = options;

    if (isRefreshing) return;
    setIsRefreshing(true);

    if (!silent) {
       toast.loading(`Updating ${tableName || 'data'}...`, { id: "smart-refresh" });
    }

    try {
      // Small artificial delay for visual feedback if not silent
      if (!silent) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Execute the success callback (which typically re-fetches data in the component)
      if (onSuccess) {
        await onSuccess();
      }

      if (!silent) {
        toast.success("Updated successfully", { id: "smart-refresh" });
      }
    } catch (err: any) {
      console.error("[Refresh] Error:", err);
      if (!silent) {
        toast.error(`Update failed: ${err.message}`, { id: "smart-refresh" });
      }
      if (onError) onError(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  return { smartRefresh, isRefreshing };
};
