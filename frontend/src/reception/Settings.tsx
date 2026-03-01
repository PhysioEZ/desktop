import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  RefreshCw,
  Trash2,
  Database,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Loader2,
  HardDriveDownload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL, authFetch } from "../config";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import Sidebar from "../components/Sidebar";
import ChatModal from "../components/Chat/ChatModal";
import LogoutConfirmation from "../components/LogoutConfirmation";
import PageHeader from "../components/PageHeader";

const COOLDOWN_KEY = "settings_fresh_start_cooldown";
const COOLDOWN_DURATION = 30 * 60 * 1000; // 30 minutes

const Settings = () => {
  const navigate = useNavigate();
  const { isDark } = useThemeStore();

  const [showChat, setShowChat] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fresh Start state
  const [isFreshStarting, setIsFreshStarting] = useState(false);
  const [freshStartResult, setFreshStartResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Sync status
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Check cooldown on mount and update every second
  useEffect(() => {
    const checkCooldown = () => {
      const stored = localStorage.getItem(COOLDOWN_KEY);
      if (stored) {
        const expiresAt = parseInt(stored);
        const remaining = expiresAt - Date.now();
        if (remaining > 0) {
          setCooldownRemaining(remaining);
        } else {
          localStorage.removeItem(COOLDOWN_KEY);
          setCooldownRemaining(0);
        }
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch sync status
  const fetchSyncStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/sync_status`);
      const data = await res.json();
      if (data.success) setSyncStatus(data);
    } catch (e) {
      console.error("Failed to fetch sync status", e);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  // Fresh Start handler
  const handleFreshStart = async () => {
    if (cooldownRemaining > 0 || isFreshStarting) return;

    setIsFreshStarting(true);
    setFreshStartResult(null);

    try {
      // Step 1: Force clear all cache (bypass the 1hr check by calling the API directly)
      const clearRes = await authFetch(`${API_BASE_URL}/auth/clear-cache`, {
        method: "POST",
      });
      await clearRes.json();

      // Step 2: Full sync — push pending, then pull everything
      const syncRes = await authFetch(`${API_BASE_URL}/reception/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const syncData = await syncRes.json();

      if (syncData.success) {
        setFreshStartResult({
          success: true,
          message: `Fresh sync complete. Pulled: ${syncData.pulled?.join(", ") || "all tables"}`,
        });
      } else {
        setFreshStartResult({
          success: false,
          message: "Sync failed. Please try again later.",
        });
      }

      // Step 3: Set cooldown
      const expiresAt = Date.now() + COOLDOWN_DURATION;
      localStorage.setItem(COOLDOWN_KEY, expiresAt.toString());
      setCooldownRemaining(COOLDOWN_DURATION);
    } catch (e) {
      console.error("Fresh start error", e);
      setFreshStartResult({
        success: false,
        message: "Failed to complete fresh start. Check your connection.",
      });
    } finally {
      setIsFreshStarting(false);
    }
  };

  const formatCooldown = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div
      className={`flex h-screen transition-colors duration-300 ${isDark ? "bg-[#050505] text-white" : "bg-[#F8F9FC] text-gray-900"}`}
    >
      <Sidebar onShowChat={() => setShowChat(true)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PageHeader
          title="Settings"
          subtitle="System Configuration"
          icon={SettingsIcon}
          onRefresh={fetchSyncStatus}
          isLoading={isLoadingStatus}
        />

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Sync Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl border p-6 ${isDark ? "bg-[#0F0F0F] border-[#1A1A1A]" : "bg-white border-gray-200"}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}
                >
                  <Database size={20} />
                </div>
                <div>
                  <h3
                    className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Sync Engine Status
                  </h3>
                  <p
                    className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                  >
                    Local SQLite ↔ Server MySQL
                  </p>
                </div>
                <button
                  onClick={fetchSyncStatus}
                  className={`ml-auto p-2 rounded-lg transition-colors ${isDark ? "hover:bg-[#1A1A1A] text-gray-500" : "hover:bg-gray-100 text-gray-400"}`}
                >
                  <RefreshCw
                    size={14}
                    className={isLoadingStatus ? "animate-spin" : ""}
                  />
                </button>
              </div>

              {syncStatus && (
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className={`rounded-xl p-4 ${isDark ? "bg-[#1A1A1A]" : "bg-gray-50"}`}
                  >
                    <p
                      className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Status
                    </p>
                    <div className="flex items-center gap-2">
                      {syncStatus.isInitialSyncComplete ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : (
                        <Loader2
                          size={14}
                          className="text-amber-500 animate-spin"
                        />
                      )}
                      <span
                        className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {syncStatus.isInitialSyncComplete
                          ? "Synced"
                          : "Updating..."}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`rounded-xl p-4 ${isDark ? "bg-[#1A1A1A]" : "bg-gray-50"}`}
                  >
                    <p
                      className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Last Pull
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock
                        size={14}
                        className={isDark ? "text-gray-500" : "text-gray-400"}
                      />
                      <span
                        className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {syncStatus.lastPullTime
                          ? new Date(
                              syncStatus.lastPullTime,
                            ).toLocaleTimeString()
                          : "Never"}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`rounded-xl p-4 ${isDark ? "bg-[#1A1A1A]" : "bg-gray-50"}`}
                  >
                    <p
                      className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Branch
                    </p>
                    <div className="flex items-center gap-2">
                      <Shield
                        size={14}
                        className={isDark ? "text-gray-500" : "text-gray-400"}
                      />
                      <span
                        className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        #{syncStatus.activeBranchId || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Fresh Start Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl border p-6 ${isDark ? "bg-[#0F0F0F] border-[#1A1A1A]" : "bg-white border-gray-200"}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"}`}
                >
                  <HardDriveDownload size={20} />
                </div>
                <div>
                  <h3
                    className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Fresh Start
                  </h3>
                  <p
                    className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                  >
                    Clear all local data and re-sync from server
                  </p>
                </div>
              </div>

              <p
                className={`text-xs mb-4 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                This will wipe all cached data from the local SQLite database
                and perform a complete re-initialization from the server. Use
                this if you're experiencing data inconsistencies or stale
                information. This action has a{" "}
                <strong>30-minute cooldown</strong>.
              </p>

              {/* Result Message */}
              <AnimatePresence>
                {freshStartResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`rounded-xl p-3 mb-4 flex items-center gap-2 text-xs font-medium ${
                      freshStartResult.success
                        ? isDark
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : isDark
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {freshStartResult.success ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <AlertTriangle size={14} />
                    )}
                    {freshStartResult.message}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleFreshStart}
                disabled={cooldownRemaining > 0 || isFreshStarting}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                  cooldownRemaining > 0 || isFreshStarting
                    ? isDark
                      ? "bg-[#1A1A1A] text-gray-500 cursor-not-allowed"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isDark
                      ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                      : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                }`}
              >
                {isFreshStarting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Clearing & Re-syncing...
                  </>
                ) : cooldownRemaining > 0 ? (
                  <>
                    <Clock size={16} />
                    Cooldown: {formatCooldown(cooldownRemaining)}
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Clear All Data & Re-Sync
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChatModal isOpen={showChat} onClose={() => setShowChat(false)} />
      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          useAuthStore.getState().logout();
          navigate("/login");
        }}
      />
    </div>
  );
};

export default Settings;
