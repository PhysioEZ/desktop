import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  RefreshCcw,
  LayoutDashboard,
  Database,
} from "lucide-react";
import { API_BASE_URL, authFetch } from "../config";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useDashboardStore } from "../store/useDashboardStore";
import { usePatientStore } from "../store/usePatientStore";
import { useTestStore } from "../store/useTestStore";

const bootSteps = [
  { key: "auth", label: "Verifying Security Tokens", icon: ShieldCheck },
  { key: "cache", label: "Optimization Check", icon: Zap },
  { key: "sync", label: "Smart Sync Engine", icon: Database },
  { key: "finalize", label: "Mounting Workspace", icon: LayoutDashboard },
];

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { isDark } = useThemeStore();
  const [progress, setProgress] = useState(0);
  const [fetchStatus, setFetchStatus] = useState<{
    [key: string]: "pending" | "success" | "error";
  }>({
    auth: "success",
    cache: "pending",
    sync: "pending",
    finalize: "pending",
  });
  const [currentTable, setCurrentTable] = useState("");
  const isSyncDoneRef = useRef(false);
  const [imgError, setImgError] = useState(false);

  // Constants for timing
  const minVisualDuration = 3000; // 3s min stay
  const maxWaitTime = 6000; // 6s max stay
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Effect 1: Initialization logic (Runs only once)
  useEffect(() => {
    if (!user) return;

    const initialize = async () => {
      // 1. Try differential sync first (skip cache purge if data is fresh)
      let needsFullSync = true;
      try {
        setCurrentTable("checking for changes...");
        const diffRes = await authFetch(
          `${API_BASE_URL}/reception/diff_check`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ branch_id: user.branch_id }),
          },
        );
        const diffData = await diffRes.json();

        if (diffData.success && diffData.mode === "differential") {
          // Data is fresh — diff_check already pulled only the changed tables
          console.log(
            `[WelcomeScreen] Differential sync: ${diffData.changed_tables.length} tables updated`,
          );
          setFetchStatus((prev) => ({
            ...prev,
            cache: "success",
            sync: "success",
          }));
          isSyncDoneRef.current = true;
          setCurrentTable("");
          needsFullSync = false;
        }
        // If mode === 'full_sync_needed', fall through to full sync below
      } catch (e) {
        console.warn("Diff check failed, falling back to full sync", e);
      }

      // 2. Full sync path: clear cache then pull everything
      if (needsFullSync) {
        // 2a. Clear stale cache
        try {
          const res = await authFetch(`${API_BASE_URL}/auth/clear-cache`, {
            method: "POST",
          });
          await res.json();
          setFetchStatus((prev) => ({ ...prev, cache: "success" }));
        } catch (e) {
          setFetchStatus((prev) => ({ ...prev, cache: "error" }));
        }

        // 2b. Run full sync (push pending + pull all)
        try {
          setCurrentTable("syncing...");
          const syncRes = await authFetch(`${API_BASE_URL}/reception/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const syncData = await syncRes.json();
          if (syncData.success) {
            setFetchStatus((prev) => ({ ...prev, sync: "success" }));
            isSyncDoneRef.current = true;
            setCurrentTable("");
          } else {
            setFetchStatus((prev) => ({ ...prev, sync: "error" }));
          }
        } catch (e) {
          console.error("Sync error", e);
          setFetchStatus((prev) => ({ ...prev, sync: "error" }));
          isSyncDoneRef.current = true;
        }
      }

      // 3. Trigger final fetches once sync is complete
      try {
        await Promise.allSettled([
          authFetch(
            `${API_BASE_URL}/reception/dashboard?branch_id=${user.branch_id}`,
          )
            .then((res) => res.json())
            .then((data) => {
              if (data.status === "success") {
                useDashboardStore.getState().setData(data.data);
              }
            }),
          usePatientStore.getState().fetchMetaData(user.branch_id),
          useTestStore.getState().fetchTests(user.branch_id, 1, 15),
        ]);
        setFetchStatus((prev) => ({ ...prev, finalize: "success" }));
      } catch (e) {
        setFetchStatus((prev) => ({ ...prev, finalize: "error" }));
      }
    };

    initialize();
  }, [user?.branch_id]);

  // Effect 2: Visual Progress Animation
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;

      // Calculate basic visual progress
      let visualProgress = (elapsed / maxWaitTime) * 100;

      // Navigation conditions
      const finishedBySync =
        isSyncDoneRef.current && elapsed >= minVisualDuration;
      const finishedByTimeout = elapsed >= maxWaitTime;

      if (finishedBySync || finishedByTimeout) {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(updateInterval);
            // Navigate after small delay once 100 is reached
            setTimeout(() => {
              const dest =
                user?.role === "admin" ||
                user?.role === "superadmin" ||
                user?.role === "developer"
                  ? "/admin/dashboard"
                  : "/reception/dashboard";
              navigate(dest);
            }, 600);
            return 100;
          }
          return Math.min(100, prev + 1.5);
        });
      } else {
        // Slow down near 95% if not finished
        if (visualProgress > 95 && !isSyncDoneRef.current) {
          setProgress(95);
        } else {
          setProgress(Math.min(95, visualProgress));
        }
      }
    }, 100);

    return () => clearInterval(updateInterval);
  }, [navigate, user, minVisualDuration, maxWaitTime]);

  const currentStepIndex = useMemo(() => {
    const idx = bootSteps.findIndex(
      (step) => fetchStatus[step.key] === "pending",
    );
    return idx === -1 ? bootSteps.length - 1 : idx;
  }, [fetchStatus]);

  if (!user) return null;

  return (
    <div
      className={`relative min-h-screen overflow-hidden flex items-center justify-center p-6 bg-slate-50 dark:bg-[#05060A] transition-colors duration-1000 selection:bg-emerald-500/30`}
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[160px] rounded-full" />
        <div className="absolute inset-0 opacity-20 dark:opacity-100 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <main className="relative z-10 w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          className="relative grid grid-cols-1 lg:grid-cols-[450px_1fr] min-h-[700px] rounded-[48px] border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#0B0D11]/80 backdrop-blur-3xl shadow-[0_32px_120px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_120px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Left Panel */}
          <div className="relative p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-white/5 bg-gradient-to-br from-slate-50/50 dark:from-white/[0.03] to-transparent">
            <div className="space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00B884] text-[10px] uppercase font-black tracking-[0.2em]"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Secure Session Active
              </motion.div>

              <div className="space-y-10">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="relative group w-32 h-32"
                >
                  <div className="absolute inset-x-0 inset-y-0 bg-emerald-500/20 blur-2xl rounded-full scale-110 group-hover:scale-125 transition-transform" />
                  <div className="relative h-full w-full rounded-[40px] border-2 border-emerald-500/30 p-1.5 overflow-hidden bg-slate-100 dark:bg-[#0A0B0E]">
                    {user.photo && !imgError ? (
                      <img
                        src={`${API_BASE_URL.replace("/api", "")}/${user.photo}`}
                        className="h-full w-full object-cover rounded-[32px]"
                        alt={user.name}
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/20 rounded-[32px]">
                        <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                          {user.name
                            ? user.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()
                            : "U"}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>

                <div className="space-y-4">
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight"
                  >
                    Welcome back,
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B884] to-[#34D399]">
                      {user.name.split(" ")[0]}
                    </span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-slate-500 dark:text-slate-400 text-base leading-relaxed max-w-[300px]"
                  >
                    Initializing your operational environment and syncing
                    real-time branch data.
                  </motion.p>
                </div>
              </div>
            </div>

            <div className="pt-12">
              <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-xs font-medium">
                <RefreshCcw size={14} className="animate-spin" />
                Last synchronization: Just now
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="p-12 lg:p-20 flex flex-col justify-center bg-slate-50/30 dark:bg-black/20">
            <div className="max-w-xl w-full mx-auto space-y-16">
              <div className="space-y-6">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      System Readiness
                    </p>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                      Initializing Modules
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black text-[#00B884] tabular-nums">
                      {Math.round(progress)}
                      <span className="text-sm text-slate-400 dark:text-slate-500 ml-1">
                        %
                      </span>
                    </span>
                  </div>
                </div>

                <div className="relative h-3 w-full rounded-full bg-slate-200 dark:bg-white/[0.03] overflow-hidden border border-slate-100 dark:border-white/5 p-0.5">
                  <motion.div
                    className="absolute inset-y-0.5 left-0.5 rounded-full bg-gradient-to-r from-[#00B884] to-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    initial={{ width: 0 }}
                    animate={{ width: `calc(${progress}% - 4px)` }}
                    transition={{ ease: "easeOut", duration: 0.5 }}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {currentTable && progress < 100 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2 text-[#00B884]/80 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-emerald-500/5 w-fit border border-emerald-500/10"
                    >
                      <Database size={12} className="animate-pulse" />
                      Synchronizing Table: {currentTable}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bootSteps.map((step, idx) => {
                  const status = fetchStatus[step.key];
                  const isDone = status === "success";
                  const isCurrent = idx === currentStepIndex && !isDone;
                  const StepIcon = step.icon;

                  return (
                    <motion.div
                      key={step.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + idx * 0.1 }}
                      className={`relative group p-5 rounded-3xl border transition-all duration-500 ${
                        isDone
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : isCurrent
                            ? "bg-white dark:bg-white/[0.05] border-slate-200 dark:border-white/10 shadow-xl"
                            : "bg-transparent border-slate-100 dark:border-white/5 opacity-40"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2.5 rounded-2xl transition-colors duration-500 ${
                            isDone
                              ? "bg-emerald-500/20 text-[#00B884]"
                              : isCurrent
                                ? "bg-slate-900 dark:bg-white/10 text-white"
                                : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600"
                          }`}
                        >
                          <StepIcon
                            size={20}
                            className={isCurrent ? "animate-pulse" : ""}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-700 dark:text-white tracking-wide truncate">
                            {step.label}
                          </span>
                          <span
                            className={`text-[9px] font-medium uppercase tracking-widest ${isDone ? "text-emerald-500" : "text-slate-400 dark:text-slate-500"}`}
                          >
                            {isDone
                              ? "Verified"
                              : isCurrent
                                ? "In Progress"
                                : "Pending"}
                          </span>
                        </div>
                        <div className="ml-auto">
                          {isDone && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <CheckCircle2
                                size={18}
                                className="text-emerald-500"
                              />
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default WelcomeScreen;
