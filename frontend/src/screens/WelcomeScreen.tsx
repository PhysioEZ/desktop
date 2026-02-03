import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  LayoutDashboard,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { API_BASE_URL } from "../config";

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { isDark } = useThemeStore();
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Sync theme class on mount
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Security Guard
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

    // Redirect after completion - fixed the timeout to be reasonable
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
      className={`min-h-screen flex flex-col items-center justify-center overflow-hidden font-sans relative transition-colors duration-1000 ${
        isDark ? "bg-[#050505]" : "bg-[#F8FAFC]"
      }`}
    >
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: isDark ? [0.1, 0.15, 0.1] : [0.05, 0.08, 0.05],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-[10%] -left-[10%] w-[800px] h-[800px] rounded-full blur-[120px] ${
            isDark ? "bg-emerald-500/20" : "bg-emerald-200/40"
          }`}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            opacity: isDark ? [0.08, 0.12, 0.08] : [0.03, 0.06, 0.03],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-[10%] -right-[10%] w-[800px] h-[800px] rounded-full blur-[120px] ${
            isDark ? "bg-purple-500/20" : "bg-purple-200/40"
          }`}
        />
        <div
          className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] ${
            isDark ? "opacity-[0.02]" : "opacity-[0.05]"
          }`}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[500px] p-8 flex flex-col items-center"
      >
        {/* Profile Shield Container */}
        <div className="relative mb-12">
          {/* Rotating Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className={`absolute -inset-4 rounded-[50px] border-2 border-dashed ${
              isDark ? "border-emerald-500/20" : "border-emerald-500/10"
            }`}
          />

          {/* Profile Card */}
          <motion.div
            whileHover={{ y: -5 }}
            className={`relative w-40 h-40 rounded-[42px] p-2 transition-all duration-500 shadow-2xl ${
              isDark
                ? "bg-gradient-to-br from-[#121212] to-[#080808] border border-white/10"
                : "bg-white border border-slate-200"
            }`}
          >
            <div className="w-full h-full rounded-[34px] overflow-hidden relative flex items-center justify-center bg-slate-50 dark:bg-black/20">
              {user.photo ? (
                <img
                  src={`${API_BASE_URL.replace("/api", "")}/${user.photo}`}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src =
                      `https://ui-avatars.com/api/?name=${user.name}&background=10b981&color=fff&bold=true`;
                  }}
                />
              ) : (
                <UserIcon
                  size={48}
                  className={isDark ? "text-emerald-500/40" : "text-slate-300"}
                />
              )}

              {/* Status Indicator */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-[8px] font-black text-black uppercase tracking-widest shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                Online
              </div>
            </div>
          </motion.div>

          {/* Floaters */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute -top-6 -right-6 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl ${
              isDark ? "bg-emerald-500 text-black" : "bg-emerald-600 text-white"
            }`}
          >
            <Sparkles size={24} />
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className={`absolute -bottom-4 -left-8 px-4 py-2 rounded-2xl border flex items-center gap-2 shadow-xl ${
              isDark
                ? "bg-[#101010] border-white/10 text-white/60"
                : "bg-white border-slate-200 text-slate-500"
            }`}
          >
            <Activity size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest">
              Authorized
            </span>
          </motion.div>
        </div>

        {/* Welcome Typography */}
        <div className="text-center space-y-3 mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-[11px] font-black uppercase tracking-[0.4em] ${
              isDark ? "text-emerald-500" : "text-emerald-600"
            }`}
          >
            System Access Granted
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`text-4xl md:text-5xl font-black tracking-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Welcome,{" "}
            <span className="text-emerald-500">{user.name.split(" ")[0]}</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${
              isDark
                ? "bg-white/[0.03] border-white/[0.05] text-white/40"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            <ShieldCheck size={12} className="text-emerald-500/60" />
            {user.role} Identity
          </motion.div>
        </div>

        {/* Premium Progress Section */}
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between px-2">
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${
                isDark ? "text-white/30" : "text-slate-400"
              }`}
            >
              {isReady ? "Environment Ready" : "Initializing Workspace"}
            </span>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              {Math.round(progress)}%
            </span>
          </div>

          <div
            className={`w-full h-2 rounded-full overflow-hidden relative ${
              isDark ? "bg-white/5" : "bg-slate-100"
            }`}
          >
            <motion.div
              layout
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`h-full rounded-full relative ${
                isDark ? "bg-emerald-500" : "bg-emerald-600"
              }`}
            >
              <div className="absolute top-0 right-0 h-full w-20 bg-white/20 blur-md animate-pulse" />
            </motion.div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <AnimatePresence mode="wait">
              {isReady ? (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-emerald-500 font-bold text-[11px] uppercase tracking-widest"
                >
                  <CheckCircle2 size={16} />
                  Session Initialized
                </motion.div>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${
                    isDark ? "text-white/20" : "text-slate-400"
                  }`}
                >
                  <LayoutDashboard size={14} className="animate-pulse" />
                  Loading Modules...
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isDark ? 0.3 : 0.5 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12 flex flex-col items-center gap-4"
      >
        <div className="flex items-center gap-6">
          <div
            className={`h-px w-12 ${isDark ? "bg-white/20" : "bg-slate-300"}`}
          />
          <p
            className={`text-[10px] font-black uppercase tracking-[0.6em] ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Physio<span className="text-emerald-500">EZ</span> Core
          </p>
          <div
            className={`h-px w-12 ${isDark ? "bg-white/20" : "bg-slate-300"}`}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
