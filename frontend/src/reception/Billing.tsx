import { useState, useEffect, useRef, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
} from "date-fns";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  Eye,
  Zap,
  CalendarRange,
  SlidersHorizontal,
  MessageCircle,
  Wallet,
  ArrowUpRight,
  RotateCcw,
  IndianRupee,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../store";
import { API_BASE_URL, authFetch } from "../config";
import { toast } from "sonner";
import BillingDrawer from "../components/billing/BillingDrawer";
import RangePicker from "../components/ui/RangePicker";
import FileViewer from "../components/FileViewer/FileViewer";
import { usePatientStore } from "../store/usePatientStore";
import PageHeader from "../components/PageHeader";
import Sidebar from "../components/Sidebar";
import TestDetailsModal from "../components/reception/TestDetailsModal";
import ChatModal from "../components/Chat/ChatModal";
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
  discount_amount?: string;
  discount?: string;
}

const Billing = () => {
  const { isDark } = useThemeStore();
  // const { user } = useAuthStore();

  // State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [stats, setStats] = useState<any>({
    treatment: { billed: 0, paid: 0, due: 0 },
    tests: { billed: 0, paid: 0, due: 0 },
    today_collection: 0,
  });
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showOnlyToday, setShowOnlyToday] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "patients" | "tests">(
    "overview",
  );
  const [combinedRecords, setCombinedRecords] = useState<any[]>([]);
  const [groupedTests, setGroupedTests] = useState<any[]>([]);

  const [statsData, setStatsData] = useState<any>({ methods: [], trends: [] });
  const [showChatModal, setShowChatModal] = useState(false);


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
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Test Modal State
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // File Viewer
  const [fileViewerConfig, setFileViewerConfig] = useState<{
    isOpen: boolean;
    url: string;
    fileName: string;
    downloadUrl?: string;
    downloadFileName?: string;
  }>({ isOpen: false, url: "", fileName: "", downloadUrl: "", downloadFileName: "" });

  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);

  // Using Patient Store for Details Modal
  const { openPatientDetails } = usePatientStore();

  // Data Fetching

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
      if (activeTab === "overview") {
        const res = await authFetch(`${API_BASE_URL}/reception/billing`, {
          method: "POST",
          body: JSON.stringify({
            action: "fetch_combined_overview",
            startDate: start,
            endDate: end,
            search,
          }),
        });
        const json = await res.json();
        if (json.status === "success") {
          setCombinedRecords(json.data.records);
          setStats(json.data.stats);
          setStatsData({
            methods: json.data.stats.methods || [],
            trends: json.data.stats.trends || [],
          });
        }
      } else if (activeTab === "patients") {
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
      } else {
        const res = await authFetch(`${API_BASE_URL}/reception/billing`, {
          method: "POST",
          body: JSON.stringify({
            action: "fetch_grouped_tests",
            startDate: start,
            endDate: end,
            search,
          }),
        });
        const json = await res.json();
        if (json.status === "success") {
          setGroupedTests(json.data);
        } else {
          toast.error(json.message || "Failed to fetch grouped tests");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshCooldown > 0) return;
    await fetchData();
    setRefreshCooldown(30);
  };

  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(() => setRefreshCooldown((p) => p - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  // Redundant fetchNotifs removed

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
    activeTab,
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
      aVal =
        parseNum(a.total_amount) -
        parseNum(a.total_paid) -
        (parseNum((a as any).discount_amount) || parseNum((a as any).discount));
      bVal =
        parseNum(b.total_amount) -
        parseNum(b.total_paid) -
        (parseNum((b as any).discount_amount) || parseNum((b as any).discount));
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
        const discount = parseNum(r.discount_amount);
        acc.billed += billed;
        acc.paid += paid;
        acc.due += billed - paid - discount;
        return acc;
      },
      { billed: 0, paid: 0, due: 0 },
    );
  }, [sortedRecords]);

  // Redundant notification interval removed

  // Redundant click outside removed

  const sendWhatsAppReminder = (row: BillingRecord) => {
    const due = parseFloat(row.total_amount) - parseFloat(row.total_paid);
    const msg = `Namaste ${row.patient_name}, this is a friendly reminder from PhysioEZ regarding an outstanding due of ${fmt(due)} for your treatment. Kindly clear it at your earliest convenience. Thank you!`;
    const url = `https://wa.me/91${row.phone_number}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const exportReport = (filterType?: "treatment" | "test") => {
    const start =
      isCustomRange && rangeStart
        ? format(new Date(rangeStart), "dd MMM yyyy")
        : format(startOfMonth(currentMonth), "dd MMM yyyy");
    const end =
      isCustomRange && rangeEnd
        ? format(new Date(rangeEnd), "dd MMM yyyy")
        : format(endOfMonth(currentMonth), "dd MMM yyyy");

    let dataToExport =
      activeTab === "overview"
        ? combinedRecords
        : activeTab === "patients"
          ? sortedRecords
          : groupedTests;

    if (activeTab === "overview" && filterType) {
      dataToExport = dataToExport.filter((r) => r.billing_type === filterType);
    }

    const reportLabel = filterType
      ? filterType === "treatment"
        ? " (Patients)"
        : " (Tests)"
      : "";

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
          .report-subtitle { font-size: 14px; font-weight: 800; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
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
            ${reportLabel ? `<div class="report-subtitle">${reportLabel}</div>` : ""}
            <p class="report-range">${start} &nbsp;→&nbsp; ${end}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>${activeTab === "overview" ? "Date" : activeTab === "tests" ? "Last Test" : "Patient ID"}</th>
              <th>Patient Name</th>
              <th>Phone</th>
              <th class="amount">${activeTab === "tests" ? "Tests" : "Total Bill"}</th>
              <th class="amount">Total Paid</th>
              <th class="amount">Due</th>
              <th style="text-align: center">${activeTab === "tests" || activeTab === "overview" ? "--" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
        if (activeTab === "overview") {
          return dataToExport
            .map(
              (r) => `
              <tr>
                <td>${format(new Date(r.last_activity), "dd MMM yy")}</td>
                <td>${r.patient_name} (${r.billing_type})</td>
                <td>${r.phone_number}</td>
                <td class="amount">${fmt(r.billed_amount)}</td>
                <td class="amount">${fmt(r.paid_amount)}</td>
                <td class="amount">${fmt(parseNum(r.billed_amount) - parseNum(r.paid_amount) - parseNum(r.discount))}</td>
                <td style="text-align: center">--</td>
              </tr>
            `,
            )
            .join("");
        }

        if (activeTab === "tests") {
          return dataToExport
            .map(
              (r) => `
              <tr>
                <td>${format(new Date(r.last_test_date), "dd MMM yy")}</td>
                <td>${r.patient_name}</td>
                <td>${r.phone_number}</td>
                <td class="amount" style="text-align: center">${r.test_count} Tests</td>
                <td class="amount">${fmt(r.total_paid)}</td>
                <td class="amount">${fmt(r.total_due)}</td>
                <td style="text-align: center">--</td>
              </tr>
            `,
            )
            .join("");
        }

        return dataToExport
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
          .join("");
      })()}
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
    const csvHeaders =
      activeTab === "overview"
        ? ["Date", "Name", "Type", "Phone", "Billed", "Paid", "Due"]
        : activeTab === "tests"
          ? ["Last Test", "Name", "Phone", "Tests", "Billed", "Paid", "Due"]
          : ["ID", "Name", "Phone", "Billed", "Paid", "Due", "Status", "Date"];

    const csvRows = (() => {
      if (activeTab === "overview") {
        return dataToExport.map((r) => [
          r.last_activity,
          r.patient_name,
          r.billing_type,
          r.phone_number,
          r.billed_amount,
          r.paid_amount,
          parseNum(r.billed_amount) - parseNum(r.paid_amount) - parseNum(r.discount),
        ]);
      }
      if (activeTab === "tests") {
        return dataToExport.map((r) => [
          r.last_test_date,
          r.patient_name,
          r.phone_number,
          r.test_count,
          r.total_billed,
          r.total_paid,
          r.total_due,
        ]);
      }
      return dataToExport.map((r) => [
        r.patient_id,
        r.patient_name,
        r.phone_number,
        r.total_amount,
        r.total_paid,
        parseFloat(r.total_amount) - parseFloat(r.total_paid),
        r.status,
        r.created_at,
      ]);
    })();
    const csvContent =
      csvHeaders.join(",") + "\n" + csvRows.map((e) => e.join(",")).join("\n");
    const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const csvUrl = URL.createObjectURL(csvBlob);

    setFileViewerConfig({
      isOpen: true,
      url: htmlUrl,
      fileName: `billing_report_${filterType ? filterType + "_" : ""}${format(isCustomRange && rangeStart ? new Date(rangeStart) : currentMonth, "MMM_yyyy")}.html`,
      downloadUrl: csvUrl,
      downloadFileName: `billing_report_${filterType ? filterType + "_" : ""}${format(isCustomRange && rangeStart ? new Date(rangeStart) : currentMonth, "MMM_yyyy")}.csv`,
    });
  };

  // Nav Links (Same as Dashboard)
  // navLinks removed

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? "bg-[#050505] text-[#E2E8F0]" : "bg-[#FAFAFA] text-[#1A1A1A]"}`}
    >
      <Sidebar
        onShowChat={() => setShowChatModal(true)}
      />

      <div className="flex-1 h-screen overflow-hidden relative flex flex-col">
        <PageHeader
          title="Billing"
          subtitle="Operations Center"
          icon={Banknote}
          onRefresh={handleRefresh}
          refreshCooldown={refreshCooldown}
          isLoading={loading}
          onShowIntelligence={() => setShowIntelligence(true)}
          onShowNotes={() => setShowNotes(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* === LEFT PANEL (STATS) === */}
          <div
            className={`hidden xl:flex w-[400px] flex-col p-10 border-r relative shrink-0 transition-colors duration-300 z-50 overflow-y-auto h-full ${isDark ? "bg-[#0A0A0A] border-[#151515] custom-scrollbar-dark" : "bg-white border-gray-200 custom-scrollbar"}`}
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
                    {fmt(stats.today_collection || 0)}
                  </div>
                </div>
              </div>

              {/* Stat 2: Separated Performance Sections */}
              <div className="space-y-6">
                {/* Treatments Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 opacity-50 px-2">
                    <Banknote size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Patients (Treatments)
                    </span>
                  </div>

                  <div
                    className={`p-5 rounded-3xl border flex flex-col gap-4 ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A]" : "bg-white border-gray-100 shadow-sm"}`}
                  >
                    <div className="flex justify-between items-center border-b pb-4 border-dashed border-gray-100 dark:border-[#2A2D2A]">
                      <div>
                        <div
                          className={`text-2xl font-black ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {fmt(stats.treatment?.billed || 0)}
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">
                          Billed
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                        <FileText size={18} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-b pb-4 border-dashed border-gray-100 dark:border-[#2A2D2A]">
                      <div>
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {fmt(stats.treatment?.paid || 0)}
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">
                          Collected
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-2xl font-black text-red-500">
                          {fmt(stats.treatment?.due || 0)}
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">
                          Balance Due
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20">
                        <ArrowUpRight size={18} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tests Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 opacity-50 px-2">
                    <Zap size={16} className="text-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Diagnostic Tests
                    </span>
                  </div>

                  <div
                    className={`p-5 rounded-3xl border flex flex-col gap-4 ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A]" : "bg-white border-purple-50 shadow-sm shadow-purple-500/5"}`}
                  >
                    <div className="flex justify-between items-center border-b pb-4 border-dashed border-purple-100 dark:border-[#2A2D2A]">
                      <div>
                        <div
                          className={`text-2xl font-black ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {fmt(stats.tests?.billed || 0)}
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">
                          Billed
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20">
                        <FileText size={18} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-b pb-4 border-dashed border-purple-100 dark:border-[#2A2D2A]">
                      <div>
                        <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                          {fmt(stats.tests?.paid || 0)}
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">
                          Collected
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20">
                        <CheckCircle2 size={18} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-2xl font-black text-red-500">
                          {fmt(stats.tests?.due || 0)}
                        </div>
                        <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">
                          Balance Due
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20">
                        <ArrowUpRight size={18} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
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
                      <div
                        key={idx}
                        className="flex justify-between items-center"
                      >
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
                                    new Date(
                                      Number(y),
                                      Number(m) - 1,
                                      Number(d),
                                    ),
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
          <main className="flex-1 h-screen overflow-hidden relative flex flex-col p-6 lg:p-10 lg:pt-8 gap-4">
            {/* Tabs Trigger */}
            <div className="px-6 flex justify-end gap-3">
              {[
                { id: "overview", label: "Overview" },
                { id: "patients", label: "Patients" },
                { id: "tests", label: "Tests" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                </button>
              ))}
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
                      placeholder={
                        activeTab === "overview"
                          ? "Search Entries..."
                          : activeTab === "patients"
                            ? "Search Patients..."
                            : "Search Test/Person..."
                      }
                      className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder:opacity-40"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="p-1 hover:bg-white/10 rounded-full opacity-40 hover:opacity-100 transition-all"
                      >
                        <RotateCcw size={12} />
                      </button>
                    )}
                  </div>

                  {/* Month Nav */}
                  <div
                    className={`hidden md:flex items-center gap-2 px-2 py-1.5 rounded-xl border transition-all ${isCustomRange ? "opacity-30 pointer-events-none scale-95" : ""} ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A]" : "bg-gray-50 border-gray-200"}`}
                  >
                    <button
                      onClick={() =>
                        setCurrentMonth((prev) => subMonths(prev, 1))
                      }
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronLeft size={16} className="opacity-60" />
                    </button>
                    <span className="text-sm font-bold min-w-[100px] text-center px-2">
                      {format(currentMonth, "MMMM yyyy")}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentMonth((prev) => addMonths(prev, 1))
                      }
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
                    className={`hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wide transition-all ${isCustomRange
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
                    <span>
                      {isCustomRange ? "Active Range" : "Custom Range"}
                    </span>
                  </button>

                  {/* Today */}
                  <button
                    onClick={() => setShowOnlyToday(!showOnlyToday)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs uppercase tracking-wide transition-all ${showOnlyToday
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

                  {/* Status (Only for Patients) */}
                  {activeTab === "patients" && (
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
                  )}

                  {/* Filter Icon and Sort Menu (Only for Patients) */}
                  {activeTab === "patients" && (
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
                  )}

                  {/* Export Button */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        if (activeTab === "overview") {
                          setIsExportMenuOpen(!isExportMenuOpen);
                        } else {
                          exportReport();
                        }
                      }}
                      className={`p-2.5 rounded-xl border transition-colors ${isExportMenuOpen ? (isDark ? "bg-[#4ADE80]/10 border-[#4ADE80]/30 text-[#4ADE80]" : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm") : isDark ? "bg-[#1A1C1A] border-[#2A2D2A] hover:bg-white/5" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50 shadow-sm"}`}
                      title="Export Financial Report"
                    >
                      <FileText size={18} strokeWidth={2} />
                    </button>

                    <AnimatePresence>
                      {activeTab === "overview" && isExportMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className={`absolute top-full right-0 mt-2 w-56 rounded-2xl shadow-2xl border z-[70] overflow-hidden p-1 ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A]" : "bg-white border-gray-100"}`}
                        >
                          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest opacity-30">
                            Select Report Category
                          </div>
                          {[
                            { label: "Patients (Treatments)", type: "treatment" },
                            { label: "Diagnostic Tests", type: "test" },
                            { label: "Whole Overview", type: undefined },
                          ].map((opt) => (
                            <button
                              key={String(opt.type)}
                              onClick={() => {
                                exportReport(opt.type as any);
                                setIsExportMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                            >
                              {opt.label}
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
                {activeTab === "overview" && (
                  <>
                    <div className="w-[10%] text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Date
                    </div>
                    <div className="flex-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Participant & Type
                    </div>
                    <div className="w-[12%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Billed
                    </div>
                    <div className="w-[12%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Paid
                    </div>
                    <div className="w-[12%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider px-4">
                      Balance Due
                    </div>
                  </>
                )}
                {activeTab === "patients" && (
                  <>
                    <div className="w-[10%] text-xs font-bold text-emerald-500 uppercase tracking-wider">
                      Patient ID
                    </div>
                    <div className="flex-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Patient Name
                    </div>
                    <div className="w-[10%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Billed
                    </div>
                    <div className="w-[10%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Paid
                    </div>
                    <div className="w-[10%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Due
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
                  </>
                )}
                {activeTab === "tests" && (
                  <>
                    <div className="flex-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Person / Last Test
                    </div>
                    <div className="w-[12%] text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Test Count
                    </div>
                    <div className="w-[15%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Total Billed
                    </div>
                    <div className="w-[15%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Total Paid
                    </div>
                    <div className="w-[15%] text-right text-xs font-bold text-gray-400 uppercase tracking-wider px-8">
                      Total Due
                    </div>
                  </>
                )}
              </div>

              {/* Table Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar relative pb-16">
                {loading ? (
                  <div className="h-40 flex items-center justify-center gap-2 opacity-50">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-200" />
                  </div>
                ) : (
                  activeTab === "overview"
                    ? combinedRecords.length === 0
                    : activeTab === "patients"
                      ? sortedRecords.length === 0
                      : groupedTests.length === 0
                ) ? (
                  <div className="h-64 flex flex-col items-center justify-center opacity-40 gap-4">
                    <FileText size={48} strokeWidth={1} />
                    <p className="font-bold text-gray-400">No records found</p>
                  </div>
                ) : (
                  <div
                    className={`divide-y ${isDark ? "divide-[#2A2D2A]" : "divide-gray-50"}`}
                  >
                    {activeTab === "overview" &&
                      combinedRecords.map((row, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => {
                            if (row.billing_type === "treatment") {
                              openPatientDetails(row as any, "treatment");
                            } else {
                              openPatientDetails(
                                {
                                  patient_id: row.patient_id,
                                  patient_name: row.patient_name,
                                  patient_phone: row.phone_number,
                                } as any,
                                "test",
                              );
                            }
                          }}
                          className={`flex items-center px-8 py-4 transition-all cursor-pointer group hover:bg-gray-50 dark:hover:bg-white/5 border-b dark:border-white/5 last:border-0`}
                        >
                          <div className="w-[10%] text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {format(new Date(row.last_activity), "dd MMM yy")}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-black text-sm uppercase ${isDark ? "text-white" : "text-slate-900"}`}
                              >
                                {row.patient_name}
                              </span>
                              <span
                                className={`text-[8px] font-black px-2 py-0.5 rounded tracking-[0.1em] uppercase ${row.billing_type === "test"
                                  ? "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
                                  : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                                  }`}
                              >
                                {row.billing_type}
                              </span>
                              {row.billing_type === "test" &&
                                row.is_registered === 1 && (
                                  <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30 uppercase tracking-tighter">
                                    Registered
                                  </span>
                                )}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 opacity-60">
                              {row.phone_number}
                            </div>
                          </div>
                          <div className="w-[12%] text-right font-black text-sm text-slate-800 dark:text-white">
                            {fmt(row.billed_amount)}
                          </div>
                          <div className="w-[12%] text-right font-black text-sm text-emerald-600 dark:text-emerald-400">
                            {fmt(row.paid_amount)}
                          </div>
                          <div
                            className={`w-[12%] text-right font-black text-sm px-4 ${parseNum(row.billed_amount) - parseNum(row.paid_amount) - parseNum(row.discount) > 0 ? "text-red-500" : "text-slate-400 opacity-20"}`}
                          >
                            {fmt(
                              parseNum(row.billed_amount) -
                              parseNum(row.paid_amount) -
                              parseNum(row.discount),
                            )}
                          </div>
                          <div className="w-[5%] flex justify-end">
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-400 hover:bg-slate-100 transition-colors">
                              <Eye size={16} strokeWidth={2} />
                            </button>
                          </div>
                        </motion.div>
                      ))}

                    {activeTab === "patients" &&
                      sortedRecords.map((row, idx) => {
                        const bill = parseNum(row.total_amount);
                        const paid = parseNum(row.total_paid);
                        const discount = parseNum(row.discount_amount);
                        const due = bill - paid - discount;

                        return (
                          <motion.div
                            key={row.patient_id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            onClick={() => openPatientDetails(row as any)}
                            className={`flex items-center px-8 py-4 transition-all cursor-pointer group hover:bg-gray-50 dark:hover:bg-white/5 border-b dark:border-white/5 last:border-0`}
                          >
                            <div className="w-[10%] font-bold text-sm text-gray-900 dark:text-white">
                              #{row.patient_id}
                            </div>

                            <div className="flex-1">
                              <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase">
                                {row.patient_name}
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 opacity-60">
                                {row.phone_number}
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
                              <span
                                className={
                                  due > 0
                                    ? "text-red-500"
                                    : "text-slate-900 dark:text-white"
                                }
                              >
                                {fmt(due)}
                              </span>
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
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${row.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : row.status === "completed" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" : "bg-gray-100 text-gray-600"}`}
                              >
                                {row.status}
                              </span>
                              {row.has_payment_today > 0 && (
                                <div className="flex items-center gap-1 text-[9px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-tight mt-0.5">
                                  <CheckCircle2 size={10} strokeWidth={3} />{" "}
                                  Paid
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openPatientDetails(row as any);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-400 hover:bg-slate-100 transition-colors"
                              >
                                <Eye size={16} strokeWidth={2} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}

                    {activeTab === "tests" &&
                      groupedTests.map((row, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => {
                            if (row.patient_id) {
                              openPatientDetails(
                                {
                                  patient_id: row.patient_id,
                                  patient_name: row.patient_name,
                                  patient_phone: row.phone_number,
                                } as any,
                                "test",
                              );
                            } else {
                              toast.info(
                                "Redirecting to patient's last test details...",
                              );
                              setSelectedTest({
                                uid: row.patient_name,
                                patient_name: row.patient_name,
                              });
                              setIsTestModalOpen(true);
                            }
                          }}
                          className={`flex items-center px-8 py-4 transition-all cursor-pointer group hover:bg-gray-50 dark:hover:bg-white/5 border-b dark:border-white/5 last:border-0`}
                        >
                          <div className="flex-1">
                            <div className="font-black text-sm uppercase text-slate-900 dark:text-white">
                              {row.patient_name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-slate-400">
                                {row.phone_number}
                              </span>
                              <div className="w-1 h-1 rounded-full bg-slate-200" />
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                Last:{" "}
                                {format(
                                  new Date(row.last_test_date),
                                  "dd MMM yy",
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="w-[12%] text-center">
                            <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
                              {row.test_count} Tests
                            </span>
                          </div>

                          <div className="w-[15%] text-right font-black text-sm text-slate-800 dark:text-white">
                            {fmt(row.total_billed)}
                          </div>
                          <div className="w-[15%] text-right font-black text-sm text-emerald-600 dark:text-emerald-400">
                            {fmt(row.total_paid)}
                          </div>
                          <div
                            className={`w-[15%] text-right font-black text-sm px-8 ${parseNum(row.total_due) > 0 ? "text-red-500" : "text-slate-400 opacity-20"}`}
                          >
                            {fmt(row.total_due)}
                          </div>
                          <div className="w-[5%] flex justify-end">
                            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-400 hover:bg-slate-100 transition-colors">
                              <Eye size={16} strokeWidth={2} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

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

        <TestDetailsModal
          isOpen={isTestModalOpen}
          onClose={() => {
            setIsTestModalOpen(false);
            setSelectedTest(null);
            fetchData();
          }}
          test={selectedTest}
        />

        <DailyIntelligence
          isOpen={showIntelligence}
          onClose={() => setShowIntelligence(false)}
        />
        <NotesDrawer isOpen={showNotes} onClose={() => setShowNotes(false)} />

        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
        />

      </div>
    </div>
  );
};

export default Billing;
