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

  // Filters
  const [dateRange, setDateRange] = useState({
    start_date: format(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      "yyyy-MM-dd",
    ),
    end_date: format(new Date(), "yyyy-MM-dd"),
  });

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
  }, [activeTab]);

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
    try {
      const params = new URLSearchParams();
      if (dateRange.start_date)
        params.append("start_date", dateRange.start_date);
      if (dateRange.end_date) params.append("end_date", dateRange.end_date);
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
        setRefreshCooldown(30);
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

    const link = document.createElement("a");
    link.href = csvUrl;
    link.download = `${activeTab}_report_${format(new Date(), "yyyyMMdd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    // Generate some mock chart data based on records if real stats aren't available
    const chartData =
      records.length > 0
        ? records.slice(0, 10).map((r, i) => ({
            name: format(new Date(r.created_at || new Date()), "MMM dd"),
            value: parseFloat(
              r.total_amount ||
                r.consultation_amount ||
                r.calculated_billed ||
                100,
            ),
            label: r.patient_name || r.name || `Record ${i + 1}`,
            sub: r.test_name || r.chief_complain || r.treatment_type || "N/A",
          }))
        : [
            { name: "Day 1", value: 400, label: "Demo Item", sub: "Category" },
            {
              name: "Day 2",
              value: 300,
              label: "Demo Item 2",
              sub: "Category",
            },
          ];

    const paymentData = [
      { name: "Cash", value: totals.cash_sum || 45 },
      { name: "UPI", value: totals.upi_sum || 30 },
      { name: "Card", value: totals.card_sum || 15 },
      { name: "Others", value: totals.other_sum || 10 },
    ].filter((d) => d.value > 0);

    // Fallback data if no payment data exists
    const displayPaymentData =
      paymentData.length > 0
        ? paymentData
        : [
            { name: "Cash", value: 60 },
            { name: "UPI", value: 25 },
            { name: "Card", value: 15 },
          ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Trend Chart */}
          <div
            className={`p-8 rounded-[40px] border ${isDark ? "bg-[#141619] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl shadow-black/[0.02]"}`}
          >
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">
                  Performance Trend
                </p>
                <h3 className="text-2xl font-serif italic text-slate-900 dark:text-white">
                  Revenue Velocity
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <TrendingUp size={20} />
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={
                      isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                    }
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#1A1C1E" : "#FFFFFF",
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
                    }}
                    itemStyle={{ fontWeight: 900, color: "#10b981" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorVal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Distribution */}
          <div
            className={`p-8 rounded-[40px] border ${isDark ? "bg-[#141619] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl shadow-black/[0.02]"}`}
          >
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-1">
                  Financial Split
                </p>
                <h3 className="text-2xl font-serif italic text-slate-900 dark:text-white">
                  Payment Methods
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                <PieChartIcon size={20} />
              </div>
            </div>

            <div className="h-[300px] w-full flex flex-col md:flex-row items-center">
              <div className="flex-1 w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displayPaymentData}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {displayPaymentData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-4 min-w-[150px]">
                {displayPaymentData.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {d.name}
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {activeTab === "inquiries"
                          ? d.value
                          : `₹${d.value.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Analysis & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Analysis (Vertical Bar) */}
          <div
            className={`lg:col-span-2 p-8 rounded-[40px] border ${isDark ? "bg-[#141619] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl shadow-black/[0.02]"}`}
          >
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">
                  Service Breakdown
                </p>
                <h3 className="text-2xl font-serif italic text-slate-900 dark:text-white">
                  {activeTab === "tests"
                    ? "Popular Tests"
                    : activeTab === "registrations"
                      ? "Common Complaints"
                      : "Inquiry Trends"}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                <BarChart3 size={20} />
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData.slice(0, 6)}
                  margin={{ left: 100 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke={
                      isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                    }
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="sub"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 900, fill: "#94a3b8" }}
                    width={120}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{ borderRadius: "16px", border: "none" }}
                  />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={30}>
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        opacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Leaderboard */}
          <div
            className={`p-8 rounded-[40px] border ${isDark ? "bg-[#141619] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl shadow-black/[0.02]"}`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-1">
              Performance
            </p>
            <h3 className="text-2xl font-serif italic text-slate-900 dark:text-white mb-8">
              Top Records
            </h3>

            <div className="space-y-6">
              {chartData.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                      {item.label}
                    </span>
                    <span className="text-xs font-black text-emerald-500">
                      ₹{item.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(item.value / (chartData[0]?.value || 1)) * 100}%`,
                      }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-10 py-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 transition-all">
              View All Insights
            </button>
          </div>
        </div>
      </motion.div>
    );
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

          {/* DATE RANGE */}
          <div
            className={`flex items-center gap-2 p-1 rounded-[20px] border transition-all flex-none ${isDark ? "bg-black/20 border-white/5 shadow-inner" : "bg-white border-slate-100 shadow-sm"}`}
          >
            <div className="relative group">
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) =>
                  setDateRange((p) => ({ ...p, start_date: e.target.value }))
                }
                className="bg-transparent border-none text-[11px] font-bold focus:ring-0 px-3 py-1.5 text-slate-700 dark:text-slate-200"
              />
              <label className="absolute -top-1.5 left-3 text-[7px] font-black uppercase tracking-widest text-emerald-500 bg-white dark:bg-[#0A0B0A] px-1 pointer-events-none">
                From
              </label>
            </div>
            <div className="h-3 w-px bg-slate-200 dark:bg-white/10" />
            <div className="relative group">
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) =>
                  setDateRange((p) => ({ ...p, end_date: e.target.value }))
                }
                className="bg-transparent border-none text-[11px] font-bold focus:ring-0 px-3 py-1.5 text-slate-700 dark:text-slate-200"
              />
              <label className="absolute -top-1.5 left-3 text-[7px] font-black uppercase tracking-widest text-emerald-500 bg-white dark:bg-[#0A0B0A] px-1 pointer-events-none">
                To
              </label>
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
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 border ${isDark ? "hover:bg-white/5 border-white/5 text-slate-300" : "bg-white border-slate-100 text-slate-600 hover:shadow-lg"}`}
            >
              <Download size={12} /> Export CSV
            </button>
            <button
              onClick={() => {}}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 border ${isDark ? "hover:bg-white/5 border-white/5 text-slate-300" : "bg-white border-slate-100 text-slate-600 hover:shadow-lg"}`}
            >
              <FileText size={12} /> Export PDF
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
                    <Th>Test Name</Th>
                    <Th>Amount</Th>
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
                        <span className="text-[14px] font-black text-emerald-600 dark:text-emerald-400">
                          ₹{parseFloat(row.total_amount).toLocaleString()}
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
                          sub="Billed Amount"
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
            {/* NEW: Module Tabs moved to Top Right */}
            <div className="flex items-center justify-end w-full">
              <div className="flex items-center gap-1.5 p-1.5 rounded-[24px] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setActiveFilters({});
                      }}
                      className={`flex items-center gap-2 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        isActive
                          ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-black/10 scale-[1.02]"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      }`}
                    >
                      <tab.icon size={13} strokeWidth={3} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

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
