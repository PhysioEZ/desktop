import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { API_BASE_URL, authFetch } from "../config";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useDashboardStore } from "../store/useDashboardStore";
import { useRegistrationStore } from "../store/useRegistrationStore";
import { usePatientStore } from "../store/usePatientStore";
import { useTestStore } from "../store/useTestStore";

const bootSteps = [
  "Verifying identity and role claims",
  "Loading branch-specific dashboard data",
  "Preparing secure workspace modules",
];

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { isDark } = useThemeStore();
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const currentStep = useMemo(() => {
    if (progress < 34) return 0;
    if (progress < 67) return 1;
    return 2;
  }, [progress]);

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

  useEffect(() => {
    // We want the progress bar to hit 100% when both minimum time has passed AND API calls are done.
    let isApiDone = false;
    let currentProgress = 0;
    const minDuration = 1500; // minimum visual duration
    const startTime = Date.now();

    const doPrefetches = async () => {
      try {
        if (!user?.branch_id) return;

        // Parallel API fetches
        await Promise.allSettled([
          // Dashboard
          authFetch(
            `${API_BASE_URL}/reception/dashboard?branch_id=${user.branch_id}`,
          )
            .then((res) => res.json())
            .then((data) => {
              if (data.status === "success" || data.success) {
                useDashboardStore.getState().setData(data.data);
                if (data.data.serverTime) {
                  useDashboardStore
                    .getState()
                    .setLastSync(data.data.serverTime);
                }
              }
            }),

          // Registrations
          authFetch(`${API_BASE_URL}/reception/registration`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "fetch",
              branch_id: user.branch_id,
              limit: 1000,
              page: 1,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.status === "success" || data.success) {
                useRegistrationStore
                  .getState()
                  .setRegistrations(data.data || []);
                useRegistrationStore.getState().setLastFetched(Date.now());
                useRegistrationStore.getState().setLastParams({
                  action: "fetch",
                  branch_id: user.branch_id,
                  limit: 1000,
                  page: 1,
                });
              }
            }),

          // Patients Data & Metadata
          usePatientStore.getState().fetchMetaData(user.branch_id),
          usePatientStore.getState().fetchPatients(user.branch_id),

          // Tests
          useTestStore.getState().fetchTests(user.branch_id, 1, 15),
        ]);
      } catch (e) {
        console.error("Prefetch errors: ", e);
      } finally {
        isApiDone = true;
      }
    };

    doPrefetches();

    const updateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      // Calculate fake visual progress out of 80% based on minDuration
      let visualProgress = (elapsed / minDuration) * 80;
      if (visualProgress > 80) visualProgress = 80;

      // Make progress jump to 100% when API is done and visual minimum passed
      if (isApiDone && elapsed > minDuration) {
        currentProgress += 5; // Animate smoothly to 100
        if (currentProgress >= 100) {
          setProgress(100);
          setIsReady(true);
          clearInterval(updateInterval);

          setTimeout(() => {
            if (
              user?.role === "admin" ||
              user?.role === "superadmin" ||
              user?.role === "developer"
            ) {
              navigate("/admin/dashboard");
            } else {
              navigate("/reception/dashboard");
            }
          }, 800);
          return;
        }
      } else {
        // Just use visual progress, maxing out at 80% if API is slow
        currentProgress = visualProgress;
      }
      setProgress(currentProgress);
    }, 30);

    return () => clearInterval(updateInterval);
  }, [navigate, user]);

  if (!user) return null;

  return (
    <div
      className={`relative min-h-screen overflow-hidden flex items-center justify-center p-4 transition-colors duration-700 dark:bg-[#05060A] bg-slate-50`}
    >
      {/* Background Glows (matching Login) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00B884]/10 blur-[120px] rounded-full dark:opacity-100 opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#3b82f6]/5 blur-[120px] rounded-full dark:opacity-100 opacity-30" />
      </div>

      <main className="relative z-10 w-full max-w-[1200px] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="grid w-full min-h-[600px] lg:min-h-[700px] grid-cols-1 md:grid-cols-[0.8fr_1.2fr] overflow-hidden rounded-[32px] border dark:border-white/10 border-slate-200 dark:bg-[#0B0D11] bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] hover:shadow-2xl transition-[box-shadow,transform] duration-700 hover:-translate-y-1"
        >
          {/* Left Column: User Context */}
          <section className="relative flex flex-col justify-center p-8 lg:p-14 border-b dark:border-white/5 border-slate-100 md:border-b-0 md:border-r dark:bg-gradient-to-br dark:from-[#101318] dark:to-[#0B0D11] bg-slate-50/50 overflow-hidden">
            <motion.div
              animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"
            />

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-10 inline-flex items-center gap-2 w-fit rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#00B884] relative z-10"
            >
              <Sparkles size={12} className="text-[#00B884]" />
              Authenticating
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-8 relative z-10"
            >
              <div className="relative w-fit">
                <div className="h-24 w-24 overflow-hidden rounded-[24px] border-2 border-white dark:border-white/10 bg-white dark:bg-[#1A1D23] shadow-lg">
                  {user.photo ? (
                    <img
                      src={`${API_BASE_URL.replace("/api", "")}/${user.photo}`}
                      alt={user.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://ui-avatars.com/api/?name=${user.name}&background=00B884&color=fff&bold=true`;
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserIcon
                        size={36}
                        className="text-slate-400 dark:text-slate-500"
                      />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 inline-flex items-center gap-1.5 rounded-full bg-[#00B884] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-black shadow-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                  </span>
                  Active
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight dark:text-white text-slate-900 leading-tight">
                  Welcome back,
                  <br />
                  <span className="text-[#00B884]">{user.name}</span>
                </h1>
                <p className="mt-3 text-sm font-medium leading-relaxed dark:text-slate-400 text-slate-600 max-w-[240px]">
                  Preparing your secured workspace and operational modules.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t dark:border-white/5 border-slate-200/60">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <ShieldCheck size={14} className="opacity-60" />
                  Role Profile
                </div>
                <p className="mt-2 text-sm font-bold capitalize text-slate-900 dark:text-white">
                  {user.role}
                </p>
              </div>
            </motion.div>
          </section>

          {/* Right Column: Loading Sequence */}
          <section className="flex flex-col justify-center p-8 lg:p-16 dark:bg-[#0B0D11] bg-white">
            <div className="w-full space-y-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    System Initialization
                  </p>
                  <p className="text-lg font-black tracking-tight text-[#00B884]">
                    {Math.round(progress)}%
                  </p>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full dark:bg-white/5 bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="relative h-full rounded-full bg-[#00B884] shadow-[0_0_15px_rgba(0,184,132,0.8)]"
                  >
                    <div className="absolute right-0 top-0 h-full w-24 bg-white/30 blur-md" />
                  </motion.div>
                </div>
              </div>

              <div className="space-y-5">
                {bootSteps.map((step, index) => {
                  const isComplete = progress >= (index + 1) * 33;
                  const isCurrent = index === currentStep && !isComplete;

                  return (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      className={`flex items-center gap-4 rounded-2xl border px-6 py-4 transition-all duration-300 ${
                        isComplete
                          ? "border-[#00B884]/20 bg-[#00B884]/5 text-[#00B884]"
                          : isCurrent
                            ? "dark:border-white/10 border-slate-200 dark:bg-[#1A1D23] bg-slate-50 text-slate-900 dark:text-white"
                            : "border-transparent text-slate-400 dark:text-slate-500 opacity-60"
                      }`}
                    >
                      {isComplete ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00B884]/10">
                          <CheckCircle2 size={16} />
                        </div>
                      ) : (
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${isCurrent ? "dark:bg-white/10 bg-slate-200" : "dark:bg-white/5 bg-slate-100"}`}
                        >
                          <Activity
                            size={14}
                            className={
                              isCurrent
                                ? "animate-[spin_3s_linear_infinite]"
                                : ""
                            }
                          />
                        </div>
                      )}
                      <span className="text-[14px] font-bold tracking-wide">
                        {step}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-end">
                <AnimatePresence mode="wait">
                  {isReady ? (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="inline-flex items-center gap-2 rounded-full border border-[#00B884]/20 bg-[#00B884]/10 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#00B884]"
                    >
                      <CheckCircle2 size={14} />
                      Dashboard Ready
                    </motion.div>
                  ) : (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="inline-flex items-center gap-2 rounded-full border dark:border-white/10 border-slate-200 dark:bg-white/5 bg-slate-50 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500"
                    >
                      <LayoutDashboard size={14} className="animate-pulse" />
                      Loading App
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default WelcomeScreen;
