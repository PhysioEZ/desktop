import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { API_BASE_URL } from "../config";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

interface SystemStatus {
  maintenance: boolean;
  forceLogout: boolean;
  message: string;
  version: string;
}

const securityPillars = [
  "Role-aware access policies",
  "Real-time session protection",
  "Branch-scoped data boundaries",
];

const LoginScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const { isDark, toggleTheme } = useThemeStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSystem, setIsCheckingSystem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    maintenance: false,
    forceLogout: false,
    message: "",
    version: "...",
  });

  const reason = searchParams.get("reason");
  const statusMessage = useMemo(() => {
    if (reason === "forced_logout") {
      return "Your session was closed by system policy. Sign in again to continue.";
    }
    if (systemStatus.maintenance || systemStatus.forceLogout) {
      return systemStatus.message || "System is temporarily unavailable.";
    }
    return "";
  }, [reason, systemStatus]);

  const fetchSystemStatus = async () => {
    setIsCheckingSystem(true);
    try {
      const res = await fetch(`${API_BASE_URL}/system/status`);
      const data = await res.json();
      if (data.status === "success") {
        setSystemStatus({
          maintenance: data.data.maintenance_mode,
          forceLogout: data.data.force_logout,
          version: data.data.current_app_version,
          message:
            data.data.maintenance_mode || data.data.force_logout
              ? data.data.maintenance_message
              : "All systems operational",
        });
      }
    } catch (err) {
      console.error("Failed to fetch system status", err);
    } finally {
      setIsCheckingSystem(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    const user = useAuthStore.getState().user;
    if (user) {
      navigate("/welcome");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          throw new Error(data.message || "Login failed");
        }
        throw new Error(
          `Server returned error ${response.status}. Please check backend logs.`,
        );
      }

      const data = await response.json();
      login({
        id: data.data.user.employee_id,
        name: data.data.user.full_name,
        email: data.data.user.email,
        role: data.data.user.role_name,
        token: data.data.token,
        photo: data.data.user.photo_path,
        branch_id: data.data.user.branch_id,
        employee_id: data.data.user.employee_id,
      });

      navigate("/welcome");
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Unable to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const isBlocked = systemStatus.maintenance || systemStatus.forceLogout;

  return (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${
        isDark ? "bg-[#05070B]" : "bg-[#F4F7FB]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ x: [0, 80, 0], y: [0, -30, 0], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-32 -left-20 h-[28rem] w-[28rem] rounded-full blur-3xl ${
            isDark ? "bg-emerald-500/20" : "bg-emerald-300/35"
          }`}
        />
        <motion.div
          animate={{ x: [0, -70, 0], y: [0, 50, 0], opacity: [0.18, 0.3, 0.18] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full blur-3xl ${
            isDark ? "bg-cyan-500/15" : "bg-cyan-300/30"
          }`}
        />
      </div>

      <div className="absolute right-6 top-6 z-30">
        <button
          onClick={toggleTheme}
          type="button"
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border backdrop-blur-md transition-all hover:scale-105 ${
            isDark
              ? "border-white/10 bg-white/5 text-amber-300"
              : "border-slate-200 bg-white/80 text-slate-700"
          }`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1300px] items-center p-4 sm:p-8">
        <div className="grid w-full items-stretch overflow-hidden rounded-[2rem] border border-white/20 bg-white/40 shadow-[0_32px_80px_-30px_rgba(14,25,40,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0B1018]/70 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-7"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
                <Sparkles size={14} />
                PhysioEZ OS
              </div>
              <div className="space-y-4">
                <h1 className="max-w-lg text-5xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                  Reception workflows.
                  <br />
                  <span className="text-emerald-500">Enterprise clarity.</span>
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Securely operate registrations, billing, tests, and support in
                  one focused command center designed for high-volume clinics.
                </p>
              </div>
              <div className="space-y-3">
                {securityPillars.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                  >
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Version {systemStatus.version}
            </div>
          </section>

          <section className="relative flex items-center justify-center p-6 sm:p-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md space-y-6"
            >
              <div className="space-y-2 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  Secure Login
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Sign in to continue
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Use your receptionist credentials to access your workspace.
                </p>
              </div>

              <AnimatePresence mode="wait">
                {(statusMessage || error) && (
                  <motion.div
                    key={`${statusMessage}-${error}`}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      error
                        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{error || statusMessage}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Username
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter username"
                      className="h-13 w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500/80 dark:focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="h-13 w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-11 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500/80 dark:focus:ring-emerald-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={fetchSystemStatus}
                    disabled={isCheckingSystem}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    <RefreshCw
                      size={14}
                      className={isCheckingSystem ? "animate-spin" : ""}
                    />
                    Recheck System
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPopup(true)}
                    className="text-xs font-semibold text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300"
                  >
                    Forgot password?
                  </button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || isBlocked}
                  className={`mt-2 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold uppercase tracking-[0.15em] transition ${
                    isLoading || isBlocked
                      ? "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
                      : "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
                  }`}
                >
                  {isLoading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {showForgotPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotPopup(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl dark:border-white/10 dark:bg-[#0F1722]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                <KeyRound size={24} />
              </div>
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Password recovery
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Password resets are restricted to administrators for security.
                Contact your system administrator to regain access.
              </p>
              <button
                onClick={() => setShowForgotPopup(false)}
                className="mt-6 h-11 w-full rounded-2xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginScreen;
