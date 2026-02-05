import { useState, useEffect, useCallback, useRef } from "react";
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
import { useAuthStore, useDashboardStore, useThemeStore } from "../store";
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
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();
  const navigate = useNavigate();

  // Global Store States
  const { setShowGlobalSearch } = useDashboardStore();

  // Local State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTab, setActiveTab] = useState<InquiryType>("consultation");
  const [inquiries, setInquiries] = useState<any[]>([]);
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
  const [followUpLogs, setFollowUpLogs] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [isSavingLog, setIsSavingLog] = useState(false);

  const pageShortcuts: ShortcutItem[] = [
    {
      keys: ["Alt", "C"],
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
    {
      keys: ["Alt", "R"],
      description: "Refresh List",
      group: "Actions",
      action: () => fetchInquiries(),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "S"],
      description: "Global Search",
      group: "Modals",
      action: () => setShowGlobalSearch(true),
    },
  ];

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchInquiries = useCallback(async () => {
    if (!user?.branch_id) return;
    setIsLoading(true);
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
        setInquiries(data.data);
        updateMonthlyStats(data.data, activeTab);
      }
    } catch (err) {
      showToast("Failed to load inquiries", "error");
    } finally {
      setIsLoading(false);
    }
  }, [user?.branch_id, activeTab]);

  const updateMonthlyStats = (data: any[], type: string) => {
    const total = data.length;
    const visited = data.filter((i) => i.status === "visited").length;
    setMonthlyStats((prev) => ({
      ...prev,
      [type]: { total, visited },
    }));
  };

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
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
        fetchInquiries();
      }
    } catch (err) {
      showToast("Error updating status", "error");
    }
  };

  const handleDeleteClick = (id: number) => setDeleteModal({ show: true, id });

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
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
        fetchInquiries();
      }
    } catch (err) {
      showToast("Error deleting inquiry", "error");
    } finally {
      setDeleteModal({ show: false, id: null });
    }
  };

  const openFollowUp = async (inquiry: any) => {
    setFollowUpModal({ show: true, inquiry });
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/inquiry`, {
        method: "POST",
        body: JSON.stringify({
          action: "fetch_followups",
          inquiry_id: inquiry.inquiry_id,
          type: activeTab,
        }),
      });
      const data = await res.json();
      if (data.status === "success") setFollowUpLogs(data.data);
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
        openFollowUp(followUpModal.inquiry);
        fetchInquiries();
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

  const handleFABAction = (action: any) => {
    const modalType =
      action === "registration" || action === "test"
        ? action
        : action === "inquiry"
          ? "registration"
          : "test";

    navigate("/reception/dashboard", {
      state: { activeModal: modalType },
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
    <div className="flex h-screen w-full bg-[#fdfcff] dark:bg-[#0A0A0A] overflow-hidden transition-colors duration-500">
      <Sidebar
        onShowChat={() => setShowChatModal(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <PageHeader
          title="Inquiry"
          icon={Phone}
          onRefresh={fetchInquiries}
          isLoading={isLoading}
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

            {/* --- REDESIGNED STATS PANEL --- */}
            <div className="space-y-10 w-full flex-1 flex flex-col justify-start py-4">
              {/* SECTION 1: CONSULTATION INQUIRY */}
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

              {/* SECTION 2: TEST INQUIRY */}
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
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-6 pr-10 py-3 rounded-2xl bg-[#f0f4f9] dark:bg-white/5 border border-transparent outline-none text-sm font-bold cursor-pointer"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="visited">Visited</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white dark:bg-white/[0.02] rounded-[32px] border border-black/[0.03] dark:border-white/5 shadow-2xl shadow-black/[0.03] overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="sticky top-0 z-10 bg-[#f0f4f9] dark:bg-[#1A1C1A]">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                        Lead Details
                      </th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                        {activeTab === "consultation"
                          ? "Complaint"
                          : "Test Title"}
                      </th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                        Contact
                      </th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                        Visit Plan
                      </th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                        Source
                      </th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                        Status
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-right">
                        Control
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.03]">
                    <AnimatePresence mode="popLayout">
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="py-24 text-center">
                            <Loader2
                              size={40}
                              className="animate-spin text-emerald-500 mx-auto mb-4 opacity-40"
                            />
                          </td>
                        </tr>
                      ) : inquiries.filter((inq) => {
                          const q = localSearchQuery.toLowerCase();
                          const matchesSearch =
                            inq.name.toLowerCase().includes(q) ||
                            inq.phone_number?.includes(q) ||
                            inq.mobile_number?.includes(q);
                          return (
                            matchesSearch &&
                            (!statusFilter || inq.status === statusFilter)
                          );
                        }).length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-24 text-center opacity-20"
                          >
                            <Search size={48} className="mx-auto mb-4" />
                            <p className="font-bold">No records found</p>
                          </td>
                        </tr>
                      ) : (
                        inquiries
                          .filter((inq) => {
                            const q = localSearchQuery.toLowerCase();
                            return (
                              (inq.name.toLowerCase().includes(q) ||
                                inq.phone_number?.includes(q) ||
                                inq.mobile_number?.includes(q)) &&
                              (!statusFilter || inq.status === statusFilter)
                            );
                          })
                          .map((inq, idx) => (
                            <motion.tr
                              key={inq.inquiry_id}
                              className={`group hover:bg-[#f0f4f9] dark:hover:bg-white/[0.02] transition-all cursor-pointer ${idx % 2 === 0 ? "" : "bg-black/[0.01] dark:bg-white/[0.01]"}`}
                            >
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                                    {inq.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#1a1c1e] dark:text-white mb-0.5">
                                      {inq.name}
                                    </p>
                                    <p className="text-[10px] uppercase font-black tracking-widest opacity-40">
                                      {inq.age} yrs • {inq.gender}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                                  {activeTab === "consultation"
                                    ? inq.complaint || "None"
                                    : inq.test_name || inq.test_title || "N/A"}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-sm font-medium opacity-60">
                                  {inq.phone_number || inq.mobile_number}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold">
                                    {inq.expected_date
                                      ? format(
                                          parseISO(inq.expected_date),
                                          "MMM d",
                                        )
                                      : "TBD"}
                                  </span>
                                  <span className="text-[10px] font-black uppercase tracking-tighter opacity-30">
                                    Planned
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span className="text-[10px] font-black uppercase tracking-[0.1em] opacity-40">
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
                                  className={`menu-trigger text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-xl border transition-all flex items-center gap-2 ${getStatusStyle(inq.status)}`}
                                >
                                  {inq.status}{" "}
                                  <ChevronDown
                                    size={10}
                                    className="opacity-50"
                                  />
                                </button>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleRegister(inq)}
                                    className="w-9 h-9 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                                  >
                                    <UserPlus size={18} />
                                  </button>
                                  <button
                                    onClick={() => openFollowUp(inq)}
                                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                                  >
                                    <HistoryIcon size={18} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteClick(inq.inquiry_id)
                                    }
                                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-500 rounded-xl transition-all"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))
                      )}
                    </AnimatePresence>
                  </tbody>
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
            useAuthStore.getState().logout();
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
              className="fixed z-[300] bg-white dark:bg-[#1A1C1A] rounded-2xl shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden"
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
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${menuState.activeValue === opt.value ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"}`}
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
            <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
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
                    className="flex-1 py-3 rounded-2xl bg-slate-100 font-bold"
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

        {/* Follow Up Modal */}
        <AnimatePresence>
          {followUpModal.show && followUpModal.inquiry && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setFollowUpModal({ show: false, inquiry: null })}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-2xl max-h-[85vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-black/5 dark:border-white/5"
              >
                <div className="px-8 py-6 border-b border-black/5 dark:border-white/5 flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                      Follow Up History
                    </h3>
                    <p className="text-sm font-medium text-emerald-500 mt-1">
                      {followUpModal.inquiry.name}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setFollowUpModal({ show: false, inquiry: null })
                    }
                    className="p-2 bg-slate-100 dark:bg-white/5 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
                  <div className="bg-white dark:bg-white/5 p-4 rounded-[24px] mb-8 border border-black/5 dark:border-white/10 shadow-sm">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a new follow-up note..."
                      className="w-full bg-transparent text-sm h-24 outline-none resize-none mb-4"
                    />
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setShowDatePicker(true)}
                        className="flex items-center gap-2 text-xs font-bold bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-xl"
                      >
                        <Calendar size={14} className="text-emerald-500" />{" "}
                        {nextDate
                          ? format(parseISO(nextDate), "MMM d")
                          : "Next Date"}
                      </button>
                      <button
                        onClick={saveFollowUp}
                        disabled={isSavingLog || !newNote.trim()}
                        className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                      >
                        {isSavingLog ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          "Save Note"
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

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Activity Timeline
                    </h4>
                    {followUpLogs.length === 0 ? (
                      <div className="text-center py-12 opacity-40">
                        <ClipboardList size={32} className="mx-auto mb-2" />
                        <p className="text-xs">No history found</p>
                      </div>
                    ) : (
                      <div className="space-y-4 pl-4 border-l-2 border-slate-100 dark:border-white/5">
                        {followUpLogs.map((log) => (
                          <div key={log.followup_id} className="relative pl-6">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-[#1a1c1e]" />
                            <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold">
                                  {log.staff_name || "Reception"}
                                </span>
                                <span className="text-[10px] opacity-40">
                                  {format(
                                    parseISO(log.created_at),
                                    "MMM d, h:mm a",
                                  )}
                                </span>
                              </div>
                              <p className="text-sm opacity-80">{log.note}</p>
                              {log.next_followup_date && (
                                <div className="mt-3 text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2 bg-emerald-500/10 w-fit px-2 py-1 rounded">
                                  Next:{" "}
                                  {format(
                                    parseISO(log.next_followup_date),
                                    "MMM d",
                                  )}
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
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[600]"
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
