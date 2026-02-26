import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Trash2,
  History,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL, authFetch } from "../config";
import { useAuthStore } from "../store/useAuthStore";
import { useRegistrationStore } from "../store/useRegistrationStore";
import { useThemeStore } from "../store/useThemeStore";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import { toast } from "sonner";

interface TestRecord {
  uid: number;
  test_uid: string;
  patient_name: string;
  phone_number: string;
  test_name: string;
  total_amount: string;
  paid_amount: string;
  due_amount: string;
  test_status: string;
  payment_status: string;
  refund_status: string;
  created_at: string;
}

const StatusDropdown = ({
  currentStatus,
  onUpdate,
}: {
  currentStatus: string;
  onUpdate: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const close = () => setIsOpen(false);
    if (isOpen) {
      window.addEventListener("click", close);
      window.addEventListener("scroll", close, true);
    }
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [isOpen]);

  const options = [
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggleOpen}
        className="relative flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 bg-rose-500/10 text-rose-600 border-rose-500/10"
      >
        <span>{currentStatus}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed z-[99999] bg-white dark:bg-[#1A1C1E] rounded-2xl shadow-2xl overflow-hidden flex flex-col p-2 min-w-[160px] border border-slate-200 dark:border-white/5"
              style={{ top: coords.top, left: coords.left }}
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onUpdate(opt.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all mb-1 last:mb-0 flex items-center justify-between group
                    ${
                      currentStatus?.toLowerCase() === opt.value?.toLowerCase()
                        ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-black/20"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                    }
                  `}
                >
                  {opt.label}
                  {currentStatus?.toLowerCase() ===
                    opt.value?.toLowerCase() && (
                    <Check size={12} strokeWidth={3} className="opacity-80" />
                  )}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

const CancelledTests: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();

  // Page State
  const { cancelledTestsCache, setCancelledTestsCache } =
    useRegistrationStore();

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // --- CLIENT SIDE FILTERING ---
  const filteredTests = React.useMemo(() => {
    let data = cancelledTestsCache || [];

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (r: any) =>
          r.patient_name?.toLowerCase().includes(lower) ||
          r.phone_number?.includes(lower) ||
          r.test_uid?.toLowerCase().includes(lower) ||
          r.test_name?.toLowerCase().includes(lower),
      );
    }
    return data;
  }, [cancelledTestsCache, search]);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredTests.length / ITEMS_PER_PAGE);

  const paginatedTests = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTests, currentPage]);

  const pagination = {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    total: filteredTests.length,
    total_pages: totalPages || 1,
  };

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedForRefund, setSelectedForRefund] = useState<TestRecord | null>(
    null,
  );
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const fetchCancelledTests = async (forceRefresh = false) => {
    if (!user?.branch_id) return;

    if (!forceRefresh && cancelledTestsCache !== null) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/reception/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fetch",
          branch_id: user.branch_id,
          status: "cancelled",
          limit: 1000,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setCancelledTestsCache(result.data || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch cancelled tests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.branch_id) {
      fetchCancelledTests();
    }
  }, [user?.branch_id]);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleInitiateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForRefund || !refundAmount || !user?.branch_id) return;

    setIsProcessingRefund(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/reception/tests?action=refund`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            test_id: selectedForRefund.uid,
            refund_amount: refundAmount,
            refund_reason: refundReason,
            branch_id: user.branch_id,
          }),
        },
      );
      const result = await response.json();
      if (result.success) {
        toast.success("Refund initiated successfully");
        setIsRefundModalOpen(false);
        setSelectedForRefund(null);
        setRefundAmount("");
        setRefundReason("");
        fetchCancelledTests(true);
      } else {
        toast.error(result.message || "Refund failed");
      }
    } catch (error) {
      toast.error("Refund failed");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const openRefundModal = (test: TestRecord) => {
    setSelectedForRefund(test);
    setRefundAmount(test.paid_amount);
    setIsRefundModalOpen(true);
  };

  const handleUpdateStatus = async (testId: number, status: string) => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/reception/tests?action=update_status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            test_id: testId,
            status: status,
          }),
        },
      );
      const result = await response.json();
      if (result.success) {
        toast.success(`Status updated to ${status}`);
        fetchCancelledTests(true);
      } else {
        toast.error(result.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  return (
    <div
      className={`flex h-screen overflow-hidden transition-colors duration-500 ${isDark ? "bg-[#0A0A0A]" : "bg-white"}`}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <PageHeader
          title="Cancelled Tests"
          subtitle="Diagnostic Recovery"
          icon={Trash2}
          onRefresh={() => fetchCancelledTests(true)}
          isLoading={isLoading}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* === STATS PANEL (Left Column) === */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`hidden xl:flex w-[400px] flex-col justify-between p-8 border-r relative shrink-0 transition-colors duration-300 z-50 ${
              isDark
                ? "bg-[#0A0A0A] border-[#151515]"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="space-y-8 z-10 text-[#1a1c1e] dark:text-[#e3e2e6]">
              <div className="space-y-3">
                <h1 className="text-4xl font-serif font-normal tracking-tight leading-tight">
                  Cancelled{" "}
                  <span
                    className={`italic ${isDark ? "text-rose-400" : "text-rose-600"}`}
                  >
                    Tests
                  </span>
                </h1>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">
                  Financial recovery for voided diagnostic procedures.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-end justify-between p-6 bg-[#F8F9FA] dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trash2 size={80} className="text-rose-500" />
                  </div>

                  <div className="relative z-10">
                    <div className="text-7xl font-medium tracking-tighter leading-none text-rose-950 dark:text-rose-50">
                      {pagination.total}
                    </div>
                    <div className="text-[10px] font-black opacity-50 mt-2 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      Total Cancelled
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-white/5 mt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-4">
                    Refund Statistics
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm group p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-default">
                      <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        Refunded
                      </span>
                      <span className="font-bold text-lg text-emerald-600">
                        {cancelledTestsCache?.filter(
                          (r) => r.refund_status === "initiated",
                        ).length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm group p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-default">
                      <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,113,0.3)]"></span>
                        Awaiting Action
                      </span>
                      <span className="font-bold text-lg text-rose-500">
                        {cancelledTestsCache?.filter(
                          (r) => r.refund_status !== "initiated",
                        ).length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto p-5 rounded-3xl bg-[#0F172A] dark:bg-black/40 text-white relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 opacity-80">
                    <History size={14} className="text-rose-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Diagnostic Recovery
                    </span>
                  </div>
                  <div className="text-sm font-medium opacity-60">
                    Manual Audit Required
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content (Right Panel) */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 custom-scrollbar bg-[#FAFAFA] dark:bg-[#0A0A0A]">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex flex-col gap-8 mb-10">
                {/* Search Bar */}
                <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-2">
                  <div className="relative group w-full xl:max-w-md">
                    <Search
                      size={18}
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-600 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Search cancelled patient, test name or UID..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 rounded-[20px] bg-white dark:bg-[#1A1C1E] border border-gray-100 dark:border-white/5 focus:border-rose-500/30 focus:ring-4 focus:ring-rose-500/5 outline-none text-sm font-medium transition-all shadow-sm"
                    />
                  </div>

                  <button
                    onClick={() => navigate("/reception/tests")}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 text-slate-500 dark:text-[#c4c7c5] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/10 transition-all border border-gray-100 dark:border-white/5 shadow-sm"
                  >
                    <History size={14} className="opacity-50" />
                    Back to Diagnostics
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-6">
                  <RefreshCw
                    size={32}
                    className="animate-spin text-rose-500 opacity-20"
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Scanning Records...
                  </p>
                </div>
              ) : paginatedTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#1a1c1e] rounded-[32px] border border-dashed border-gray-200 dark:border-white/10 shadow-sm">
                  <Trash2
                    size={48}
                    className="text-gray-300 mb-4"
                    strokeWidth={1}
                  />
                  <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">
                    No Cancelled Tests
                  </h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Table Header */}
                  <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-6 px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-black/[0.03] dark:border-white/[0.03] mb-2">
                    <div>Patient & Test</div>
                    <div>Paid Amount</div>
                    <div className="text-center">Refund Status</div>
                    <div className="text-center">Status</div>
                    <div className="text-right">Action</div>
                  </div>

                  <div className="flex flex-col gap-3 pb-20">
                    {paginatedTests.map((test: any) => (
                      <motion.div
                        key={test.uid}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group rounded-[24px] px-8 py-5 border transition-all cursor-pointer relative overflow-hidden grid lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-6 items-center ${
                          isDark
                            ? "bg-[#141619] border-white/5"
                            : "bg-white border-gray-100 shadow-sm hover:border-rose-500/20"
                        }`}
                      >
                        <div className="absolute left-0 top-0 w-1.5 h-full bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex flex-col gap-1.5">
                          <h3 className="text-[17px] font-bold text-[#1a1c1e] dark:text-[#e3e2e6] leading-none group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors">
                            {test.patient_name}
                          </h3>
                          <p className="text-[10px] font-bold text-rose-600/60 uppercase tracking-widest">
                            {test.test_name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 font-bold font-mono text-slate-500">
                              #{test.test_uid}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                              {new Date(test.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="text-base font-black text-[#1a1c1e] dark:text-[#e3e2e6]">
                          ₹
                          {parseFloat(test.paid_amount).toLocaleString("en-IN")}
                        </div>

                        <div className="flex justify-center">
                          <span
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                              test.refund_status === "initiated"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}
                          >
                            {test.refund_status === "initiated"
                              ? "Refunded"
                              : "Pending"}
                          </span>
                        </div>

                        <div className="flex justify-center">
                          <StatusDropdown
                            currentStatus={test.test_status}
                            onUpdate={(status) =>
                              handleUpdateStatus(test.uid, status)
                            }
                          />
                        </div>

                        <div className="flex justify-end">
                          {test.refund_status !== "initiated" &&
                            parseFloat(test.paid_amount) > 0 && (
                              <button
                                onClick={() => openRefundModal(test)}
                                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                              >
                                Refund
                              </button>
                            )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Refund Modal */}
      <AnimatePresence>
        {isRefundModalOpen && selectedForRefund && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRefundModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden relative z-10 border ${isDark ? "bg-[#0A0A0A] border-white/5" : "bg-white border-slate-200"}`}
            >
              <div className="px-8 py-6 border-b flex justify-between items-center transition-colors">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">
                    Process Refund
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Test UID: #{selectedForRefund?.test_uid}
                  </p>
                </div>
                <button
                  onClick={() => setIsRefundModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleInitiateRefund} className="p-8 space-y-8">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">
                    Refund Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      max={selectedForRefund?.paid_amount || "0"}
                      required
                      className="w-full pl-10 pr-5 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-xl font-bold outline-none transition-all focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <p className="text-[10px] text-rose-500 font-bold mt-3 uppercase tracking-wide">
                    Available for refund: ₹
                    {selectedForRefund?.paid_amount || "0"}
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">
                    Reason for Cancellation
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Brief explanation..."
                    rows={3}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-rose-500/20 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessingRefund}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {isProcessingRefund ? (
                    <RefreshCw size={18} className="animate-spin mx-auto" />
                  ) : (
                    "Confirm Refund"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CancelledTests;
