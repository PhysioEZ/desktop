import React, { useRef, useState, useEffect } from "react";
import { Search, RefreshCw, Bell, Beaker, StickyNote } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeStore, useDashboardStore } from "../store";
import { format } from "date-fns";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  onRefresh?: () => void;
  isLoading?: boolean;
  refreshCooldown?: number;
  onShowIntelligence?: () => void;
  onShowNotes?: () => void;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle = "Operations Center",
  icon: Icon,
  onRefresh,
  isLoading = false,
  refreshCooldown = 0,
  onShowIntelligence,
  onShowNotes,
  children,
}) => {
  const { isDark } = useThemeStore();
  const { notifications, unreadCount, setShowGlobalSearch } =
    useDashboardStore();

  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`sticky top-0 z-[150] px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-4 transition-all duration-500 ${isDark ? "bg-[#0E110E]/80" : "bg-white/80"
        } backdrop-blur-xl border-b ${isDark
          ? "border-white/5 shadow-2xl shadow-black/40"
          : "border-gray-100 shadow-sm"
        }`}
    >
      {/* Title Area */}
      <div className="flex items-center gap-4">
        <div
          className={`p-2 rounded-xl ${isDark ? "bg-emerald-500/10 text-emerald-500" : "bg-emerald-50 text-emerald-600"}`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex flex-col">
          <h1
            className="text-lg sm:text-xl font-bold tracking-tight text-[#006e1c] dark:text-[#88d99d]"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {title}
          </h1>
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] opacity-40">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Centered Search Bar */}
      <div className="hidden md:block flex-1 max-w-xl mx-8">
        <div
          onClick={() => setShowGlobalSearch(true)}
          className={`group flex items-center gap-3 px-6 py-2.5 rounded-full shadow-lg shadow-black/[0.02] border transition-all cursor-pointer ${isDark
            ? "bg-white/5 border-white/10 hover:bg-white/10"
            : "bg-white border-gray-100 hover:border-emerald-500/30"
            }`}
        >
          <Search
            size={18}
            className="text-slate-300 group-hover:text-emerald-500 transition-colors"
          />
          <span className="text-sm font-medium text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 flex-1">
            Search anything...
          </span>
          <div
            className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-tighter ${isDark
              ? "border-white/10 text-white/40"
              : "border-black/5 text-black/20"
              }`}
          >
            <span className="mr-1">⌥</span>S
          </div>
        </div>
      </div>

      {/* Extra Actions Prop */}
      {children}

      {/* Utilities Area */}
      <div
        className={`flex items-center p-1 rounded-2xl shadow-lg shadow-black/[0.02] ${isDark
          ? "bg-white/5 border border-white/10"
          : "bg-white border border-gray-100"
          }`}
      >
        {onRefresh && (
          <>
            <button
              onClick={onRefresh}
              disabled={isLoading || refreshCooldown > 0}
              className={`p-2.5 rounded-xl text-slate-400 hover:text-emerald-500 transition-all hover:bg-black/5 dark:hover:bg-white/5 ${isLoading ? "animate-spin" : ""
                } ${refreshCooldown > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              title={
                refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : "Refresh"
              }
            >
              <RefreshCw size={19} />
            </button>
            <div className="w-[1px] h-4 bg-black/[0.03] dark:bg-white/10 mx-1" />
          </>
        )}

        {/* Notifications */}
        <div className="relative flex items-center" ref={notifRef}>
          <button
            onClick={() => setShowNotifPopup(!showNotifPopup)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-500 transition-all hover:bg-black/5 dark:hover:bg-white/5 relative"
            title="Notifications"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            )}
          </button>

          <AnimatePresence>
            {showNotifPopup && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute top-full right-0 mt-3 w-80 rounded-3xl border shadow-2xl z-[200] overflow-hidden ${isDark
                  ? "bg-[#121412] border-white/5"
                  : "bg-white border-gray-100"
                  }`}
              >
                <div className="p-4 border-b dark:border-white/5 border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest opacity-40">
                    Activity Center
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar p-2">
                  {notifications && notifications.length > 0 ? (
                    notifications.map((n: any) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl mb-1 last:mb-0 transition-all cursor-pointer ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                          }`}
                      >
                        <p className="text-xs font-bold leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[10px] opacity-40 mt-1 block font-medium">
                          {format(new Date(n.created_at), "h:mm a, d MMM")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center opacity-30">
                      <Bell size={32} className="mb-2" />
                      <p className="text-xs font-bold">All caught up!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {onShowIntelligence && (
          <>
            <div className="w-[1px] h-4 bg-black/[0.03] dark:bg-white/10 mx-1" />
            <button
              onClick={onShowIntelligence}
              className="p-2.5 rounded-xl text-slate-400 hover:text-[#6366f1] transition-all hover:bg-black/5 dark:hover:bg-white/5"
              title="Daily Intelligence"
            >
              <Beaker size={19} />
            </button>
          </>
        )}

        {onShowNotes && (
          <>
            <div className="w-[1px] h-4 bg-black/[0.03] dark:bg-white/10 mx-1" />
            <button
              onClick={onShowNotes}
              className="p-2.5 rounded-xl text-slate-400 hover:text-amber-500 transition-all hover:bg-black/5 dark:hover:bg-white/5"
              title="Notes"
            >
              <StickyNote size={19} />
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
