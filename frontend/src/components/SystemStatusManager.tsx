import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Sparkles, Download, LogOut, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "../config";
import { useAuthStore } from "../store/useAuthStore";
import pack from "../../package.json";

const APP_VERSION = pack.version;

const SystemStatusManager: React.FC = () => {
  const { logout } = useAuthStore();
  const [status, setStatus] = useState<{
    maintenance_mode: boolean;
    maintenance_message: string;
    current_app_version: string;
    download_url: string;
    force_logout: boolean;
  } | null>(null);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showForcedLogout, setShowForcedLogout] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/system/status`);
      if (!res.ok) return;

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;

      const data = await res.json();
      if (data.status === "success") {
        const newStatus = data.data;
        setStatus(newStatus);

        // Handle Forced Logout - Only trigger if not already on login page
        const isAtLogin = window.location.pathname.endsWith("/login");
        if (newStatus.force_logout && !isAtLogin && !showForcedLogout) {
          setShowForcedLogout(true);
          logout();
        }

        // Handle Version Check
        if (isNewerVersion(newStatus.current_app_version, APP_VERSION)) {
          setShowUpdateModal(true);
        }
      }
    } catch (err) {
      // Quietly log errors to avoid disturbing UX, but help with debugging
      console.warn("SystemStatus Check failure:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [logout, showForcedLogout]);

  const location = useLocation();

  useEffect(() => {
    fetchStatus();
    // Use a slightly longer polling interval to reduce server load and potential collisions
    const interval = setInterval(fetchStatus, 45000);

    // Support for manual triggers from other components
    const handleManualTrigger = () => fetchStatus();
    window.addEventListener("trigger-system-status-check", handleManualTrigger);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "trigger-system-status-check",
        handleManualTrigger,
      );
    };
  }, [fetchStatus, location.pathname]);

  // Version comparison helper: returns true if v1 > v2
  const isNewerVersion = (v1: string, v2: string) => {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return true;
      if (p1 < p2) return false;
    }
    return false;
  };

  if (!status) return null;

  return (
    <>
      {/* Maintenance Overlay */}
      <AnimatePresence>
        {status.maintenance_mode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200000] bg-white dark:bg-[#1C1B1F] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 md:w-48 md:h-48 border-4 border-dashed border-[#4ADE80] rounded-full opacity-20"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Settings className="w-16 h-16 md:w-24 md:h-24 text-[#4ADE80] animate-pulse" />
              </div>
            </div>
            <h1 className="text-3xl md:text-6xl font-black mt-12 text-[#1C1B1F] dark:text-white tracking-tighter text-balance">
              SYSTEM MAINTENANCE
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-md text-lg font-medium">
              {status.maintenance_message}
            </p>
            <div className="mt-12 flex flex-col items-center gap-6">
              <div className="py-3 px-6 rounded-full bg-[#4ADE80]/5 border border-[#4ADE80]/20">
                <p className="text-[#4ADE80] font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
                  Optimizing your experience
                </p>
              </div>

              <button
                onClick={fetchStatus}
                disabled={isRefreshing}
                className="flex items-center gap-3 px-8 py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <RefreshCw
                  size={20}
                  className={isRefreshing ? "animate-spin" : ""}
                />
                Check System Status
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forced Logout Overlay */}
      <AnimatePresence>
        {showForcedLogout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200001] bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-[#1d1b20] p-10 rounded-[40px] shadow-2xl max-w-md w-full border border-red-500/20"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <LogOut className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter text-[#1C1B1F] dark:text-white mb-4">
                Session Terminated
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-8">
                The administrator has restricted system access. Your session has
                been securely closed.
              </p>

              <button
                onClick={() => {
                  window.location.href =
                    `${import.meta.env.BASE_URL || ""}login?reason=forced_logout`.replace(
                      "//",
                      "/",
                    );
                }}
                className="w-full h-16 bg-red-500 text-white rounded-[24px] font-black text-xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Go to Login
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version Update Modal */}
      <AnimatePresence>
        {showUpdateModal && (
          <div className="fixed inset-0 z-[190000] bg-black/40 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white dark:bg-[#1C1B1F] w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5 p-10 text-center"
            >
              <div className="w-20 h-20 bg-[#4ADE80]/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <Sparkles className="w-10 h-10 text-[#4ADE80]" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4ADE80]/10 text-[#4ADE80] text-[10px] font-black uppercase tracking-widest mb-4">
                Update Required
              </div>

              <h2 className="text-4xl font-black tracking-tighter text-[#1C1B1F] dark:text-white mb-4">
                Version v{status.current_app_version} is here!
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-8">
                A newer version of PhysioEZ is available. Please download and
                install the latest build to continue.
              </p>

              <div className="space-y-4">
                <a
                  href={status.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-16 bg-[#4ADE80] text-[#0C200E] rounded-[24px] font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Download size={24} />
                  Download Now
                </a>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                  Current Version: v{APP_VERSION}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SystemStatusManager;
