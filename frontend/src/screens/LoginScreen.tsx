import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Sun,
  Moon,
} from "lucide-react";

interface SystemStatus {
  maintenance: boolean;
  forceLogout: boolean;
  message: string;
  version: string;
}

const LoginScreen = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { isDark, toggleTheme } = useThemeStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    maintenance: false,
    forceLogout: false,
    message: "",
    version: "...",
  });
  const [isCheckingSystem, setIsCheckingSystem] = useState(false);

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
              : "Checked",
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
    // Redirect if already logged in
    const user = useAuthStore.getState().user;
    if (user) {
      navigate("/welcome");
      return;
    }
    // Sync theme class on mount for login
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          throw new Error(data.message || "Login failed");
        } else {
          throw new Error(
            `Server returned error ${response.status}. Please check backend logs.`,
          );
        }
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

  useSearchParams();

  return (
    <div
      className={`min-h-screen flex flex-col overflow-hidden font-sans relative transition-colors duration-700 ${isDark ? "bg-[#050505]" : "bg-[#F8FAFC]"}`}
    >
      {/* Theme Toggle in Login */}
      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={toggleTheme}
          type="button"
          className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all hover:scale-105 active:scale-95 ${isDark ? "border-white/10 bg-white/5 text-yellow-400" : "border-gray-200 bg-white text-gray-800 shadow-sm"}`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: isDark ? [0.15, 0.25, 0.15] : [0.05, 0.12, 0.05],
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-[10%] -right-[5%] w-[700px] h-[700px] rounded-full blur-[120px] ${isDark ? "bg-emerald-500/10" : "bg-emerald-200/20"}`}
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: isDark ? [0.1, 0.2, 0.1] : [0.03, 0.1, 0.03],
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-[10%] -left-[5%] w-[700px] h-[700px] rounded-full blur-[120px] ${isDark ? "bg-emerald-900/10" : "bg-green-100/10"}`}
        />
        <div
          className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] ${isDark ? "opacity-[0.02]" : "opacity-[0.05]"}`}
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 mt-[-20px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px]"
        >
          {/* Header Identity */}
          <div className="text-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`inline-flex items-center justify-center w-20 h-20 rounded-[30px] border shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] mb-8 relative group cursor-default transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-[#121212] to-[#080808] border-white/10 text-[#4ADE80]" : "bg-white border-gray-100 text-[#16a34a]"}`}
            >
              <div
                className={`absolute inset-0 rounded-[30px] opacity-0 group-hover:opacity-100 transition-opacity blur-xl ${isDark ? "bg-emerald-500/10" : "bg-emerald-500/5"}`}
              />
              <ShieldCheck
                size={40}
                strokeWidth={1.5}
                className="relative transition-transform group-hover:rotate-12"
              />
              <div className="absolute -top-1 -right-1">
                <Sparkles
                  size={16}
                  className={
                    isDark ? "text-emerald-500/40" : "text-emerald-500/30"
                  }
                />
              </div>
            </motion.div>

            <h1
              className={`text-3xl font-black tracking-widest uppercase mb-2 transition-colors duration-500 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Physio
              <span className={isDark ? "text-[#4ADE80]" : "text-[#16a34a]"}>
                EZ
              </span>
            </h1>
            <p
              className={`text-[11px] font-bold tracking-[0.3em] uppercase transition-colors duration-500 ${isDark ? "text-white/60" : "text-slate-500"}`}
            >
              Management Portal
            </p>
          </div>

          {/* Login Card (Premium Glass) */}
          <div
            className={`p-10 md:p-12 rounded-[48px] border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden transition-all duration-500 backdrop-blur-3xl ${isDark ? "bg-[#0A0A0A]/40 border-white/[0.05] shadow-black/60" : "bg-white border-slate-200/60"}`}
          >
            {/* System Restriction Banner */}
            <AnimatePresence>
              {(systemStatus.maintenance || systemStatus.forceLogout) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8 p-4 rounded-3xl bg-red-500/5 border border-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold text-center"
                >
                  <div className="flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] mb-1">
                    <AlertCircle size={14} />
                    <span>Access Restricted</span>
                  </div>
                  <p className="font-semibold leading-relaxed">
                    {systemStatus.message || "System is temporarily offline."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-10">
              <h2
                className={`text-2xl font-bold tracking-tight transition-colors duration-500 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Sign In
              </h2>
              <button
                type="button"
                onClick={fetchSystemStatus}
                disabled={isCheckingSystem}
                className={`p-2 rounded-xl border transition-all ${isDark ? "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.08] text-white/40" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-400"} ${isCheckingSystem ? "animate-spin text-emerald-500" : ""}`}
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              {/* Username Input */}
              <div className="space-y-2">
                <label
                  className={`text-[10px] font-black uppercase tracking-[0.2em] ml-4 transition-colors duration-500 ${isDark ? "text-white/50" : "text-slate-500"}`}
                >
                  Username
                </label>
                <div
                  className={`relative flex items-center border rounded-[22px] transition-all duration-300 ${isFocused === "email" ? "border-emerald-500/60 bg-white/[0.05] shadow-[0_0_30px_rgba(74,222,128,0.05)]" : isDark ? "bg-white/[0.03] border-white/[0.05]" : "bg-slate-50 border-slate-200"}`}
                >
                  <User
                    size={18}
                    className={`absolute left-5 transition-colors ${isFocused === "email" ? "text-emerald-500" : isDark ? "text-white/30" : "text-slate-400"}`}
                  />
                  <input
                    type="text"
                    required
                    value={email}
                    onFocus={() => setIsFocused("email")}
                    onBlur={() => setIsFocused(null)}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full bg-transparent pl-14 pr-6 py-5 text-sm font-bold outline-none placeholder:opacity-100 ${isDark ? "text-white placeholder:text-white/20" : "text-slate-900 placeholder:text-slate-400"}`}
                    placeholder="Enter Username"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label
                  className={`text-[10px] font-black uppercase tracking-[0.2em] ml-4 transition-colors duration-500 ${isDark ? "text-white/50" : "text-slate-500"}`}
                >
                  Password
                </label>
                <div
                  className={`relative flex items-center border rounded-[22px] transition-all duration-300 ${isFocused === "password" ? "border-emerald-500/60 bg-white/[0.05] shadow-[0_0_30px_rgba(74,222,128,0.05)]" : isDark ? "bg-white/[0.03] border-white/[0.05]" : "bg-slate-50 border-slate-200"}`}
                >
                  <Lock
                    size={18}
                    className={`absolute left-5 transition-colors ${isFocused === "password" ? "text-emerald-500" : isDark ? "text-white/30" : "text-slate-400"}`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onFocus={() => setIsFocused("password")}
                    onBlur={() => setIsFocused(null)}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-transparent pl-14 pr-14 py-5 text-sm font-bold outline-none placeholder:opacity-100 ${isDark ? "text-white placeholder:text-white/20" : "text-slate-900 placeholder:text-slate-400"}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-5 transition-colors ${isDark ? "text-white/40 hover:text-emerald-500" : "text-slate-400 hover:text-emerald-600"}`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Callout */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-[11px] font-bold"
                  >
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Recovery Action */}
              <div className="flex justify-center flex-col items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    systemStatus.maintenance ||
                    systemStatus.forceLogout
                  }
                  className={`w-full h-16 rounded-[22px] flex items-center justify-center gap-3 transition-all duration-300 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl ${
                    isLoading ||
                    systemStatus.maintenance ||
                    systemStatus.forceLogout
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-emerald-500 text-black hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] shadow-emerald-500/20"
                  }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForgotPopup(true)}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isDark ? "text-white/40 hover:text-white/70" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Global Footer Meta */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center space-y-6"
        >
          <div
            className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isDark ? "bg-white/[0.02] border-white/[0.05] text-white/50" : "bg-slate-100 border-slate-200 text-slate-500"}`}
          >
            <ShieldCheck size={12} className="text-emerald-500/50" />
            Version {systemStatus.version}
          </div>

          <div
            className={`flex items-center justify-center gap-4 transition-opacity duration-500 ${isDark ? "opacity-20" : "opacity-40"}`}
          >
            <div
              className={`h-px w-10 ${isDark ? "bg-white" : "bg-slate-900"}`}
            />
            <p
              className={`text-[10px] font-black uppercase tracking-widest leading-none ${isDark ? "text-white" : "text-slate-900"}`}
            >
              PhysioEZ Core Console
            </p>
            <div
              className={`h-px w-10 ${isDark ? "bg-white" : "bg-slate-900"}`}
            />
          </div>
        </motion.div>
      </div>

      {/* Modern MD3 Dialog for Recovery */}
      <AnimatePresence>
        {showForgotPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotPopup(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative border rounded-[40px] shadow-2xl max-w-sm w-full p-10 text-center overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#101010] border-white/[0.05]" : "bg-white border-slate-200"}`}
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${isDark ? "bg-emerald-500/10 text-emerald-500" : "bg-emerald-50 text-emerald-600"}`}
              >
                <KeyRound size={32} strokeWidth={1.5} />
              </div>

              <h3
                className={`text-2xl font-bold mb-4 transition-colors duration-500 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Forgot Password?
              </h3>
              <p
                className={`text-sm mb-10 leading-relaxed font-medium transition-colors duration-500 ${isDark ? "text-white/60" : "text-slate-600"}`}
              >
                For security reasons, password resets are handled by the system
                administrator.
                <br />
                <br />
                Please contact the{" "}
                <span className="text-emerald-500 font-bold">
                  Administrator
                </span>{" "}
                to reset your credentials.
              </p>

              <button
                onClick={() => setShowForgotPopup(false)}
                className={`w-full py-5 px-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all border ${isDark ? "bg-white/[0.05] hover:bg-white/[0.08] text-white border-white/[0.05]" : "bg-slate-900 hover:bg-slate-800 text-white border-transparent"}`}
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
