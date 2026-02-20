import { useState, useEffect } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useThemeStore } from "../store/useThemeStore";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { useAuthStore } from "../store/useAuthStore";
import { API_BASE_URL, authFetch } from "../config";

import DailyIntelligence from "../components/DailyIntelligence";
import NotesDrawer from "../components/NotesDrawer";
import ChatModal from "../components/Chat/ChatModal";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import TestDetailsModal from "../components/reception/TestDetailsModal";

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
  const { isDark } = useThemeStore();
  const { user: _user } = useAuthStore();

  // State
  const [records, setRecords] = useState<TestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    total_revenue: 0,
    total_paid: 0,
    total_due: 0,
  });

  const [refreshCooldown, setRefreshCooldown] = useState(0);

  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  const [selectedTest, setSelectedTest] = useState<TestRecord | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Filter Logic
  // We apply the tab filter locally over whatever records were fetched
  const filteredRecords = records.filter((record) => {
    if (activeTab === "All") return true;
    return record.test_status.toLowerCase() === activeTab.toLowerCase();
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

  const fetchTests = async (pageNum = 1, searchParam = appliedSearchQuery) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const params = new URLSearchParams();
      params.append("action", "fetch");

      const bodyData: any = { action: "fetch", page: pageNum, limit: 15 };
      if (searchParam) {
        bodyData.search = searchParam;
      }
      // Note: we do not send status filter to backend so it always returns everything

      const response = await authFetch(
        `${API_BASE_URL}/reception/tests?${params.toString()}`,
        {
          method: "POST",
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

        // Update stats only on initial fetch so we don't mess up aggregated stats for the page
        if (pageNum === 1) {
          setStats({
            total: res.stats.total || 0,
            completed: res.stats.completed || 0,
            pending: res.stats.pending || 0,
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

  useEffect(() => {
    fetchTests(1, appliedSearchQuery);
  }, []);

  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(() => setRefreshCooldown((p) => p - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  const handleRefresh = () => {
    if (refreshCooldown > 0) return;
    fetchTests(1, appliedSearchQuery);
    setRefreshCooldown(30);
  };

  const handleSearchClick = () => {
    const trimmed = searchQuery.trim();
    if (trimmed === "" && appliedSearchQuery === "") return;
    if (trimmed === appliedSearchQuery) return;

    setAppliedSearchQuery(trimmed);
    fetchTests(1, trimmed);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
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
          isLoading={isLoading}
          onShowIntelligence={() => setShowIntelligence(true)}
          onShowNotes={() => setShowNotes(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* === LEFT PANEL: SUMMARY === */}
          <aside
            className={`w-[500px] flex flex-col border-r overflow-y-auto custom-scrollbar p-8 space-y-10 transition-colors duration-300 ${isDark ? "bg-[#0A0B0A] border-white/5" : "bg-white border-gray-100"}`}
          >
            {/* Today's Summary */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Today's Summary
                </h3>
                <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest animate-pulse">
                  <Activity size={10} /> Live
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-6 rounded-[24px] border transition-all hover:scale-[1.02] cursor-default ${isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100 shadow-sm"}`}
                >
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Total Tests
                  </p>
                  <p className="text-3xl font-black tracking-tight">
                    {stats.total}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                    <TrendingUp size={12} /> +12%
                  </div>
                </div>
                <div
                  onClick={() => setShowApprovals(true)}
                  className={`p-6 rounded-[24px] border transition-all hover:scale-[1.02] cursor-pointer ${isDark ? "bg-white/[0.02] border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)]" : "bg-white border-slate-100 shadow-xl shadow-black/5"}`}
                >
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Pending
                  </p>
                  <p className="text-3xl font-black tracking-tight text-amber-500">
                    {pendingApprovals.filter((a) => a.type === "test").length}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Needs Action
                  </div>
                </div>
              </div>

              <div
                className={`p-6 rounded-[24px] bg-gradient-to-br from-[#0c4a48] to-[#062d2c] text-white shadow-2xl relative overflow-hidden group`}
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
                {/* Abstract background shape */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
              </div>
            </div>

            {/* Test Types Distribution */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Test Types
                </h3>
              </div>

              <div className="space-y-3">
                {[
                  {
                    name: "EEG (Brain Test)",
                    count: 24,
                    progress: 65,
                    color: "bg-indigo-500",
                  },
                  {
                    name: "NCV (Nerve Test)",
                    count: 18,
                    progress: 45,
                    color: "bg-emerald-500",
                  },
                  {
                    name: "BERA (Hearing Test)",
                    count: 12,
                    progress: 30,
                    color: "bg-rose-500",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-colors ${isDark ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]" : "bg-white border-slate-100 hover:bg-slate-50"}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-bold opacity-70">
                        {item.name}
                      </span>
                      <span className="text-xs font-black">{item.count}</span>
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
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Important Info
              </h3>
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
            <div className="px-6 py-4 flex items-center justify-between border-b dark:border-white/5 border-gray-100 bg-white/50 dark:bg-black/20 backdrop-blur-sm z-10 sticky top-0">
              <div
                className={`flex items-center gap-3 px-2 py-1.5 rounded-xl border ${isDark ? "bg-[#1A1C1A] border-white/5" : "bg-white border-gray-200 shadow-sm"} min-w-[480px] max-w-xl`}
              >
                <div className="flex-1 flex items-center gap-3 px-2">
                  <Search size={16} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patient, uid..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
                    className="bg-transparent border-none outline-none text-sm w-full font-medium"
                  />
                </div>
                <button
                  onClick={handleSearchClick}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#009b7c] text-white hover:bg-[#008268] transition-colors shadow-sm"
                >
                  Search
                </button>
              </div>

              <div
                className={`flex p-1 rounded-xl border ${isDark ? "bg-[#121412] border-white/5" : "bg-gray-100/50 border-gray-200"}`}
              >
                {["All", "Pending", "Completed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === tab
                        ? isDark
                          ? "bg-[#1A1C1A] text-white shadow-sm"
                          : "bg-white text-gray-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
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
                                <button className="px-4 py-1.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20 transition-colors shadow-sm">
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
                    <CheckCircle2 size={48} strokeWidth={1} className="mb-3" />
                    <p className="text-sm font-medium">No pending approvals.</p>
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
                                      ₹0
                                    </p>
                                  </div>
                                  <div
                                    className={`px-3 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"}`}
                                  >
                                    <p className="text-[8px] font-bold uppercase opacity-30 mb-0.5">
                                      Discount
                                    </p>
                                    <p className="text-xs font-black">₹0</p>
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

      <KeyboardShortcuts
        shortcuts={[]}
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        onToggle={() => setShowShortcuts((p) => !p)}
      />

      <TestDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTest(null);
        }}
        test={selectedTest}
      />
    </div>
  );
};

export default Tests;
