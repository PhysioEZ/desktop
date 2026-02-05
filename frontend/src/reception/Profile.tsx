import { useState, useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { useDashboardStore } from "../store/useDashboardStore";
import { API_BASE_URL, authFetch } from "../config";
import { motion } from "framer-motion";
import {
  Settings,
  Building,
  Mail,
  MapPin,
  Shield,
  Loader2,
  PhoneCall,
  CalendarCheck,
  LayoutGrid,
  Lock,
  ExternalLink,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import ChatModal from "../components/Chat/ChatModal";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import RequestPasswordChangeModal from "../components/RequestPasswordChangeModal";

interface ProfileData {
  employee_id: number;
  first_name: string;
  last_name: string;
  job_title: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  date_of_joining: string;
  is_active: number;
  photo_path: string | null;
  email: string;
  role: string;
  branch_name: string;
  clinic_name: string;
  phone_primary: string;
  branch_email: string;
  address_line_1: string;
  city: string;
}

export default function Profile() {
  const { isDark } = useThemeStore();
  const { profileData, setProfileData } = useDashboardStore();

  const [loading, setLoading] = useState(!profileData);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [passwordRequestStatus, setPasswordRequestStatus] = useState<'idle' | 'pending'>('idle');

  const handleSubmitPasswordRequest = (reason: string) => {
    // In a real app, we would send this to the backend
    console.log("Password change requested for reason:", reason);
    setPasswordRequestStatus('pending');
    setShowPasswordChangeModal(false);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (profileData) return; // Use cache if available

      try {
        const res = await authFetch(`${API_BASE_URL}/reception/profile`);
        const result = await res.json();
        if (result.status === "success") {
          setProfileData(result.data as ProfileData);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [profileData, setProfileData]);

  const leftPanelEntrance = {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 },
    },
  } as any;

  const mainContentEntrance = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 },
    },
  } as any;

  const getInitials = (name: string) => {
    const names = name.split(" ");
    if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase();
    return name[0]?.toUpperCase() || "U";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr || dateStr === "Not Set") return "Not Set";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Not Set";
    }
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center h-screen ${isDark ? "bg-[#050505]" : "bg-[#f2f4f8]"}`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? "bg-[#050505] text-[#E2E8F0]" : "bg-[#FAFAFA] text-[#1A1A1A]"}`}
    >
      <Sidebar
        onShowChat={() => setShowChatModal(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      {/* === LEFT PANEL (Identity & Greeting) === */}
      <motion.div
        variants={leftPanelEntrance}
        initial="hidden"
        animate="visible"
        className={`hidden xl:flex w-[400px] flex-col justify-between p-10 border-r relative shrink-0 transition-colors duration-300 z-50 ${isDark ? "bg-[#0A0A0A] border-[#151515]" : "bg-white border-gray-200"
          }`}
      >
        <div className="space-y-10 z-10">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded flex items-center justify-center text-[#4ADE80] ${isDark ? "bg-[#1C1C1C]" : "bg-green-50"}`}
            >
              <LayoutGrid size={18} />
            </div>
            <span className="font-bold tracking-widest text-xs uppercase text-gray-400">
              PhysioEZ Core
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-serif font-normal tracking-tight leading-tight text-[#1a1c1e] dark:text-[#e3e2e6]">
              User{" "}
              <span
                className={`italic ${isDark ? "text-[#4ADE80]" : "text-[#16a34a]"}`}
              >
                Profile
              </span>
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs font-medium">
              Official employment records and system access configuration.
            </p>
          </div>

          {/* Identity Card */}
          <div
            className={`rounded-[32px] p-8 border ${isDark
                ? "bg-white/[0.02] border-white/5 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.5)]"
                : "bg-gray-50/50 border-gray-100 shadow-xl shadow-gray-200/50"
              }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-[32px] bg-emerald-500/10 flex items-center justify-center text-[#16a34a] dark:text-[#4ADE80] font-black text-3xl border border-emerald-500/10 shadow-inner overflow-hidden mb-6">
                {profileData?.photo_path ? (
                  <img
                    src={profileData.photo_path}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        `<span>${getInitials(
                          `${profileData?.first_name} ${profileData?.last_name}`,
                        )}</span>`;
                    }}
                  />
                ) : (
                  getInitials(
                    `${profileData?.first_name} ${profileData?.last_name}`,
                  )
                )}
              </div>
              <h2
                className={`text-xl font-black tracking-tight mb-1 ${isDark ? "text-white" : "text-[#1a1c1e]"}`}
              >
                {profileData?.first_name} {profileData?.last_name}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/80 mb-6">
                {profileData?.role}
              </p>

              <div className="w-full space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-gray-400 uppercase tracking-widest">
                    Employee ID
                  </span>
                  <span className={isDark ? "text-white" : "text-gray-900"}>
                    {profileData?.employee_id}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-gray-400 uppercase tracking-widest">
                    Status
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-emerald-500">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info or decorative element */}
        <div className="z-10 bg-emerald-500/5 p-6 rounded-[24px] border border-emerald-500/10">
          <p className="text-[10px] font-black uppercase text-emerald-500/80 mb-2">
            Access Level
          </p>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-500" />
            <span className="text-xs font-bold whitespace-nowrap">
              Standard Enterprise Access
            </span>
          </div>
        </div>
      </motion.div>

      {/* === MAIN CONTENT (Details Area) === */}
      <main className="flex-1 h-screen overflow-y-auto relative p-10 md:p-14 lg:p-20">
        <motion.div
          variants={mainContentEntrance}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto space-y-16"
        >
          {/* Section 1: Personal Profile */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? "bg-white/5 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}
                >
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight mb-1">
                    Personal Details
                  </h3>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                    Biological & Residential Records
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 p-10 rounded-[40px] border ${isDark ? "bg-white/[0.01] border-white/5 shadow-2xl shadow-black/40" : "bg-white border-gray-100 shadow-xl shadow-gray-200/20"}`}
            >
              <div className="group">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#16a34a] mb-2 opacity-60">
                  Full Name
                </p>
                <p className="text-lg font-bold">
                  {profileData?.first_name} {profileData?.last_name}
                </p>
              </div>
              <div className="group">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#16a34a] mb-2 opacity-60">
                  Professional Designation
                </p>
                <p className="text-lg font-bold">{profileData?.job_title}</p>
              </div>
              <div className="group">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#16a34a] mb-2 opacity-60">
                  Contact Number
                </p>
                <div className="flex items-center gap-2">
                  <PhoneCall size={16} className="text-gray-400" />
                  <p className="text-lg font-bold tabular-nums">
                    {profileData?.phone_number}
                  </p>
                </div>
              </div>
              <div className="group">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#16a34a] mb-2 opacity-60">
                  Date of Birth
                </p>
                <p className="text-lg font-bold tabular-nums text-gray-500">
                  {formatDate(profileData?.date_of_birth || null)}
                </p>
              </div>
              <div className="md:col-span-2 group">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#16a34a] mb-2 opacity-60 text-center md:text-left">
                  Home Address
                </p>
                <div className="flex items-start gap-2 justify-center md:justify-start">
                  <MapPin size={18} className="text-gray-400 mt-1 shrink-0" />
                  <p className="text-lg font-bold max-w-lg leading-snug">
                    {profileData?.address || "No residential record found."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Deployment & Security Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Deployment Card */}
            <div
              className={`rounded-[40px] p-10 border overflow-hidden relative ${isDark ? "bg-white/[0.01] border-white/5 shadow-2xl" : "bg-white border-gray-100 shadow-xl shadow-gray-200/20"}`}
            >
              <div className="flex items-center gap-4 mb-10 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
                  <Building size={20} />
                </div>
                <h4 className="text-xl font-black tracking-tight">
                  Deployment
                </h4>
              </div>

              <div className="space-y-6 relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#16a34a] mb-1 opacity-60">
                    Primary Branch
                  </p>
                  <p className="text-base font-bold">
                    {profileData?.branch_name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#16a34a] mb-1 opacity-60">
                    Associated Institute
                  </p>
                  <p className="text-base font-bold">
                    {profileData?.clinic_name}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#16a34a] mb-1 opacity-60">
                    Official Support
                  </p>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    <p className="text-sm font-bold text-gray-500">
                      {profileData?.branch_email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full translate-x-1/4 -translate-y-1/4"></div>
            </div>

            {/* Security & Password Card */}
            <div
              className={`rounded-[32px] p-10 flex flex-col justify-between border ${isDark ? "bg-indigo-500/[0.02] border-indigo-500/10" : "bg-indigo-50/20 border-indigo-100"}`}
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Lock size={20} />
                  </div>
                  <h4 className="text-xl font-black tracking-tight">
                    Security Center
                  </h4>
                </div>

                <div
                  className={`p-6 rounded-3xl border ${isDark ? "bg-black/20 border-white/5" : "bg-white border-indigo-100/50"}`}
                >
                  <p className="text-xs font-bold text-gray-400 mb-3 leading-relaxed">
                    System security policy restricts manual password changes for
                    your role level.
                  </p>
                  <div className="bg-indigo-500/5 p-4 rounded-2xl flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase text-indigo-500 tracking-tighter">
                      Identity: {profileData?.email}
                    </p>
                    <Shield size={14} className="text-indigo-500/40" />
                  </div>
                  <button
                    onClick={() => passwordRequestStatus === 'idle' && setShowPasswordChangeModal(true)}
                    disabled={passwordRequestStatus === 'pending'}
                    className={`w-full py-4 rounded-2xl ${passwordRequestStatus === 'pending' ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'} text-white font-black text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-colors`}
                  >
                    {passwordRequestStatus === 'pending' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Request Pending
                      </>
                    ) : (
                      <>
                        <ExternalLink size={16} />
                        Request Password Change
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-6 flex items-center gap-4 grayscale opacity-40">
                <CalendarCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                  Employee Since{" "}
                  {formatDate(profileData?.date_of_joining || null)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* === MODALS === */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        onToggle={() => setShowShortcuts(!showShortcuts)}
        shortcuts={[]}
      />
      <RequestPasswordChangeModal
        isOpen={showPasswordChangeModal}
        onClose={() => setShowPasswordChangeModal(false)}
        onSubmit={handleSubmitPasswordRequest}
      />
    </div>
  );
}
