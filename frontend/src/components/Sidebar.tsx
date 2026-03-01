import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useUIStore } from "../store/useUIStore";
import {
  LayoutGrid,
  Calendar,
  Phone,
  Users,
  UserPlus,
  Banknote,
  TestTube2,
  MessageSquare,
  FileText,
  // PieChart,
  LifeBuoy,
  MessageCircle,
  Sun,
  Moon,
  Keyboard,
  User,
  LogOut,
  // Activity,
  CalendarCheck,
  Wallet,
  Settings as SettingsIcon,
} from "lucide-react";

import pack from "../../package.json";

const APP_VERSION = pack.version;

interface SidebarProps {
  onShowChat?: () => void;
  onShowShortcuts?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onShowChat, onShowShortcuts }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { hasDashboardAnimated } = useUIStore();

  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const sidebarEntrance = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  } as any;

  const navLinks = [
    {
      icon: LayoutGrid,
      label: "Dashboard",
      desc: "Overview & Stats",
      path: "/reception/dashboard",
    },
    {
      icon: Calendar,
      label: "Appointments",
      desc: "Appmts & Queue",
      path: "/reception/schedule",
    },
    {
      icon: Phone,
      label: "Inquiry",
      desc: "New Leads",
      path: "/reception/inquiry",
    },
    {
      icon: UserPlus,
      label: "Registration",
      desc: "New Patient",
      path: "/reception/registration",
    },
    {
      icon: Users,
      label: "Patients",
      desc: "All Records",
      path: "/reception/patients",
    },
    {
      icon: Banknote,
      label: "Billing",
      desc: "Invoices & Dues",
      path: "/reception/billing",
    },
    {
      icon: CalendarCheck,
      label: "Attendance",
      desc: "Daily Track",
      path: "/reception/attendance",
    },
    {
      icon: TestTube2,
      label: "Tests",
      desc: "Lab Orders",
      path: "/reception/tests",
    },
    {
      icon: MessageSquare,
      label: "Feedback",
      desc: "Patient Reviews",
      path: "/reception/feedback",
    },
    {
      icon: FileText,
      label: "Reports",
      desc: "Analytics",
      path: "/reception/reports",
    },
    // {
    //   icon: Activity,
    //   label: "Ops Analytics",
    //   desc: "Reception Insights",
    //   path: "/reception/reception-analytics",
    // },
    {
      icon: Wallet,
      label: "Expenses",
      desc: "Clinic Exp",
      path: "/reception/expenses",
    },
    {
      icon: LifeBuoy,
      label: "Support",
      desc: "Help & Docs",
      path: "/reception/support",
    },
    {
      icon: SettingsIcon,
      label: "Settings",
      desc: "Sync & Config",
      path: "/reception/settings",
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <motion.div
      variants={sidebarEntrance}
      initial={hasDashboardAnimated ? "visible" : "hidden"}
      animate="visible"
      className={`w-20 hidden md:flex flex-col items-center py-8 border-r z-[60] shrink-0 gap-6 transition-colors duration-300 ${
        isDark
          ? "bg-[#0A0A0A] border-[#151515]"
          : "bg-white border-gray-200 shadow-xl"
      }`}
    >
      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
        PE
      </div>

      <div className="flex flex-col gap-4 mt-6 w-full px-5">
        {navLinks.map((link, idx) => {
          const isActive = location.pathname === link.path;
          return (
            <div
              key={idx}
              className={`group flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 relative cursor-pointer ${
                isActive
                  ? isDark
                    ? "bg-[#1C1C1C] text-white shadow-inner"
                    : "bg-emerald-50 text-emerald-600 shadow-inner"
                  : isDark
                    ? "text-[#444] hover:bg-[#1C1C1C] hover:text-white"
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <button
                onClick={() => navigate(link.path)}
                className="w-full h-full flex items-center justify-center"
              >
                <link.icon size={16} strokeWidth={2} />
              </button>

              {/* Hover Tooltip */}
              <div
                className={`absolute left-16 top-1/2 -translate-y-1/2 rounded-lg p-3 w-32 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity ml-2 z-[60] border ${
                  isDark
                    ? "bg-[#1A1A1A] border-[#2A2A2A]"
                    : "bg-white border-gray-200"
                }`}
              >
                <div
                  className={`text-xs font-bold mb-0.5 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {link.label}
                </div>
                <div
                  className={`text-[10px] font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                  {link.desc}
                </div>
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 border-l border-b rotate-45 ${
                    isDark
                      ? "bg-[#1A1A1A] border-[#2A2A2A]"
                      : "bg-white border-gray-200"
                  }`}
                ></div>
              </div>

              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#4ADE80] rounded-r-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* Chat & Profile Actions - Pushed to Bottom */}
      <div className="mt-auto flex flex-col items-center gap-4 mb-4">
        {/* Chat Button */}
        <div className="relative group">
          <button
            onClick={onShowChat}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isDark
                ? "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            }`}
          >
            <MessageCircle size={16} strokeWidth={2.5} />
          </button>
          {/* Tooltip */}
          <div
            className={`absolute left-14 top-1/2 -translate-y-1/2 rounded-lg p-3 w-28 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity ml-2 z-[60] border ${
              isDark
                ? "bg-[#1A1A1A] border-[#2A2A2A]"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Messenger
            </div>
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 border-l border-b rotate-45 ${
                isDark
                  ? "bg-[#1A1A1A] border-[#2A2A2A]"
                  : "bg-white border-gray-200"
              }`}
            ></div>
          </div>
        </div>

        {/* Profile Button */}
        <div
          className="relative group"
          onClick={() => setShowProfilePopup(!showProfilePopup)}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border-2 ${
              isDark
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-emerald-50 border-emerald-100 text-emerald-600"
            }`}
          >
            <Users size={18} strokeWidth={2.5} />
          </div>
          {/* Tooltip */}
          <div
            className={`absolute left-14 top-1/2 -translate-y-1/2 rounded-lg p-3 w-28 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity ml-2 z-[60] border ${
              isDark
                ? "bg-[#1A1A1A] border-[#2A2A2A]"
                : "bg-white border-gray-200"
            }`}
          >
            <div
              className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              My Profile
            </div>
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 border-l border-b rotate-45 ${
                isDark
                  ? "bg-[#1A1A1A] border-[#2A2A2A]"
                  : "bg-white border-gray-200"
              }`}
            ></div>
          </div>
          <AnimatePresence>
            {showProfilePopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15, x: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15, x: -10 }}
                className="absolute bottom-0 left-full ml-6 w-80 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-3xl rounded-[32px] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-white/5 z-[100] overflow-hidden"
              >
                {/* User Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01]">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[22px] bg-emerald-500/10 flex items-center justify-center text-[#16a34a] dark:text-[#4ADE80] font-black text-2xl border border-emerald-500/10 shadow-inner">
                      {user?.name?.charAt(0).toUpperCase() || "S"}
                    </div>
                    <div className="overflow-hidden">
                      <p
                        className={`text-lg font-black tracking-tight leading-none mb-1.5 ${isDark ? "text-white" : "text-[#1a1c1e]"}`}
                      >
                        {user?.name || "User"}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        {user?.role || "RECEPTION"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Settings & Utilities */}
                <div className="p-2 border-b border-gray-100 dark:border-white/5">
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] text-sm font-medium transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isDark ? <Sun size={18} /> : <Moon size={18} />}
                      <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                    </div>
                    <span className="text-[10px] opacity-30 font-black uppercase">
                      Alt + W
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      onShowShortcuts?.();
                      setShowProfilePopup(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] text-sm font-medium mt-1 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Keyboard size={18} />
                      <span>Shortcuts</span>
                    </div>
                    <span className="text-[10px] opacity-30 font-black uppercase">
                      Alt + /
                    </span>
                  </button>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <button
                    onClick={() => navigate("/reception/profile")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] text-sm font-medium transition-colors"
                  >
                    <User size={18} /> Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#ffdad6] dark:hover:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] text-sm font-medium mt-1 transition-colors"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </div>

                {/* Version Footer */}
                <div className="px-6 py-4 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] opacity-40">
                    Build System
                  </span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const vStr = APP_VERSION.toLowerCase();
                      const isAlpha = vStr.includes("a");
                      const isBeta = vStr.includes("b");

                      return (
                        <>
                          <span
                            className={`text-[8px] font-black px-1.5 py-0.5 rounded-[6px] uppercase tracking-widest ${
                              isAlpha
                                ? "bg-amber-500/10 text-amber-500"
                                : isBeta
                                  ? "bg-blue-500/10 text-blue-500"
                                  : "bg-emerald-500/10 text-emerald-500"
                            }`}
                          >
                            {isAlpha ? "Alpha" : isBeta ? "Beta" : "Stable"}
                          </span>
                          <span className="text-[13px] font-black text-slate-500 dark:text-slate-400 tabular-nums">
                            v{APP_VERSION}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
