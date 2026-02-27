import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  AlertCircle,
  Code2,
  Eye,
  EyeOff,
  KeyRound,
  LayoutGrid,
  Lock,
  Moon,
  RefreshCw,
  ShieldCheck,
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
  const [recheckCooldown, setRecheckCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [showFoundersPopup, setShowFoundersPopup] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    maintenance: false,
    forceLogout: false,
    message: "",
    version: "0.6.2.5-ALPHA",
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

  const fetchSystemStatus = async (isManual = false) => {
    if (isManual && recheckCooldown) {
      return;
    }

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
        if (isManual) toast.success("System status verified");
      }
    } catch (err) {
      console.error("Failed to fetch system status", err);
      if (isManual) toast.error("Failed to reach server");
    } finally {
      setIsCheckingSystem(false);
      if (isManual) {
        setRecheckCooldown(true);
        setCooldownTime(15);
      }
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime((prev) => prev - 1);
      }, 1000);
    } else if (cooldownTime === 0) {
      setRecheckCooldown(false);
    }
    return () => clearInterval(interval);
  }, [cooldownTime]);

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
      className={`relative min-h-screen overflow-hidden flex items-center justify-center p-4 transition-colors duration-500 dark:bg-[#05060A] bg-slate-50`}
    >
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00B884]/10 blur-[120px] rounded-full dark:opacity-100 opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#3b82f6]/5 blur-[120px] rounded-full dark:opacity-100 opacity-30" />
      </div>

      <div className="absolute right-8 top-8 z-30">
        <button
          onClick={toggleTheme}
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border dark:border-white/5 border-slate-200 dark:bg-white/5 bg-white dark:text-slate-400 text-slate-600 shadow-sm backdrop-blur-md transition-all hover:scale-105 dark:hover:bg-white/10 hover:bg-slate-50"
        >
          {isDark ? (
            <Sun size={20} className="text-amber-300" />
          ) : (
            <Moon size={20} className="text-slate-600" />
          )}
        </button>
      </div>

      <main className="relative z-10 w-full max-w-[1200px] flex items-center justify-center">
        <div className="grid w-full grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] overflow-hidden rounded-[32px] border dark:border-white/10 border-slate-200 dark:bg-[#0B0D11] bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
          {/* Left Column: Branding & Illustration */}
          <section className="relative flex flex-col justify-between p-8 lg:p-10 border-b dark:border-white/5 border-slate-100 lg:border-b-0 lg:border-r dark:border-white/5 border-slate-100 dark:bg-gradient-to-br dark:from-[#101318] dark:to-[#0B0D11] bg-slate-50/50">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#00B884]">
                <LayoutGrid size={12} className="text-[#00B884]" />
                PHYSIOEZ OS
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl lg:text-[40px] font-black leading-[1.1] tracking-tight dark:text-white text-slate-900">
                  Reception workflows.
                  <br />
                  <span className="text-[#00B884]">Enterprise clarity.</span>
                </h1>
                <p className="max-w-[340px] text-[13px] font-medium leading-relaxed dark:text-slate-400 text-slate-600">
                  Securely operate registrations, billing, tests, and support in
                  one focused command center designed for high-volume clinics.
                </p>
              </div>

              <div className="pt-4">
                <img
                  src="/images/login_page_final.png"
                  alt="Medical Illustration"
                  className="w-full h-auto max-w-[440px] object-contain drop-shadow-[0_20px_50px_rgba(0,184,132,0.1)]"
                />
              </div>
            </div>

            <div className="mt-12 pt-8 border-t dark:border-white/5 border-slate-200/60 w-full">
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2.5 rounded-full dark:bg-[#00B884]/10 bg-emerald-50 dark:border-[#00B884]/20 border-emerald-100/50 border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#00B884]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B884] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00B884]"></span>
                    </span>
                    v{systemStatus.version}
                  </div>

                  <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <span>Built by</span>
                    <button
                      onClick={() => setShowFoundersPopup(true)}
                      className="group flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#fc3b00]/10 to-[#ff6129]/10 border border-[#fc3b00]/20 px-3.5 py-1.5 text-[#fc3b00] dark:text-[#ff7145] font-bold transition-all hover:scale-105 hover:shadow-md"
                    >
                      <Code2
                        size={12}
                        className="text-[#fc3b00] dark:text-[#ff7145] transition-transform group-hover:scale-110 group-hover:rotate-6"
                      />
                      404 Founders
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400/80 dark:text-slate-500">
                    <ShieldCheck size={14} className="opacity-60" />
                    <p>&copy; 2026 PhysioEZ OS. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Login Form */}
          <section className="flex items-center justify-center p-8 lg:p-12 dark:bg-[#0B0D11] bg-white">
            <div className="w-full max-w-[360px] space-y-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border dark:border-white/5 border-slate-100 dark:bg-white/5 bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] dark:text-slate-400 text-slate-600">
                  <ShieldCheck size={12} className="text-[#00B884]" />
                  Secure Login
                </div>
                <h2 className="text-2xl lg:text-3xl font-black tracking-tight dark:text-white text-slate-900">
                  Sign in to continue
                </h2>
                <p className="text-[13px] font-medium dark:text-slate-400 text-slate-600">
                  Use your credentials to access your workspace.
                </p>
              </div>

              <AnimatePresence mode="wait">
                {(statusMessage || error) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`rounded-2xl border px-5 py-4 text-sm ${
                      error
                        ? "border-red-500/20 bg-red-500/5 text-red-400"
                        : "border-amber-500/20 bg-amber-500/5 text-amber-400"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle size={18} className="shrink-0" />
                      <span className="font-medium leading-relaxed">
                        {error || statusMessage}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="ml-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#00B884] transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Username"
                      className="h-14 w-full rounded-[24px] border dark:border-white/5 border-slate-200 dark:bg-[#1A1D23] bg-slate-50 pl-14 pr-6 text-sm font-bold dark:text-white text-slate-900 outline-none transition-all focus:border-[#00B884]/50 dark:focus:bg-[#1C2027] focus:bg-white focus:ring-4 focus:ring-[#00B884]/5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#00B884] transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="h-14 w-full rounded-[24px] border dark:border-white/5 border-slate-200 dark:bg-[#1A1D23] bg-slate-50 pl-14 pr-14 text-sm font-bold dark:text-white text-slate-900 outline-none transition-all focus:border-[#00B884]/50 dark:focus:bg-[#1C2027] focus:bg-white focus:ring-4 focus:ring-[#00B884]/5"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition-all hover:bg-white/5 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => fetchSystemStatus(true)}
                    disabled={isCheckingSystem || recheckCooldown}
                    className={`flex items-center gap-2 rounded-xl border dark:border-white/5 border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      recheckCooldown
                        ? "bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed opacity-70"
                        : "dark:bg-white/5 bg-slate-50 text-slate-500 dark:hover:bg-white/10 hover:bg-slate-100 dark:hover:text-white hover:text-slate-900"
                    }`}
                  >
                    <RefreshCw
                      size={14}
                      className={isCheckingSystem ? "animate-spin" : ""}
                    />
                    {recheckCooldown
                      ? `Wait ${cooldownTime}s`
                      : "Recheck System"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPopup(true)}
                    className="text-[10px] font-medium text-slate-500 hover:text-slate-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || isBlocked}
                  className={`relative mt-2 flex h-14 w-full items-center justify-center gap-3 rounded-[24px] text-xs font-black uppercase tracking-[0.25em] transition-all ${
                    isLoading || isBlocked
                      ? "cursor-not-allowed bg-slate-800 text-slate-500"
                      : "bg-[#00B884] text-black shadow-[0_20px_40px_-10px_rgba(0,184,132,0.4)] hover:bg-[#00D196] hover:shadow-[0_20px_50px_-5px_rgba(0,184,132,0.5)] hover:scale-[1.01] active:scale-[0.99]"
                  }`}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-black/20 border-t-black" />
                  ) : (
                    <>
                      CONTINUE
                      <ArrowRight size={18} />
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </section>
        </div>
      </main>

      {/* Forgot Password Popup */}
      <AnimatePresence>
        {showForgotPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-md rounded-[32px] border dark:border-white/10 border-slate-200 dark:bg-[#10141D] bg-white p-10 shadow-2xl"
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00B884]/10 text-[#00B884]">
                <KeyRound size={28} />
              </div>
              <h3 className="text-2xl font-black tracking-tight dark:text-white text-slate-900">
                Password recovery
              </h3>
              <p className="mt-4 text-sm font-medium leading-relaxed dark:text-slate-400 text-slate-600">
                Password resets are restricted to administrators for security.
                Contact your system administrator to regain access to your
                workspace.
              </p>
              <button
                onClick={() => setShowForgotPopup(false)}
                className="mt-8 h-14 w-full rounded-2xl dark:bg-white bg-slate-900 text-sm font-black uppercase tracking-widest dark:text-[#05060A] text-white transition-all hover:bg-slate-800 dark:hover:bg-slate-200"
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Star Shape in Bottom Right as seen in image */}
      <div className="absolute bottom-10 right-10 dark:opacity-20 opacity-10 hidden lg:block dark:text-white text-slate-400">
        <svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M30 0L33.7 26.3L60 30L33.7 33.7L30 60L26.3 33.7L0 30L26.3 26.3L30 0Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Founders Popup */}
      <AnimatePresence>
        {showFoundersPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[8px] flex items-center justify-center z-[999] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-[1000px] h-auto md:h-[800px] rounded-[24px] overflow-y-auto overflow-x-hidden flex flex-col md:flex-row shadow-[0_40px_80px_rgba(0,0,0,0.5)] text-white"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #000000 0%, #1a0a05 40%, #fc3b00 100%)",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            >
              {/* LEFT SIDE */}
              <div className="flex-1 p-8 md:p-[60px] flex flex-col justify-center">
                <span className="text-[12px] tracking-[2px] opacity-70 mb-5 uppercase">
                  PRODUCT ENGINEERING
                </span>
                <h1 className="text-4xl md:text-[48px] font-bold mb-[25px]">
                  404 Founders
                </h1>

                <p className="text-[18px] leading-[1.6] opacity-90 mb-5">
                  We build reliable, high-performance software for modern
                  healthcare teams.
                </p>

                <p className="text-[16px] opacity-75 mb-[30px]">
                  Our mission is simple — turn complex operations into seamless
                  digital experiences.
                </p>

                <p className="text-[14px] text-[#ff7145] font-medium">
                  Yes, the name is 404. But the systems we build are always
                  exactly where they need to be.
                </p>
              </div>

              {/* RIGHT SIDE */}
              <div className="flex-1 bg-white/5 backdrop-blur-[20px] p-8 md:p-[40px] flex flex-col justify-center gap-5">
                <div className="bg-white/[0.06] rounded-[16px] p-5 transition-all duration-300 hover:bg-white/[0.12] hover:-translate-y-1">
                  <span className="bg-[#ff6129] text-white text-[11px] px-2.5 py-1 rounded-[20px] font-semibold tracking-[1px] uppercase inline-block">
                    Team Lead
                  </span>
                  <h3 className="my-2.5 text-[18px] font-bold italic">
                    Sumit Srivastava
                  </h3>
                  <p className="text-[14px] opacity-80 leading-[1.5]">
                    Architected and led the platform from idea to production.
                    Focused on scalability, performance, and long-term
                    stability.
                  </p>
                </div>

                <div className="bg-white/[0.06] rounded-[16px] p-5 transition-all duration-300 hover:bg-white/[0.12] hover:-translate-y-1">
                  <span className="bg-[#fc3b00] text-white text-[11px] px-2.5 py-1 rounded-[20px] font-semibold tracking-[1px] uppercase inline-block">
                    Developer
                  </span>
                  <h3 className="my-2.5 text-[18px] font-bold italic">
                    Avinash Kumar
                  </h3>
                  <p className="text-[14px] opacity-80 leading-[1.5]">
                    Engineered frontend and backend systems. Delivered secure
                    integrations and dependable APIs across the platform.
                  </p>
                </div>

                <div className="bg-white/[0.06] rounded-[16px] p-5 transition-all duration-300 hover:bg-white/[0.12] hover:-translate-y-1">
                  <span className="bg-[#fc3b00] text-white text-[11px] px-2.5 py-1 rounded-[20px] font-semibold tracking-[1px] uppercase inline-block">
                    Developer
                  </span>
                  <h3 className="my-2.5 text-[18px] font-bold italic">
                    Shiv Kauhsal
                  </h3>
                  <p className="text-[14px] opacity-80 leading-[1.5]">
                    Designed and implemented the frontend architecture and UI.
                    Prioritized clarity, consistency, and intuitive experiences.
                  </p>
                </div>

                <div className="flex gap-[15px] mt-5">
                  <button
                    onClick={() =>
                      window.open("https://404founders.com", "_blank")
                    }
                    className="flex-1 bg-gradient-to-r from-[#ff6129] to-[#fc3b00] border-none py-3 rounded-[12px] font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    Visit Website
                  </button>
                  <button
                    onClick={() => setShowFoundersPopup(false)}
                    className="flex-1 bg-white/15 border-none py-3 rounded-[12px] font-semibold text-white cursor-pointer hover:bg-white/20 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginScreen;
