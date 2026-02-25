import { useState, useEffect, useCallback, useRef } from "react";
import { toast as sonnerToast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  History as HistoryIcon,
  UserPlus,
  X,
  Edit2,
  ClipboardList,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Phone,
  LayoutGrid,
  Beaker,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAuthStore,
  useDashboardStore,
  useThemeStore,
  useInquiryStore,
} from "../store";
import { API_BASE_URL, authFetch } from "../config";
import { format, parseISO, isToday } from "date-fns";
import KeyboardShortcuts, {
  type ShortcutItem,
} from "../components/KeyboardShortcuts";
import Sidebar from "../components/Sidebar";
import NotesDrawer from "../components/NotesDrawer";
import DailyIntelligence from "../components/DailyIntelligence";
import LogoutConfirmation from "../components/LogoutConfirmation";
import ChatModal from "../components/Chat/ChatModal";
import ActionFAB from "../components/ActionFAB";
import PageHeader from "../components/PageHeader";

type InquiryType = "consultation" | "test";

const DatePicker = ({ value, onChange, onClose }: any) => {
  const [currDate, setCurrDate] = useState(
    value ? new Date(value) : new Date(),
  );
  const [selected, setSelected] = useState(
    value ? new Date(value) : new Date(),
  );

  const getDays = () => {
    const y = currDate.getFullYear(),
      m = currDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(y, m, i));
    return days;
  };

  const handleDateClick = (date: Date) => {
    const offsetDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000,
    );
    setSelected(offsetDate);
  };

  const confirm = () => {
    onChange(selected.toISOString().split("T")[0]);
    onClose();
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10005] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#ece6f0] dark:bg-[#2b2930] w-[320px] rounded-[28px] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="bg-[#ece6f0] dark:bg-[#2b2930] px-6 pt-4 pb-3 border-b border-[#79747e]/10">
          <p className="text-[#49454f] dark:text-[#cac4d0] text-xs font-medium uppercase tracking-wide">
            Select date
          </p>
          <div className="flex justify-between items-center mt-1">
            <h2 className="text-3xl font-normal text-[#1d1b20] dark:text-[#e6e1e5]">
              {selected.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </h2>
            <button className="text-[#49454f] dark:text-[#cac4d0] p-1 hover:bg-[#1d1b20]/10 rounded-full transition-colors">
              <Edit2 size={18} />
            </button>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-1 text-[#49454f] dark:text-[#cac4d0] font-bold text-sm">
              {months[currDate.getMonth()]} {currDate.getFullYear()}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  setCurrDate(
                    new Date(
                      currDate.getFullYear(),
                      currDate.getMonth() - 1,
                      1,
                    ),
                  )
                }
                className="w-8 h-8 flex items-center justify-center hover:bg-[#1d1b20]/10 rounded-full text-[#49454f] dark:text-[#cac4d0]"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() =>
                  setCurrDate(
                    new Date(
                      currDate.getFullYear(),
                      currDate.getMonth() + 1,
                      1,
                    ),
                  )
                }
                className="w-8 h-8 flex items-center justify-center hover:bg-[#1d1b20]/10 rounded-full text-[#49454f] dark:text-[#cac4d0]"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center mb-2">
            {weekDays.map((d, i) => (
              <span
                key={i}
                className="text-xs font-medium text-[#49454f] dark:text-[#cac4d0] w-8 h-8 flex items-center justify-center"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {getDays().map((d, i) => (
              <div key={i} className="flex justify-center">
                {d ? (
                  <button
                    onClick={() => handleDateClick(d)}
                    className={`w-9 h-9 text-sm rounded-full flex items-center justify-center transition-colors ${
                      selected.toDateString() === d.toDateString()
                        ? "bg-[#6750a4] dark:bg-[#d0bcff] text-white dark:text-[#381e72]"
                        : d.toDateString() === new Date().toDateString()
                          ? "border border-[#6750a4] text-[#6750a4] dark:border-[#d0bcff] dark:text-[#d0bcff]"
                          : "text-[#1d1b20] dark:text-[#e6e1e5] hover:bg-[#1d1b20]/10 dark:hover:bg-[#e6e1e5]/10"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                ) : (
                  <div className="w-9 h-9" />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 p-3 pt-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full"
          >
            OK
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Inquiry = () => {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  // Global Store States
  const { setShowGlobalSearch } = useDashboardStore();
  const {
    consultations,
    diagnostics,
    followUpLogs,
    setConsultations,
    setDiagnostics,
    setFollowUpLogs,
  } = useInquiryStore();

  // Local State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState<InquiryType>("consultation");
  const [isLoading, setIsLoading] = useState(true);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // UI States
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  // Stats Data
  const [monthlyStats, setMonthlyStats] = useState({
    consultation: { total: 0, visited: 0 },
    test: { total: 0, visited: 0 },
  });

  // Refs
  const localSearchInputRef = useRef<HTMLInputElement>(null);

  // Menu & Modal State
  const [menuState, setMenuState] = useState<{
    x: number;
    y: number;
    width: number;
    options: { label: string; value: string }[];
    onSelect: (val: string) => void;
    activeValue: string;
  } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    id: number | null;
  }>({ show: false, id: null });
  const [followUpModal, setFollowUpModal] = useState<{
    show: boolean;
    inquiry: any | null;
  }>({ show: false, inquiry: null });
  const [followUpLogsLocal, setFollowUpLogsLocal] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [isSavingLog, setIsSavingLog] = useState(false);

  const handleFABAction = (action: any) => {
    navigate("/reception/dashboard", { state: { openModal: action } });
  };

  const pageShortcuts: ShortcutItem[] = [
    // General
    {
      keys: ["Alt", "/"],
      description: "Keyboard Shortcuts",
      group: "General",
      action: () => setShowShortcuts((prev) => !prev),
    },
    {
      keys: ["Alt", "S"],
      description: "Quick Search",
      group: "General",
      action: () => setShowGlobalSearch(true),
    },
    {
      keys: ["Alt", "C"],
      description: "Toggle Chat",
      group: "General",
      action: () => setShowChatModal((prev) => !prev),
    },

    // Inquiry Specific
    {
      keys: ["Alt", "X"],
      description: "Consultation Tab",
      group: "Inquiry",
      action: () => setActiveTab("consultation"),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "T"],
      description: "Diagnostic Tab",
      group: "Inquiry",
      action: () => setActiveTab("test"),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "F"],
      description: "Focus Filter",
      group: "Inquiry",
      action: () => localSearchInputRef.current?.focus(),
      pageSpecific: true,
    },

    // Modals (Global but available via FAB action)
    {
      keys: ["Alt", "R"],
      description: "New Registration",
      group: "Modals",
      action: () => handleFABAction("registration"),
    },
    {
      keys: ["Alt", "I"],
      description: "New Inquiry",
      group: "Modals",
      action: () => handleFABAction("inquiry"),
    },
    {
      keys: ["Alt", "E"],
      description: "Branch Notes",
      group: "Modals",
      action: () => setShowNotes((prev) => !prev),
    },
    {
      keys: ["Alt", "Shift", "E"],
      description: "Quick Note",
      group: "Modals",
      action: () => setShowNotes(true),
    },

    // Actions
    {
      keys: ["Alt", "W"],
      description: "Toggle Theme",
      group: "Actions",
      action: toggleTheme,
    },
    {
      keys: ["Alt", "L"],
      description: "Logout",
      group: "Actions",
      action: () => setShowLogoutConfirm(true),
    },
    {
      keys: ["Ctrl", "R"],
      description: "Refresh Page",
      group: "Actions",
      action: () => handleRefresh(),
    },
    {
      keys: ["Alt", "Shift", "R"],
      description: "Refresh List",
      group: "Actions",
      action: () => handleRefresh(),
      pageSpecific: true,
    },

    // Navigation
    {
      keys: ["Alt", "1"],
      description: "Dashboard",
      group: "Navigation",
      action: () => navigate("/reception/dashboard"),
    },
    {
      keys: ["Alt", "2"],
      description: "Schedule",
      group: "Navigation",
      action: () => navigate("/reception/schedule"),
    },
    {
      keys: ["Alt", "3"],
      description: "Inquiry List",
      group: "Navigation",
      action: () => navigate("/reception/inquiry"),
    },
    {
      keys: ["Alt", "4"],
      description: "Registration List",
      group: "Navigation",
      action: () => navigate("/reception/registration"),
    },
    {
      keys: ["Alt", "5"],
      description: "Patients List",
      group: "Navigation",
      action: () => navigate("/reception/patients"),
    },
  ];

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRefresh = async () => {
    if (refreshCooldown > 0) return;

    const promise = fetchInquiries(true);
    sonnerToast.promise(promise, {
      loading: "Refreshing inquiries...",
      success: "Inquiries updated",
      error: "Failed to refresh",
    });

    setRefreshCooldown(20);
  };

  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(
        () => setRefreshCooldown((prev) => prev - 1),
        1000,
      );
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  const fetchInquiries = useCallback(
    async (force = false) => {
      if (!user?.branch_id) return;

      // Check cache first
      if (!force) {
        const { consultations, diagnostics } = useInquiryStore.getState();
        if (activeTab === "consultation" && consultations) {
          updateMonthlyStats(consultations, "consultation");
          setIsLoading(false);
          return;
        }
        if (activeTab === "test" && diagnostics) {
          updateMonthlyStats(diagnostics, "test");
          setIsLoading(false);
          return;
        }
      }

      const currentData =
        activeTab === "consultation"
          ? useInquiryStore.getState().consultations
          : useInquiryStore.getState().diagnostics;
      if (!currentData) {
        setIsLoading(true);
      }
      try {
        const res = await authFetch(`${API_BASE_URL}/reception/inquiry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "fetch",
            branch_id: user.branch_id,
            type: activeTab,
          }),
        });
        const data = await res.json();
        if (data.status === "success") {
          if (activeTab === "consultation") setConsultations(data.data);
          else setDiagnostics(data.data);
          updateMonthlyStats(data.data, activeTab);
        }
      } catch (err) {
        showToast("Failed to load inquiries", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [user?.branch_id, activeTab, setConsultations, setDiagnostics],
  );

  const updateMonthlyStats = (data: any[], type: string) => {
    const total = data.length;
    const visited = data.filter((i) => i.status === "visited").length;
    setMonthlyStats((prev) => ({
      ...prev,
      [type]: { total, visited },
    }));
  };

  useEffect(() => {
    fetchInquiries(true);
  }, [fetchInquiries]);

  const inquiries =
    activeTab === "consultation" ? consultations || [] : diagnostics || [];

  const filteredInquiries = inquiries.filter((inq: any) => {
    const q = localSearchQuery.toLowerCase();
    const matchesSearch =
      inq.name?.toLowerCase().includes(q) ||
      inq.phone_number?.includes(q) ||
      inq.mobile_number?.includes(q);
    return matchesSearch && (!statusFilter || inq.status === statusFilter);
  });

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    // Optimistic UI Update
    if (activeTab === "consultation" && consultations) {
      setConsultations(
        consultations.map((inq: any) =>
          inq.inquiry_id === id ? { ...inq, status: newStatus } : inq,
        ),
      );
    } else if (activeTab === "test" && diagnostics) {
      setDiagnostics(
        diagnostics.map((inq: any) =>
          inq.inquiry_id === id ? { ...inq, status: newStatus } : inq,
        ),
      );
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          branch_id: user?.branch_id,
          type: activeTab,
          id,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Status updated successfully", "success");
      } else {
        // Revert on failure
        fetchInquiries(true);
      }
    } catch (err) {
      showToast("Error updating status", "error");
      fetchInquiries(true); // Revert on failure
    }
  };

  const handleDeleteClick = (id: number) => setDeleteModal({ show: true, id });

  const confirmDelete = async () => {
    if (!deleteModal.id) return;

    // Optimistic Delete
    if (activeTab === "consultation" && consultations) {
      setConsultations(
        consultations.filter((inq: any) => inq.inquiry_id !== deleteModal.id),
      );
    } else if (activeTab === "test" && diagnostics) {
      setDiagnostics(
        diagnostics.filter((inq: any) => inq.inquiry_id !== deleteModal.id),
      );
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          branch_id: user?.branch_id,
          type: activeTab,
          id: deleteModal.id,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Inquiry deleted", "success");
      } else {
        fetchInquiries(true); // Revert on failure
      }
    } catch (err) {
      showToast("Error deleting inquiry", "error");
      fetchInquiries(true); // Revert on failure
    } finally {
      setDeleteModal({ show: false, id: null });
    }
  };

  const openFollowUp = async (inquiry: any) => {
    setFollowUpModal({ show: true, inquiry });
    const inquiryId = inquiry.inquiry_id;

    // Check cache
    if (followUpLogs[inquiryId]) {
      setFollowUpLogsLocal(followUpLogs[inquiryId]);
      return;
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/inquiry`, {
        method: "POST",
        body: JSON.stringify({
          action: "fetch_followups",
          inquiry_id: inquiryId,
          type: activeTab,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setFollowUpLogs(inquiryId, data.data);
        setFollowUpLogsLocal(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveFollowUp = async () => {
    if (!newNote.trim()) return;
    setIsSavingLog(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/inquiry`, {
        method: "POST",
        body: JSON.stringify({
          action: "add_followup",
          inquiry_id: followUpModal.inquiry.inquiry_id,
          type: activeTab,
          note: newNote,
          next_date: nextDate,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast("Follow-up added", "success");
        setNewNote("");
        setNextDate("");

        // Invalidate follow-up cache for this inquiry
        const inquiryId = followUpModal.inquiry.inquiry_id;
        const updatedLogs = [
          {
            note: newNote,
            next_date: nextDate,
            created_at: new Date().toISOString(),
          },
          ...followUpLogsLocal,
        ];
        setFollowUpLogs(inquiryId, updatedLogs);
        setFollowUpLogsLocal(updatedLogs);

        // Optionally refresh inquiries if follow-up affects it
        fetchInquiries(true);
      }
    } catch (e) {
      showToast("Error saving log", "error");
    } finally {
      setIsSavingLog(false);
    }
  };

  const handleRegister = (inquiry: any) => {
    const isTest = activeTab === "test";
    const prefillData = {
      patient_name: inquiry.name,
      phone: isTest ? inquiry.mobile_number : inquiry.phone_number,
      age: inquiry.age,
      gender: inquiry.gender,
      address: inquiry.address,
      chief_complaint: inquiry.complaint,
      how_did_you_hear: inquiry.referral,
    };
    navigate("/reception/dashboard", {
      state: { activeModal: isTest ? "test" : "registration", prefillData },
    });
  };

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === "visited")
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30";
    if (s === "cancelled")
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30";
    return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30";
  };

  const openMenu = (
    e: React.MouseEvent,
    options: any[],
    activeValue: string,
    onSelect: (val: string) => void,
    width: number = 140,
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuState({
      x: rect.left,
      y: rect.bottom + 8,
      width,
      options,
      onSelect,
      activeValue,
    });
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        menuState &&
        !(e.target as Element).closest("#custom-menu") &&
        !(e.target as Element).closest(".menu-trigger")
      ) {
        setMenuState(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuState]);

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#0A0A0A] overflow-hidden transition-colors duration-500">
      <Sidebar
        onShowChat={() => setShowChatModal(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <PageHeader
          title="Inquiry"
          icon={Phone}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          refreshCooldown={refreshCooldown}
          onShowIntelligence={() => setShowIntelligence(true)}
          onShowNotes={() => setShowNotes(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel */}
          <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="hidden xl:flex w-[440px] flex-col border-r border-black/[0.03] dark:border-white/5 p-6 overflow-y-auto"
            style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
          >
            <div className="space-y-6 z-10 mb-8">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center text-[#4ADE80] ${isDark ? "bg-white/5 shadow-inner" : "bg-green-50"}`}
                >
                  <LayoutGrid size={18} />
                </div>
                <span className="font-bold tracking-widest text-[10px] uppercase text-slate-400">
                  PhysioEZ Core
                </span>
              </div>

              <div className="space-y-1">
                <h1 className="text-5xl font-serif font-light tracking-tight leading-[1.1] text-[#1a1c1e] dark:text-[#e3e2e6]">
                  Inquiry{" "}
                  <span
                    className={`italic font-bold ${isDark ? "text-[#4ADE80]" : "text-[#16a34a]"}`}
                  >
                    Ops
                  </span>
                </h1>
                <p className="text-gray-500 text-base">
                  Here's your daily lead overview.
                </p>
              </div>
            </div>

            <div className="space-y-10 w-full flex-1 flex flex-col justify-start py-4">
              <div className="space-y-6">
                <div className="flex items-center gap-3 opacity-50 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  <ClipboardList size={18} />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">
                    Consultation Inquiry
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-dashed pb-6 dark:border-white/5 border-gray-100">
                  <div>
                    <div
                      className={`text-7xl font-medium tracking-tighter leading-none ${isDark ? "text-white" : "text-[#0F172A]"}`}
                    >
                      {
                        inquiries.filter(
                          (i) =>
                            i.type === "consultation" &&
                            isToday(parseISO(i.created_at)),
                        ).length
                      }
                    </div>
                    <div className="text-sm font-medium opacity-40 mt-2 text-[#1a1c1e] dark:text-[#e3e2e6]">
                      Today
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-3xl font-medium ${isDark ? "text-white" : "text-[#0F172A]"}`}
                    >
                      {monthlyStats.consultation.total}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide opacity-40 mt-1 text-[#1a1c1e] dark:text-[#e3e2e6]">
                      Month
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pl-1 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  <div className="flex items-center justify-between text-sm group">
                    <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="w-1.5 h-1.5 rounded-sm bg-orange-500"></span>{" "}
                      Pending
                    </span>
                    <span className="font-bold">
                      {monthlyStats.consultation.total -
                        monthlyStats.consultation.visited}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm group">
                    <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="w-1.5 h-1.5 rounded-sm bg-green-500"></span>{" "}
                      Visited
                    </span>
                    <span className="font-bold">
                      {monthlyStats.consultation.visited}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 opacity-50 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  <Beaker size={18} />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">
                    Test Inquiry
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-dashed pb-6 dark:border-white/5 border-gray-100">
                  <div>
                    <div
                      className={`text-7xl font-medium tracking-tighter leading-none ${isDark ? "text-white" : "text-[#0F172A]"}`}
                    >
                      {
                        inquiries.filter(
                          (i) =>
                            i.type === "test" &&
                            isToday(parseISO(i.created_at)),
                        ).length
                      }
                    </div>
                    <div className="text-sm font-medium opacity-40 mt-2 text-[#1a1c1e] dark:text-[#e3e2e6]">
                      Today
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-3xl font-medium ${isDark ? "text-white" : "text-[#0F172A]"}`}
                    >
                      {monthlyStats.test.total}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide opacity-40 mt-1 text-[#1a1c1e] dark:text-[#e3e2e6]">
                      Month
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pl-1 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  <div className="flex items-center justify-between text-sm group">
                    <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="w-1.5 h-1.5 rounded-sm bg-orange-500"></span>{" "}
                      Pending
                    </span>
                    <span className="font-bold">
                      {monthlyStats.test.total - monthlyStats.test.visited}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm group">
                    <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="w-1.5 h-1.5 rounded-sm bg-green-500"></span>{" "}
                      Visited
                    </span>
                    <span className="font-bold">
                      {monthlyStats.test.visited}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-2">
                Today's Follow-ups
              </h3>
              <div className="space-y-3">
                {inquiries.filter(
                  (i) =>
                    i.next_followup_date &&
                    isToday(new Date(i.next_followup_date)),
                ).length > 0 ? (
                  inquiries
                    .filter(
                      (i) =>
                        i.next_followup_date &&
                        isToday(new Date(i.next_followup_date)),
                    )
                    .map((inq) => (
                      <div
                        key={inq.inquiry_id}
                        onClick={() => openFollowUp(inq)}
                        className={`p-3 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer ${isDark ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]" : "bg-white border-gray-100 shadow-sm"}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                            Scheduled
                          </span>
                          <span className="text-[10px] opacity-40 font-bold">
                            {inq.phone_number || inq.mobile_number}
                          </span>
                        </div>
                        <p className="text-sm font-bold mb-1">{inq.name}</p>
                        <p className="text-[11px] opacity-60 line-clamp-1">
                          {inq.last_note || "No history notes"}
                        </p>
                      </div>
                    ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center opacity-20 text-center">
                    <Calendar size={32} className="mb-2" />
                    <p className="text-xs font-bold">No follow-ups for today</p>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>

          {/* Right Panel */}
          <main className="flex-1 flex flex-col bg-[#fdfcff] dark:bg-[#0E110E] transition-colors duration-500 overflow-hidden p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex p-1.5 bg-[#f0f4f9] dark:bg-white/5 rounded-[20px] w-fit border border-black/5 dark:border-white/5">
                {(["consultation", "test"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-8 py-2.5 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-white dark:bg-emerald-500 text-[#1a1c1e] dark:text-white shadow-xl shadow-black/[0.03]" : "text-slate-400"}`}
                  >
                    {tab === "consultation" ? "Consultation" : "Diagnostic"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                  />
                  <input
                    ref={localSearchInputRef}
                    type="text"
                    placeholder="Filter records..."
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="pl-11 pr-6 py-3 rounded-2xl bg-[#f0f4f9] dark:bg-white/5 border border-transparent focus:border-emerald-500/20 outline-none w-64 text-sm font-medium transition-all"
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={(e) =>
                      openMenu(
                        e,
                        [
                          { label: "All Status", value: "" },
                          { label: "Pending", value: "pending" },
                          { label: "Visited", value: "visited" },
                          { label: "Cancelled", value: "cancelled" },
                        ],
                        statusFilter,
                        (val) => setStatusFilter(val),
                        160,
                      )
                    }
                    className="menu-trigger pl-6 pr-10 py-3 rounded-2xl bg-[#f0f4f9] dark:bg-white/5 border border-black/5 dark:border-white/5 outline-none text-sm font-bold flex items-center justify-between min-w-[140px] hover:bg-white dark:hover:bg-white/10 transition-all"
                  >
                    <span>
                      {statusFilter
                        ? statusFilter.charAt(0).toUpperCase() +
                          statusFilter.slice(1)
                        : "All Status"}
                    </span>
                    <ChevronDown
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40"
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto custom-scrollbar px-1">
                <table className="w-full text-left border-separate border-spacing-y-3 min-w-[900px]">
                  <thead className="sticky top-0 z-20 bg-[#fdfcff]/80 dark:bg-[#0E110E]/80 backdrop-blur-md">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Lead Details
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {activeTab === "consultation"
                          ? "Complaint"
                          : "Test Title"}
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Visit Plan
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Source
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Status
                      </th>
                      <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
                        Control
                      </th>
                    </tr>
                  </thead>
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.tbody
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <tr>
                          <td colSpan={7} className="py-24 text-center">
                            <Loader2
                              size={40}
                              className="animate-spin text-emerald-500 mx-auto mb-4 opacity-40"
                            />
                            <p className="text-xs font-bold opacity-40 tracking-widest uppercase">
                              Fetching Records...
                            </p>
                          </td>
                        </tr>
                      </motion.tbody>
                    ) : (
                      <motion.tbody
                        key={activeTab}
                        className="space-y-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{
                          type: "spring",
                          damping: 25,
                          stiffness: 200,
                        }}
                      >
                        {filteredInquiries.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-24 text-center opacity-20"
                            >
                              <Search size={48} className="mx-auto mb-4" />
                              <p className="font-bold uppercase tracking-widest text-xs">
                                No records found
                              </p>
                            </td>
                          </tr>
                        ) : (
                          filteredInquiries.map((inq) => (
                            <tr
                              key={inq.inquiry_id}
                              className="group bg-white dark:bg-white/[0.03] hover:bg-[#f0f4f9] dark:hover:bg-white/[0.05] transition-all shadow-sm hover:shadow-md rounded-xl overflow-hidden"
                            >
                              <td className="px-8 py-5 first:rounded-l-[24px]">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-500 flex items-center justify-center font-bold text-lg shadow-inner">
                                    {inq.name?.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#1a1c1e] dark:text-white text-base mb-0.5 group-hover:text-emerald-500 transition-colors">
                                      {inq.name}
                                    </p>
                                    <p className="text-[10px] uppercase font-black tracking-widest opacity-40">
                                      {inq.age} yrs • {inq.gender}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-xs font-bold text-slate-600 dark:text-emerald-400 bg-slate-100 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-transparent dark:border-emerald-500/10">
                                  {activeTab === "consultation"
                                    ? inq.complaint || "None"
                                    : inq.test_name || inq.test_title || "N/A"}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-2 text-sm font-medium opacity-60">
                                  <Phone
                                    size={14}
                                    className="text-emerald-500/40"
                                  />
                                  {inq.phone_number || inq.mobile_number}
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    {inq.expected_date
                                      ? format(
                                          parseISO(inq.expected_date),
                                          "MMM d, yyyy",
                                        )
                                      : "TBD"}
                                  </span>
                                  <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-30 mt-0.5">
                                    Expected Visit
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-lg">
                                  {inq.referral_source ||
                                    inq.referral ||
                                    "Walk-in"}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <button
                                  onClick={(e) =>
                                    openMenu(
                                      e,
                                      [
                                        { label: "Pending", value: "pending" },
                                        { label: "Visited", value: "visited" },
                                        {
                                          label: "Cancelled",
                                          value: "cancelled",
                                        },
                                      ],
                                      inq.status,
                                      (val) =>
                                        handleUpdateStatus(inq.inquiry_id, val),
                                    )
                                  }
                                  className={`menu-trigger text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 group/status hover:scale-105 ${getStatusStyle(
                                    inq.status,
                                  )}`}
                                >
                                  {inq.status}{" "}
                                  <ChevronDown
                                    size={12}
                                    className="opacity-40 group-hover/status:translate-y-0.5 transition-transform"
                                  />
                                </button>
                              </td>
                              <td className="px-8 py-5 text-right last:rounded-r-[24px]">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleRegister(inq)}
                                    title="Register Patient"
                                    className="w-10 h-10 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all hover:rotate-12"
                                  >
                                    <UserPlus size={20} />
                                  </button>
                                  <button
                                    onClick={() => openFollowUp(inq)}
                                    title="Follow-up History"
                                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-2xl transition-all"
                                  >
                                    <HistoryIcon size={20} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteClick(inq.inquiry_id)
                                    }
                                    title="Delete Entry"
                                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </motion.tbody>
                    )}
                  </AnimatePresence>
                </table>
              </div>
            </div>
          </main>
        </div>

        {/* Global Components */}
        <ActionFAB onAction={handleFABAction} />
        <NotesDrawer isOpen={showNotes} onClose={() => setShowNotes(false)} />
        <DailyIntelligence
          isOpen={showIntelligence}
          onClose={() => setShowIntelligence(false)}
        />
        <LogoutConfirmation
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            logout();
            navigate("/login");
          }}
        />
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
        />
        <KeyboardShortcuts
          shortcuts={pageShortcuts}
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          onToggle={() => setShowShortcuts(!showShortcuts)}
        />

        {/* Context Menu */}
        <AnimatePresence>
          {menuState && (
            <motion.div
              id="custom-menu"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed z-[600] bg-white dark:bg-[#1A1C1A] rounded-2xl shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden"
              style={{
                top: menuState.y,
                left: menuState.x,
                width: menuState.width,
              }}
            >
              <div className="p-1.5 space-y-0.5">
                {menuState.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      menuState.onSelect(opt.value);
                      setMenuState(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${menuState.activeValue === opt.value ? "bg-emerald-500 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"}`}
                  >
                    {opt.label}{" "}
                    {menuState.activeValue === opt.value && (
                      <CheckCircle2 size={14} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {deleteModal.show && (
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setDeleteModal({ show: false, id: null })}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white dark:bg-[#1A1C1A] w-full max-w-sm rounded-[32px] p-8 text-center border border-black/5 dark:border-white/5 shadow-2xl"
              >
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Delete Inquiry?</h3>
                <p className="text-sm text-slate-500 mb-8">
                  This action is permanent and cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteModal({ show: false, id: null })}
                    className="flex-1 py-3 rounded-2xl bg-slate-100 font-bold dark:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Follow Up Drawer */}
        <AnimatePresence>
          {followUpModal.show && followUpModal.inquiry && (
            <div className="fixed inset-0 z-[1000] flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setFollowUpModal({ show: false, inquiry: null })}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className={`relative w-full max-w-[400px] min-w-[650px] h-full flex flex-col border-l shadow-2xl transition-colors ${
                  isDark
                    ? "bg-[#121412] border-white/5"
                    : "bg-white border-gray-100"
                }`}
              >
                <div
                  className={`px-8 py-10 flex items-center justify-between border-b ${isDark ? "border-white/5" : "border-gray-50"}`}
                >
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <HistoryIcon size={20} />
                      </div>
                      Activity Log
                    </h3>
                    <p className="text-sm font-medium text-emerald-500 mt-2 pl-12">
                      {followUpModal.inquiry.name}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setFollowUpModal({ show: false, inquiry: null })
                    }
                    className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                  <div className="bg-[#f8f9fc] dark:bg-white/[0.02] p-6 rounded-[28px] mb-10 border border-black/[0.03] dark:border-white/5">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Type a new activity note..."
                      className="w-full bg-transparent text-sm h-32 outline-none resize-none mb-6 font-medium leading-relaxed"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setShowDatePicker(true)}
                        className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-white/5 px-4 py-3.5 rounded-2xl border border-black/5 dark:border-white/5 flex-1 justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
                      >
                        <Calendar size={14} className="text-emerald-500" />
                        {nextDate
                          ? format(parseISO(nextDate), "MMM d, yyyy")
                          : "Next Followup"}
                      </button>
                      <button
                        onClick={saveFollowUp}
                        disabled={isSavingLog || !newNote.trim()}
                        className="px-8 py-3.5 bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 min-w-[140px]"
                      >
                        {isSavingLog ? (
                          <Loader2 size={16} className="animate-spin mx-auto" />
                        ) : (
                          "Save Update"
                        )}
                      </button>
                    </div>
                  </div>

                  {showDatePicker && (
                    <DatePicker
                      value={nextDate}
                      onChange={setNextDate}
                      onClose={() => setShowDatePicker(false)}
                    />
                  )}

                  <div className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Timeline
                      </h4>
                      <div className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {followUpLogsLocal.length} Events
                      </div>
                    </div>

                    {followUpLogsLocal.length === 0 ? (
                      <div className="text-center py-20 opacity-10">
                        <ClipboardList size={64} className="mx-auto mb-4" />
                        <p className="text-sm font-bold">History is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-6 relative pl-4">
                        <div className="absolute left-[3px] top-4 bottom-4 w-0.5 bg-slate-100 dark:bg-white/5" />
                        {followUpLogsLocal.map((log) => (
                          <div
                            key={log.followup_id}
                            className="relative pl-8 group"
                          >
                            <div className="absolute left-[-5px] top-2 w-[10px] h-[10px] rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#121412] z-10" />
                            <div className="bg-white dark:bg-white/[0.03] p-5 rounded-[24px] border border-black/[0.03] dark:border-white/5 transition-all group-hover:border-emerald-500/20">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-emerald-500">
                                  {log.staff_name || "Receptionist"}
                                </span>
                                <span className="text-[10px] opacity-30 font-bold">
                                  {format(
                                    parseISO(log.created_at),
                                    "MMM d • HH:mm",
                                  )}
                                </span>
                              </div>
                              <p className="text-sm opacity-70 leading-relaxed font-normal">
                                {log.note}
                              </p>
                              {log.next_followup_date && (
                                <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                                  <span className="text-[9px] uppercase font-black tracking-widest opacity-20">
                                    Reminder
                                  </span>
                                  <div className="text-[10px] font-bold text-amber-500 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                                    <Calendar size={10} />
                                    {format(
                                      parseISO(log.next_followup_date),
                                      "MMM d, yyyy",
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000]"
            >
              <div
                className={`px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <span className="font-bold text-sm tracking-wide">
                  {toast.message}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Inquiry;
