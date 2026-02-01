import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { useAuthStore } from "../store/useAuthStore";
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
  Info,
  RefreshCw,
} from "lucide-react";

const LoginScreen = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<{
    maintenance: boolean;
    forceLogout: boolean;
    message: string;
  }>({ maintenance: false, forceLogout: false, message: "" });
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

  useState(() => {
    fetchSystemStatus();
  });

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

  const [searchParams] = useSearchParams();
  const isForcedLogoutReason = searchParams.get("reason") === "forced_logout";

  return (
    <div className="min-h-screen flex flex-col bg-[#fef7ff] dark:bg-[#141218] overflow-hidden font-sans relative">
      {/* MD3 Ambient Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] right-[-5%] w-[600px] h-[600px] bg-[#006a6a]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[600px] h-[600px] bg-[#6750a4]/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Brand Identity / Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] bg-[#006a6a] text-white shadow-xl shadow-[#006a6a]/20 mb-6 group transition-transform hover:scale-105 duration-300">
              <ShieldCheck
                size={40}
                className="group-hover:rotate-12 transition-transform"
              />
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-[#1c1b1f] dark:text-[#e6e1e5]">
              Physio<span className="text-[#006a6a]">EZ</span>
            </h1>
            <p className="text-sm text-[#49454f] dark:text-[#cac4d0] mt-2 font-medium tracking-wide uppercase">
              Next Gen Medical Console
            </p>
          </div>

          {/* Login Container (MD3 Card) */}
          <div className="bg-white dark:bg-[#1d1b20] p-8 md:p-10 rounded-[28px] shadow-[0_4px_30px_rgba(0,0,0,0.05)] border border-[#eaddff] dark:border-[#49454f] relative overflow-hidden">
            {/* System Status Banner */}
            <AnimatePresence>
              {(systemStatus.maintenance || systemStatus.forceLogout) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 rounded-2xl p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center space-y-1"
                >
                  <div className="flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
                    <AlertCircle size={14} />
                    <span>System Restricted</span>
                  </div>
                  <p className="font-medium normal-case">
                    {systemStatus.maintenance
                      ? systemStatus.message
                      : "Access is temporarily restricted by administrator."}
                  </p>
                </motion.div>
              )}
              {!systemStatus.maintenance &&
                !systemStatus.forceLogout &&
                systemStatus.message === "Checked" &&
                isForcedLogoutReason && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8 rounded-2xl p-4 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold text-center"
                  >
                    <div className="flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
                      <ShieldCheck size={14} />
                      <span>System Operational</span>
                    </div>
                    <p className="font-medium normal-case mt-1">
                      You may log back in now. Maintenance window is closed.
                    </p>
                  </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-[#1c1b1f] dark:text-[#e6e1e5]">
                Sign In
              </h2>
              <button
                type="button"
                onClick={fetchSystemStatus}
                disabled={isCheckingSystem}
                className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-all ${isCheckingSystem ? "animate-spin text-[#006a6a]" : "text-slate-400"}`}
                title="Refresh System Status"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email / Username Field */}
              <div className="relative group">
                <div
                  className={`absolute -top-2.5 left-3 px-1.5 text-[11px] font-bold uppercase tracking-wider bg-white dark:bg-[#1d1b20] transition-colors z-10 ${isFocused === "email" || email ? "text-[#006a6a]" : "text-[#49454f] dark:text-[#cac4d0]"}`}
                >
                  Username or Email
                </div>
                <div
                  className={`relative flex items-center border-2 rounded-2xl transition-all ${isFocused === "email" ? "border-[#006a6a] ring-4 ring-[#006a6a]/5" : "border-[#cac4d0] dark:border-[#49454f] hover:border-[#1c1b1f] dark:hover:border-[#e6e1e5]"}`}
                >
                  <User
                    size={18}
                    className={`absolute left-4 transition-colors ${isFocused === "email" ? "text-[#006a6a]" : "text-[#49454f] dark:text-[#cac4d0]"}`}
                  />
                  <input
                    type="text"
                    required
                    value={email}
                    onFocus={() => setIsFocused("email")}
                    onBlur={() => setIsFocused(null)}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent pl-12 pr-4 py-4 text-sm font-medium outline-none text-[#1c1b1f] dark:text-[#e6e1e5] placeholder-transparent"
                    placeholder="Username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="relative group">
                <div
                  className={`absolute -top-2.5 left-3 px-1.5 text-[11px] font-bold uppercase tracking-wider bg-white dark:bg-[#1d1b20] transition-colors z-10 ${isFocused === "password" || password ? "text-[#006a6a]" : "text-[#49454f] dark:text-[#cac4d0]"}`}
                >
                  Password
                </div>
                <div
                  className={`relative flex items-center border-2 rounded-2xl transition-all ${isFocused === "password" ? "border-[#006a6a] ring-4 ring-[#006a6a]/5" : "border-[#cac4d0] dark:border-[#49454f] hover:border-[#1c1b1f] dark:hover:border-[#e6e1e5]"}`}
                >
                  <Lock
                    size={18}
                    className={`absolute left-4 transition-colors ${isFocused === "password" ? "text-[#006a6a]" : "text-[#49454f] dark:text-[#cac4d0]"}`}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onFocus={() => setIsFocused("password")}
                    onBlur={() => setIsFocused(null)}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent pl-12 pr-12 py-4 text-sm font-medium outline-none text-[#1c1b1f] dark:text-[#e6e1e5] placeholder-transparent"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-[#49454f] hover:text-[#006a6a] transition-colors p-1 rounded-full hover:bg-[#006a6a]/5"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-[#ffdad6] dark:bg-[#93000a]/20 text-[#ba1a1a] dark:text-[#ffb4ab] text-xs font-bold rounded-xl flex items-center gap-3 border border-[#ffdad6] dark:border-[#93000a]/30">
                      <AlertCircle size={16} className="shrink-0" />
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPopup(true)}
                  className="text-xs font-bold text-[#006a6a] hover:underline underline-offset-4 tracking-wide uppercase"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isLoading ||
                  systemStatus.maintenance ||
                  systemStatus.forceLogout
                }
                className={`w-full relative group h-14 rounded-full shadow-lg transition-all active:scale-[0.98] overflow-hidden ${
                  isLoading ||
                  systemStatus.maintenance ||
                  systemStatus.forceLogout
                    ? "bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed shadow-none"
                    : "bg-[#006a6a] text-white hover:shadow-xl hover:shadow-[#006a6a]/20"
                }`}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                <div className="flex items-center justify-center gap-3 text-white font-bold tracking-wide uppercase text-sm">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enter Workspace</span>
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#eaddff]/20 border border-[#eaddff]/30 text-[10px] font-bold text-[#49454f] dark:text-[#cac4d0] uppercase tracking-widest">
            <Info size={12} /> Console Version 0.6.0
          </div>
          <p className="text-xs text-[#49454f] dark:text-[#cac4d0] font-medium opacity-60">
            &copy; 2026 PhysioEZ Medical Inc. All rights reserved.
          </p>
        </motion.div>
      </div>

      {/* Forgot Password Popup (MD3 Dialog) */}
      <AnimatePresence>
        {showForgotPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotPopup(false)}
              className="absolute inset-0 bg-[#1c1b1f]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#fef7ff] dark:bg-[#1d1b20] rounded-[28px] shadow-2xl max-w-sm w-full p-8 text-center border border-[#eaddff] dark:border-[#49454f]"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#006a6a]/10 text-[#006a6a] flex items-center justify-center mx-auto mb-6">
                <KeyRound size={32} />
              </div>

              <h3 className="text-xl font-bold text-[#1c1b1f] dark:text-[#e6e1e5] mb-2 leading-tight">
                Access Recovery
              </h3>
              <p className="text-[#49454f] dark:text-[#cac4d0] text-sm mb-8 leading-relaxed">
                Direct password recovery is disabled for security. Please
                contact your{" "}
                <span className="font-bold text-[#006a6a]">
                  System Administrator
                </span>{" "}
                to reset credentials.
              </p>

              <button
                onClick={() => setShowForgotPopup(false)}
                className="w-full py-3.5 px-6 bg-[#006a6a] text-white rounded-full font-bold text-sm uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
              >
                Acknowledge
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginScreen;
