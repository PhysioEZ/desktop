import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  TestTube2,
  CreditCard,
  TrendingUp,
  Activity,
  AlertCircle,
  ArrowRight,
  X,
  CheckCircle2,
  Search,
  Loader2,
  ChevronDown,
  Ban,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useThemeStore } from "../store/useThemeStore";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { useAuthStore } from "../store/useAuthStore";
import { useTestStore } from "../store/useTestStore";
import { useSmartRefresh } from "../hooks/useSmartRefresh";
import { API_BASE_URL, authFetch } from "../config";
import { toast } from "sonner";

import DailyIntelligence from "../components/DailyIntelligence";
import NotesDrawer from "../components/NotesDrawer";
import ChatModal from "../components/Chat/ChatModal";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import TestDetailsModal from "../components/reception/TestDetailsModal";
import TestBillModal from "../components/patients/modals/TestBillModal";
import type { ShortcutItem } from "../types/shortcuts";

interface TestRecord {
  uid: string;
  patient_name: string;
  test_name: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status:
    | "Paid"
    | "Partial"
    | "Unpaid"
    | "paid"
    | "partial"
    | "pending";
  test_status:
    | "Completed"
    | "Pending"
    | "Cancelled"
    | "In Progress"
    | "completed"
    | "pending"
    | "cancelled"
    | "in-progress";
  test_uid: string;
}

const Tests = () => {
  const navigate = useNavigate();
  const { isDark } = useThemeStore();
  const { user: _user } = useAuthStore();
  const { tests: cachedTests, stats: cachedStats } = useTestStore();

  // State
  const [records, setRecords] = useState<TestRecord[]>(
    cachedTests && cachedTests.length > 0 ? (cachedTests as any) : [],
  );
  const [isLoading, setIsLoading] = useState(
    cachedTests && cachedTests.length > 0 ? false : true,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");

  const [testTypeFilter, setTestTypeFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [stats, setStats] = useState(
    cachedStats && cachedStats.total > 0
      ? cachedStats
      : {
          total: 0,
          completed: 0,
          pending: 0,
          cancelled: 0,
          total_revenue: 0,
          total_paid: 0,
          total_due: 0,
        },
  );

  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const { smartRefresh, isRefreshing } = useSmartRefresh();

  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  const [selectedTest, setSelectedTest] = useState<TestRecord | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showTestBill, setShowTestBill] = useState(false);
  const [billTestId, setBillTestId] = useState<number | null>(null);

  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isPaymentMenuOpen, setIsPaymentMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const shortcuts: ShortcutItem[] = [
    {
      keys: ["Alt", "/"],
      description: "Keyboard Shortcuts",
      group: "General",
      action: () => setShowShortcuts((prev) => !prev),
    },
    {
      keys: ["Alt", "C"],
      description: "Toggle Chat",
      group: "Modals",
      action: () => setShowChatModal((prev) => !prev),
    },
  ];

  // Filter Logic
  const filteredRecords = records.filter((record) => {
    // Type Filter
    const matchesType =
      testTypeFilter === "All" ||
      record.test_name.toLowerCase().includes(testTypeFilter.toLowerCase());

    // Payment Filter
    const matchesPayment =
      paymentFilter === "All" ||
      record.payment_status.toLowerCase() === paymentFilter.toLowerCase();

    // Status Filter (Dropdown)
    const matchesStatus =
      statusFilter === "All" ||
      record.test_status.toLowerCase() === statusFilter.toLowerCase();

    // Cancelled Only Filter (Removed, handled by separate page)
    const matchesCancelled = true;

    // Search Filter (Synced with Server Results)
    const matchesSearch =
      appliedSearchQuery.trim() === "" ||
      record.patient_name
        .toLowerCase()
        .includes(appliedSearchQuery.toLowerCase()) ||
      record.test_uid
        .toLowerCase()
        .includes(appliedSearchQuery.toLowerCase()) ||
      record.test_name.toLowerCase().includes(appliedSearchQuery.toLowerCase());

    return (
      matchesType &&
      matchesPayment &&
      matchesStatus &&
      matchesCancelled &&
      matchesSearch
    );
  });

  // Fetch Logic
  const fetchApprovals = async () => {
    if (!_user?.branch_id) return;
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/get_pending_approvals?branch_id=${_user.branch_id}`,
      );
      const data = await res.json();
      if (data.success) {
        setPendingApprovals(data.data || []);
      }
    } catch (e) {
      console.error("Error fetching approvals", e);
    }
  };

  const fetchTests = async (
    pageNum = 1,
    searchParam = appliedSearchQuery,
    forceRefresh = false,
  ) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const params = new URLSearchParams();
      params.append("action", "fetch");

      const bodyData: any = {
        action: "fetch",
        page: pageNum,
        limit: 15,
        search: searchParam,
      };

      // Set status based on statusFilter
      if (statusFilter !== "All") {
        bodyData.status = statusFilter;
      }

      if (paymentFilter !== "All") {
        bodyData.payment_status = paymentFilter;
      }

      if (testTypeFilter !== "All") {
        bodyData.test_name = testTypeFilter;
      }

      const response = await authFetch(
        `${API_BASE_URL}/reception/tests?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(forceRefresh && { "X-Refresh": "true" }),
          },
          body: JSON.stringify(bodyData),
        },
      );
      const res = await response.json();
      if (res.success) {
        if (pageNum === 1) {
          setRecords(res.data);
        } else {
          setRecords((prev) => [...prev, ...res.data]);
        }
        setHasMore(res.data.length === 15);
        setPage(pageNum);

        // Update stats only on initial fetch
        if (pageNum === 1) {
          setStats({
            total: res.stats.total || 0,
            completed: res.stats.completed || 0,
            pending: res.stats.pending || 0,
            cancelled: res.stats.cancelled || 0,
            total_revenue: res.data.reduce(
              (acc: number, curr: TestRecord) =>
                acc + (Number(curr.total_amount) || 0),
              0,
            ),
            total_paid: res.data.reduce(
              (acc: number, curr: TestRecord) =>
                acc + (Number(curr.paid_amount) || 0),
              0,
            ),
            total_due: res.data.reduce(
              (acc: number, curr: TestRecord) =>
                acc + (Number(curr.due_amount) || 0),
              0,
            ),
          });
        }
      }
      // Also fetch approvals
      await fetchApprovals();
    } catch (error) {
      console.error("Fetch Tests Error:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      fetchApprovals();
    }
    fetchTests(1, appliedSearchQuery);
  }, [statusFilter, paymentFilter, testTypeFilter]);

  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(() => setRefreshCooldown((p) => p - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  const handleRefresh = () => {
    if (refreshCooldown > 0) return;
    smartRefresh("tests", {
      onSuccess: () => {
        fetchTests(1, appliedSearchQuery, true);
        setRefreshCooldown(30);
      },
    });
  };

  const handleSearchClick = () => {
    const trimmed = searchQuery.trim();
    if (trimmed === "") {
      toast.error(
        "Please enter a patient name, UID, or phone number to search.",
      );
      return;
    }

    if (trimmed === appliedSearchQuery) return;

    setAppliedSearchQuery(trimmed);
    fetchTests(1, trimmed);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setAppliedSearchQuery("");
    fetchTests(1, "");
  };

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? "bg-[#050505] text-[#E2E8F0]" : "bg-[#FAFAFA] text-[#1A1A1A]"}`}
    >
      <Sidebar
        onShowChat={() => setShowChatModal(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <PageHeader
          title="Tests"
          subtitle="Lab Registry"
          icon={TestTube2}
          onRefresh={handleRefresh}
          refreshCooldown={refreshCooldown}
          isLoading={isLoading || isRefreshing}
          onShowIntelligence={() => setShowIntelligence(true)}
          onShowNotes={() => setShowNotes(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* === LEFT PANEL: SUMMARY === */}
          <aside
            className={`w-[450px] flex flex-col border-r overflow-y-auto custom-scrollbar p-6 space-y-8 transition-colors duration-300 ${isDark ? "bg-[#0A0B0A] border-white/5" : "bg-white border-gray-100"}`}
          >
            {/* 1. Daily Volume Card - Consolidated */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Diagnostic Status
                </h3>
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest">
                  <Activity size={10} /> Live
                </div>
              </div>

              <div
                className={`p-6 rounded-[32px] border relative overflow-hidden transition-all ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/20"}`}
              >
                <div className="grid grid-cols-4 gap-2 relative z-10 divide-x dark:divide-white/5 divide-slate-100">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Total
                    </p>
                    <p className="text-2xl font-black tracking-tighter">
                      {stats.total}
                    </p>
                    <div className="mt-1 flex items-center gap-0.5 text-[9px] font-bold text-emerald-500">
                      <TrendingUp size={10} /> +12%
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Completed
                    </p>
                    <p className="text-2xl font-black tracking-tighter text-emerald-500">
                      {stats.completed}
                    </p>
                    <div className="mt-1 flex items-center gap-0.5 text-[9px] font-bold text-slate-400 opacity-40">
                      SUCCESS
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center group">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors">
                      Pending
                    </p>
                    <p className="text-2xl font-black tracking-tighter text-amber-500">
                      {stats.pending}
                    </p>
                    <div className="mt-1 flex items-center gap-0.5 text-[9px] font-bold text-slate-400 opacity-40 uppercase">
                      Wait
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center group">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 grayscale group-hover:grayscale-0 transition-all">
                      Cancelled
                    </p>
                    <p className="text-2xl font-black tracking-tighter text-rose-500/50 group-hover:text-rose-500 transition-colors">
                      {stats.cancelled}
                    </p>
                    <div className="mt-1 flex items-center gap-0.5 text-[9px] font-bold text-slate-400 opacity-20 uppercase">
                      Void
                    </div>
                  </div>
                </div>
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />
              </div>
            </div>

            {/* 2. Today's Money Card */}
            <div
              className={`p-6 rounded-[32px] bg-gradient-to-br from-[#0c4a48] to-[#062d2c] text-white shadow-2xl relative overflow-hidden group`}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <CreditCard size={20} className="text-teal-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tight">
                      Today's Money
                    </h4>
                    <p className="text-[10px] font-bold text-teal-200/60 uppercase tracking-widest">
                      Payment Overview
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-6">
                  <div>
                    <p className="text-[10px] font-black text-teal-200/40 uppercase tracking-widest mb-1">
                      Total Billed
                    </p>
                    <p className="text-2xl font-black">
                      ₹{stats.total_revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-teal-200/40 uppercase tracking-widest mb-1 text-right">
                      Paid
                    </p>
                    <p className="text-2xl font-black text-emerald-400">
                      ₹{stats.total_paid.toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-teal-200/40 uppercase tracking-widest">
                        Percentage Paid
                      </span>
                      <span className="text-xs font-black text-emerald-400">
                        {stats.total_revenue > 0
                          ? (
                              (stats.total_paid / stats.total_revenue) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${stats.total_revenue > 0 ? (stats.total_paid / stats.total_revenue) * 100 : 0}%`,
                        }}
                        className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
            </div>

            {/* 3. Test Types Distribution Card - Consolidated */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Service Distribution
                </h3>
              </div>

              <div
                className={`p-6 rounded-[32px] border ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-100 shadow-sm"} space-y-6`}
              >
                {[
                  {
                    name: "EEG (Brain Test)",
                    count: 24,
                    progress: 65,
                    color:
                      "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]",
                  },
                  {
                    name: "NCV (Nerve Test)",
                    count: 18,
                    progress: 45,
                    color:
                      "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
                  },
                  {
                    name: "BERA (Hearing Test)",
                    count: 12,
                    progress: 30,
                    color: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                        {item.name}
                      </span>
                      <span className="text-xs font-black tracking-tight">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        className={`h-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Info */}
            <div className="space-y-6 pb-10">
              <div
                className={`p-5 rounded-[24px] border ${isDark ? "bg-amber-500/5 border-amber-500/10" : "bg-amber-50 border-amber-100"}`}
              >
                <div className="flex gap-4">
                  <div className="mt-1">
                    <AlertCircle size={18} className="text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight">
                      Quick Note
                    </h5>
                    <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/60 leading-relaxed uppercase">
                      {pendingApprovals.filter((a) => a.type === "test").length}{" "}
                      tests are still waiting for approval. Please check.
                    </p>
                    <button
                      onClick={() => setShowApprovals(true)}
                      className="flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 mt-2 hover:underline"
                    >
                      VIEW ALL <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* === MAIN CONTENT AREA === */}
          <main className="flex-1 bg-transparent flex flex-col relative">
            {/* Top Toolbar */}
            <div
              className={`px-8 py-4 flex items-center gap-4 border-b transition-colors z-[100] sticky top-0 backdrop-blur-md ${isDark ? "bg-black/40 border-white/5" : "bg-white/80 border-gray-100"}`}
            >
              {/* Resized Search Bar */}
              <div
                className={`max-w-md flex-1 flex items-center gap-3 px-5 py-3 rounded-[20px] border transition-all duration-300 ${isDark ? "bg-[#1A1C1A] border-white/5 focus-within:border-emerald-500/50" : "bg-gray-50 border-gray-200 focus-within:bg-white focus-within:shadow-xl focus-within:shadow-emerald-500/5 focus-within:border-emerald-500/30"}`}
              >
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="SEARCH PATIENTS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
                  className="bg-transparent border-none outline-none text-[11px] w-full font-black tracking-widest uppercase placeholder:opacity-20 placeholder:font-black"
                />

                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="p-1 hover:bg-black/5 rounded-full transition-colors text-slate-400"
                  >
                    <X size={14} />
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSearchClick}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#009b7c] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#008268] transition-all shadow-lg shadow-[#009b7c]/10"
                  >
                    <Search size={12} />
                    Search
                  </button>

                  {appliedSearchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isDark ? "bg-white/10 text-slate-300 hover:bg-white/20" : "bg-gray-100 text-gray-500 hover:bg-gray-200 shadow-sm"}`}
                    >
                      <X size={12} />
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Filters Dropdowns */}
              <div className="flex items-center gap-2 ml-auto">
                {/* 1. Test Type Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
                    className={`flex items-center gap-3 pl-5 pr-4 py-3 rounded-[18px] border font-black text-[9px] uppercase tracking-widest outline-none transition-all ${isDark ? "bg-[#1A1C1A] border-white/5 hover:bg-white/5 text-slate-300" : "bg-white border-gray-200 hover:bg-gray-50 text-slate-500 hover:border-emerald-500/20 shadow-sm"} ${isTypeMenuOpen ? "border-emerald-500/40 ring-4 ring-emerald-500/5" : ""}`}
                  >
                    <span>
                      {testTypeFilter === "All" ? "Types" : testTypeFilter}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${isTypeMenuOpen ? "rotate-180" : "opacity-30"}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isTypeMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsTypeMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className={`absolute top-full right-0 mt-3 w-48 rounded-[24px] border shadow-2xl z-50 overflow-hidden backdrop-blur-xl ${isDark ? "bg-black/60 border-white/10" : "bg-white/90 border-gray-100"}`}
                        >
                          <div className="p-2 space-y-1">
                            {["All", "EEG", "NCV", "BERA"].map((option) => (
                              <button
                                key={option}
                                onClick={() => {
                                  setTestTypeFilter(option);
                                  setIsTypeMenuOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${testTypeFilter === option ? "bg-emerald-500/10 text-emerald-500" : isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"}`}
                              >
                                {option === "All" ? "All Types" : option}
                                {testTypeFilter === option && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Payment Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsPaymentMenuOpen(!isPaymentMenuOpen)}
                    className={`flex items-center gap-3 pl-5 pr-4 py-3 rounded-[18px] border font-black text-[9px] uppercase tracking-widest outline-none transition-all ${isDark ? "bg-[#1A1C1A] border-white/5 hover:bg-white/5 text-slate-300" : "bg-white border-gray-200 hover:bg-gray-50 text-slate-500 hover:border-emerald-500/20 shadow-sm"} ${isPaymentMenuOpen ? "border-emerald-500/40 ring-4 ring-emerald-500/5" : ""}`}
                  >
                    <span>
                      {paymentFilter === "All" ? "Payment" : paymentFilter}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${isPaymentMenuOpen ? "rotate-180" : "opacity-30"}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isPaymentMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsPaymentMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className={`absolute top-full right-0 mt-3 w-48 rounded-[24px] border shadow-2xl z-50 overflow-hidden backdrop-blur-xl ${isDark ? "bg-black/60 border-white/10" : "bg-white/90 border-gray-100"}`}
                        >
                          <div className="p-2 space-y-1">
                            {["All", "Paid", "Partial", "Unpaid"].map(
                              (option) => (
                                <button
                                  key={option}
                                  onClick={() => {
                                    setPaymentFilter(option);
                                    setIsPaymentMenuOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentFilter === option ? "bg-emerald-500/10 text-emerald-500" : isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"}`}
                                >
                                  {option === "All" ? "All Payments" : option}
                                  {paymentFilter === option && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                  )}
                                </button>
                              ),
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Status Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                    className={`flex items-center gap-3 pl-5 pr-4 py-3 rounded-[18px] border font-black text-[9px] uppercase tracking-widest outline-none transition-all ${isDark ? "bg-[#1A1C1A] border-white/5 hover:bg-white/5 text-slate-300" : "bg-white border-gray-200 hover:bg-gray-50 text-slate-500 hover:border-emerald-500/20 shadow-sm"} ${isStatusMenuOpen ? "border-emerald-500/40 ring-4 ring-emerald-500/5" : ""}`}
                  >
                    <span>
                      {statusFilter === "All" ? "Status" : statusFilter}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${isStatusMenuOpen ? "rotate-180" : "opacity-30"}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isStatusMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsStatusMenuOpen(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className={`absolute top-full right-0 mt-3 w-48 rounded-[24px] border shadow-2xl z-50 overflow-hidden backdrop-blur-xl ${isDark ? "bg-black/60 border-white/10" : "bg-white/90 border-gray-100"}`}
                        >
                          <div className="p-2 space-y-1">
                            {[
                              "All",
                              "Pending",
                              "Completed",
                              "In Progress",
                              "Cancelled",
                            ].map((option) => (
                              <button
                                key={option}
                                onClick={() => {
                                  setStatusFilter(option);
                                  setIsStatusMenuOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === option ? "bg-emerald-500/10 text-emerald-500" : isDark ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"}`}
                              >
                                {option === "All" ? "All Status" : option}
                                {statusFilter === option && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action Buttons with larger gap */}
              <div className="flex items-center gap-2 ml-6">
                <button
                  onClick={() => navigate("/reception/tests/cancelled")}
                  className={`flex items-center gap-2 px-4 py-3 rounded-[18px] border font-black text-[9px] uppercase tracking-widest transition-all ${isDark ? "bg-[#1A1C1A] border-white/5 text-slate-400" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                >
                  <Ban size={14} className="opacity-30" />
                  Cancelled
                </button>

                <button
                  onClick={() => navigate("/reception/test-schedule")}
                  className={`flex items-center gap-2 px-5 py-3 rounded-[18px] border font-black text-[9px] uppercase tracking-widest transition-all bg-[#009b7c] text-white hover:bg-[#008268] shadow-lg shadow-[#009b7c]/20`}
                >
                  <Calendar size={14} />
                  Schedule
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <Loader2 size={32} className="animate-spin mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">
                    Loading Records...
                  </p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                  <TestTube2 size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">
                    No records found
                  </p>
                </div>
              ) : (
                <div className="flex flex-col pb-20 w-full px-4 md:px-6">
                  <div className="flex flex-col w-full overflow-x-auto custom-scrollbar pb-8 px-1">
                    <div className="min-w-[1300px] w-full">
                      {/* Table Headers */}
                      <div className="grid grid-cols-[100px_1.5fr_1fr_120px_120px_120px_130px_130px_140px] gap-4 px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 select-none mb-2">
                        <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
                          TEST UID{" "}
                          <span className="opacity-50 text-[8px] mt-0.5">
                            ▼
                          </span>
                        </div>
                        <div>Name</div>
                        <div>Test Name</div>
                        <div>Total Amount</div>
                        <div>Paid Amount</div>
                        <div>Due Amount</div>
                        <div>Payment Status</div>
                        <div>Test Status</div>
                        <div>Actions</div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col gap-3"
                        >
                          {filteredRecords.map((record, idx) => (
                            <motion.div
                              key={record.uid}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: { delay: idx * 0.01 },
                              }}
                              className={`grid grid-cols-[100px_1.5fr_1fr_120px_120px_120px_130px_130px_140px] gap-4 px-8 py-4 items-center bg-white dark:bg-[#141619] rounded-[24px] shadow-sm border border-slate-200 dark:border-white/5 hover:shadow-md cursor-pointer transition-all hover:-translate-y-[1px] hover:border-emerald-500/20`}
                            >
                              <div
                                className={`text-[13px] font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                              >
                                {record.test_uid}
                              </div>
                              <div
                                className={`text-[13px] font-bold uppercase truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}
                              >
                                {record.patient_name}
                              </div>
                              <div
                                className={`text-[13px] font-bold uppercase ${isDark ? "text-slate-400" : "text-slate-500"}`}
                              >
                                {record.test_name}
                              </div>
                              <div
                                className={`text-[13px] font-black tracking-tight ${isDark ? "text-slate-200" : "text-slate-800"}`}
                              >
                                ₹{Number(record.total_amount).toFixed(2)}
                              </div>
                              <div className="text-[13px] font-black text-emerald-500 tracking-tight">
                                ₹{Number(record.paid_amount).toFixed(2)}
                              </div>
                              <div
                                className={`text-[13px] font-black tracking-tight text-rose-500`}
                              >
                                ₹{Number(record.due_amount).toFixed(2)}
                              </div>
                              <div>
                                <span
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${
                                    record.payment_status.toLowerCase() ===
                                    "paid"
                                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20"
                                      : record.payment_status.toLowerCase() ===
                                          "partial"
                                        ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20"
                                        : "bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-500 border border-rose-200 dark:border-rose-500/20"
                                  }`}
                                >
                                  {record.payment_status
                                    .charAt(0)
                                    .toUpperCase() +
                                    record.payment_status
                                      .slice(1)
                                      .toLowerCase()}
                                </span>
                              </div>
                              <div>
                                <span
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${
                                    record.test_status.toLowerCase() ===
                                    "completed"
                                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20"
                                      : record.test_status.toLowerCase() ===
                                          "pending"
                                        ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20"
                                        : "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20"
                                  }`}
                                >
                                  {record.test_status.charAt(0).toUpperCase() +
                                    record.test_status.slice(1).toLowerCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTest(record);
                                    setIsDetailsModalOpen(true);
                                  }}
                                  className="px-4 py-1.5 rounded-full text-[10px] font-bold bg-[#009b7c] text-white hover:bg-[#008268] transition-colors shadow-sm"
                                >
                                  View
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBillTestId(parseInt(record.uid));
                                    setShowTestBill(true);
                                  }}
                                  className="px-4 py-1.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20 transition-colors shadow-sm"
                                >
                                  Bill
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>

                      {/* Load More Options */}
                      {hasMore && filteredRecords.length > 0 && (
                        <div className="flex justify-center mt-6">
                          <button
                            onClick={() =>
                              fetchTests(page + 1, appliedSearchQuery)
                            }
                            disabled={isLoadingMore}
                            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                              isDark
                                ? "bg-white/5 text-slate-300 hover:bg-white/10"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {isLoadingMore ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Loading...
                              </>
                            ) : (
                              "Load More"
                            )}
                          </button>
                        </div>
                      )}
                      {!hasMore && filteredRecords.length > 0 && (
                        <div className="flex justify-center mt-6">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest opacity-50">
                            End of records
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        <DailyIntelligence
          isOpen={showIntelligence}
          onClose={() => setShowIntelligence(false)}
        />
        <NotesDrawer isOpen={showNotes} onClose={() => setShowNotes(false)} />

        {showChatModal && (
          <ChatModal
            isOpen={showChatModal}
            onClose={() => setShowChatModal(false)}
          />
        )}

        {/* === APPROVALS MODAL === */}
        <AnimatePresence>
          {showApprovals && (
            <div
              className="fixed inset-0 z-[10020] bg-black/20 backdrop-blur-md flex items-center justify-center p-6 md:p-10"
              onClick={(e) =>
                e.target === e.currentTarget && setShowApprovals(false)
              }
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                className={`w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border transition-colors ${isDark ? "bg-[#121412] border-white/5" : "bg-white border-gray-100"}`}
              >
                <div className="px-8 py-6 flex items-center justify-between sticky top-0 z-10 transition-colors">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">
                      Pending Approvals
                    </h2>
                    <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-0.5">
                      Review zero-cost requests
                    </p>
                  </div>
                  <button
                    onClick={() => setShowApprovals(false)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"}`}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="px-6 pb-8 overflow-y-auto custom-scrollbar flex-1">
                  {pendingApprovals.filter((a) => a.type === "test").length ===
                  0 ? (
                    <div className="flex flex-col items-center justify-center py-16 opacity-20">
                      <CheckCircle2
                        size={48}
                        strokeWidth={1}
                        className="mb-3"
                      />
                      <p className="text-sm font-medium">
                        No pending approvals.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingApprovals
                        .filter((a) => a.type === "test")
                        .map((item: any, idx: number) => (
                          <div
                            key={`${item.type}-${item.id}-${idx}`}
                            className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? "bg-white/5 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}
                          >
                            <div className="flex gap-4 items-center">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[12px] font-black uppercase tracking-widest ${item.type === "registration" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"}`}
                                  >
                                    {item.type}
                                  </span>
                                  <span className="text-[10px] opacity-30 font-bold">
                                    {new Date(item.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <h3 className="text-lg font-bold">
                                  {item.patient_name}
                                </h3>
                                <p className="text-xs opacity-50 font-medium">
                                  {item.type === "test"
                                    ? `Test: ${item.test_name}`
                                    : `Consultation`}
                                </p>

                                {item.type === "registration" && (
                                  <p className="text-sm font-bold mt-2">
                                    Amount:{" "}
                                    <span className="text-[#006e1c] dark:text-[#4ade80]">
                                      ₹{item.amount}
                                    </span>
                                  </p>
                                )}

                                {item.type === "test" && (
                                  <div className="flex items-center gap-2 mt-3">
                                    <div
                                      className={`px-3 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"}`}
                                    >
                                      <p className="text-[8px] font-bold uppercase opacity-30 mb-0.5">
                                        Total
                                      </p>
                                      <p className="text-xs font-black">
                                        ₹{item.amount}
                                      </p>
                                    </div>
                                    <div
                                      className={`px-3 py-1.5 rounded-lg border bg-yellow-500/5 border-yellow-500/10`}
                                    >
                                      <p className="text-[8px] font-bold uppercase text-yellow-600 opacity-50 mb-0.5">
                                        Paid
                                      </p>
                                      <p className="text-xs font-black text-yellow-600">
                                        ₹{item.advance_amount || 0}
                                      </p>
                                    </div>
                                    <div
                                      className={`px-3 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"}`}
                                    >
                                      <p className="text-[8px] font-bold uppercase opacity-30 mb-0.5">
                                        Discount
                                      </p>
                                      <p className="text-xs font-black">
                                        ₹{item.discount || 0}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-yellow-500/5 text-yellow-600 dark:text-yellow-500 border border-yellow-500/10 shrink-0">
                              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Awaiting Approval
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isDetailsModalOpen && selectedTest && (
            <TestDetailsModal
              isOpen={isDetailsModalOpen}
              onClose={() => setIsDetailsModalOpen(false)}
              test={selectedTest}
            />
          )}
        </AnimatePresence>

        {showTestBill && billTestId && (
          <TestBillModal
            isOpen={showTestBill}
            onClose={() => {
              setShowTestBill(false);
              setBillTestId(null);
            }}
            testId={billTestId}
          />
        )}

        <KeyboardShortcuts
          shortcuts={shortcuts}
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          onToggle={() => setShowShortcuts((prev) => !prev)}
        />
      </div>
    </div>
  );
};

export default Tests;
