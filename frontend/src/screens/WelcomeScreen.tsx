import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
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
  { key: "cache", label: "Purging stale session cache" },
  { key: "dashboard", label: "Syncing dashboard analytics" },
  { key: "registration", label: "Retrieving registration records" },
  { key: "patients", label: "Preparing patient registry" },
  { key: "tests", label: "Loading medical test data" },
];

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { isDark } = useThemeStore();
  const [progress, setProgress] = useState(0);
  const [fetchStatus, setFetchStatus] = useState<{
    [key: string]: "pending" | "success" | "error";
  }>({
    cache: "pending",
    dashboard: "pending",
    registration: "pending",
    patients: "pending",
    tests: "pending",
  });

  const currentStepIndex = useMemo(() => {
    return bootSteps.findIndex((step) => fetchStatus[step.key] === "pending");
  }, [fetchStatus]);

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
    let isApiDone = false;
    let currentProgress = 0;
    const minVisualDuration = 1500;
    const maxWaitTime = 4000;
    const startTime = Date.now();

    const doPrefetches = async () => {
      try {
        if (!user?.branch_id) return;

        // Step 1: Clear server-side SQLite cache
        try {
          const res = await authFetch(`${API_BASE_URL}/auth/clear-cache`, {
            method: "POST",
          });
          await res.json();
          setFetchStatus((prev) => ({ ...prev, cache: "success" }));
        } catch (e) {
          console.warn("[Welcome] Cache clear fail:", e);
          setFetchStatus((prev) => ({ ...prev, cache: "error" }));
        }

        // Step 2: Parallel API fetches
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
                setFetchStatus((prev) => ({ ...prev, dashboard: "success" }));
              } else throw new Error();
            })
            .catch(() =>
              setFetchStatus((prev) => ({ ...prev, dashboard: "error" })),
            ),

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
                setFetchStatus((prev) => ({
                  ...prev,
                  registration: "success",
                }));
              } else throw new Error();
            })
            .catch(() =>
              setFetchStatus((prev) => ({ ...prev, registration: "error" })),
            ),

          // Patients
          usePatientStore
            .getState()
            .fetchMetaData(user.branch_id)
            .then(() =>
              setFetchStatus((prev) => ({ ...prev, patients: "success" })),
            )
            .catch(() =>
              setFetchStatus((prev) => ({ ...prev, patients: "error" })),
            ),
          usePatientStore.getState().fetchPatients(user.branch_id),

          // Tests
          useTestStore
            .getState()
            .fetchTests(user.branch_id, 1, 15)
            .then(() =>
              setFetchStatus((prev) => ({ ...prev, tests: "success" })),
            )
            .catch(() =>
              setFetchStatus((prev) => ({ ...prev, tests: "error" })),
            ),
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
      let visualProgress = (elapsed / maxWaitTime) * 90;
      if (visualProgress > 90) visualProgress = 90;

      const finishedByApi = isApiDone && elapsed >= minVisualDuration;
      const finishedByTimeout = elapsed >= maxWaitTime;

      if (finishedByApi || finishedByTimeout) {
        currentProgress += 5;
        if (currentProgress >= 100) {
          setProgress(100);
          clearInterval(updateInterval);
          setTimeout(() => {
            const dest =
              user?.role === "admin" ||
              user?.role === "superadmin" ||
              user?.role === "developer"
                ? "/admin/dashboard"
                : "/reception/dashboard";
            navigate(dest);
          }, 600);
          return;
        }
      } else {
        currentProgress = visualProgress;
      }
      setProgress(currentProgress);
    }, 40);

    return () => clearInterval(updateInterval);
  }, [navigate, user]);

  if (!user) return null;

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 transition-colors duration-700 dark:bg-[#05060A] bg-slate-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00B884]/10 blur-[120px] rounded-full dark:opacity-100 opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#3b82f6]/5 blur-[120px] rounded-full dark:opacity-100 opacity-30" />
      </div>

      <main className="relative z-10 w-full max-w-[1200px] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="grid w-full min-h-[600px] grid-cols-1 md:grid-cols-[0.8fr_1.2fr] overflow-hidden rounded-[32px] border dark:border-white/10 border-slate-200 dark:bg-[#0B0D11] bg-white shadow-2xl"
        >
          {/* User Info */}
          <section className="relative flex flex-col justify-center p-8 lg:p-14 border-b md:border-b-0 md:border-r dark:bg-gradient-to-br dark:from-[#101318] dark:to-[#0B0D11] bg-slate-50/50">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-10 inline-flex items-center gap-2 w-fit rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#00B884]"
            >
              <Sparkles size={12} />
              Authenticating
            </motion.div>

            <div className="space-y-8">
              <div className="h-24 w-24 overflow-hidden rounded-[24px] border-2 border-white dark:border-white/10 bg-white">
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
                    <UserIcon size={36} className="text-slate-400" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-black dark:text-white text-slate-900">
                  Welcome back, <br />
                  <span className="text-[#00B884]">{user.name}</span>
                </h1>
                <p className="mt-3 text-sm dark:text-slate-400 text-slate-600">
                  Preparing your secured workspace and operational modules.
                </p>
              </div>
            </div>
          </section>

          {/* Progress */}
          <section className="flex flex-col justify-center p-8 lg:p-16 dark:bg-[#0B0D11] bg-white">
            <div className="w-full space-y-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase text-slate-500">
                    System Initialization
                  </p>
                  <p className="text-lg font-black text-[#00B884]">
                    {Math.round(progress)}%
                  </p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full dark:bg-white/5 bg-slate-100">
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-[#00B884] shadow-[0_0_15px_rgba(0,184,132,0.5)]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {bootSteps.map((step, index) => {
                  const status = fetchStatus[step.key];
                  const isComplete = status === "success";
                  const isError = status === "error";
                  const isCurrent = index === currentStepIndex;

                  return (
                    <motion.div
                      key={step.key}
                      className={`flex items-center gap-4 rounded-2xl border px-6 py-4 transition-all ${
                        isComplete
                          ? "border-[#00B884]/20 bg-[#00B884]/5 text-[#00B884]"
                          : isError
                            ? "border-red-500/20 bg-red-500/5 text-red-500"
                            : isCurrent
                              ? "dark:border-white/10 border-slate-200 dark:bg-[#1A1D23] bg-slate-50"
                              : "border-transparent opacity-40"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 size={18} />
                      ) : isError ? (
                        <Activity size={18} className="text-red-500" />
                      ) : (
                        <Activity
                          size={18}
                          className={isCurrent ? "animate-spin" : ""}
                        />
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{step.label}</span>
                        {isError && (
                          <span className="text-[10px] italic">
                            Fetch failed, retrying in background...
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default WelcomeScreen;
