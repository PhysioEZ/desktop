import React, { useCallback } from "react";
import { useAuthStore, useDashboardStore } from "../store";
import { authFetch, API_BASE_URL } from "../config";
import GlobalSearch from "./GlobalSearch";
import { toast } from "sonner";

const GlobalSearchOverlay: React.FC = () => {
  const { user } = useAuthStore();
  const {
    globalSearchQuery,
    setGlobalSearchQuery,
    globalSearchResults,
    setGlobalSearchResults,
    showGlobalSearch,
    setShowGlobalSearch,
    isGlobalSearchLoading,
    setIsGlobalSearchLoading,
    searchCache,
    setSearchCache,
  } = useDashboardStore();

  const handlePerformSearch = useCallback(async () => {
    if (!user?.branch_id) return;

    const query = globalSearchQuery.trim().toLowerCase();
    if (query.length < 2) {
      setGlobalSearchResults([]);
      return;
    }

    // 1. Instant Cache Check
    if (searchCache[query]) {
      setGlobalSearchResults(searchCache[query]);
      return;
    }

    // 2. Network Fetch
    setIsGlobalSearchLoading(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/search_patients?branch_id=${user.branch_id}&q=${encodeURIComponent(globalSearchQuery)}`,
      );
      const data = await res.json();
      if (data.success) {
        const results = data.results || [];
        setGlobalSearchResults(results);
        // Store in cache for future use
        setSearchCache(query, results);
      }
    } catch (err) {
      console.error("Search Error:", err);
      toast.error("Search failed. Please try again.");
    } finally {
      setIsGlobalSearchLoading(false);
    }
  }, [
    user?.branch_id,
    globalSearchQuery,
    searchCache,
    setGlobalSearchResults,
    setIsGlobalSearchLoading,
    setSearchCache,
  ]);

  return (
    <GlobalSearch
      isOpen={showGlobalSearch}
      onClose={() => setShowGlobalSearch(false)}
      searchQuery={globalSearchQuery}
      setSearchQuery={setGlobalSearchQuery}
      searchResults={globalSearchResults}
      onSearch={handlePerformSearch}
      isLoading={isGlobalSearchLoading}
    />
  );
};

export default GlobalSearchOverlay;