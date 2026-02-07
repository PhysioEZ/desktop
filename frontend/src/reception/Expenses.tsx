import { useState, useEffect, useCallback } from "react";
import {
  PieChart,
  RefreshCw,
  CheckCircle2,
  Plus,
  Filter,
  Wallet,
  TrendingUp,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  Calendar,
  Upload,
  FileText,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { API_BASE_URL, authFetch } from "../config";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import Sidebar from "../components/Sidebar";
import { toast } from "sonner";

interface ExpenseRecord {
  id: number;
  voucher_no: string;
  date: string;
  paid_to: string;
  category: string;
  amount: number;
  payment_method: string;
  status: "Approved" | "Pending" | "Rejected";
  has_bill: boolean;
  reason?: string;
  expense_done_by?: string;
}

interface ExpenseStats {
  total_count: number;
  total_spent: number;
  daily_limit: number;
  daily_rem: number;
  monthly_rem: number;
  monthly_limit: number;
}

const CATEGORIES = [
  "Medical Supplies",
  "Office Supplies",
  "Rent & Utilities",
  "Staff Salary",
  "Maintenance",
  "Marketing",
  "Electricity",
  "Cleaning",
  "Equipment Maintenance",
  "Other Misc",
];

const PAYMENT_METHODS = [
  "Cash",
  "Online Transfer",
  "GPay/PhonePe",
  "Credit Card",
  "Cheque",
];

// Function to convert number to words (Simplified for UI)
const numberToWords = (num: number): string => {
  if (num === 0) return "Zero";
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        "Hundred " +
        (n % 100 !== 0 ? "and " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        "Thousand " +
        (n % 1000 !== 0 ? inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        "Lakh " +
        (n % 100000 !== 0 ? inWords(n % 100000) : "")
      );
    return "";
  };

  return inWords(num).trim() + " Rupees Only";
};

const Expenses = () => {
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();

  // State
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [stats, setStats] = useState<ExpenseStats>({
    total_count: 0,
    total_spent: 0,
    daily_limit: 2000,
    daily_rem: 2000,
    monthly_rem: 50000,
    monthly_limit: 50000,
  });
  const [loading, setLoading] = useState(false);
  const [currentDate] = useState(new Date());

  // Pagination & Filter
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTotal, setShowTotal] = useState(false);

  // Form Temporary State for Live View (Amount in Words)
  const [formAmount, setFormAmount] = useState<number>(0);

  // Initial Data Fetch
  const fetchData = useCallback(async () => {
    if (!user?.branch_id) return;
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/expenses`, {
        method: "POST",
        body: JSON.stringify({
          action: "fetch",
          branch_id: user.branch_id,
          start_date: dateRange.start,
          end_date: dateRange.end,
          page,
          limit: 10,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setExpenses(data.data || []);
        setStats(data.stats || stats);
        setTotalPages(data.total_pages || 1);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to sync expenses");
    } finally {
      setLoading(false);
    }
  }, [user?.branch_id, dateRange, page, stats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append("action", "add");
    formData.append("branch_id", String(user?.branch_id));
    formData.append("employee_id", String(user?.employee_id));

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/expenses`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Expense recorded successfully");
        setIsAddModalOpen(false);
        setFormAmount(0);
        fetchData();
      } else {
        toast.error(data.message || "Failed to add expense");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (val: number | string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val));
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "pending":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "rejected":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? "bg-[#050505] text-slate-200" : "bg-[#FAFAFA] text-slate-900"}`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
                input[type="date"]::-webkit-calendar-picker-indicator {
                    background: transparent;
                    bottom: 0;
                    color: transparent;
                    cursor: pointer;
                    height: auto;
                    left: 0;
                    position: absolute;
                    right: 0;
                    top: 0;
                    width: auto;
                }
            `,
        }}
      />
      <Sidebar />

      {/* === LEFT PANEL (STATS) === */}
      <div
        className={`hidden xl:flex w-[380px] flex-col justify-between p-7 border-r relative shrink-0 transition-colors duration-300 z-50 ${isDark ? "bg-[#0A0A0A] border-[#1A1A1A]" : "bg-white border-slate-100"}`}
      >
        {/* Decorative background accent */}
        <div
          className={`absolute top-0 right-0 w-32 h-64 opacity-20 blur-[100px] pointer-events-none rounded-full ${isDark ? "bg-emerald-500/20" : "bg-emerald-500/10"}`}
        />

        <div className="space-y-7 z-10">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-emerald-500 ${isDark ? "bg-[#1C1C1C]" : "bg-emerald-50"}`}
            >
              <PieChart size={18} />
            </div>
            <span className="font-bold tracking-[0.2em] text-[8px] uppercase text-slate-400">
              PhysioEZ Analytics
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-serif font-normal tracking-tight leading-tight text-slate-900 dark:text-slate-100">
              Expense <br />
              <span
                className={`italic font-medium ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
              >
                Summary
              </span>
            </h1>
            <p className="text-slate-500 text-xs leading-relaxed max-w-[240px]">
              Branch operational performance for{" "}
              {format(currentDate, "MMMM yyyy")}.
            </p>
          </div>
        </div>

        {/* Vertical Stats Stack */}
        <div className="space-y-4 w-full flex-1 flex flex-col justify-center py-4 z-10">
          {/* Stat 1: Total Spent */}
          <div
            className={`p-6 rounded-[24px] border transition-all duration-300 relative overflow-hidden group ${isDark ? "bg-[#121212] border-white/[0.03] hover:border-emerald-500/20" : "bg-white border-slate-100 shadow-sm hover:border-emerald-500/20"}`}
          >
            <div className="flex items-center gap-2.5 opacity-60 mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Wallet size={16} strokeWidth={2} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Monthly Spending
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div
                className={`text-3xl font-semibold tracking-tight truncate ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {showTotal ? fmt(stats.total_spent) : "••••••"}
              </div>
              <button
                onClick={() => setShowTotal(!showTotal)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400 shrink-0"
              >
                {showTotal ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="absolute -bottom-1 -right-1 w-12 h-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
              <Wallet size={48} />
            </div>
          </div>

          {/* Compact Budgets */}
          <div
            className={`p-6 rounded-[24px] border space-y-5 ${isDark ? "bg-[#121212] border-white/[0.03]" : "bg-white border-slate-100 shadow-sm"}`}
          >
            <div className="flex items-center justify-between group">
              <div className="space-y-0.5">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  Daily Balance
                </div>
                <div
                  className={`text-xl font-semibold leading-none pt-1 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {fmt(stats.daily_rem)}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-emerald-500/5 text-emerald-500 opacity-60">
                <CheckCircle2 size={16} />
              </div>
            </div>

            <div className="h-[1px] w-full bg-slate-100 dark:bg-white/[0.02] border-dashed border-b" />

            <div className="flex items-center justify-between group">
              <div className="space-y-0.5">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                  Monthly Rem.
                </div>
                <div
                  className={`text-xl font-semibold leading-none pt-1 text-slate-400`}
                >
                  {fmt(stats.monthly_rem)}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-blue-500/5 text-blue-500 opacity-60">
                <Receipt size={16} />
              </div>
            </div>
          </div>

          {/* Stat 3: Allocation */}
          <div
            className={`p-6 rounded-[24px] border transition-all duration-300 relative overflow-hidden ${isDark ? "bg-emerald-500/[0.02] border-emerald-500/10" : "bg-emerald-50/30 border-emerald-100"}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp
                size={14}
                className="text-emerald-500"
                strokeWidth={2.5}
              />
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Branch Limit
              </span>
            </div>
            <div className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 leading-none">
              {fmt(stats.monthly_limit)}
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-dashed border-slate-200 dark:border-white/5 flex items-center justify-between z-10">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-300 mb-0.5 leading-none">
              Security Protocol
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase leading-none">
              End-to-End Encrypted
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/10">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* === MAIN CONTENT (Right Panel) === */}
      <main className="flex-1 h-screen overflow-hidden relative flex flex-col p-8 lg:p-12 gap-8">
        {/* Global Header */}
        <div className="flex justify-between items-end shrink-0">
          <div>
            <h2 className="text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-100">
              Expense Center
            </h2>
            <p className="text-slate-500 text-base mt-1">
              Monitor clinical and operational expenditures
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              className={`w-12 h-12 border rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-[#121212] border-white/5 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"} ${loading ? "animate-spin" : ""}`}
            >
              <RefreshCw size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Main Card (Filter + Table Container) */}
        <div
          className={`flex-1 rounded-[40px] border overflow-hidden flex flex-col shadow-sm transition-colors ${isDark ? "bg-[#0A0A0A] border-white/5" : "bg-white border-slate-200/60"}`}
        >
          {/* Toolbar Row */}
          <div
            className={`flex flex-col xl:flex-row items-center justify-between gap-6 p-8 border-b ${isDark ? "border-white/5" : "border-slate-100"}`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-4 px-6 py-3.5 rounded-2xl border ${isDark ? "bg-[#121212] border-white/5" : "bg-slate-50 border-slate-100"} transition-all`}
              >
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-emerald-500" />
                  <div className="flex items-center gap-2">
                    <div className="relative group/start">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => {
                          setDateRange((prev) => ({
                            ...prev,
                            start: e.target.value,
                          }));
                          setPage(1);
                        }}
                        onClick={(e) => (e.target as any).showPicker?.()}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 pointer-events-none group-hover/start:text-indigo-500 transition-colors">
                        {format(new Date(dateRange.start), "dd MMM yyyy")}
                      </span>
                    </div>
                    <div className="w-5 h-[1.5px] bg-slate-200 dark:bg-white/10 mx-1" />
                    <div className="relative group/end">
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => {
                          setDateRange((prev) => ({
                            ...prev,
                            end: e.target.value,
                          }));
                          setPage(1);
                        }}
                        onClick={(e) => (e.target as any).showPicker?.()}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 pointer-events-none group-hover/end:text-indigo-500 transition-colors">
                        {format(new Date(dateRange.end), "dd MMM yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setDateRange({
                    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
                    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
                  });
                  setPage(1);
                }}
                className={`p-3.5 rounded-2xl border transition-all ${isDark ? "bg-[#121212] border-white/5 hover:bg-white/10 text-slate-400" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-500 shadow-sm"}`}
                title="Reset to current month"
              >
                <Filter size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-[#6366f1] text-white text-sm font-medium hover:bg-[#4f46e5] transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
              >
                <Plus size={20} /> Add Expense
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div
            className={`flex items-center px-10 py-5 border-b text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 ${isDark ? "bg-white/[0.02]" : "bg-slate-50/50"}`}
          >
            <div className="w-[10%]">Voucher</div>
            <div className="w-[12%]">Date</div>
            <div className="w-[18%]">Paid To</div>
            <div className="flex-1">Category / Reason</div>
            <div className="w-[12%] text-right">Amount</div>
            <div className="w-[12%] text-center">Payment</div>
            <div className="w-[10%] text-center">Status</div>
            <div className="w-[8%] text-right">Bill</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
                <RefreshCw size={48} className="animate-spin" />
                <p className="text-xs font-bold uppercase tracking-widest">
                  Syncing Records...
                </p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-20 gap-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`w-24 h-24 rounded-[32px] flex items-center justify-center transition-colors ${isDark ? "bg-white/5 text-slate-700" : "bg-slate-50 text-slate-300"}`}
                >
                  <Receipt size={48} strokeWidth={1} />
                </motion.div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-medium text-slate-900 dark:text-slate-200">
                    No expenses recorded
                  </h3>
                  <p className="text-sm text-slate-400 font-normal">
                    Add your first transaction for this period
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y dark:divide-white/5 divide-slate-100">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center px-10 py-6 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="w-[10%] font-mono text-xs opacity-40 font-semibold">
                      #{exp.voucher_no || exp.id}
                    </div>
                    <div className="w-[12%] text-sm font-medium">
                      {format(new Date(exp.date), "dd MMM yyyy")}
                    </div>
                    <div className="w-[18%]">
                      <div className="text-sm font-semibold uppercase tracking-tight">
                        {exp.paid_to}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-1">
                        {exp.category}
                      </div>
                      <div className="text-sm opacity-60 line-clamp-1">
                        {exp.reason || "N/A"}
                      </div>
                    </div>
                    <div className="w-[12%] text-right text-base font-semibold text-slate-900 dark:text-white">
                      {fmt(exp.amount)}
                    </div>
                    <div className="w-[12%] text-center text-[10px] font-semibold uppercase tracking-widest opacity-40">
                      {exp.payment_method}
                    </div>
                    <div className="w-[10%] flex justify-center">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest ${getStatusStyle(exp.status)}`}
                      >
                        {exp.status}
                      </span>
                    </div>
                    <div className="w-[8%] text-right">
                      {exp.has_bill ? (
                        <button className="p-2 hover:bg-emerald-500/10 rounded-xl text-emerald-500 transition-colors">
                          <FileText size={18} />
                        </button>
                      ) : (
                        <div className="p-2 opacity-10">
                          <EyeOff size={18} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer / Pagination */}
          <div
            className={`px-10 py-6 border-t flex items-center justify-between shrink-0 ${isDark ? "border-white/5" : "border-slate-100"}`}
          >
            <div className="text-sm font-medium text-slate-500">
              Showing{" "}
              <span className="text-slate-900 dark:text-white font-bold">
                {expenses.length}
              </span>{" "}
              entries
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 shadow-sm hover:bg-slate-50"} disabled:opacity-20`}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-xs font-bold px-4">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 shadow-sm hover:bg-slate-50"} disabled:opacity-20`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* === ADD EXPENSE MODAL (REFACTORED BASED ON IMAGE) === */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`w-full max-w-[850px] rounded-[32px] shadow-2xl overflow-hidden relative z-10 p-1 font-sans ${isDark ? "bg-[#1A1C1E]" : "bg-white"}`}
            >
              <form
                onSubmit={handleAddExpense}
                className="flex flex-col h-full"
              >
                {/* Modal Header */}
                <div className="px-12 pt-12 pb-8 flex justify-between items-start">
                  <div>
                    <h3 className="text-[32px] font-bold tracking-tight text-[#6366f1]">
                      Add New Expense
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                      Create a new expense voucher
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-slate-500 mt-1"
                  >
                    <X size={22} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Form Content */}
                <div className="px-12 pb-12 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
                  {/* Line 1: Voucher No & Date */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1">
                        Voucher No.
                      </label>
                      <input
                        disabled
                        placeholder="Auto-generated"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-base font-semibold text-slate-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1">
                        Date <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <input
                          name="date"
                          type="date"
                          required
                          defaultValue={format(new Date(), "yyyy-MM-dd")}
                          onClick={(e) => (e.target as any).showPicker?.()}
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-base font-semibold text-slate-900 dark:text-white outline-none ring-2 ring-transparent focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all cursor-pointer"
                        />
                        <Calendar
                          size={18}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Line 2: Paid To */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1">
                      Paid To <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      name="paid_to"
                      required
                      placeholder="Recipient Name"
                      className="w-full px-6 py-5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 outline-none ring-2 ring-transparent focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                    />
                  </div>

                  {/* Line 3: Expense Done By & Category */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1">
                        Expense Done By{" "}
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        name="expense_done_by"
                        required
                        placeholder="Staff Name"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 outline-none ring-2 ring-transparent focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1">
                        Category{" "}
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <select
                        name="category"
                        required
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-base font-semibold text-slate-900 dark:text-white outline-none ring-2 ring-transparent focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- Select Category --</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Line 4: Amount & Payment Method */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1">
                        Amount (₹){" "}
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-xl group-focus-within:text-indigo-600 transition-colors">
                          ₹
                        </div>
                        <input
                          name="amount"
                          type="number"
                          required
                          onChange={(e) =>
                            setFormAmount(Number(e.target.value))
                          }
                          placeholder="0.00"
                          className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-base font-semibold text-slate-900 dark:text-white outline-none ring-2 ring-transparent focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1">
                        Payment Method{" "}
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <select
                        name="payment_method"
                        required
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-base font-semibold text-slate-900 dark:text-white outline-none ring-2 ring-transparent focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- Select Method --</option>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Line 5: Being (Description) */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1">
                      Being (Description)
                    </label>
                    <textarea
                      name="reason"
                      rows={3}
                      placeholder="Enter details..."
                      className="w-full px-6 py-6 bg-[#f5f7ff] dark:bg-white/[0.02] border-2 border-indigo-500/20 rounded-[24px] text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-transparent transition-all overflow-hidden resize-none"
                    />
                  </div>

                  {/* Line 6: Amount in Words */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-2">
                      Amount in Words
                    </label>
                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide min-h-[1.5rem]">
                      {formAmount > 0 ? numberToWords(formAmount) : ""}
                    </div>
                  </div>

                  {/* Line 7: Bill Upload (Subtle) */}
                  <div className="pt-6 border-t border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400">
                          <Upload size={22} />
                        </div>
                        <div>
                          <p className="text-sm font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                            Upload Bill
                          </p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            JPG, PNG or PDF supported
                          </p>
                        </div>
                      </div>
                      <input
                        name="bill_image"
                        type="file"
                        className="hidden"
                        id="bill-upload-modal"
                      />
                      <label
                        htmlFor="bill-upload-modal"
                        className="px-6 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-all text-slate-700 dark:text-slate-300"
                      >
                        Browse Files
                      </label>
                    </div>
                  </div>
                </div>

                {/* Footer Area */}
                <div className="px-12 py-10 flex justify-end items-center bg-slate-50/30 dark:bg-white/[0.01] border-t border-slate-200 dark:border-white/10">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-[#6366f1] text-white text-base font-semibold hover:bg-[#4f46e5] text-white shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={20} strokeWidth={3} /> Save Expense Record
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Expenses;
