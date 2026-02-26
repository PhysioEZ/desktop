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
import { API_BASE_URL } from "../config";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

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
    const duration = 3000;
    const intervalTime = 30;
    const increment = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setIsReady(true);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    const redirectTimer = setTimeout(() => {
      if (
        user?.role === "admin" ||
        user?.role === "superadmin" ||
        user?.role === "developer"
      ) {
        navigate("/admin/dashboard");
      } else {
        navigate("/reception/dashboard");
      }
    }, duration + 800);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate, user]);

  if (!user) return null;

  return (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-700 ${
        isDark ? "bg-[#060A12]" : "bg-[#F2F7FB]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ x: [0, 70, 0], y: [0, -40, 0], opacity: [0.22, 0.34, 0.22] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className={`absolute -left-20 -top-24 h-[26rem] w-[26rem] rounded-full blur-3xl ${
            isDark ? "bg-emerald-500/20" : "bg-emerald-300/35"
          }`}
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 35, 0], opacity: [0.16, 0.28, 0.16] }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-24 -right-16 h-[28rem] w-[28rem] rounded-full blur-3xl ${
            isDark ? "bg-cyan-500/20" : "bg-cyan-300/35"
          }`}
        />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-5 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid w-full overflow-hidden rounded-[2rem] border border-white/20 bg-white/50 shadow-[0_28px_72px_-30px_rgba(15,30,50,0.42)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0A1220]/70 lg:grid-cols-[0.95fr_1.05fr]"
        >
          <section className="border-b border-white/20 p-7 sm:p-10 dark:border-white/10 lg:border-b-0 lg:border-r">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
              <Sparkles size={14} />
              Session Handoff
            </div>

            <div className="space-y-5">
              <div className="relative w-fit">
                <div className="h-28 w-28 overflow-hidden rounded-[1.6rem] border-2 border-white/60 bg-white shadow-xl dark:border-white/10 dark:bg-white/5">
                  {user.photo ? (
                    <img
                      src={`${API_BASE_URL.replace("/api", "")}/${user.photo}`}
                      alt={user.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://ui-avatars.com/api/?name=${user.name}&background=10b981&color=fff&bold=true`;
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserIcon
                        size={44}
                        className="text-slate-400 dark:text-slate-500"
                      />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" />
                  Active
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Welcome back,{" "}
                  <span className="text-emerald-500">
                    {user.name.split(" ")[0]}
                  </span>
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  We are preparing your secured workspace and personalized
                  reception controls.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  Role Profile
                </div>
                <p className="mt-2 text-sm font-semibold capitalize text-slate-900 dark:text-white">
                  {user.role}
                </p>
              </div>
            </div>
          </section>

          <section className="p-7 sm:p-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                  Workspace Initialization
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
                  {Math.round(progress)}%
                </p>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="relative h-full rounded-full bg-emerald-500"
                >
                  <div className="absolute right-0 top-0 h-full w-24 bg-white/30 blur-md" />
                </motion.div>
              </div>

              <div className="space-y-3">
                {bootSteps.map((step, index) => {
                  const isComplete = progress >= (index + 1) * 33;
                  const isCurrent = index === currentStep && !isComplete;

                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                        isComplete
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : isCurrent
                            ? "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300"
                            : "border-slate-200 bg-white/70 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Activity
                          size={16}
                          className={isCurrent ? "animate-pulse" : ""}
                        />
                      )}
                      <span className="text-sm font-medium">{step}</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <AnimatePresence mode="wait">
                  {isReady ? (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                    >
                      <CheckCircle2 size={14} />
                      Launching your dashboard
                    </motion.div>
                  ) : (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    >
                      <LayoutDashboard size={14} className="animate-pulse" />
                      Finalizing modules
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
