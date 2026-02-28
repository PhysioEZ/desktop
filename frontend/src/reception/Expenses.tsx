import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { API_BASE_URL, authFetch, FILE_BASE_URL } from "../config";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useSmartRefresh } from "../hooks/useSmartRefresh";
import Sidebar from "../components/Sidebar";
import { toast } from "sonner";
import ChatModal from "../components/Chat/ChatModal";
import LogoutConfirmation from "../components/LogoutConfirmation";
import NotesDrawer from "../components/NotesDrawer";
import DailyIntelligence from "../components/DailyIntelligence";
import PageHeader from "../components/PageHeader";

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
  bill_path?: string;
  reason?: string;
  expense_done_by?: string;
}

interface ExpenseStats {
  total_count: number;
  total_spent: number;
  monthly_spent: number;
  daily_limit: number;
  daily_rem: number;
  monthly_rem: number;
  monthly_limit: number;
}

// Redundant static arrays removed as they are now fetched from form_options API.

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
  const { user, logout } = useAuthStore();
  const { isDark } = useThemeStore();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // State
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [stats, setStats] = useState<ExpenseStats>({
    total_count: 0,
    total_spent: 0,
    monthly_spent: 0,
    daily_limit: 2000,
    daily_rem: 2000,
    monthly_rem: 50000,
    monthly_limit: 50000,
  });
  const [loading, setLoading] = useState(false);
  const [currentDate] = useState(new Date());
  const [showChatModal, setShowChatModal] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const { smartRefresh, isRefreshing } = useSmartRefresh();

  // Pagination & Filter
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  // Modal & Preview State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<
    { method_code: string; method_name: string }[]
  >([]);

  // Form Temporary State for Live View
  const [formAmount, setFormAmount] = useState<number>(0);
  const [showTotal, setShowTotal] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [otherCategory, setOtherCategory] = useState("");

  // Debounced search effect
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/reception/form_options`);
        const data = await res.json();
        if (data.status === "success") {
          setCategories(data.data.expenseCategories || []);
          setPaymentMethods(data.data.paymentMethods || []);
        }
      } catch (err) {
        console.error("Error fetching options:", err);
      }
    };
    fetchOptions();
  }, []);

  // Initial Data Fetch
  const handleViewBill = (path: string) => {
    if (!path) return;
    const fullUrl = `${FILE_BASE_URL}/${path}`;
    setPreviewUrl(fullUrl);
    setIsPreviewModalOpen(true);
  };

  const handleTableBillUpload = async (file: File, expenseId: number) => {
    const formData = new FormData();
    formData.append("action", "update_bill");
    formData.append("expense_id", String(expenseId));
    formData.append("bill_image", file);

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/expenses`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Bill updated successfully");
        fetchData();
      } else {
        toast.error(data.message || "Failed to upload bill");
      }
    } catch {
      toast.error("Upload failed");
    }
  };

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
          search: debouncedSearch,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setExpenses(data.data || []);
        if (data.stats) setStats(data.stats);
        setTotalPages(data.total_pages || 1);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to sync expenses");
    } finally {
      setLoading(false);
    }
  }, [dateRange, page, debouncedSearch, user?.branch_id]);

  const handleRefresh = useCallback(() => {
    if (refreshCooldown > 0 || !user?.branch_id) return;

    smartRefresh("expenses", {
      onSuccess: () => {
        fetchData();
        setRefreshCooldown(30);
      },
    });
  }, [refreshCooldown, user?.branch_id, fetchData, smartRefresh]);

  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setTimeout(
        () => setRefreshCooldown(refreshCooldown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [refreshCooldown]);

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
    formData.append("amount_in_words", numberToWords(formAmount));

    // Handle "Other" category
    if (selectedCategory === "Other") {
      formData.set("category", otherCategory);
    }

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
      <Sidebar onShowChat={() => setShowChatModal(true)} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <PageHeader
          title="Expense Registry"
          subtitle="Financial Tracking"
          icon={Wallet}
          onRefresh={handleRefresh}
          refreshCooldown={refreshCooldown}
          isLoading={loading || isRefreshing}
          onShowIntelligence={() => setShowIntelligence(true)}
          onShowNotes={() => setShowNotes(true)}
        />
        <div className="flex-1 flex overflow-hidden">
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
              {/* Stat 0: Transaction Volume (New) */}
              <div
                className={`p-6 rounded-[24px] border transition-all duration-300 relative overflow-hidden group ${isDark ? "bg-[#121212] border-white/[0.03] hover:border-indigo-500/20" : "bg-white border-slate-100 shadow-sm hover:border-indigo-500/20"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5 opacity-60">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                      <Receipt size={16} strokeWidth={2} />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                      Transaction Volume
                    </span>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div
                      className={`text-3xl font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {stats.total_count}
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                      Records for Period
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-indigo-500/5 text-indigo-500">
                    <CreditCard size={18} strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {/* Stat 1: Total Spent */}
              <div
                className={`p-6 rounded-[24px] border transition-all duration-300 relative overflow-hidden group ${isDark ? "bg-[#121212] border-white/[0.03] hover:border-emerald-500/20" : "bg-white border-slate-100 shadow-sm hover:border-emerald-500/20"}`}
              >
                <div className="flex items-center gap-2.5 opacity-60 mb-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Period Spending
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
                <div className="mt-1 flex items-center justify-between opacity-40">
                  <span className="text-[8px] font-bold uppercase">
                    Monthly Spent
                  </span>
                  <span className="text-[10px] font-mono">
                    {fmt(stats.monthly_spent)}
                  </span>
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
                  {/* Search Bar */}
                  <div
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${isDark ? "bg-[#121212] border-white/5 focus-within:border-emerald-500/30" : "bg-slate-50 border-slate-100 focus-within:border-emerald-500/30"}`}
                  >
                    <Filter size={18} className="text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search voucher, recipient..."
                      className="bg-transparent border-none outline-none text-sm font-medium w-64 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>

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
                <div className="w-[8%] text-right pr-4">Actions</div>
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
                            <button
                              onClick={() =>
                                handleViewBill(exp.bill_path || "")
                              }
                              className="p-2 hover:bg-indigo-500/10 rounded-xl text-indigo-500 transition-colors"
                              title="View Receipt"
                            >
                              <FileText size={18} />
                            </button>
                          ) : (
                            <div className="relative inline-block">
                              <input
                                type="file"
                                className="hidden"
                                id={`upload-${exp.id}`}
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleTableBillUpload(file, exp.id);
                                }}
                              />
                              <label
                                htmlFor={`upload-${exp.id}`}
                                className="p-2 hover:bg-emerald-500/10 rounded-xl text-emerald-500 transition-colors cursor-pointer inline-block"
                                title="Upload Receipt"
                              >
                                <Upload size={18} />
                              </label>
                            </div>
                          )}
                        </div>
                        <div className="w-[8%] text-right pr-4">
                          <button
                            onClick={() => {
                              setSelectedExpense(exp);
                              setIsViewModalOpen(true);
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 group-hover:text-indigo-500 transition-all active:scale-90"
                          >
                            <Eye size={18} />
                          </button>
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

          {/* === VIEW EXPENSE MODAL (PREMIUM DETAILS) === */}
          <AnimatePresence>
            {isViewModalOpen && selectedExpense && (
              <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsViewModalOpen(false)}
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className={`w-full max-w-2xl rounded-[48px] shadow-2xl relative z-10 overflow-hidden border transition-colors ${isDark ? "bg-[#0A0A0A] border-white/10" : "bg-white border-slate-200"}`}
                >
                  {/* Branding Strip */}
                  <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

                  <div className="p-12">
                    <div className="flex justify-between items-start mb-10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <FileText size={22} />
                          </div>
                          <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Voucher Details
                          </h3>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                          Audit ID: #EXP-{selectedExpense.id}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsViewModalOpen(false)}
                        className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-y-10 gap-x-12 mb-12">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Voucher Number
                        </p>
                        <p className="text-base font-bold text-slate-900 dark:text-white font-mono">
                          {selectedExpense.voucher_no || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Transaction Date
                        </p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          {format(
                            new Date(selectedExpense.date),
                            "dd MMMM yyyy",
                          )}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Paid To
                        </p>
                        <p className="text-base font-bold text-indigo-500 uppercase italic">
                          {selectedExpense.paid_to}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Expense Done By
                        </p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          {selectedExpense.expense_done_by || "Unspecified"}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Accounting Category
                        </p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          {selectedExpense.category}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Voucher Status
                        </p>
                        <span
                          className={`inline-flex px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusStyle(selectedExpense.status)}`}
                        >
                          {selectedExpense.status}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Payment Method
                        </p>
                        <p className="text-base font-bold text-slate-900 dark:text-white uppercase">
                          {selectedExpense.payment_method}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          Amount Invoiced
                        </p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                          {fmt(selectedExpense.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 rounded-[32px] bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                          Being (Description)
                        </p>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                          "
                          {selectedExpense.reason ||
                            "No detailed description provided."}
                          "
                        </p>
                      </div>

                      <div className="p-6 rounded-[32px] bg-emerald-500/[0.03] border border-emerald-500/10 border-dashed">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2">
                          Authenticated Words
                        </p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                          {numberToWords(selectedExpense.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-12 flex items-center justify-between">
                      {selectedExpense.has_bill && (
                        <button
                          onClick={() =>
                            handleViewBill(selectedExpense.bill_path || "")
                          }
                          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                        >
                          <FileText size={18} /> View Receipt
                        </button>
                      )}
                      <button
                        onClick={() => setIsViewModalOpen(false)}
                        className="px-10 py-4 rounded-2xl bg-indigo-500 text-white text-sm font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-all ml-auto"
                      >
                        Close Preview
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

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
                  initial={{ opacity: 0, y: 30, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.98 }}
                  className={`w-full max-w-3xl rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden relative z-10 border transition-colors ${isDark ? "bg-[#0D0D0D] border-white/10" : "bg-white border-slate-200"}`}
                >
                  <form
                    onSubmit={handleAddExpense}
                    className="flex flex-col h-full max-h-[90vh]"
                  >
                    {/* Header Section */}
                    <div className="px-10 pt-10 pb-6 flex justify-between items-start shrink-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Plus size={24} />
                          </div>
                          <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                            Record Expenditure
                          </h3>
                        </div>
                        <p className="text-sm text-slate-500 font-medium pl-1">
                          Generate a new audit-ready expense voucher
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    {/* Form Body Start */}
                    <div className="px-10 pb-10 space-y-7 overflow-y-auto custom-scrollbar flex-1">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            Voucher Number
                          </label>
                          <input
                            disabled
                            placeholder="Auto-generated"
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl text-base font-semibold text-slate-400 italic outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            Transaction Date
                          </label>
                          <div className="relative group">
                            <input
                              name="date"
                              type="date"
                              required
                              defaultValue={format(new Date(), "yyyy-MM-dd")}
                              onClick={(e) => (e.target as any).showPicker?.()}
                              className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl text-base font-semibold text-slate-900 dark:text-white outline-none ring-2 ring-transparent focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all cursor-pointer"
                            />
                            <Calendar
                              size={18}
                              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                          Beneficiary / Recipient
                        </label>
                        <div className="relative group">
                          <input
                            name="paid_to"
                            required
                            placeholder="Who received this payment?"
                            className="w-full px-12 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/10 outline-none ring-2 ring-transparent focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all"
                          />
                          <Wallet
                            size={18}
                            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            Procured By
                          </label>
                          <input
                            name="expense_done_by"
                            required
                            placeholder="Staff member"
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/10 outline-none ring-2 ring-transparent focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            Account Category
                          </label>
                          <select
                            name="category"
                            required
                            value={selectedCategory}
                            onChange={(e) =>
                              setSelectedCategory(e.target.value)
                            }
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl text-base font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500/30 transition-all appearance-none cursor-pointer"
                          >
                            <option value="">-- Choose Category --</option>
                            {categories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                            <option value="Other">Other (Custom)</option>
                          </select>
                        </div>
                      </div>

                      {selectedCategory === "Other" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-2"
                        >
                          <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest pl-1">
                            Specify Detail Category
                          </label>
                          <input
                            required
                            value={otherCategory}
                            onChange={(e) => setOtherCategory(e.target.value)}
                            placeholder="Enter account head..."
                            className="w-full px-5 py-4 bg-emerald-500/[0.02] border border-emerald-500/20 rounded-2xl text-base font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                          />
                        </motion.div>
                      )}

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            Amount (INR)
                          </label>
                          <div className="relative group">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg group-focus-within:text-emerald-500 transition-colors">
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
                              className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl text-base font-semibold text-slate-900 dark:text-white outline-none ring-2 ring-transparent focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            Payment Instrument
                          </label>
                          <select
                            name="payment_method"
                            required
                            value={selectedMethod}
                            onChange={(e) => setSelectedMethod(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl text-base font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500/30 transition-all appearance-none cursor-pointer"
                          >
                            <option value="">-- Mode of Payment --</option>
                            {paymentMethods.map((m) => (
                              <option key={m.method_code} value={m.method_code}>
                                {m.method_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {selectedMethod.toLowerCase() === "cheque" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-2"
                        >
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                            Cheque Reference Details
                          </label>
                          <input
                            name="cheque_details"
                            required
                            placeholder="Bank Name, Cheque #, Date"
                            className="w-full px-5 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl text-base font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500/30 transition-all"
                          />
                        </motion.div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                          Detailed Description
                        </label>
                        <textarea
                          name="reason"
                          rows={3}
                          placeholder="Enter specific details regarding this expense..."
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[24px] text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/10 outline-none focus:border-emerald-500/30 transition-all resize-none"
                        />
                      </div>

                      {formAmount > 0 && (
                        <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 border-dashed">
                          <label className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest block mb-1">
                            Amount Authentication (In Words)
                          </label>
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase break-words leading-relaxed">
                            {numberToWords(formAmount)}
                          </div>
                        </div>
                      )}

                      {/* Attachment Section */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between p-5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-200/50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                              <Upload size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                Audit Proof
                              </p>
                              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                Image or PDF (Max 5MB)
                              </p>
                            </div>
                          </div>
                          <input
                            name="bill_image"
                            type="file"
                            className="hidden"
                            id="bill-upload-final"
                            accept="image/*,.pdf"
                          />
                          <label
                            htmlFor="bill-upload-final"
                            className="px-6 py-2.5 bg-slate-900 dark:bg-emerald-500 text-white dark:text-emerald-950 text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10"
                          >
                            Attach Bill
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="px-10 py-8 bg-slate-50/50 dark:bg-white/[0.02] border-t dark:border-white/5 flex items-center justify-end gap-4 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(false)}
                        className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-100 transition-colors"
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-10 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-mono font-bold transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-3 active:scale-95"
                      >
                        {isSubmitting ? (
                          <RefreshCw size={18} className="animate-spin" />
                        ) : (
                          <Check size={18} />
                        )}
                        Generate Voucher
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <ChatModal
            isOpen={showChatModal}
            onClose={() => setShowChatModal(false)}
          />

          {/* === BILL PREVIEW MODAL (GLOBAL) === */}
          <AnimatePresence>
            {isPreviewModalOpen && previewUrl && (
              <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`w-full max-w-5xl h-[85vh] rounded-[48px] shadow-2xl relative z-10 overflow-hidden border transition-colors flex flex-col ${isDark ? "bg-[#0A0A0A] border-white/10" : "bg-white border-slate-200"}`}
                >
                  <div className="px-8 py-6 border-b dark:border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Document Preview
                        </h4>
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                          Authenticated Proof
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href={previewUrl}
                        download
                        className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 transition-colors"
                        title="Download File"
                      >
                        <Upload size={20} className="rotate-180" />
                      </a>
                      <button
                        onClick={() => setIsPreviewModalOpen(false)}
                        className="p-3 rounded-2xl hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-50 dark:bg-black/20 overflow-auto p-8 flex items-center justify-center">
                    {previewUrl.toLowerCase().endsWith(".pdf") ? (
                      <iframe
                        src={previewUrl}
                        className="w-full h-full rounded-3xl border dark:border-white/5"
                        title="PDF Preview"
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Bill Preview"
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-lg border dark:border-white/10"
                      />
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <DailyIntelligence
            isOpen={showIntelligence}
            onClose={() => setShowIntelligence(false)}
          />
          <NotesDrawer isOpen={showNotes} onClose={() => setShowNotes(false)} />
          <LogoutConfirmation
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={() => {
              logout();
              navigate("/login");
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Expenses;
