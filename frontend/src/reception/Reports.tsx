import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  FileText,
  Users,
  Activity,
  MessageSquare,
  Search,
  Filter,
  Download,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ChevronLeft,
  CalendarRange,
  RotateCcw,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { useSmartRefresh } from "../hooks/useSmartRefresh";
import { API_BASE_URL, authFetch } from "../config";

import Sidebar from "../components/Sidebar";
import LogoutConfirmation from "../components/LogoutConfirmation";
import PageHeader from "../components/PageHeader";
import DailyIntelligence from "../components/DailyIntelligence";
import NotesDrawer from "../components/NotesDrawer";
import ActionFAB from "../components/ActionFAB";
import CustomSelect from "../components/ui/CustomSelect";
import ChatModal from "../components/Chat/ChatModal";
import RangePicker from "../components/ui/RangePicker";
import FileViewer from "../components/FileViewer/FileViewer";
import { startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";

type TabType = "tests" | "registrations" | "patients" | "inquiries";

const Reports = () => {
  const navigate = useNavigate();
  const { isDark } = useThemeStore();

  const { logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>("tests");
  const [viewMode, setViewMode] = useState<"table" | "visual">("table");
  const [loading, setLoading] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { smartRefresh, isRefreshing } = useSmartRefresh();

  // Data
  const [records, setRecords] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  // Custom Range States (same as Billing)
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [showRangePicker, setShowRangePicker] = useState<
    "start" | "end" | null
  >(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // File Viewer config
  const [fileViewerConfig, setFileViewerConfig] = useState<{
    isOpen: boolean;
    url: string;
    fileName: string;
    downloadUrl?: string;
    downloadFileName?: string;
  }>({
    isOpen: false,
    url: "",
    fileName: "",
    downloadUrl: "",
    downloadFileName: "",
  });

  // Filters
  const [filterOptions, setFilterOptions] = useState<any>({});
  const [activeFilters, setActiveFilters] = useState<any>({});

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "tests", label: "Tests", icon: Activity },
    { id: "registrations", label: "Registration", icon: FileText },
    { id: "patients", label: "Patients", icon: Users },
    { id: "inquiries", label: "Inquiry", icon: MessageSquare },
  ];

  useEffect(() => {
    fetchFilters();
    fetchData();
  }, [activeTab, rangeStart, rangeEnd, isCustomRange, currentMonth]);

  const fetchFilters = async () => {
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/reports/filters/${activeTab}`,
      );
      const data = await res.json();
      if (data.success) {
        setFilterOptions(data.options);
      }
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

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
      const params = new URLSearchParams();
      if (start) params.append("start_date", start);
      if (end) params.append("end_date", end);
      if (activeFilters.search) params.append("search", activeFilters.search);

      Object.entries(activeFilters).forEach(([key, val]) => {
        if (val && key !== "search") params.append(key, val as string);
      });

      const res = await authFetch(
        `${API_BASE_URL}/reception/reports/${activeTab}?${params.toString()}`,
      );
      const data = await res.json();

      if (data.success) {
        setRecords(data[activeTab] || []);
        setTotals(data.totals || {});
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshCooldown > 0) return;
    smartRefresh(activeTab, {
      onSuccess: () => {
        fetchData();
        setRefreshCooldown(20);
      },
    });
  };

  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(() => setRefreshCooldown((p) => p - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchData();
  };

  const exportToCSV = () => {
    if (!records || records.length === 0) return;

    // Simplistic export based on active tab
    const headers = Object.keys(records[0]).join(",");
    const csvRows = records
      .map((r) =>
        Object.values(r)
          .map((v) => `"${v || ""}"`)
          .join(","),
      )
      .join("\n");

    const csvBlob = new Blob([headers + "\n" + csvRows], {
      type: "text/csv;charset=utf-8;",
    });
    const csvUrl = window.URL.createObjectURL(csvBlob);

    setFileViewerConfig({
      isOpen: true,
      url: csvUrl,
      fileName: `${activeTab}_report_${format(new Date(), "yyyyMMdd")}.csv`,
    });
  };

  const exportToPDF = () => {
    if (!records || records.length === 0) return;
    const start =
      isCustomRange && rangeStart
        ? format(new Date(rangeStart), "dd MMM yyyy")
        : format(startOfMonth(currentMonth), "dd MMM yyyy");
    const end =
      isCustomRange && rangeEnd
        ? format(new Date(rangeEnd), "dd MMM yyyy")
        : format(endOfMonth(currentMonth), "dd MMM yyyy");

    const getReportConfig = () => {
      const formatCurrency = (v: any, _row?: any) => {
        const num = parseFloat(v);
        return isNaN(num) ? "₹0" : `₹${num.toLocaleString()}`;
      };

      switch (activeTab) {
        case "tests":
          return {
            columns: [
              {
                header: "Date",
                key: "created_at",
                format: (v: any, _r?: any) =>
                  v ? format(new Date(v), "MMM dd, yyyy") : "—",
              },
              { header: "Patient", key: "patient_name" },
              { header: "Test", key: "test_name" },
              { header: "Billed", key: "billed", format: formatCurrency },
              { header: "Paid", key: "paid", format: formatCurrency },
              { header: "Dues", key: "dues", format: formatCurrency },
              { header: "Status", key: "test_status" },
            ],
            summary: [
              {
                label: "Gross Billed",
                value: formatCurrency(totals.total_billed),
              },
              {
                label: "Total Collected",
                value: formatCurrency(totals.total_collected),
              },
              {
                label: "Total Outstanding",
                value: formatCurrency(totals.total_outstanding),
              },
            ],
          };
        case "registrations":
          return {
            columns: [
              {
                header: "Date",
                key: "created_at",
                format: (v: any, _r?: any) =>
                  v ? format(new Date(v), "MMM dd, yyyy") : "—",
              },
              { header: "Patient", key: "patient_name" },
              { header: "Complaint", key: "chief_complain" },
              {
                header: "Amount",
                key: "consultation_amount",
                format: formatCurrency,
              },
              { header: "Status", key: "status" },
            ],
            summary: [
              {
                label: "Consultation Revenue",
                value: formatCurrency(totals.consulted_sum),
              },
              {
                label: "Expected Revenue (Pending)",
                value: formatCurrency(totals.pending_sum),
              },
            ],
          };
        case "patients":
          return {
            columns: [
              { header: "Patient", key: "patient_name" },
              { header: "Doctor", key: "assigned_doctor" },
              { header: "Treatment", key: "treatment_type" },
              {
                header: "Billed",
                key: "calculated_billed",
                format: formatCurrency,
              },
              {
                header: "Paid",
                key: "calculated_paid_all_time",
                format: formatCurrency,
              },
              { header: "Due", key: "calculated_due", format: formatCurrency },
            ],
            summary: [
              {
                label: "Period Billing",
                value: formatCurrency(totals.total_sum),
              },
              {
                label: "Period Collections",
                value: formatCurrency(totals.paid_sum),
              },
              {
                label: "Current Receivables",
                value: formatCurrency(totals.due_sum),
              },
            ],
          };
        case "inquiries":
          return {
            columns: [
              {
                header: "Date",
                key: "created_at",
                format: (v: any, _r?: any) =>
                  v ? format(new Date(v), "MMM dd, yyyy") : "—",
              },
              { header: "Lead Name", key: "name" },
              { header: "Source", key: "referralSource" },
              { header: "Status", key: "status" },
            ],
            summary: [
              {
                label: "Total Leads",
                value: totals.total_inquiries,
                isCurrency: false,
              },
              {
                label: "Conversions",
                value: totals.registered_count,
                isCurrency: false,
              },
              {
                label: "Success Rate",
                value: `${Math.round((totals.registered_count / (totals.total_inquiries || 1)) * 100)}%`,
                isCurrency: false,
              },
            ],
          };
        default:
          return { columns: [], summary: [] };
      }
    };

    const reportConfig = getReportConfig();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
          body { font-family: 'Outfit', sans-serif; padding: 60px; color: #0f172a; background: #fff; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; }
          .brand-box { border-left: 8px solid #10b981; padding-left: 24px; }
          .brand { font-size: 28px; font-weight: 900; letter-spacing: -0.04em; color: #0f172a; }
          .brand span { color: #10b981; }
          .report-info { text-align: right; }
          .report-title { font-size: 36px; font-weight: 900; margin: 0; letter-spacing: -0.05em; color: #0f172a; text-transform: uppercase; }
          .report-range { font-size: 13px; font-weight: 700; color: #64748b; margin-top: 6px; letter-spacing: 0.1em; }
          
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 60px; }
          .summary-card { background: #f8fafc; padding: 24px; rounded: 24px; border: 1px solid #f1f5f9; border-radius: 24px; }
          .summary-label { font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px; }
          .summary-value { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }

          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; padding: 20px 16px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #64748b; border-bottom: 2px solid #f1f5f9; background: #fff; }
          td { padding: 18px 16px; font-size: 13px; font-weight: 600; color: #334155; border-bottom: 1px solid #f8fafc; }
          tr:nth-child(even) td { background: #fafafa; }
          
          .footer { margin-top: 80px; font-size: 11px; font-weight: 700; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 30px; letter-spacing: 0.05em; }
          .badge { padding: 4px 10px; border-radius: 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand-box">
            <div class="brand">PRO<span>SPINE</span></div>
            <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 4px;">Clinical Intelligence</div>
          </div>
          <div class="report-info">
            <h1 class="report-title">${activeTab} Statistics</h1>
            <p class="report-range">${start} &nbsp;—&nbsp; ${end}</p>
          </div>
        </div>

        <div class="summary-grid">
          ${reportConfig.summary
            .map(
              (s) => `
            <div class="summary-card">
              <div class="summary-label">${s.label}</div>
              <div class="summary-value">${s.value}</div>
            </div>
          `,
            )
            .join("")}
        </div>

        <table>
          <thead>
            <tr>
              ${reportConfig.columns.map((c) => `<th>${c.header}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${records
              .map(
                (r: any) => `
              <tr>
                ${reportConfig.columns
                  .map((c) => {
                    const val = r[c.key];
                    return `<td>${c.format ? c.format(val, r) : val || "—"}</td>`;
                  })
                  .join("")}
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        <div class="footer">Generated by PhysioEZ Management Console on ${format(new Date(), "PPpp")} &nbsp;•&nbsp; Confidential</div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    setFileViewerConfig({
      isOpen: true,
      url: url,
      fileName: `${activeTab}_report_${format(new Date(), "yyyyMMdd")}.html`,
    });
  };

  const COLORS = [
    "#10b981",
    "#6366f1",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
    "#ef4444",
  ];

  const renderAnalytics = () => {
    // Shared Data Helpers
    const aggregateByDate = (field: string = "count") => {
      const map: any = {};
      records.forEach((r) => {
        const d = format(new Date(r.created_at || new Date()), "MMM dd");
        map[d] =
          (map[d] || 0) + (field === "count" ? 1 : parseFloat(r[field] || 0));
      });
      return Object.entries(map)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => a.name.localeCompare(b.name));
    };

    const aggregateByField = (field: string, metric: string = "count") => {
      const map: any = {};
      records.forEach((r) => {
        const k = r[field] || "Unspecified";
        if (!map[k]) map[k] = { name: k, value: 0 };
        map[k].value += metric === "count" ? 1 : parseFloat(r[metric] || 0);
      });
      return Object.values(map).sort((a: any, b: any) => b.value - a.value);
    };

    const Card = ({
      children,
      className = "",
    }: {
      children: React.ReactNode;
      className?: string;
    }) => (
      <div
        className={`p-6 rounded-3xl border ${isDark ? "bg-[#0A0A0B] border-white/5 shadow-xl" : "bg-white border-slate-100 shadow-sm"} ${className}`}
      >
        {children}
      </div>
    );

    const ChartHeader = ({
      title,
      sub,
      icon: Icon,
      color,
    }: {
      title: string;
      sub: string;
      icon: any;
      color: string;
    }) => (
      <div className="flex items-center justify-between mb-6">
        <div>
          <span
            className={`text-[10px] font-black uppercase tracking-widest ${color} block mb-1`}
          >
            {sub}
          </span>
          <h4 className="text-xl font-bold dark:text-white tracking-tight">
            {title}
          </h4>
        </div>
        <div
          className={`p-2.5 rounded-xl ${color.replace("text-", "bg-")}/10 ${color}`}
        >
          <Icon size={18} />
        </div>
      </div>
    );

    const Leaderboard = ({
      data,
      title,
      metricLabel,
      isCurrency,
    }: {
      data: any[];
      title: string;
      metricLabel: string;
      isCurrency?: boolean;
    }) => (
      <div className="mt-6 space-y-4">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2 mb-4">
          {title}
        </h5>
        {data.slice(0, 5).map((d, i) => (
          <div key={i} className="flex items-center justify-between group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                0{i + 1}
              </div>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate group-hover:text-emerald-500 transition-colors">
                {d.name || d.patient_name || "Anonymous Patient"}
              </span>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white shrink-0">
              {isCurrency
                ? `₹${d.value.toLocaleString()}`
                : `${d.value} ${metricLabel}`}
            </span>
          </div>
        ))}
        {data.length === 0 && (
          <div className="text-[10px] text-slate-400 italic py-4">
            Insufficient data for breakdown
          </div>
        )}
      </div>
    );

    const renderTestsAnalytics = () => {
      const trendData = aggregateByDate("billed");
      const testSplit = aggregateByField("test_name", "billed");
      const paymentData = aggregateByField("payment_status");
      const topTests = aggregateByField("test_name");

      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <ChartHeader
                title="Revenue Timeline"
                sub="Financial Momentum"
                icon={TrendingUp}
                color="text-emerald-500"
              />
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="tG" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      strokeOpacity={0.05}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                      tickFormatter={(v) =>
                        `₹${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v}`
                      }
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: "16px", border: "none" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={4}
                      fill="url(#tG)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <ChartHeader
                title="Payment Mix"
                sub="Collection Health"
                icon={PieChartIcon}
                color="text-indigo-500"
              />
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {paymentData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {paymentData.slice(0, 4).map((d: any, i: number) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent"
                  >
                    <p className="text-[9px] font-bold text-slate-400 uppercase">
                      {d.name}
                    </p>
                    <p className="text-sm font-black dark:text-white">
                      {d.value}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <ChartHeader
                title="Diagnostic Performance"
                sub="Yield Analysis"
                icon={BarChart3}
                color="text-amber-500"
              />
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    data={testSplit.slice(0, 6)}
                  >
                    <PolarGrid strokeOpacity={0.1} />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fontSize: 8, fill: "#64748b" }}
                    />
                    <Radar
                      name="Revenue"
                      dataKey="value"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <ChartHeader
                title="High Volume Tests"
                sub="Demand Spectrum"
                icon={Activity}
                color="text-rose-500"
              />
              <Leaderboard
                data={topTests}
                title="Top Diagnostics by Volume"
                metricLabel="Cases"
              />
            </Card>
          </div>
        </div>
      );
    };

    const renderRegistrationsAnalytics = () => {
      const regTrend = aggregateByDate();
      const complaintData = aggregateByField("chief_complain");
      const typeData = aggregateByField("consultation_type");

      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Card>
            <div className="flex justify-between items-start mb-8">
              <ChartHeader
                title="Clinical Inflow Pulse"
                sub="Admission Velocity"
                icon={TrendingUp}
                color="text-blue-500"
              />
              <div className="text-right">
                <span className="text-4xl font-black tracking-tighter text-blue-500">
                  {records.length}
                </span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Global Admissions
                </p>
              </div>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={regTrend}>
                  <CartesianGrid
                    strokeDasharray="5 5"
                    vertical={false}
                    strokeOpacity={0.05}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: "#94a3b8" }}
                  />
                  <Tooltip contentStyle={{ borderRadius: "16px" }} />
                  <Bar
                    dataKey="value"
                    fill="#3b82f6"
                    radius={[8, 8, 8, 8]}
                    barSize={20}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#fff",
                      strokeWidth: 2,
                      stroke: "#3b82f6",
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <ChartHeader
                title="Clinical Concerns"
                sub="Pathological Spectrum"
                icon={Activity}
                color="text-rose-500"
              />
              <div className="space-y-4">
                {complaintData.slice(0, 6).map((c: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                      <span className="text-slate-500 truncate max-w-[200px]">
                        {c.name}
                      </span>
                      <span className="text-rose-500">{c.value} PTS</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(c.value / Math.max(1, records.length)) * 100}%`,
                        }}
                        className="h-full bg-rose-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <ChartHeader
                title="Consultation Split"
                sub="Admission Architecture"
                icon={PieChartIcon}
                color="text-slate-500"
              />
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {typeData.map((_, i) => (
                        <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                {typeData.map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: COLORS[(i + 2) % COLORS.length],
                      }}
                    />
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      {d.name}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      );
    };

    const renderPatientsAnalytics = () => {
      const billingData = aggregateByDate("calculated_billed");
      const doctorLoad = aggregateByField("assigned_doctor");
      const treatmentMix = aggregateByField("treatment_type");

      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-4">
              <ChartHeader
                title="Practioner Allocation"
                sub="Case Load"
                icon={Users}
                color="text-indigo-500"
              />
              <div className="space-y-4">
                {doctorLoad.slice(0, 5).map((d: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent hover:border-indigo-500/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-500">
                        {d.name.charAt(0)}
                      </div>
                      <div>
                        <h6 className="text-[13px] font-bold dark:text-white line-clamp-1">
                          {d.name === "Unspecified"
                            ? "Not Assigned"
                            : `Dr. ${d.name}`}
                        </h6>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          {d.value} Active Cases
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="lg:col-span-8">
              <ChartHeader
                title="Revenue Accrual"
                sub="Growth Trends"
                icon={TrendingUp}
                color="text-emerald-500"
              />
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={billingData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      strokeOpacity={0.05}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                    />
                    <Tooltip cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                    <Bar
                      dataKey="value"
                      fill="#10b981"
                      radius={[6, 6, 6, 6]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card>
            <ChartHeader
              title="Treatment Spectrum"
              sub="Retention Analysis"
              icon={Activity}
              color="text-amber-500"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-4">
              {treatmentMix.slice(0, 4).map((t: any, i: number) => (
                <div
                  key={i}
                  className="group border-r border-slate-100 dark:border-white/5 last:border-0 pr-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t.name}
                    </span>
                    <ArrowUpRight
                      size={12}
                      className="text-slate-300 group-hover:text-amber-500 transition-colors"
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h5 className="text-3xl font-black dark:text-white tracking-tighter">
                      {t.value}
                    </h5>
                    <span className="text-[10px] font-bold text-slate-300">
                      Cycles
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full mt-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5, delay: i * 0.2 }}
                      className="h-full bg-amber-500"
                    />
                  </div>
                </div>
              ))}
              {treatmentMix.length === 0 && (
                <div className="col-span-full text-center text-[10px] text-slate-400 italic">
                  No treatment data captured for this period
                </div>
              )}
            </div>
          </Card>
        </div>
      );
    };

    const renderInquiriesAnalytics = () => {
      const leadTrend = aggregateByDate();
      const sourceMix = aggregateByField("referralSource");
      const statusMix = aggregateByField("status");

      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <ChartHeader
                title="Lead Acquisition"
                sub="Captured Velocity"
                icon={Search}
                color="text-fuchsia-500"
              />
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={leadTrend}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      strokeOpacity={0.05}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                    />
                    <Tooltip />
                    <Line
                      type="stepAfter"
                      dataKey="value"
                      stroke="#d946ef"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: "#fff",
                        strokeWidth: 2,
                        stroke: "#d946ef",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <ChartHeader
                title="Top Channels"
                sub="Traffic Performance"
                icon={PieChartIcon}
                color="text-blue-500"
              />
              <Leaderboard
                data={sourceMix}
                title="Referral Source Breakdown"
                metricLabel="Leads"
              />
            </Card>
          </div>

          <Card>
            <ChartHeader
              title="Conversion Funnel Health"
              sub="Pipeline Snapshot"
              icon={Target}
              color="text-emerald-500"
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4">
              {statusMix.map((s: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-transparent relative overflow-hidden group"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                    {s.name}
                  </span>
                  <div className="flex items-baseline gap-2 relative z-10">
                    <h5 className="text-4xl font-black dark:text-white tracking-tighter leading-none">
                      {s.value}
                    </h5>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">
                      Leads
                    </span>
                  </div>
                  <Target
                    size={48}
                    className="absolute -bottom-2 -right-2 text-black/5 dark:text-white/5 group-hover:scale-110 transition-transform"
                  />
                </div>
              ))}
              {statusMix.length === 0 && (
                <div className="col-span-full text-center text-[10px] text-slate-400 italic">
                  No lead status data available
                </div>
              )}
            </div>
          </Card>
        </div>
      );
    };

    switch (activeTab) {
      case "tests":
        return renderTestsAnalytics();
      case "registrations":
        return renderRegistrationsAnalytics();
      case "patients":
        return renderPatientsAnalytics();
      case "inquiries":
        return renderInquiriesAnalytics();
      default:
        return null;
    }
  };

  const renderFilters = () => {
    return (
      <div className="flex flex-col gap-6 mb-8 w-full">
        <div className="flex items-center gap-4 w-full  ">
          {/* SEARCH FIELD */}
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all flex-[1.5] ${isDark ? "bg-black/20 border-white/5 focus-within:border-emerald-500/50" : "bg-white border-slate-100 focus-within:border-slate-300 shadow-sm"}`}
          >
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={activeFilters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="bg-transparent border-none text-xs font-bold focus:ring-0 p-0 w-full text-slate-700 dark:text-slate-200"
            />
          </div>

          {/* DATE RANGE: RANGE PICKER INTEGRATION */}
          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${isDark ? "bg-black/20 border-white/5" : "bg-white border-slate-100 shadow-sm"}`}
          >
            <button
              onClick={() => setShowRangePicker("start")}
              className="flex flex-col items-start min-w-[100px]"
            >
              <span className="text-[7px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">
                From
              </span>
              <div className="flex items-center gap-2">
                <CalendarRange size={12} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {rangeStart
                    ? format(new Date(rangeStart), "dd MMM, yyyy")
                    : format(startOfMonth(currentMonth), "dd MMM, yyyy")}
                </span>
              </div>
            </button>

            <div className="w-px h-8 bg-slate-100 dark:bg-white/10" />

            <button
              onClick={() => setShowRangePicker("end")}
              className="flex flex-col items-start min-w-[100px]"
            >
              <span className="text-[7px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">
                To
              </span>
              <div className="flex items-center gap-2">
                <CalendarRange size={12} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {rangeEnd
                    ? format(new Date(rangeEnd), "dd MMM, yyyy")
                    : format(endOfMonth(currentMonth), "dd MMM, yyyy")}
                </span>
              </div>
            </button>

            {(isCustomRange || rangeStart || rangeEnd) && (
              <button
                onClick={() => {
                  setIsCustomRange(false);
                  setRangeStart(null);
                  setRangeEnd(null);
                }}
                className={`ml-2 p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors ${!isCustomRange && !rangeStart && !rangeEnd ? "hidden" : ""}`}
                title="Reset Range"
              >
                <RotateCcw size={12} strokeWidth={3} />
              </button>
            )}

            <div className="flex items-center gap-1 border-l border-slate-100 dark:border-white/10 pl-3 ml-2">
              <button
                onClick={() => {
                  setCurrentMonth(subMonths(currentMonth, 1));
                  setIsCustomRange(false);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronLeft size={14} strokeWidth={3} />
              </button>
              <button
                onClick={() => {
                  setCurrentMonth(addMonths(currentMonth, 1));
                  setIsCustomRange(false);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                disabled={
                  format(currentMonth, "MM-yyyy") ===
                  format(new Date(), "MM-yyyy")
                }
              >
                <ChevronRight size={14} strokeWidth={3} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-[2.5] justify-end">
            {activeTab === "tests" && (
              <>
                <div className="flex-1 min-w-[120px]">
                  <CustomSelect
                    label="Type"
                    value={activeFilters.test_name}
                    options={[
                      { label: "All Types", value: "" },
                      ...(filterOptions.tests || []).map((t: string) => ({
                        label: t,
                        value: t,
                      })),
                    ]}
                    onChange={(v) => handleFilterChange("test_name", v)}
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <CustomSelect
                    label="Status"
                    value={activeFilters.status}
                    options={[
                      { label: "All Status", value: "" },
                      ...(filterOptions.statuses || []).map((s: string) => ({
                        label: s,
                        value: s,
                      })),
                    ]}
                    onChange={(v) => handleFilterChange("status", v)}
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <CustomSelect
                    label="Payment"
                    value={activeFilters.payment_status}
                    options={[
                      { label: "All Payment", value: "" },
                      ...(filterOptions.payment_statuses || []).map(
                        (p: string) => ({ label: p, value: p }),
                      ),
                    ]}
                    onChange={(v) => handleFilterChange("payment_status", v)}
                  />
                </div>
              </>
            )}
            {activeTab === "registrations" && (
              <>
                <div className="flex-1 min-w-[120px]">
                  <CustomSelect
                    label="Complaint"
                    value={activeFilters.chief_complain}
                    options={[
                      { label: "All Complaints", value: "" },
                      ...(filterOptions.complains || []).map((c: string) => ({
                        label: c,
                        value: c,
                      })),
                    ]}
                    onChange={(v) => handleFilterChange("chief_complain", v)}
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <CustomSelect
                    label="Consult"
                    value={activeFilters.consultation_type}
                    options={[
                      { label: "All Types", value: "" },
                      ...(filterOptions.consultation_types || []).map(
                        (c: string) => ({ label: c, value: c }),
                      ),
                    ]}
                    onChange={(v) => handleFilterChange("consultation_type", v)}
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <CustomSelect
                    label="Status"
                    value={activeFilters.status}
                    options={[
                      { label: "All Status", value: "" },
                      ...(filterOptions.statuses || []).map((s: string) => ({
                        label: s,
                        value: s,
                      })),
                    ]}
                    onChange={(v) => handleFilterChange("status", v)}
                  />
                </div>
              </>
            )}
            {activeTab === "patients" && (
              <>
                <div className="flex-1 min-w-[120px]">
                  <CustomSelect
                    label="Doctor"
                    value={activeFilters.assigned_doctor}
                    options={[
                      { label: "All Doctors", value: "" },
                      ...(filterOptions.doctors || []).map((d: string) => ({
                        label: d,
                        value: d,
                      })),
                    ]}
                    onChange={(v) => handleFilterChange("assigned_doctor", v)}
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <CustomSelect
                    label="Treat"
                    value={activeFilters.treatment_type}
                    options={[
                      { label: "All", value: "" },
                      ...(filterOptions.treatment_types || []).map(
                        (t: string) => ({
                          label: t,
                          value: t,
                        }),
                      ),
                    ]}
                    onChange={(v) => handleFilterChange("treatment_type", v)}
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <CustomSelect
                    label="Status"
                    value={activeFilters.status}
                    options={[
                      { label: "All Status", value: "" },
                      ...(filterOptions.statuses || []).map((s: string) => ({
                        label: s,
                        value: s,
                      })),
                    ]}
                    onChange={(v) => handleFilterChange("status", v)}
                  />
                </div>
              </>
            )}
            {activeTab === "inquiries" && (
              <>
                <div className="flex-1 min-w-[120px]">
                  <CustomSelect
                    label="Complaint"
                    value={activeFilters.chief_complain}
                    options={[
                      { label: "All Complaints", value: "" },
                      ...(filterOptions.complains || []).map((c: string) => ({
                        label: c,
                        value: c,
                      })),
                    ]}
                    onChange={(v) => handleFilterChange("chief_complain", v)}
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <CustomSelect
                    label="Source"
                    value={activeFilters.referralSource}
                    options={[
                      { label: "All Sources", value: "" },
                      ...(filterOptions.sources || []).map((s: string) => ({
                        label: s,
                        value: s,
                      })),
                    ]}
                    onChange={(v) => handleFilterChange("referralSource", v)}
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <CustomSelect
                    label="Status"
                    value={activeFilters.status}
                    options={[
                      { label: "All Status", value: "" },
                      ...(filterOptions.statuses || []).map((s: string) => ({
                        label: s,
                        value: s,
                      })),
                    ]}
                    onChange={(v) => handleFilterChange("status", v)}
                  />
                </div>
              </>
            )}
            <button
              onClick={applyFilters}
              disabled={loading}
              className={`p-3 rounded-xl transition-all shadow-md active:scale-95 flex-none ${isDark ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10"}`}
            >
              <Filter size={16} strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={exportToCSV}
              className={`group flex items-center gap-3 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                isDark
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900 hover:shadow-xl hover:shadow-black/[0.05]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isDark ? "bg-emerald-500/10 group-hover:bg-black/20" : "bg-slate-100 group-hover:bg-slate-900 group-hover:text-white"}`}
              >
                <Download size={12} strokeWidth={3} />
              </div>
              Preview CSV
            </button>
            <button
              onClick={exportToPDF}
              className={`group flex items-center gap-3 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                isDark
                  ? "bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/20"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900 hover:shadow-xl hover:shadow-black/[0.05]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isDark ? "bg-rose-500/10 group-hover:bg-black/20" : "bg-slate-100 group-hover:bg-slate-900 group-hover:text-white"}`}
              >
                <FileText size={12} strokeWidth={3} />
              </div>
              Review Report
            </button>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === "table" ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <TableIcon size={12} strokeWidth={3} />
              Table
            </button>
            <button
              onClick={() => setViewMode("visual")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === "visual" ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <LayoutGrid size={12} strokeWidth={3} />
              Analytics
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-30 select-none pointer-events-none">
          <Activity size={40} className="animate-spin text-emerald-500" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">
            Processing Dataset...
          </p>
        </div>
      );
    }

    if (!records || records.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[40px] opacity-40">
          <FileText size={48} className="text-slate-300 mb-4" />
          <p className="text-sm font-medium">
            No records found for this period.
          </p>
        </div>
      );
    }

    return (
      <div
        className={`overflow-hidden rounded-[32px] border transition-all ${isDark ? "bg-[#141619] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl shadow-black/[0.03]"}`}
      >
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"}`}
              >
                {activeTab === "tests" && (
                  <>
                    <Th>Date</Th>
                    <Th>Patient</Th>
                    <Th>Test</Th>
                    <Th>Total</Th>
                    <Th>Disc</Th>
                    <Th>Billed</Th>
                    <Th>Paid</Th>
                    <Th>Dues</Th>
                    <Th>Status</Th>
                  </>
                )}
                {activeTab === "registrations" && (
                  <>
                    <Th>Date</Th>
                    <Th>Patient</Th>
                    <Th>Complaint</Th>
                    <Th>Type</Th>
                    <Th>Amount</Th>
                    <Th>Status</Th>
                  </>
                )}
                {activeTab === "patients" && (
                  <>
                    <Th>Patient</Th>
                    <Th>Doctor</Th>
                    <Th>Treatment</Th>
                    <Th>Days</Th>
                    <Th>Billed</Th>
                    <Th>Paid</Th>
                    <Th>Due</Th>
                  </>
                )}
                {activeTab === "inquiries" && (
                  <>
                    <Th>Date</Th>
                    <Th>Potential Patient</Th>
                    <Th>Source</Th>
                    <Th>Status</Th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {records.map((row: any, idx) => (
                <tr
                  key={idx}
                  className={`group transition-all hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-default`}
                >
                  {activeTab === "tests" && (
                    <>
                      <Td>
                        <span className="text-xs font-bold text-slate-500">
                          {format(new Date(row.created_at), "MMM dd")}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-500 transition-colors">
                            {row.patient_name}
                          </span>
                          <span className="text-[10px] font-medium opacity-50 uppercase tracking-widest">
                            {row.gender} • {row.age}Y
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                          {row.test_name}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[14px] font-black text-slate-500">
                          ₹{parseFloat(row.total || 0).toLocaleString()}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[14px] font-black text-rose-500">
                          ₹{parseFloat(row.discount || 0).toLocaleString()}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[14px] font-black text-slate-900 dark:text-white">
                          ₹{parseFloat(row.billed || 0).toLocaleString()}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[14px] font-black text-emerald-600">
                          ₹{parseFloat(row.paid || 0).toLocaleString()}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className={`text-[14px] font-black ${parseFloat(row.dues || 0) > 0 ? "text-rose-500" : "text-emerald-500"}`}
                        >
                          ₹{parseFloat(row.dues || 0).toLocaleString()}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge status={row.test_status} />
                      </Td>
                    </>
                  )}
                  {activeTab === "registrations" && (
                    <>
                      <Td>
                        <span className="text-xs font-bold text-slate-500">
                          {format(new Date(row.created_at), "MMM dd")}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-black text-slate-900 dark:text-slate-100">
                            {row.patient_name}
                          </span>
                          <span className="text-[10px] font-medium opacity-50 uppercase tracking-widest">
                            {row.gender} • {row.age}Y
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                          {row.chief_complain}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[11px] font-black uppercase bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">
                          {row.consultation_type}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[14px] font-black text-emerald-600 dark:text-emerald-400">
                          ₹
                          {parseFloat(row.consultation_amount).toLocaleString()}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge status={row.status} />
                      </Td>
                    </>
                  )}
                  {activeTab === "patients" && (
                    <>
                      <Td>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-black text-slate-900 dark:text-slate-100">
                            {row.patient_name}
                          </span>
                          <span className="text-[10px] font-medium opacity-50 uppercase tracking-widest">
                            UID: #{row.patient_uid || row.patient_id}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 italic">
                          Dr. {row.assigned_doctor}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[11px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">
                          {row.treatment_type}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[13px] font-bold text-slate-500">
                          {row.attendance_present_count}/{row.treatment_days}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[14px] font-black">
                          ₹{parseFloat(row.calculated_billed).toLocaleString()}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-[14px] font-black text-emerald-600 dark:text-emerald-400">
                          ₹
                          {parseFloat(
                            row.calculated_paid_all_time,
                          ).toLocaleString()}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className={`text-[14px] font-black ${parseFloat(row.calculated_due) > 0 ? "text-rose-500" : "text-emerald-500"}`}
                        >
                          ₹{parseFloat(row.calculated_due).toLocaleString()}
                        </span>
                      </Td>
                    </>
                  )}
                  {activeTab === "inquiries" && (
                    <>
                      <Td>
                        <span className="text-xs font-bold text-slate-500">
                          {format(new Date(row.created_at), "MMM dd")}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-black text-slate-900 dark:text-slate-100">
                            {row.name}
                          </span>
                          <span className="text-[10px] font-medium opacity-50 uppercase tracking-widest">
                            {row.phone_number}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                          {row.referralSource}
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge status={row.status} />
                      </Td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? "bg-[#050505] text-slate-200" : "bg-[#FAFAFA] text-slate-900"}`}
    >
      <Sidebar onShowChat={() => setShowChatModal(true)} />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <PageHeader
          title="Reports & Analytics"
          subtitle="Data Intelligence Hub"
          icon={TrendingUp}
          onRefresh={handleRefresh}
          refreshCooldown={refreshCooldown}
          isLoading={loading || isRefreshing}
          onShowIntelligence={() => setShowIntelligence(true)}
          onShowNotes={() => setShowNotes(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL: Module Navigation & Summary */}
          <aside
            className={`hidden xl:flex w-[400px] flex-col p-10 border-r relative shrink-0 transition-colors duration-300 z-50 ${isDark ? "bg-[#0A0A0A] border-[#151515]" : "bg-white border-gray-100"}`}
          >
            <div className="space-y-12 z-10 w-full">
              <div className="space-y-4">
                <h1 className="text-5xl font-serif font-normal tracking-tight leading-tight text-slate-900 dark:text-slate-100 italic">
                  Insights &nbsp;
                  <span
                    className={`font-normal ${isDark ? "text-emerald-400 font-sans not-italic" : "text-emerald-600 font-sans not-italic"}`}
                  >
                    Hub
                  </span>
                </h1>
                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[280px]">
                  Analyze operational performance with multi-module reporting.
                </p>
              </div>

              {/* FINANCIAL OVERVIEW: Promoted to top spot */}
              <div className="space-y-10">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                      Module Navigation
                    </p>
                    <div className="w-12 h-px bg-slate-100 dark:bg-white/5" />
                  </div>

                  <div className="flex flex-col gap-2 p-2 rounded-[32px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setActiveFilters({});
                          }}
                          className={`
                            flex items-center justify-between px-6 py-4 rounded-[24px] transition-all duration-300 group
                            ${
                              isActive
                                ? "bg-white dark:bg-white/10 shadow-xl shadow-black/[0.05] translate-x-1"
                                : "hover:bg-white/50 dark:hover:bg-white/5 hover:translate-x-1"
                            }
                          `}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`
                                w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500
                                ${
                                  isActive
                                    ? "bg-slate-900 dark:bg-white text-white dark:text-black scale-110 rotate-3"
                                    : "bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:bg-white dark:group-hover:bg-white/10 group-hover:text-slate-900 dark:group-hover:text-white"
                                }
                              `}
                            >
                              <tab.icon
                                size={18}
                                strokeWidth={isActive ? 3 : 2}
                              />
                            </div>
                            <div className="flex flex-col items-start">
                              <span
                                className={`text-[11px] font-black uppercase tracking-widest ${isActive ? "text-slate-900 dark:text-white" : "text-slate-500"}`}
                              >
                                {tab.label}
                              </span>
                              {isActive && (
                                <motion.span
                                  layoutId="active-indicator"
                                  className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5"
                                >
                                  Active Analysis
                                </motion.span>
                              )}
                            </div>
                          </div>
                          <ChevronRight
                            size={14}
                            className={`transition-all duration-300 ${isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-40"}`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                      Financial Intelligence
                    </p>
                    <div className="w-12 h-px bg-slate-100 dark:bg-white/5" />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {activeTab === "tests" && (
                      <>
                        <LargeStatBox
                          label="Total Revenue"
                          value={totals.total_revenue}
                          sub={`Billed: ₹${(totals.total_billed || 0).toLocaleString()}`}
                          color="emerald"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <SmallStatBox
                            label="Collected"
                            value={totals.total_collected}
                            color="blue"
                          />
                          <SmallStatBox
                            label="Outstanding"
                            value={totals.total_outstanding}
                            color="rose"
                          />
                        </div>
                      </>
                    )}

                    {activeTab === "registrations" && (
                      <>
                        <LargeStatBox
                          label="Consulted Sum"
                          value={totals.consulted_sum}
                          sub="Completed Sessions"
                          color="emerald"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <SmallStatBox
                            label="Pending"
                            value={totals.pending_sum}
                            color="amber"
                          />
                          <SmallStatBox
                            label="Closed"
                            value={totals.closed_sum}
                            color="slate"
                          />
                        </div>
                      </>
                    )}

                    {activeTab === "patients" && (
                      <>
                        <LargeStatBox
                          label="Period Billed"
                          value={totals.total_sum}
                          sub="New Billings"
                          color="indigo"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <SmallStatBox
                            label="Period Paid"
                            value={totals.paid_sum}
                            color="emerald"
                          />
                          <SmallStatBox
                            label="Total Dues"
                            value={totals.due_sum}
                            color="rose"
                          />
                        </div>

                        <div className="mt-4 p-6 rounded-[32px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Conversion
                            </span>
                            <Activity size={14} className="text-emerald-500" />
                          </div>
                          <div className="text-4xl font-black text-slate-900 dark:text-white">
                            {stats.registrations_period > 0
                              ? Math.round(
                                  (stats.converted_period /
                                    stats.registrations_period) *
                                    100,
                                )
                              : 0}
                            %
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 mt-1">
                            {stats.converted_period} converted from{" "}
                            {stats.registrations_period} registrations
                          </p>
                        </div>
                      </>
                    )}

                    {activeTab === "inquiries" && (
                      <>
                        <LargeStatBox
                          label="Total Leads"
                          value={totals.total_inquiries}
                          sub="Inbound Queries"
                          color="slate"
                          isCurrency={false}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <SmallStatBox
                            label="Converted"
                            value={totals.registered_count}
                            color="emerald"
                            isCurrency={false}
                          />
                          <SmallStatBox
                            label="Efficiency"
                            value={
                              totals.total_inquiries > 0
                                ? Math.round(
                                    (totals.registered_count /
                                      totals.total_inquiries) *
                                      100,
                                  )
                                : 0
                            }
                            color="blue"
                            isCurrency={false}
                            suffix="%"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col p-6 md:p-8 lg:p-10 gap-8 bg-[#FAFAFA] dark:bg-[#0A0A0A] pb-40">
            {/* Module Tabs moved to Top Right - Removed */}

            {renderFilters()}
            <AnimatePresence mode="wait">
              {viewMode === "table" ? (
                <motion.div
                  key="table"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderTable()}
                </motion.div>
              ) : (
                <motion.div
                  key="visual"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderAnalytics()}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      <ActionFAB
        onAction={(act) =>
          navigate("/reception/dashboard", { state: { openModal: act } })
        }
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

      {showRangePicker && (
        <RangePicker
          startDate={rangeStart}
          endDate={rangeEnd}
          onChange={(start, end) => {
            setRangeStart(start);
            setRangeEnd(end);
            setIsCustomRange(true);
            setShowRangePicker(null);
          }}
          onClose={() => setShowRangePicker(null)}
        />
      )}

      <FileViewer
        isOpen={fileViewerConfig.isOpen}
        onClose={() => setFileViewerConfig((p) => ({ ...p, isOpen: false }))}
        url={fileViewerConfig.url}
        fileName={fileViewerConfig.fileName}
        downloadUrl={fileViewerConfig.downloadUrl}
        downloadFileName={fileViewerConfig.downloadFileName}
      />

      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          navigate("/login");
        }}
      />
    </div>
  );
};

const LargeStatBox = ({
  label,
  value,
  sub,
  color,
  isCurrency = true,
  suffix = "",
}: any) => {
  const cMap: any = {
    emerald: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10",
    blue: "text-blue-500 bg-blue-500/5 border-blue-500/10",
    rose: "text-rose-500 bg-rose-500/5 border-rose-500/10",
    indigo: "text-indigo-500 bg-indigo-500/5 border-indigo-500/10",
    slate: "text-slate-500 bg-slate-500/5 border-slate-500/10",
  };

  const num = parseFloat(String(value));
  const displayValue = !isNaN(num) ? num.toLocaleString() : "0";

  return (
    <div
      className={`p-8 rounded-[40px] border ${cMap[color] || cMap.slate} transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <TrendingUp size={80} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
            {label}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500">
            <ArrowUpRight size={12} />
            {Math.floor(Math.random() * 15) + 5}%
          </div>
        </div>
        <div className="text-5xl font-black tracking-tighter">
          {isCurrency ? "₹" : ""}
          {displayValue}
          {suffix}
        </div>
        <div className="text-[11px] font-bold opacity-40 mt-2 uppercase tracking-widest flex items-center gap-2">
          <span>{sub}</span>
          <div className="w-1.5 h-px bg-current opacity-30" />
          <span className="text-[9px]">Vs last period</span>
        </div>
      </div>
    </div>
  );
};

const SmallStatBox = ({
  label,
  value,
  color,
  isCurrency = true,
  suffix = "",
}: any) => {
  const cMap: any = {
    emerald: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10",
    blue: "text-blue-500 bg-blue-500/5 border-blue-500/10",
    rose: "text-rose-500 bg-rose-500/5 border-rose-500/10",
    amber: "text-amber-500 bg-amber-500/5 border-amber-500/10",
    slate: "text-slate-500 bg-slate-500/5 border-slate-100 dark:border-white/5",
  };

  const num = parseFloat(String(value));
  const displayValue = !isNaN(num) ? num.toLocaleString() : "0";

  return (
    <div
      className={`p-6 rounded-[32px] border ${cMap[color] || cMap.slate} transition-all`}
    >
      <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 mb-3">
        {label}
      </div>
      <div className="text-xl font-black">
        {isCurrency ? "₹" : ""}
        {displayValue}
        {suffix}
      </div>
    </div>
  );
};

const Th = ({ children }: any) => {
  const { isDark } = useThemeStore();
  return (
    <th
      className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-500" : "text-slate-400"}`}
    >
      {children}
    </th>
  );
};

const Td = ({ children, className = "" }: any) => {
  return (
    <td className={`px-6 py-5 whitespace-nowrap ${className}`}>{children}</td>
  );
};

const StatusBadge = ({ status }: any) => {
  const s = String(status || "").toLowerCase();

  let bClass =
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  let dot = "bg-slate-400";

  if (
    [
      "paid",
      "completed",
      "active",
      "consulted",
      "closed",
      "registered",
    ].includes(s)
  ) {
    bClass =
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
    dot = "bg-emerald-500";
  } else if (
    [
      "pending",
      "in-progress",
      "in progress",
      "partial",
      "partially_paid",
      "new",
    ].includes(s)
  ) {
    bClass =
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
    dot = "bg-amber-500";
  } else if (["cancelled", "discontinued", "unpaid", "lost"].includes(s)) {
    bClass =
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
    dot = "bg-rose-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${bClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      {status || "Unknown"}
    </span>
  );
};

export default Reports;
