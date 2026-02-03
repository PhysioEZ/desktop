import * as React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import { API_BASE_URL } from "../config";
import { useThemeStore } from "../store/useThemeStore";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = React.useState(0);
  const [version, setVersion] = React.useState<string | null>(null);
  const { isDark } = useThemeStore();

  React.useEffect(() => {
    // Sync theme class on mount for splash
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 1. Fetch System Status / Version
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/system/status`);
        const data = await res.json();
        if (data.status === "success" && data.data) {
          setVersion(data.data.current_app_version);
        }
      } catch (err) {
        console.error("Failed to fetch version", err);
      }
    };

    fetchStatus();

    // 2. Linear Progress Animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 25);

    // 3. Completion Timer
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete, isDark]);

  return (
    <div
      className={`fixed inset-0 z-[500] flex flex-col items-center justify-center overflow-hidden font-sans transition-colors duration-700 ${isDark ? "bg-[#0C0C0C]" : "bg-[#F8FAFC]"}`}
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: isDark ? [0.1, 0.2, 0.1] : [0.05, 0.1, 0.05],
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full blur-[140px] ${isDark ? "bg-[#4ADE80]" : "bg-emerald-200"}`}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: isDark ? [0.1, 0.15, 0.1] : [0.03, 0.08, 0.03],
            x: [0, -40, 0],
            y: [0, 60, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-[20%] -left-[10%] w-[800px] h-[800px] rounded-full blur-[140px] ${isDark ? "bg-[#16a34a]" : "bg-green-100"}`}
        />

        {/* Particle Overlay */}
        <div
          className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] ${isDark ? "opacity-[0.03]" : "opacity-[0.1]"}`}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Premium Brand Mark */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 relative"
        >
          <div className="relative group">
            {/* Outer Glow */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: isDark ? [0.3, 0.5, 0.3] : [0.1, 0.2, 0.1],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className={`absolute inset-x-0 inset-y-0 rounded-[38%] blur-3xl ${isDark ? "bg-emerald-500 opacity-20" : "bg-emerald-400 opacity-10"}`}
            />

            {/* Main Icon Plate */}
            <div
              className={`relative w-32 h-32 rounded-[40px] border flex items-center justify-center shadow-[0_24px_50px_-12px_rgba(0,0,0,0.3)] transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-[#121212] to-[#080808] border-white/10 shadow-black/50" : "bg-white border-slate-200 shadow-emerald-900/10"}`}
            >
              <div
                className={`absolute inset-0 rounded-[40px] opacity-50 ${isDark ? "bg-gradient-to-tr from-emerald-500/20 to-transparent" : "bg-gradient-to-tr from-emerald-50/50 to-transparent"}`}
              />
              <ShieldCheck
                size={64}
                className={`relative drop-shadow-[0_0_15px_rgba(74,222,128,0.4)] ${isDark ? "text-[#4ADE80]" : "text-[#16a34a]"}`}
                strokeWidth={1.5}
              />

              {/* Corner Accent */}
              <div
                className={`absolute top-4 right-4 ${isDark ? "text-emerald-500/30" : "text-emerald-500/20"}`}
              >
                <Sparkles size={16} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Typography */}
        <div className="text-center space-y-4">
          <motion.h1
            initial={{ letterSpacing: "0.2em", opacity: 0 }}
            animate={{ letterSpacing: "0.05em", opacity: 1 }}
            transition={{ delay: 0.4, duration: 1.2 }}
            className={`text-5xl font-black uppercase transition-colors duration-500 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            PHYSIO
            <span className={isDark ? "text-[#4ADE80]" : "text-[#16a34a]"}>
              EZ
            </span>
          </motion.h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 40 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className={`h-[2px] mx-auto rounded-full ${isDark ? "bg-emerald-500/50" : "bg-emerald-600/30"}`}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: isDark ? 0.6 : 0.7 }}
            transition={{ delay: 1.2, duration: 1 }}
            className={`text-[11px] font-black tracking-[0.4em] uppercase transition-colors duration-500 ${isDark ? "text-white" : "text-slate-500"}`}
          >
            Physiotherapy Management System
          </motion.p>
        </div>

        {/* Loading Indicator */}
        <div className="mt-24 space-y-6 flex flex-col items-center">
          {/* Progress Bar Container */}
          <div
            className={`w-56 h-[4px] rounded-full overflow-hidden relative ${isDark ? "bg-white/5" : "bg-emerald-950/5"}`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`h-full bg-gradient-to-r rounded-full relative ${isDark ? "from-emerald-600 to-emerald-400" : "from-emerald-500 to-emerald-300"}`}
            >
              <div
                className={`absolute top-0 right-0 h-full w-8 blur-sm ${isDark ? "bg-white/40" : "bg-white/60"}`}
              />
            </motion.div>
          </div>

          {/* Version / Status Label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-emerald-500/80" : "text-emerald-700/70"}`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? "bg-emerald-500" : "bg-emerald-600"}`}
            />
            {version ? `Version ${version}` : "Starting System..."}
          </motion.div>
        </div>
      </div>

      {/* Subtle Copyright Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isDark ? 0.3 : 0.4 }}
        transition={{ delay: 2 }}
        className={`absolute bottom-12 text-[10px] font-bold uppercase tracking-widest pointer-events-none ${isDark ? "text-white" : "text-slate-400"}`}
      >
        • Physiotherapy Excellence •
      </motion.div>
    </div>
  );
};

export default SplashScreen;
