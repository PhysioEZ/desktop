import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LayoutGrid,
  Calendar,
  Phone,
  Users,
  Banknote,
  MessageSquare,
  PieChart,
  LifeBuoy,
  Moon,
  Sun,
  Bell,
  Zap,
  CalendarRange,
  SlidersHorizontal,
  MessageCircle,
  LogOut,
  User,
  Wallet,
  ArrowUpRight,
  TestTube2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
} from "date-fns";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, authFetch } from "../config";
import { toast } from "sonner";
import BillingDrawer from "../components/billing/BillingDrawer";
import RangePicker from "../components/ui/RangePicker";
import FileViewer from "../components/FileViewer/FileViewer";
import { usePatientStore } from "../store/usePatientStore";
import { useAuthStore } from "../store/useAuthStore";

interface BillingRecord {
  patient_id: number;
  patient_name: string;
  phone_number: string;
  total_amount: string;
  total_paid: string;
  due_amount: number;
  status: string;
  has_payment_today: number;
  created_at: string;
  branch_id: number;
  effective_balance?: number;
}

interface Notification {
  notification_id: number;
  message: string;
  link_url: string | null;
  is_read: number;
  created_at: string;
  time_ago: string;
}

const Billing = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState({
    today_collection: 0,
    range_billed: 0,
    range_paid: 0,
    range_due: 0,
  });
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showOnlyToday, setShowOnlyToday] = useState(false);
  const [statsData, setStatsData] = useState<any>({ methods: [], trends: [] });
  const [showBilled, setShowBilled] = useState(false);
  const [showCollected, setShowCollected] = useState(false);

  // Custom Range States
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [showRangePicker, setShowRangePicker] = useState<
    "start" | "end" | null
  >(null);

  // Sort State
  const [sortConfig, setSortConfig] = useState<{
    key: keyof BillingRecord | "due_amount";
    direction: "asc" | "desc";
  }>({ key: "created_at", direction: "desc" });
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // File Viewer
  const [fileViewerConfig, setFileViewerConfig] = useState<{
    isOpen: boolean;
    url: string;
    fileName: string;
    downloadUrl?: string;
    downloadFileName?: string;
  }>({ isOpen: false, url: "", fileName: "" });

  // Theme Logic
  const [isDark, setIsDark] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  // Header Logic (Notifications)
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const notifRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Using Patient Store for Details Modal
  const { openPatientDetails } = usePatientStore();

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
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  // Data Fetching
  const fetchData = async () => {
    setLoading(true);
    const start =
      isCustomRange && rangeStart
        ? rangeStart
        : format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end =
      isCustomRange && rangeEnd
        ? rangeEnd
        : format(endOfMonth(currentMonth), "yyyy-MM-dd");

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/billing`, {
        method: "POST",
        body: JSON.stringify({
          action: "fetch_overview",
          startDate: start,
          endDate: end,
          search,
          status: statusFilter,
          paymentFilter: showOnlyToday ? "today" : "all",
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        setStats(json.data.stats);
        setRecords(json.data.records);
        setStatsData({
          methods: json.data.stats.methods || [],
          trends: json.data.stats.trends || [],
        });
      } else {
        toast.error(json.message || "Failed to fetch billing data");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifs = useCallback(async () => {
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
  }, [user?.employee_id]);

  useEffect(() => {
    fetchData();
  }, [
    currentMonth,
    search,
    statusFilter,
    showOnlyToday,
    rangeStart,
    rangeEnd,
    isCustomRange,
  ]);

  // Format Currency
  const fmt = (val: number | string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(String(val).replace(/[^\d.-]/g, "")) || 0);
  };

  const parseNum = (val: any) => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    return parseFloat(String(val).replace(/[^\d.-]/g, "")) || 0;
  };

  // Client-side Sorting
  const sortedRecords = [...records].sort((a, b) => {
    let aVal: any = a[sortConfig.key as keyof BillingRecord];
    let bVal: any = b[sortConfig.key as keyof BillingRecord];

    if (sortConfig.key === "due_amount") {
      aVal = parseNum(a.total_amount) - parseNum(a.total_paid);
      bVal = parseNum(b.total_amount) - parseNum(b.total_paid);
    } else {
      aVal = parseNum(aVal);
      bVal = parseNum(bVal);
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Calculate stats from filtered records for consistency
  const activeStats = useMemo(() => {
    return sortedRecords.reduce(
      (acc, r) => {
        const billed = parseNum(r.total_amount);
        const paid = parseNum(r.total_paid);
        acc.billed += billed;
        acc.paid += paid;
        acc.due += billed - paid;
        return acc;
      },
      { billed: 0, paid: 0, due: 0 },
    );
  }, [sortedRecords]);

  useEffect(() => {
    if (user?.employee_id) {
      fetchNotifs();
      const inv = setInterval(fetchNotifs, 30000);
      return () => clearInterval(inv);
    }
  }, [fetchNotifs, user?.employee_id]);

  useEffect(() => {
    // Click outside handler for popups
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest("#notif-popup")
      )
        setShowNotifPopup(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sendWhatsAppReminder = (row: BillingRecord) => {
    const due = parseFloat(row.total_amount) - parseFloat(row.total_paid);
    const msg = `Namaste ${row.patient_name}, this is a friendly reminder from PhysioEZ regarding an outstanding due of ${fmt(due)} for your treatment. Kindly clear it at your earliest convenience. Thank you!`;
    const url = `https://wa.me/91${row.phone_number}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const exportReport = () => {
    const start =
      isCustomRange && rangeStart
        ? format(new Date(rangeStart), "dd MMM yyyy")
        : format(startOfMonth(currentMonth), "dd MMM yyyy");
    const end =
      isCustomRange && rangeEnd
        ? format(new Date(rangeEnd), "dd MMM yyyy")
        : format(endOfMonth(currentMonth), "dd MMM yyyy");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; pb-20; }
          .brand { font-size: 24px; font-weight: 900; letter-spacing: -0.02em; color: #10b981; }
          .report-info { text-align: right; }
          .report-title { font-size: 32px; font-weight: 900; margin: 0; letter-spacing: -0.04em; }
          .report-range { font-size: 14px; font-weight: 700; opacity: 0.4; margin-top: 4px; uppercase; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; padding: 16px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; border-bottom: 1px solid #f1f5f9; }
          td { padding: 16px; font-size: 13px; font-weight: 600; color: #334155; border-bottom: 1px solid #f8fafc; }
          .patient-id { color: #10b981; }
          .amount { text-align: right; font-variant-numeric: tabular-nums; }
          .status { display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
          .status-active { background: #ecfdf5; color: #059669; }
          .status-completed { background: #f0f9ff; color: #0284c7; }
          
          .footer { margin-top: 60px; font-size: 10px; font-weight: 700; opacity: 0.3; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">PhysioEZ / Billing</div>
          <div class="report-info">
            <h1 class="report-title">Financial Report</h1>
            <p class="report-range">${start} &nbsp;→&nbsp; ${end}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Patient Name</th>
              <th>Phone</th>
              <th class="amount">Total Bill</th>
              <th class="amount">Total Paid</th>
              <th class="amount">Due</th>
              <th style="text-align: center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${records
              .map(
                (r) => `
              <tr>
                <td class="patient-id">#${r.patient_id}</td>
                <td>${r.patient_name}</td>
                <td>${r.phone_number}</td>
                <td class="amount">${fmt(r.total_amount)}</td>
                <td class="amount">${fmt(r.total_paid)}</td>
                <td class="amount">${fmt(parseNum(r.total_amount) - parseNum(r.total_paid))}</td>
                <td style="text-align: center">
                  <span class="status status-${r.status.toLowerCase()}">${r.status}</span>
                </td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="footer">
          Generated on ${new Date().toLocaleString()} &bull; Secure Financial Report
        </div>
      </body>
      </html>
    `;

    const htmlBlob = new Blob([htmlContent], { type: "text/html" });
    const htmlUrl = URL.createObjectURL(htmlBlob);

    // Also generate CSV for download
    const csvHeaders = [
      "Patient ID",
      "Patient Name",
      "Phone",
      "Total Bill",
      "Total Paid",
      "Due",
      "Status",
      "Date",
    ];
    const csvRows = records.map((r) => [
      r.patient_id,
      r.patient_name,
      r.phone_number,
      r.total_amount,
      r.total_paid,
      parseFloat(r.total_amount) - parseFloat(r.total_paid),
      r.status,
      r.created_at,
    ]);
    const csvContent =
      csvHeaders.join(",") + "\n" + csvRows.map((e) => e.join(",")).join("\n");
    const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const csvUrl = URL.createObjectURL(csvBlob);

    setFileViewerConfig({
      isOpen: true,
      url: htmlUrl,
      fileName: `billing_report_${format(isCustomRange && rangeStart ? new Date(rangeStart) : currentMonth, "MMM_yyyy")}.html`,
      downloadUrl: csvUrl,
      downloadFileName: `billing_report_${format(isCustomRange && rangeStart ? new Date(rangeStart) : currentMonth, "MMM_yyyy")}.csv`,
    });
  };

  // Nav Links (Same as Dashboard)
  const navLinks = [
    {
      icon: LayoutGrid,
      label: "Dashboard",
      desc: "Overview & Stats",
      path: "/reception/dashboard",
    },
    {
      icon: Calendar,
      label: "Schedule",
      desc: "Appmts & Queue",
      path: "/reception/schedule",
    },
    {
      icon: Phone,
      label: "Inquiry",
      desc: "New Leads",
      path: "/reception/inquiry",
    },
    {
      icon: Users,
      label: "Registration",
      desc: "New Patient",
      path: "/reception/registration",
    },
    {
      icon: Users,
      label: "Patients",
      desc: "All Records",
      path: "/reception/patients",
    },
    {
      icon: Banknote,
      label: "Billing",
      desc: "Invoices & Dues",
      path: "/reception/billing",
      active: true,
    },
    {
      icon: Users,
      label: "Attendance",
      desc: "Daily Track",
      path: "/reception/attendance",
    },
    {
      icon: TestTube2,
      label: "Tests",
      desc: "Lab Orders",
      path: "/reception/tests",
    },
    {
      icon: MessageSquare,
      label: "Feedback",
      desc: "Patient Reviews",
      path: "/reception/feedback",
    },
    {
      icon: FileText,
      label: "Reports",
      desc: "Analytics",
      path: "/reception/reports",
    },
    {
      icon: PieChart,
      label: "Expenses",
      desc: "Clinic Exp",
      path: "/reception/expenses",
    },
    {
      icon: MessageCircle,
      label: "Chat",
      desc: "Messages",
      path: "/reception/chat",
    },
    {
      icon: LifeBuoy,
      label: "Support",
      desc: "Help & Docs",
      path: "/reception/support",
    },
  ];

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? "bg-[#050505] text-[#E2E8F0]" : "bg-[#FAFAFA] text-[#1A1A1A]"}`}
    >
      {/* === SIDEBAR === */}
      <div
        className={`w-20 hidden md:flex flex-col items-center py-8 border-r z-[60] shrink-0 gap-6 transition-colors duration-300 ${isDark ? "bg-[#0A0A0A] border-[#151515]" : "bg-white border-gray-200 shadow-xl"}`}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ADE80] to-[#22c55e] flex items-center justify-center text-black shadow-[0_0_20px_rgba(74,222,128,0.3)]">
          <span className="font-extrabold text-sm">PE</span>
        </div>

        <div className="flex-1 w-full flex flex-col items-center gap-4 pt-4 ">
          {navLinks.map((link) => (
            <div
              key={link.label}
              className="group relative flex items-center justify-center w-full px-4"
            >
              <button
                onClick={() => navigate(link.path)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  link.active
                    ? isDark
                      ? "bg-[#1C1C1C] text-[#4ADE80] ring-1 ring-[#4ADE80]/30"
                      : "bg-gray-100 text-[#16a34a] ring-1 ring-[#16a34a]/30"
                    : isDark
                      ? "text-gray-500 hover:text-white hover:bg-[#1C1C1C]"
                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <link.icon size={18} strokeWidth={2} />
              </button>
              {/* Hover Tooltip */}
              <div
                className={`absolute left-14 top-1/2 -translate-y-1/2 rounded-lg p-3 w-32 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity ml-2 z-[60] border ${isDark ? "bg-[#1A1A1A] border-[#2A2D2A]" : "bg-white border-gray-200"}`}
              >
                <div
                  className={`text-xs font-bold mb-0.5 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {link.label}
                </div>
                <div
                  className={`text-[10px] font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                  {link.desc}
                </div>
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 border-l border-b rotate-45 ${isDark ? "bg-[#1A1A1A] border-[#2A2D2A]" : "bg-white border-gray-200"}`}
                ></div>
              </div>
              {link.active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#4ADE80] rounded-r-full" />
              )}
            </div>
          ))}
        </div>

        {/* Footer Utilities */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={toggleTheme}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDark ? "text-gray-500 hover:text-white hover:bg-[#1C1C1C]" : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"}`}
          >
            {isDark ? (
              <Sun size={18} strokeWidth={2} />
            ) : (
              <Moon size={18} strokeWidth={2} />
            )}
          </button>
          <div
            onClick={() => setShowProfilePopup(!showProfilePopup)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer relative ${isDark ? "bg-[#1C1C1C] text-gray-500 hover:text-white" : "bg-gray-100 text-gray-400 hover:text-black"}`}
          >
            <Users size={18} />
            <AnimatePresence>
              {showProfilePopup && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-full left-full mb-2 ml-2 w-56 bg-[#fdfcff] dark:bg-[#111315] rounded-[20px] shadow-xl border border-[#e0e2ec] dark:border-[#43474e] z-[60] overflow-hidden p-2 transition-colors"
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
      </div>

      {/* === LEFT PANEL (STATS) === */}
      <div
        className={`hidden xl:flex w-[450px] flex-col p-10 border-r relative shrink-0 transition-colors duration-300 z-50 overflow-y-auto h-screen ${isDark ? "bg-[#0A0A0A] border-[#151515] custom-scrollbar-dark" : "bg-white border-gray-200 custom-scrollbar"}`}
      >
        {/* Brand & Title */}
        <div className="space-y-10 z-10">
          <div className="space-y-4">
            <h1 className="text-5xl font-serif font-normal tracking-tight leading-tight text-[#1a1c1e] dark:text-[#e3e2e6]">
              Billing &nbsp;
              <span
                className={`italic ${isDark ? "text-[#4ADE80]" : "text-[#16a34a]"}`}
              >
                Center
              </span>
            </h1>
            <p className="text-gray-500 text-sm">
              Track collections, dues and invoices for{" "}
              {isCustomRange && rangeStart && rangeEnd
                ? `${format(new Date(rangeStart), "dd MMM")} - ${format(new Date(rangeEnd), "dd MMM yyyy")}`
                : format(currentMonth, "MMMM yyyy")}
              .
            </p>
          </div>
        </div>

        {/* Vertical Stats Stack - NEW STYLES */}
        <div className="space-y-8 w-full flex-1 flex flex-col py-6">
          {/* NEW: Range Context Card */}
          {isCustomRange && rangeStart && rangeEnd && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`p-6 rounded-[32px] border relative overflow-hidden transition-all ${isDark ? "bg-[#064e3b]/30 border-emerald-500/20" : "bg-emerald-50 border-emerald-100 shadow-sm"}`}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                    <CalendarRange size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                    Analysis Range
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsCustomRange(false);
                    setRangeStart(null);
                    setRangeEnd(null);
                  }}
                  className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={10} /> Reset
                </button>
              </div>

              <div className="space-y-1 relative z-10">
                <div
                  className={`text-xl font-black ${isDark ? "text-white" : "text-emerald-950"}`}
                >
                  {format(new Date(rangeStart), "dd MMM")} —{" "}
                  {format(new Date(rangeEnd), "dd MMM yyyy")}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  Custom Interval Active
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">
                    Volume
                  </p>
                  <p
                    className={`text-lg font-bold ${isDark ? "text-emerald-400" : "text-emerald-900"}`}
                  >
                    {fmt(activeStats.billed)}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">
                    Success
                  </p>
                  <p
                    className={`text-lg font-bold ${isDark ? "text-emerald-400" : "text-emerald-900"}`}
                  >
                    {fmt(activeStats.paid)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stat 1: Today's Collection */}
          <div
            className={`p-6 rounded-3xl border shadow-sm ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A]" : "bg-white border-green-100"}`}
          >
            <div className="flex items-center gap-3 opacity-60 mb-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <IndianRupee size={20} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Today's Collection
              </span>
            </div>
            <div>
              <div
                className={`text-5xl font-bold tracking-tight ${isDark ? "text-white" : "text-[#0F172A]"}`}
              >
                {fmt(stats.today_collection)}
              </div>
            </div>
          </div>

          {/* Stat 2: Month Performance */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 opacity-50 px-2">
              <Banknote size={16} />
              <span className="text-sm font-bold uppercase tracking-wider">
                {format(currentMonth, "MMM")} Overview
              </span>
            </div>

            <div
              className={`p-5 rounded-3xl border flex flex-col gap-4 ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A]" : "bg-white border-gray-100 shadow-sm"}`}
            >
              <div className="flex justify-between items-center border-b pb-4 border-dashed border-gray-100 dark:border-[#2A2D2A]">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {showBilled ? fmt(stats.range_billed) : "••••••"}
                    </div>
                    <button
                      onClick={() => setShowBilled(!showBilled)}
                      className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#2A2D2A] transition-colors opacity-40 hover:opacity-100 flex items-center justify-center"
                    >
                      {showBilled ? (
                        <EyeOff size={20} strokeWidth={2} />
                      ) : (
                        <Eye size={20} strokeWidth={2} />
                      )}
                    </button>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wide opacity-40 mt-1">
                    Billed
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  <FileText size={18} strokeWidth={2.5} />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-2xl font-bold text-emerald-600 dark:text-emerald-400`}
                    >
                      {showCollected ? fmt(stats.range_paid) : "••••••"}
                    </div>
                    <button
                      onClick={() => setShowCollected(!showCollected)}
                      className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#2A2D2A] transition-colors opacity-40 hover:opacity-100 flex items-center justify-center"
                    >
                      {showCollected ? (
                        <EyeOff size={20} strokeWidth={2} />
                      ) : (
                        <Eye size={20} strokeWidth={2} />
                      )}
                    </button>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wide opacity-40 mt-1">
                    Collected
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <CheckCircle2 size={18} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          {/* Stat 3: Dues */}
          <div
            className={`p-6 rounded-3xl border shadow-sm ${isDark ? "bg-[#251010] border-red-900/30" : "bg-white border-red-100"}`}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  <AlertCircle size={20} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Due (Range)
                </span>
              </div>
            </div>
            <div className="text-4xl font-bold tracking-tight text-red-600 dark:text-red-400">
              {fmt(stats.range_due)}
            </div>
          </div>

          {/* NEW: Payment Methods Breakdown */}
          {statsData.methods && statsData.methods.length > 0 && (
            <div
              className={`p-5 rounded-3xl border ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A]" : "bg-gray-50/50 border-gray-100 shadow-sm"}`}
            >
              <div className="flex items-center gap-2 mb-4 px-1">
                <Wallet size={12} className="text-teal-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Mode Distribution
                </span>
              </div>
              <div className="space-y-2.5">
                {statsData.methods.map((m: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 capitalize">
                        {m.payment_method}
                      </span>
                    </div>
                    <span className="text-xs font-black text-[#1a1c1e] dark:text-[#e3e2e6]">
                      {fmt(m.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEW: Collection Trend (Simple Bars) */}
          {statsData.trends && statsData.trends.length > 0 && (
            <div
              className={`p-5 rounded-3xl border ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A]" : "bg-white border-gray-100 shadow-sm"}`}
            >
              <div className="flex items-center gap-2 mb-4 px-1">
                <ArrowUpRight size={12} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  7-Day Collection Trend
                </span>
              </div>
              <div className="flex items-end gap-2 h-24 px-1">
                {(() => {
                  const max = Math.max(
                    ...statsData.trends.map((t: any) => Number(t.total)),
                    1,
                  );
                  return statsData.trends.map((t: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex-1 h-full flex flex-col justify-end group relative"
                    >
                      {/* Bar Background Track */}
                      <div className="absolute inset-x-0 bottom-0 top-0 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-sm" />

                      {/* Actual Bar */}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{
                          height: `${Math.max((Number(t.total) / max) * 100, 4)}%`,
                        }}
                        className="bg-emerald-500/40 group-hover:bg-emerald-500/70 transition-all rounded-t-sm w-full relative z-10"
                      />

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl pointer-events-none z-50 transform scale-90 group-hover:scale-100">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="opacity-60 text-[8px] uppercase font-black">
                            {(() => {
                              const [y, m, d] = t.date.split("-");
                              return format(
                                new Date(Number(y), Number(m) - 1, Number(d)),
                                "dd MMM",
                              );
                            })()}
                          </span>
                          <span>{fmt(t.total)}</span>
                        </div>
                        {/* Little Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Decoration */}
        <div className="absolute top-1/2 left-0 w-full h-full bg-gradient-to-t from-green-900/5 to-transparent pointer-events-none" />
      </div>

      {/* === MAIN CONTENT (Right Panel) === */}
      <main className="flex-1 h-screen overflow-hidden relative flex flex-col p-6 lg:p-10 gap-6">
        {/* Global Header */}
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1a1c1e] dark:text-[#e3e2e6]">
              Billing Overview
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              Manage your invoices and payments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:bg-gray-50 dark:hover:bg-[#1A1C1A] ${isDark ? "border-[#2A2D2A] bg-[#121412]" : "border-gray-200 bg-white"} ${loading ? "animate-spin" : ""}`}
              title="Refresh Data"
            >
              <RefreshCw size={18} strokeWidth={2} />
            </button>

            <button
              onClick={exportReport}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wide transition-colors ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A] hover:bg-white/5" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm"}`}
            >
              <FileText size={16} className="opacity-50" />
              <span>Export Report</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                ref={notifRef}
                onClick={() => {
                  setShowNotifPopup(!showNotifPopup);
                  setShowProfilePopup(false);
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:bg-gray-50 dark:hover:bg-[#1A1C1A] relative ${isDark ? "border-[#2A2D2A] bg-[#121412]" : "border-gray-200 bg-white"}`}
              >
                <Bell size={18} strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#B3261E] rounded-full ring-2 ring-white dark:ring-[#121412]"></span>
                )}
              </button>
              <AnimatePresence>
                {showNotifPopup && (
                  <motion.div
                    id="notif-popup"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5 }}
                    className={`absolute top-full right-0 mt-3 w-80 rounded-[24px] shadow-2xl border overflow-hidden z-[60] ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A]" : "bg-white border-gray-100"}`}
                  >
                    <div className="px-5 py-4 border-b dark:border-white/5 border-gray-100 flex items-center justify-between">
                      <span className="font-bold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#CCEBC4] text-[#0C200E]">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto p-1.5">
                      {notifications.map((n) => (
                        <div
                          key={n.notification_id}
                          className={`p-3 rounded-xl transition-all cursor-pointer group mb-1 ${n.is_read === 0 ? (isDark ? "bg-[#CCEBC4]/5 hover:bg-[#CCEBC4]/10" : "bg-green-50 hover:bg-green-100/50") : isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                        >
                          <p
                            className={`text-xs leading-snug ${n.is_read === 0 ? "font-bold" : ""} ${isDark ? "text-gray-200" : "text-gray-800"}`}
                          >
                            {n.message}
                          </p>
                          <p className="text-[9px] opacity-30 font-medium mt-1 uppercase">
                            {n.time_ago}
                          </p>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="py-10 text-center opacity-30 flex flex-col items-center gap-2">
                          <Bell size={24} strokeWidth={1.5} />
                          <p className="text-xs font-medium">
                            All notifications cleared
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div
          className={`flex-1 rounded-[24px] border overflow-hidden flex flex-col shadow-sm ${isDark ? "bg-[#121412] border-[#2A2D2A]" : "bg-white border-gray-200"}`}
        >
          {/* Toolbar Row */}
          <div
            className={`flex flex-col xl:flex-row items-center justify-between gap-4 p-5 border-b ${isDark ? "border-[#2A2D2A]" : "border-gray-100"}`}
          >
            {/* Left Side: Search + Month */}
            <div className="flex items-center gap-3 w-full xl:w-auto">
              {/* Search */}
              <div
                ref={searchRef}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 w-full xl:w-80 ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A] focus-within:border-[#4ADE80]/50" : "bg-gray-50 border-gray-200 focus-within:border-emerald-500/50 focus-within:bg-white focus-within:shadow-sm"}`}
              >
                <Search size={18} className="opacity-40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Patient..."
                  className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder:opacity-40"
                />
              </div>

              {/* Month Nav */}
              <div
                className={`hidden md:flex items-center gap-2 px-2 py-1.5 rounded-xl border transition-all ${isCustomRange ? "opacity-30 pointer-events-none scale-95" : ""} ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A]" : "bg-gray-50 border-gray-200"}`}
              >
                <button
                  onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronLeft size={16} className="opacity-60" />
                </button>
                <span className="text-sm font-bold min-w-[100px] text-center px-2">
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <button
                  onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                  disabled={currentMonth >= startOfMonth(new Date())}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-20"
                >
                  <ChevronRight size={16} className="opacity-60" />
                </button>
              </div>
            </div>

            {/* Right Side: Filters */}
            <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
              {/* Custom Range (Visual) */}
              <button
                onClick={() => {
                  if (isCustomRange) {
                    setIsCustomRange(false);
                    setRangeStart(null);
                    setRangeEnd(null);
                  } else {
                    setShowRangePicker("start");
                  }
                }}
                className={`hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wide transition-all ${
                  isCustomRange
                    ? isDark
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                    : isDark
                      ? "bg-[#1A1C1A] border-[#2A2D2A] hover:bg-white/5"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <CalendarRange
                  size={16}
                  className={isCustomRange ? "fill-current" : "opacity-50"}
                />
                <span>{isCustomRange ? "Active Range" : "Custom Range"}</span>
              </button>

              {/* Today */}
              <button
                onClick={() => setShowOnlyToday(!showOnlyToday)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wide transition-all ${
                  showOnlyToday
                    ? isDark
                      ? "bg-[#4ADE80]/10 border-[#4ADE80]/30 text-[#4ADE80]"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                    : isDark
                      ? "bg-[#1A1C1A] border-[#2A2D2A] hover:bg-white/5"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Zap
                  size={16}
                  className={showOnlyToday ? "fill-current" : "opacity-50"}
                />
                <span>Today</span>
                {showOnlyToday && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded text-[9px] ${isDark ? "bg-[#4ADE80]/20" : "bg-emerald-100"}`}
                  >
                    ON
                  </span>
                )}
              </button>

              {/* Status */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wide outline-none cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A] hover:bg-white/5" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
                <ChevronLeft
                  className="absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 opacity-40 pointer-events-none"
                  size={14}
                />
              </div>

              {/* Filter Icon */}
              <div className="relative">
                <button
                  onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                  className={`p-2.5 rounded-xl border transition-colors ${isSortMenuOpen || sortConfig.key !== "created_at" ? (isDark ? "bg-[#4ADE80]/10 border-[#4ADE80]/30 text-[#4ADE80]" : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm") : isDark ? "bg-[#1A1C1A] border-[#2A2D2A] hover:bg-white/5" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                >
                  <SlidersHorizontal size={18} strokeWidth={2} />
                </button>
                <AnimatePresence>
                  {isSortMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className={`absolute top-full right-0 mt-2 w-56 rounded-2xl shadow-2xl border z-[70] overflow-hidden p-1 ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A]" : "bg-white border-gray-100"}`}
                    >
                      <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest opacity-30">
                        Sort By
                      </div>
                      {[
                        {
                          label: "Date (Newest)",
                          key: "created_at",
                          dir: "desc",
                        },
                        {
                          label: "Date (Oldest)",
                          key: "created_at",
                          dir: "asc",
                        },
                        {
                          label: "Bill (High-Low)",
                          key: "total_amount",
                          dir: "desc",
                        },
                        {
                          label: "Paid (High-Low)",
                          key: "total_paid",
                          dir: "desc",
                        },
                        {
                          label: "Dues (Highest)",
                          key: "due_amount",
                          dir: "desc",
                        },
                        {
                          label: "Wallet (High-Low)",
                          key: "effective_balance",
                          dir: "desc",
                        },
                      ].map((opt) => (
                        <button
                          key={`${opt.key}-${opt.dir}`}
                          onClick={() => {
                            setSortConfig({
                              key: opt.key as any,
                              direction: opt.dir as any,
                            });
                            setIsSortMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${sortConfig.key === opt.key && sortConfig.direction === opt.dir ? (isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700") : isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                        >
                          {opt.label}
                          {sortConfig.key === opt.key &&
                            sortConfig.direction === opt.dir && (
                              <CheckCircle2 size={12} />
                            )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div
            className={`flex items-center px-8 py-4 border-b ${isDark ? "bg-[#1A1C1A]/50 border-[#2A2D2A]" : "bg-gray-50/50 border-gray-100"}`}
          >
            <div className="w-[10%] text-xs font-bold text-emerald-500 uppercase tracking-wider">
              Patient ID
            </div>
            <div className="flex-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
              Patient Name
            </div>
            <div className="w-[10%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total Bill
            </div>
            <div className="w-[10%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total Paid
            </div>
            <div className="w-[10%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
              Expected Due
            </div>
            <div className="w-[10%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
              Wallet Bal
            </div>
            <div className="w-[10%] text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              Status
            </div>
            <div className="w-[8%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
              Actions
            </div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {loading ? (
              <div className="h-40 flex items-center justify-center gap-2 opacity-50">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
              </div>
            ) : sortedRecords.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center opacity-40 gap-4">
                <FileText size={48} strokeWidth={1} />
                <p className="font-bold text-gray-400">No records found</p>
              </div>
            ) : (
              <div
                className={`divide-y ${isDark ? "divide-[#2A2D2A]" : "divide-gray-50"}`}
              >
                {sortedRecords.map((row) => {
                  const bill = parseNum(row.total_amount);
                  const paid = parseNum(row.total_paid);
                  const due = bill - paid;

                  return (
                    <div
                      key={row.patient_id}
                      onClick={() => openPatientDetails(row as any)}
                      className={`flex items-center px-8 py-4 transition-all cursor-pointer group hover:bg-gray-50 dark:hover:bg-white/5`}
                    >
                      <div className="w-[10%] font-bold text-sm text-gray-900 dark:text-white">
                        #{row.patient_id}
                      </div>

                      <div className="flex-1">
                        <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase">
                          {row.patient_name}
                        </div>
                      </div>

                      <div className="w-[10%] text-right font-medium text-sm text-gray-500 dark:text-gray-400">
                        {fmt(bill)}
                      </div>

                      <div className="w-[10%] text-right">
                        <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {fmt(paid)}
                        </div>
                      </div>

                      <div className="w-[10%] text-right font-bold text-sm text-gray-600 dark:text-gray-400">
                        {due > 0 ? (
                          <span className="text-gray-500 dark:text-gray-400">
                            {fmt(due)}
                          </span>
                        ) : (
                          <span className="text-gray-900 dark:text-white">
                            {fmt(due)}
                          </span>
                        )}
                      </div>

                      <div className="w-[10%] text-right">
                        <div
                          className={`font-bold text-sm ${parseNum(row.effective_balance) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                        >
                          {fmt(row.effective_balance || 0)}
                        </div>
                      </div>

                      <div className="w-[10%] flex flex-col items-center gap-1">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            row.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                              : row.status === "completed"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {row.status}
                        </span>
                        {row.has_payment_today > 0 && (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-tight mt-0.5">
                            <CheckCircle2 size={10} strokeWidth={3} /> Paid
                            Today
                          </div>
                        )}
                      </div>

                      <div className="w-[8%] flex justify-end gap-2">
                        {due > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendWhatsAppReminder(row);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageCircle size={14} strokeWidth={2.5} />
                          </button>
                        )}
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-400 hover:bg-slate-100 transition-colors">
                          <Eye size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <BillingDrawer
        onExport={(url, fileName, downloadUrl, downloadFileName) =>
          setFileViewerConfig({
            isOpen: true,
            url,
            fileName,
            downloadUrl,
            downloadFileName,
          })
        }
      />

      {/* Modals & Popups */}
      <AnimatePresence>
        {showRangePicker && (
          <RangePicker
            startDate={rangeStart}
            endDate={rangeEnd}
            onChange={(start, end) => {
              setRangeStart(start);
              setRangeEnd(end);
              setIsCustomRange(true);
            }}
            onClose={() => setShowRangePicker(null)}
          />
        )}
      </AnimatePresence>

      <FileViewer
        isOpen={fileViewerConfig.isOpen}
        onClose={() =>
          setFileViewerConfig({ ...fileViewerConfig, isOpen: false })
        }
        url={fileViewerConfig.url}
        fileName={fileViewerConfig.fileName}
        downloadUrl={fileViewerConfig.downloadUrl}
        downloadFileName={fileViewerConfig.downloadFileName}
      />
    </div>
  );
};

export default Billing;
