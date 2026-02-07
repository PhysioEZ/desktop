import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  DollarSign,
  CheckCircle2,
  History,
  X,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL, authFetch } from "../config";
import { useAuthStore } from "../store/useAuthStore";
import { useRegistrationStore } from "../store/useRegistrationStore";
import { useThemeStore } from "../store/useThemeStore";
import Sidebar from "../components/Sidebar";
import { toast } from "sonner";

const StatusDropdown = ({
  currentStatus,
  onUpdate,
}: {
  currentStatus: string;
  onUpdate: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
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
    { value: "closed", label: "Keep Closed" },
    { value: "pending", label: "Re-open" },
  ];

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggleOpen}
        className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border bg-rose-500/10 text-rose-600 border-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer"
      >
        <span>Closed</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
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
              className="fixed z-[99999] bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl overflow-hidden flex flex-col p-2 min-w-[160px] border border-slate-200 dark:border-white/5"
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
                                    w-full text-left px-4 py-2.5 text-xs font-semibold rounded-xl transition-all mb-1 last:mb-0
                                    ${
                                      currentStatus === opt.value
                                        ? "bg-emerald-500 text-white"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                    }
                                `}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

interface RegistrationRecord {
  registration_id: number;
  patient_name: string;
  phone_number: string;
  consultation_amount: string;
  status: string;
  refund_status: string;
  created_at: string;
  address: string;
}

const CancelledRegistrations: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();

  // Page State
  const { cancelledRegistrationsCache, setCancelledRegistrationsCache } =
    useRegistrationStore();

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // --- CLIENT SIDE FILTERING ---
  const filteredRegistrations = React.useMemo(() => {
    let data = cancelledRegistrationsCache || [];

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (r: any) =>
          r.patient_name?.toLowerCase().includes(lower) ||
          r.phone_number?.includes(lower) ||
          r.registration_id?.toString().includes(lower),
      );
    }
    return data;
  }, [cancelledRegistrationsCache, search]);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE);

  const paginatedRegistrations = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRegistrations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRegistrations, currentPage]);

  const pagination = {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    total: filteredRegistrations.length,
    total_pages: totalPages || 1,
  };

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedForRefund, setSelectedForRefund] =
    useState<RegistrationRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const fetchRegistrations = async (forceRefresh = false) => {
    if (!user?.branch_id) return;

    if (
      !forceRefresh &&
      cancelledRegistrationsCache &&
      cancelledRegistrationsCache.length > 0
    ) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/reception/registration`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "fetch",
            branch_id: user.branch_id,
            status: "closed",
            limit: 1000,
            page: 1,
          }),
        },
      );
      const result = await response.json();
      if (result.status === "success") {
        setCancelledRegistrationsCache(result.data || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.branch_id) {
      fetchRegistrations();
    }
  }, [user?.branch_id]);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/reception/registration?action=update_status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: newStatus }),
        },
      );
      const result = await response.json();
      if (result.status === "success") {
        toast.success(`Registration marked as ${newStatus}`);
        fetchRegistrations(true);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleInitiateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForRefund || !refundAmount || !user?.branch_id) return;

    setIsProcessingRefund(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/reception/registration?action=refund`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registration_id: selectedForRefund.registration_id,
            refund_amount: refundAmount,
            refund_reason: refundReason,
            branch_id: user.branch_id,
          }),
        },
      );
      const result = await response.json();
      if (result.status === "success") {
        toast.success("Refund initiated successfully");
        setIsRefundModalOpen(false);
        setSelectedForRefund(null);
        setRefundAmount("");
        setRefundReason("");
        fetchRegistrations(true);
      }
    } catch (error) {
      toast.error("Refund failed");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const openRefundModal = (reg: RegistrationRecord) => {
    setSelectedForRefund(reg);
    setRefundAmount(reg.consultation_amount);
    setIsRefundModalOpen(true);
  };

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? "bg-[#050505] text-slate-200" : "bg-[#FAFAFA] text-slate-900"}`}
    >
      <Sidebar />

      {/* === LEFT PANEL (STATS) === */}
      <div
        className={`hidden xl:flex w-[450px] flex-col justify-between p-10 border-r relative shrink-0 transition-colors duration-300 z-50 ${isDark ? "bg-[#0A0A0A] border-[#151515]" : "bg-white border-gray-200"}`}
      >
        <div className="space-y-12 z-10">
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-rose-500 ${isDark ? "bg-[#1C1C1C]" : "bg-rose-50"}`}
            >
              <Trash2 size={22} />
            </div>
            <span className="font-semibold tracking-[0.2em] text-[10px] uppercase text-slate-500">
              PhysioEZ Recovery
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl font-serif font-normal tracking-tight leading-tight text-slate-900 dark:text-slate-100">
              Refund <br />
              <span
                className={`italic ${isDark ? "text-rose-400" : "text-rose-600"}`}
              >
                Queue
              </span>
            </h1>
            <p className="text-slate-500 text-base leading-relaxed max-w-xs">
              Manage cancelled registrations and process patient refunds
              efficiently.
            </p>
          </div>
        </div>

        <div className="space-y-10 w-full flex-1 flex flex-col justify-center py-6">
          <div
            className={`p-8 rounded-[32px] border transition-all duration-300 ${isDark ? "bg-[#121212] border-white/5" : "bg-white border-rose-100 shadow-sm"}`}
          >
            <div className="flex items-center gap-3 opacity-60 mb-4 text-rose-500">
              <AlertCircle size={20} strokeWidth={2} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Cancelled
              </span>
            </div>
            <div
              className={`text-5xl font-medium tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {pagination.total}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 opacity-40 px-2 group">
              <TrendingUp
                size={14}
                className="group-hover:translate-y-[-2px] transition-transform"
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                Financial Recovery
              </span>
            </div>
            <div
              className={`p-8 rounded-[32px] border flex flex-col gap-6 ${isDark ? "bg-[#121212] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}
            >
              <div className="flex justify-between items-center border-b pb-6 border-dashed border-slate-200 dark:border-white/5">
                <div>
                  <div className="text-3xl font-medium text-emerald-600 dark:text-emerald-400">
                    {
                      cancelledRegistrationsCache?.filter(
                        (r: any) => r.refund_status === "initiated",
                      ).length
                    }
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    Processed
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 size={22} />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-3xl font-medium text-rose-500">
                    {
                      cancelledRegistrationsCache?.filter(
                        (r: any) => r.refund_status !== "initiated",
                      ).length
                    }
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    Awaiting Action
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                  <DollarSign size={22} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-0 w-full h-full bg-gradient-to-t from-rose-500/[0.02] to-transparent pointer-events-none" />
      </div>

      {/* === MAIN CONTENT (Right Panel) === */}
      <main className="flex-1 h-screen overflow-hidden relative flex flex-col p-8 lg:p-12 gap-8">
        <div className="flex justify-between items-end shrink-0">
          <div>
            <h2 className="text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-100">
              Cancelled Listings
            </h2>
            <p className="text-slate-500 text-base mt-1">
              Track and manage service cancellations
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/reception/registration")}
              className={`px-6 py-3 border rounded-2xl flex items-center gap-3 transition-all text-xs font-bold uppercase tracking-widest ${isDark ? "bg-[#121212] border-white/5 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"}`}
            >
              <History size={16} /> Active Listings
            </button>
            <button
              onClick={() => fetchRegistrations(true)}
              className={`w-12 h-12 border rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-[#121212] border-white/5 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"} ${isLoading ? "animate-spin" : ""}`}
            >
              <RefreshCw size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div
          className={`flex-1 rounded-[40px] border overflow-hidden flex flex-col shadow-sm transition-colors ${isDark ? "bg-[#0A0A0A] border-white/5" : "bg-white border-slate-200/60"}`}
        >
          <div
            className={`flex flex-col xl:flex-row items-center justify-between gap-6 p-8 border-b ${isDark ? "border-white/5" : "border-slate-100"}`}
          >
            <div
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl border w-full xl:w-96 transition-all ${isDark ? "bg-[#121212] border-white/5 focus-within:border-rose-500/30" : "bg-slate-50 border-slate-100 focus-within:bg-white focus-within:border-rose-500/30 shadow-inner focus-within:shadow-sm"}`}
            >
              <Search size={18} className="opacity-30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cancelled records..."
                className="bg-transparent border-none outline-none text-sm w-full font-medium"
              />
            </div>
          </div>

          <div
            className={`flex items-center px-10 py-5 border-b text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 ${isDark ? "bg-white/[0.02]" : "bg-slate-50/50"}`}
          >
            <div className="w-[8%]">Reg ID</div>
            <div className="flex-1">Patient Info</div>
            <div className="w-[15%]">Fee</div>
            <div className="w-[15%] text-center">Refund</div>
            <div className="w-[15%] text-center">Status</div>
            <div className="w-[15%] text-right">Actions</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center opacity-30 gap-4">
                <RefreshCw size={32} className="animate-spin" />
                <p className="text-xs font-bold uppercase tracking-widest">
                  Scanning records...
                </p>
              </div>
            ) : paginatedRegistrations.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center opacity-30 gap-4">
                <Trash2 size={48} strokeWidth={1} />
                <p className="text-xs font-bold uppercase tracking-widest">
                  No cancelled records found
                </p>
              </div>
            ) : (
              <div className="divide-y dark:divide-white/5 divide-slate-100">
                {paginatedRegistrations.map((reg: any) => (
                  <div
                    key={reg.registration_id}
                    className="flex items-center px-10 py-6 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all group"
                  >
                    <div className="w-[8%] font-mono text-xs opacity-40 font-bold uppercase tracking-widest">
                      #{reg.registration_id}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 transition-colors uppercase tracking-wide">
                        {reg.patient_name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {reg.phone_number} •{" "}
                        {new Date(reg.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="w-[15%] text-sm font-semibold text-slate-700 dark:text-slate-300">
                      ₹
                      {parseFloat(reg.consultation_amount).toLocaleString(
                        "en-IN",
                      )}
                    </div>
                    <div className="w-[15%] flex justify-center">
                      <span
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest ${reg.refund_status === "initiated" ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 dark:bg-white/5 text-slate-400"}`}
                      >
                        {reg.refund_status === "initiated"
                          ? "Refunded"
                          : "Pending"}
                      </span>
                    </div>
                    <div className="w-[15%] flex justify-center">
                      <StatusDropdown
                        currentStatus={reg.status}
                        onUpdate={(val) =>
                          handleUpdateStatus(reg.registration_id, val)
                        }
                      />
                    </div>
                    <div className="w-[15%] text-right">
                      {reg.refund_status !== "initiated" &&
                        parseFloat(reg.consultation_amount) > 0 && (
                          <button
                            onClick={() => openRefundModal(reg)}
                            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                          >
                            Process Refund
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className={`px-10 py-6 border-t flex items-center justify-between shrink-0 ${isDark ? "border-white/5" : "border-slate-100"}`}
          >
            <div className="text-sm font-medium text-slate-500">
              Showing{" "}
              <span className="text-slate-900 dark:text-white font-bold">
                {filteredRegistrations.length}
              </span>{" "}
              entries
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 shadow-sm hover:bg-slate-50"} disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-xs font-bold px-4">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 shadow-sm hover:bg-slate-50"} disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>

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
                    Reg ID: #{selectedForRefund.registration_id}
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
                      max={selectedForRefund.consultation_amount}
                      required
                      className="w-full pl-10 pr-5 py-4 bg-slate-50 dark:bg-white/5 border-none rounded-2xl text-xl font-bold outline-none transition-all focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                  <p className="text-[10px] text-rose-500 font-bold mt-3 uppercase tracking-wide">
                    Available for refund: ₹
                    {selectedForRefund.consultation_amount}
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

export default CancelledRegistrations;
