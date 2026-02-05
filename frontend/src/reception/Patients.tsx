import { useState, useEffect, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Phone,
  Stethoscope,
  CheckCircle2,
  Eye,
  Printer,
  Bell,
  Moon,
  Sun,
  Loader2,
  RefreshCw,
  User,
  LogOut,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { usePatientStore } from "../store/usePatientStore";
import { useDashboardStore } from "../store";
import { API_BASE_URL, authFetch, FILE_BASE_URL } from "../config";
import CustomSelect from "../components/ui/CustomSelect";
import PatientDetailsModal from "../components/patients/PatientDetailsModal";
import AttendanceModal from "../components/patients/modals/AttendanceModal";
import TokenPreviewModal from "../components/patients/modals/TokenPreviewModal";
import GlobalSearch from "../components/GlobalSearch";
import { toast } from "sonner";

// --- Extracted Components to avoid re-mounting on parent re-render ---

const Header = ({
  user,
  logout,
  onRefresh,
  toggleTheme,
  onOpenSearch,
}: any) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const notifRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Notifications logic localized here
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await authFetch(
          `${API_BASE_URL}/reception/notifications?employee_id=${user?.employee_id || ""}`,
        );
        const data = await res.json();
        if (data.success || data.status === "success") {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unread_count || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.employee_id) {
      fetchNotifs();
      const inv = setInterval(fetchNotifs, 30000);
      return () => clearInterval(inv);
    }
  }, [user?.employee_id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest("#notif-popup")
      )
        setShowNotifPopup(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfilePopup(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fdfcff]/80 dark:bg-[#111315]/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between border-b border-[#e0e2ec] dark:border-[#43474e] transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/reception/dashboard")}
        >
          <div className="w-10 h-10 rounded-xl bg-[#ccebc4] flex items-center justify-center text-[#0c200e] font-bold">
            PE
          </div>
          <h1
            className="text-2xl text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight hidden md:block"
            style={{ fontFamily: "serif" }}
          >
            PhysioEZ
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative z-50">
          <div
            className="flex items-center bg-[#e0e2ec] dark:bg-[#43474e] rounded-full px-4 py-2 w-64 lg:w-96 transition-colors duration-300 cursor-pointer hover:bg-[#dadae2] dark:hover:bg-[#50545c]"
            onClick={onOpenSearch}
          >
            <Search
              size={18}
              className="text-[#43474e] dark:text-[#c4c7c5] mr-2"
            />
            <span className="text-sm text-[#43474e] dark:text-[#8e918f]">
              Search patients... (Alt + S)
            </span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-3 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors"
        >
          <RefreshCw size={22} strokeWidth={1.5} />
        </button>

        <button
          onClick={toggleTheme}
          className="p-3 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors"
        >
          <Moon size={22} strokeWidth={1.5} className="block dark:hidden" />
          <Sun size={22} strokeWidth={1.5} className="hidden dark:block" />
        </button>

        <div className="relative">
          <button
            ref={notifRef}
            onClick={() => {
              setShowNotifPopup(!showNotifPopup);
              setShowProfilePopup(false);
            }}
            className="p-3 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors relative"
          >
            <Bell size={22} strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute top-3 right-3 w-2 h-2 bg-[#b3261e] rounded-full"></span>
            )}
          </button>
          <AnimatePresence>
            {showNotifPopup && (
              <motion.div
                id="notif-popup"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-full right-0 mt-2 w-80 bg-[#fdfcff] dark:bg-[#111315] rounded-[20px] shadow-xl border border-[#e0e2ec] dark:border-[#43474e] z-[60] overflow-hidden transition-colors"
              >
                <div className="p-4 border-b border-[#e0e2ec] dark:border-[#43474e] font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">
                  Notifications
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.notification_id}
                      className={`p-3 border-b border-[#e0e2ec] dark:border-[#43474e] hover:bg-[#e0e2ec]/50 dark:hover:bg-[#43474e]/50 ${n.is_read === 0 ? "bg-[#ccebc4]/20 dark:bg-[#ccebc4]/10" : ""}`}
                    >
                      <p className="text-sm text-[#1a1c1e] dark:text-[#e3e2e6]">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-[#43474e] dark:text-[#c4c7c5] mt-1">
                        {n.time_ago}
                      </p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-4 text-center text-sm text-[#43474e] dark:text-[#c4c7c5]">
                      No notifications
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={profileRef}>
          <div
            onClick={() => {
              setShowProfilePopup(!showProfilePopup);
              setShowNotifPopup(false);
            }}
            className="w-10 h-10 bg-[#ccebc4] dark:bg-[#0c3b10] rounded-full flex items-center justify-center text-[#0c200e] dark:text-[#ccebc4] font-bold border border-[#74777f] dark:border-[#8e918f] ml-1 overflow-hidden cursor-pointer hover:ring-2 ring-[#ccebc4] transition-colors"
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <AnimatePresence>
            {showProfilePopup && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-full right-0 mt-2 w-56 bg-[#fdfcff] dark:bg-[#111315] rounded-[20px] shadow-xl border border-[#e0e2ec] dark:border-[#43474e] z-[60] overflow-hidden p-2 transition-colors"
              >
                <button
                  onClick={() => navigate("/reception/profile")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] text-sm font-medium transition-colors"
                >
                  <User size={18} /> Profile
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#ffdad6] dark:hover:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] text-sm font-medium mt-1 transition-colors"
                >
                  <LogOut size={18} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

const NavChips = ({ currentPath }: { currentPath: string }) => {
  const navigate = useNavigate();
  const navItems = [
    { label: "Dashboard", path: "/reception/dashboard" },
    { label: "Schedule", path: "/reception/schedule" },
    { label: "Inquiry", path: "/reception/inquiry" },
    { label: "Registration", path: "/reception/registration" },
    { label: "Patients", path: "/reception/patients" },
    { label: "Billing", path: "/reception/billing" },
    { label: "Attendance", path: "/reception/attendance" },
    { label: "Tests", path: "/reception/tests" },
    { label: "Feedback", path: "/reception/feedback" },
    { label: "Reports", path: "/reception/reports" },
    { label: "Expenses", path: "/reception/expenses" },
    { label: "Support", path: "/reception/support" },
  ];

  return (
    <div className="fixed top-[72px] left-0 right-0 z-40 bg-[#fdfcff]/80 dark:bg-[#111315]/80 backdrop-blur-md border-b border-[#e0e2ec] dark:border-[#43474e] transition-colors duration-300">
      <div className="flex gap-3 overflow-x-auto py-3 px-6 scrollbar-hide">
        {navItems.map((nav) => (
          <button
            key={nav.label}
            onClick={() => {
              if (nav.path !== currentPath) navigate(nav.path);
            }}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${currentPath === nav.path ? "bg-[#1a1c1e] text-white dark:bg-[#e3e2e6] dark:text-[#1a1c1e] shadow-md" : "bg-[#f2f6fa] dark:bg-[#1a1c1e] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] border border-[#74777f] dark:border-[#8e918f] text-[#43474e] dark:text-[#c4c7c5]"}`}
          >
            {nav.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const Patients = () => {
  const { user, logout } = useAuthStore();

  // Store State
  const {
    patients,
    isLoading,
    pagination,
    filters,
    metaData,
    setFilters,
    setPage,
    fetchPatients,
    fetchMetaData,
    openPatientDetails,
  } = usePatientStore();
  const { searchCache, setSearchCache } = useDashboardStore();

  // Local UI State
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [showGlobalModal, setShowGlobalModal] = useState(false);

  // Modals State
  const [attendanceModal, setAttendanceModal] = useState<{
    open: boolean;
    patient: any | null;
  }>({ open: false, patient: null });
  const [tokenModal, setTokenModal] = useState<{
    open: boolean;
    patientId: number | null;
  }>({ open: false, patientId: null });

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    if (user?.branch_id) fetchMetaData(user.branch_id);
  }, [user?.branch_id]);

  // Fetch Patients on Filter/Page Change
  // Fetch Patients: Immediate on mount if empty, Debounced on filter change
  useEffect(() => {
    if (!user?.branch_id) return;

    const isFirstLoad = patients.length === 0;

    const runFetch = () => fetchPatients(user.branch_id);

    if (isFirstLoad) {
      runFetch();
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(runFetch, 300);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [pagination.page, filters, user?.branch_id]);

  // Theme & Click Outside Effects
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setIsDark(newDark);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
    }
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Search with Caching
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!user?.branch_id) {
      setSearchResults([]);
      return;
    }

    const query = globalSearchQuery.trim().toLowerCase();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    // Check cache
    if (searchCache[query]) {
      setSearchResults(searchCache[query]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authFetch(
          `${API_BASE_URL}/reception/search_patients?branch_id=${user.branch_id}&q=${encodeURIComponent(globalSearchQuery)}`,
        );
        const data = await res.json();
        if (data.success) {
          const results = data.results || [];
          setSearchResults(results);
          setSearchCache(query, results);
        }
      } catch (err) {
        console.error("Search Error:", err);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [globalSearchQuery, user?.branch_id]);

  const getStatusColors = (status: string) => {
    const s = status?.toLowerCase()?.trim();
    switch (s) {
      case "active":
        return "bg-[#ccebc4]/30 text-[#006e1c] dark:text-[#88d99d] border-[#ccebc4] dark:border-[#0c3b10]";
      case "completed":
        return "bg-[#f0f4f9] text-[#43474e] dark:text-[#c4c7c5] border-[#e0e2ec] dark:border-[#43474e]";
      case "inactive":
        return "bg-[#ffdad6]/30 text-[#93000a] dark:text-[#ffb4ab] border-[#ffdad6] dark:border-[#93000a]";
      default:
        return "bg-[#e0e2ec]/30 text-[#43474e] dark:text-[#c4c7c5] border-[#e0e2ec] dark:border-[#43474e]";
    }
  };

  const handleMarkAttendance = async (e: React.MouseEvent, patient: any) => {
    e.stopPropagation();

    const cost = parseFloat(patient.cost_per_day || "0");
    const balance = parseFloat(patient.effective_balance || "0");

    // Logic: If Balance is sufficient OR cost is 0, Auto Mark.
    if (Math.round(balance * 100) >= Math.round(cost * 100) || cost === 0) {
      const loadingToast = toast.loading("Marking attendance...");
      try {
        const res = await authFetch(`${API_BASE_URL}/reception/attendance`, {
          method: "POST",
          body: JSON.stringify({
            patient_id: patient.patient_id,
            payment_amount: "0",
            mode: "",
            remarks: "Auto: Debited from Balance",
            status: "present",
          }),
        });
        const data = await res.json();
        if (data.success || data.status === "success") {
          toast.success("Attendance marked successfully");
          fetchPatients(user!.branch_id);
        } else {
          toast.error(data.message || "Failed to mark attendance");
        }
      } catch (err) {
        toast.error("Error marking attendance");
      } finally {
        toast.dismiss(loadingToast);
      }
    } else {
      // Insufficient Balance -> Open Modal
      setAttendanceModal({ open: true, patient });
    }
  };

  const handlePrintToken = (e: React.MouseEvent, patientId: number) => {
    e.stopPropagation();
    setTokenModal({ open: true, patientId });
  };

  return (
    <div className="min-h-screen bg-[#fdfcff] dark:bg-[#111315] text-[#1a1c1e] dark:text-[#e3e2e6] font-sans transition-colors duration-300 pb-20">
      <Header
        user={user}
        logout={logout}
        onRefresh={() => fetchPatients(user!.branch_id)}
        toggleTheme={toggleTheme}
        onOpenSearch={() => setShowGlobalModal(true)}
      />
      <NavChips currentPath="/reception/patients" />

      <div className="max-w-[1600px] mx-auto p-6 pt-44">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1
              className="text-3xl font-black text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight mb-1"
              style={{ fontFamily: "serif" }}
            >
              Manage Patients
            </h1>
            <p className="text-[#43474e] dark:text-[#c4c7c5] font-medium text-sm">
              Overview of active cases and treatment tracking
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* New Today */}
            <div className="bg-[#e8def8] dark:bg-[#381e72] rounded-[24px] px-6 py-4 flex flex-col justify-between min-w-[160px] shadow-sm border border-transparent hover:border-[#6750a4]/20 transition-all">
              <p className="text-[11px] font-bold text-[#1d192b] dark:text-[#eaddff] uppercase tracking-[0.1em] mb-2 opacity-70">
                New Today
              </p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-[#1d192b] dark:text-[#eaddff] tracking-tight">
                  {metaData.counts?.new_today || 0}
                </p>
                <div className="w-8 h-8 rounded-full bg-[#1d192b]/5 dark:bg-white/10 flex items-center justify-center">
                  <User
                    size={16}
                    className="text-[#1d192b] dark:text-[#eaddff]"
                  />
                </div>
              </div>
            </div>

            {/* Active Patients */}
            <div className="bg-[#ccebc4] dark:bg-[#0c3b10] rounded-[24px] px-6 py-4 flex flex-col justify-between min-w-[160px] shadow-sm border border-transparent hover:border-[#006e1c]/20 transition-all">
              <p className="text-[11px] font-bold text-[#0c200e] dark:text-[#ccebc4] uppercase tracking-[0.1em] mb-2 opacity-70">
                Active Cases
              </p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-[#0c200e] dark:text-[#ccebc4] tracking-tight">
                  {metaData.counts?.active_count || 0}
                </p>
                <div className="w-8 h-8 rounded-full bg-[#0c200e]/5 dark:bg-white/10 flex items-center justify-center">
                  <Stethoscope
                    size={16}
                    className="text-[#0c200e] dark:text-[#ccebc4]"
                  />
                </div>
              </div>
            </div>

            {/* Inactive Patients */}
            <div className="bg-[#f2f0f4] dark:bg-[#2b2930] rounded-[24px] px-6 py-4 flex flex-col justify-between min-w-[160px] shadow-sm border border-[#e0e2ec] dark:border-[#43474e] hover:border-[#1a1c1e]/20 transition-all">
              <p className="text-[11px] font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-[0.1em] mb-2 opacity-70">
                Inactive
              </p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight">
                  {metaData.counts?.inactive_count || 0}
                </p>
                <div className="w-8 h-8 rounded-full bg-[#1a1c1e]/5 dark:bg-white/10 flex items-center justify-center">
                  <RefreshCw
                    size={16}
                    className="text-[#1a1c1e] dark:text-[#e3e2e6]"
                  />
                </div>
              </div>
            </div>

            {/* Terminated/Completed */}
            <div className="bg-[#ffdad6] dark:bg-[#93000a] rounded-[24px] px-6 py-4 flex flex-col justify-between min-w-[160px] shadow-sm border border-transparent hover:border-[#ba1a1a]/20 transition-all">
              <p className="text-[11px] font-bold text-[#410002] dark:text-[#ffdad6] uppercase tracking-[0.1em] mb-2 opacity-70">
                Completed
              </p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-[#410002] dark:text-[#ffdad6] tracking-tight">
                  {metaData.counts?.terminated_count || 0}
                </p>
                <div className="w-8 h-8 rounded-full bg-[#410002]/5 dark:bg-white/10 flex items-center justify-center">
                  <CheckCircle2
                    size={16}
                    className="text-[#410002] dark:text-[#ffdad6]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* M3 Search & Filter Controls */}
        <div className="flex flex-col gap-6 mb-8 bg-white dark:bg-[#111315] p-6 rounded-[32px] border border-[#e0e2ec] dark:border-[#43474e] shadow-sm">
          {/* Status Toggles (Exact Reference Match) */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-black text-[#74777f] dark:text-[#939099] uppercase tracking-[0.15em] shrink-0">
              Status:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: "All Patients", value: "" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
                { label: "Completed", value: "completed" },
                { label: "Stopped", value: "stopped" },
              ].map((chip) => {
                const isSelected = filters.status === chip.value;
                return (
                  <button
                    key={chip.label}
                    onClick={() => setFilters({ status: chip.value })}
                    className={`px-6 py-2.5 rounded-full text-[14px] font-bold transition-all flex items-center gap-2.5 shadow-sm border-none outline-none ${
                      isSelected
                        ? "bg-[#6750a4] text-white shadow-[#6750a4]/20"
                        : "bg-[#eaddff] text-[#21005d] hover:bg-[#d0bcff] transition-colors"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 flex items-center justify-center">
                        <CheckCircle2
                          size={12}
                          strokeWidth={3}
                          className="text-white"
                        />
                      </div>
                    )}
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-12 xl:col-span-5 relative group">
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-[#43474e] dark:text-[#c4c7c5]"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name, phone or ID..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className="w-full bg-[#f2f0f4] dark:bg-[#1f1f23] border border-transparent focus:border-[#6750a4] focus:bg-[#fdfcff] dark:focus:bg-[#111315] rounded-[28px] py-4 pl-14 pr-6 outline-none transition-all font-medium text-[#1a1c1e] dark:text-[#e3e2e6] shadow-inner group-hover:shadow-sm"
              />
            </div>

            {/* Other Select Filters */}
            <div className="lg:col-span-4 xl:col-span-3">
              <CustomSelect
                value={filters.doctor}
                onChange={(v) => setFilters({ doctor: v })}
                options={[
                  { label: "All Doctors", value: "" },
                  ...metaData.doctors.map((d) => ({ label: d, value: d })),
                ]}
                placeholder="Select Doctor"
                className="!rounded-[28px] !bg-[#f2f0f4] dark:!bg-[#1f1f23] !border-transparent !py-4"
              />
            </div>

            <div className="lg:col-span-4 xl:col-span-2">
              <CustomSelect
                value={filters.service_type}
                onChange={(v) => setFilters({ service_type: v })}
                options={[
                  { label: "Services", value: "" },
                  ...metaData.services.map((s) => ({ label: s, value: s })),
                ]}
                placeholder="Service"
                className="!rounded-[28px] !bg-[#f2f0f4] dark:!bg-[#1f1f23] !border-transparent !py-4"
              />
            </div>

            <div className="lg:col-span-4 xl:col-span-2">
              <CustomSelect
                value={filters.treatment}
                onChange={(v) => setFilters({ treatment: v })}
                options={[
                  { label: "Treatment", value: "" },
                  ...metaData.treatments.map((t) =>
                    typeof t === "string" ? { label: t, value: t } : t,
                  ),
                ]}
                placeholder="Type"
                className="!rounded-[28px] !bg-[#f2f0f4] dark:!bg-[#1f1f23] !border-transparent !py-4"
              />
            </div>
          </div>
        </div>

        {/* Filter info text */}
        <div className="flex items-center justify-between px-6 mb-6">
          <div className="flex items-center gap-2 text-sm text-[#43474e] dark:text-[#c4c7c5] font-medium">
            <span>Showing</span>
            <span className="text-[#1a1c1e] dark:text-[#e3e2e6] font-bold bg-[#e0e2ec] dark:bg-[#43474e] px-2 py-0.5 rounded-md">
              {pagination.total_records}
            </span>
            <span>patients</span>
            {(filters.search ||
              filters.status ||
              filters.doctor ||
              filters.service_type ||
              filters.treatment) && (
              <div className="flex items-center gap-1 border-l border-[#e0e2ec] dark:border-[#43474e] ml-2 pl-3">
                <span>filtered by</span>
                <div className="flex flex-wrap gap-1">
                  {filters.search && (
                    <span className="bg-[#ccebc4] dark:bg-[#0c3b10] text-[#0c200e] dark:text-[#ccebc4] px-2 py-0.5 rounded-full text-[11px] font-bold">
                      "{filters.search}"
                    </span>
                  )}
                  {filters.status && (
                    <span className="bg-[#e8def8] dark:bg-[#381e72] text-[#1d192b] dark:text-[#eaddff] px-2 py-0.5 rounded-full text-[11px] font-bold">
                      {filters.status}
                    </span>
                  )}
                  {filters.doctor && (
                    <span className="bg-[#fdfcff] dark:bg-[#2b2930] border border-[#e0e2ec] dark:border-[#43474e] px-2 py-0.5 rounded-full text-[11px] font-bold">
                      Dr. {filters.doctor}
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      status: "",
                      doctor: "",
                      service_type: "",
                      treatment: "",
                    })
                  }
                  className="text-[#b3261e] hover:underline text-xs font-bold underline-offset-2 transition-all ml-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
          <div className="text-[11px] font-black text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-widest opacity-50">
            PhysioEZ Reception Desk
          </div>
        </div>

        {/* Main Content Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-emerald-500 mb-4" size={48} />
            <p className="text-slate-500 font-bold animate-pulse">
              Syncing patient data...
            </p>
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-slate-50 dark:bg-[#111315] rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-lg flex items-center justify-center mb-6">
              <Search size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              No patients found
            </h3>
            <p className="text-slate-500 mt-2">
              Adjust your filters or try a different search
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {patients.map((patient, idx) => {
              const totalDays = patient.treatment_days || 1;
              const progress = Math.min(
                100,
                (patient.attendance_count / totalDays) * 100,
              );
              const balance = Number(patient.effective_balance || 0);
              const isPresent = patient.today_attendance === "present";
              const isPending = patient.today_attendance === "pending";
              const hasToken = patient.has_token_today;

              return (
                <motion.div
                  key={patient.patient_id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => openPatientDetails(patient)}
                  className="group bg-white dark:bg-[#1a1c1e] rounded-[32px] border border-[#e0e2ec] dark:border-[#43474e] p-6 hover:shadow-2xl hover:shadow-[#ccebc4]/20 transition-all cursor-pointer flex flex-col"
                >
                  {/* Card Top */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-[#ccebc4] dark:bg-[#0c3b10] flex items-center justify-center text-[#0c200e] dark:text-[#ccebc4] font-black text-2xl shadow-inner overflow-hidden border border-[#e0e2ec] dark:border-[#43474e]">
                        {patient.patient_photo_path ? (
                          <img
                            src={
                              patient.patient_photo_path.startsWith("http")
                                ? patient.patient_photo_path
                                : `${FILE_BASE_URL}/${patient.patient_photo_path.replace("admin/desktop/server/", "")}`
                            }
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          patient.patient_name?.charAt(0).toUpperCase() || "P"
                        )}
                      </div>
                      {isPresent && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white dark:border-[#111315] flex items-center justify-center">
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                      )}
                      {isPending && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full border-4 border-white dark:border-[#111315] flex items-center justify-center">
                          <Clock size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColors(patient.patient_status)}`}
                    >
                      {patient.patient_status}
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="mb-6">
                    <h3 className="font-extrabold text-xl text-slate-900 dark:text-white leading-tight mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {patient.patient_name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Phone size={12} /> {patient.patient_phone}
                      </p>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        ID: {patient.patient_uid}
                      </p>
                    </div>
                  </div>

                  {/* Treatment Summary */}
                  <div className="space-y-4 flex-1">
                    <div className="p-4 bg-slate-50 dark:bg-[#0b0c0d] rounded-2xl border border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Current Plan
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase">
                          {patient.treatment_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stethoscope size={14} className="text-emerald-500" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                          {patient.service_type || "General Consultation"}
                        </p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 pl-6">
                        Dr. {patient.assigned_doctor}
                      </p>
                    </div>

                    {/* Progressive Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                        <span className="text-slate-400">Progression</span>
                        <span className="text-slate-900 dark:text-slate-200">
                          {patient.attendance_count} / {patient.treatment_days}{" "}
                          sessions
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Footer */}
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                        Balance
                      </p>
                      <p
                        className={`text-lg font-black leading-none ${balance < 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}
                      >
                        ₹{Math.abs(balance).toLocaleString()}
                        <span className="text-[10px] ml-1">
                          {balance < 0 ? "DUE" : ""}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handlePrintToken(e, patient.patient_id)}
                        disabled={!isPresent || !!hasToken}
                        className={`p-3 rounded-2xl transition-all ${
                          hasToken
                            ? "bg-amber-50 text-amber-600 border border-amber-100 opacity-50 cursor-not-allowed"
                            : !isPresent
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50"
                              : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 hover:bg-emerald-600 hover:text-white border border-transparent"
                        }`}
                        title={
                          !isPresent
                            ? "Mark attendance first"
                            : hasToken
                              ? "Token already printed"
                              : "Print Token"
                        }
                      >
                        <Printer size={18} />
                      </button>
                      <button
                        onClick={(e) => handleMarkAttendance(e, patient)}
                        disabled={isPresent || isPending}
                        className={`p-3 rounded-2xl transition-all ${
                          isPresent
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100 opacity-50"
                            : isPending
                              ? "bg-amber-50 text-amber-600 border border-amber-200 opacity-100 cursor-not-allowed"
                              : "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent"
                        }`}
                        title={
                          isPending
                            ? "Attendance Pending Approval"
                            : "Mark Attendance"
                        }
                      >
                        {isPending ? (
                          <Clock size={18} />
                        ) : (
                          <CheckCircle2 size={18} />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPatientDetails(patient);
                        }}
                        className="p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl hover:scale-105 transition-all shadow-lg"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination (Floating) */}
        {!isLoading && patients.length > 0 && pagination.total_pages > 1 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1c1e] dark:bg-[#e3e2e6] text-white dark:text-[#1a1c1e] px-4 py-2 rounded-full shadow-2xl z-30 flex items-center gap-4">
            <button
              onClick={() => setPage(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="p-1 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-xs font-bold tracking-widest">
              {pagination.page} / {pagination.total_pages}
            </span>
            <button
              onClick={() =>
                setPage(Math.min(pagination.total_pages, pagination.page + 1))
              }
              disabled={pagination.page === pagination.total_pages}
              className="p-1 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Modals Bridge */}
      <PatientDetailsModal />
      <AttendanceModal
        isOpen={attendanceModal.open}
        onClose={() => setAttendanceModal({ open: false, patient: null })}
        patient={attendanceModal.patient}
        onSuccess={() => fetchPatients(user!.branch_id)}
      />
      <TokenPreviewModal
        isOpen={tokenModal.open}
        onClose={() => setTokenModal({ open: false, patientId: null })}
        patientId={tokenModal.patientId}
      />
      <GlobalSearch
        isOpen={showGlobalModal}
        onClose={() => setShowGlobalModal(false)}
        searchQuery={globalSearchQuery}
        setSearchQuery={setGlobalSearchQuery}
        searchResults={searchResults}
      />
    </div>
  );
};

export default Patients;
