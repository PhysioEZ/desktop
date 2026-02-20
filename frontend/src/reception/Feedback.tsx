import { useState, useRef, useCallback, useEffect } from "react";
import {
  Search,
  MessageSquare,
  PieChart,
  Smile,
  Frown,
  Meh,
  Send,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Bell,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { API_BASE_URL, authFetch } from "../config";
import { toast } from "sonner";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import Sidebar from "../components/Sidebar";
import FileViewer from "../components/FileViewer/FileViewer";

interface FeedbackRecord {
  id: number;
  date: string;
  patient_name: string;
  added_by: string;
  rating: "Good" | "Average" | "Bad";
  status: "Ongoing" | "Completed" | "Discontinued";
  comment: string;
  phone_number?: string;
  is_resolved?: boolean;
  resolution_note?: string;
  resolved_by_name?: string;
  resolved_at?: string;
}

const Feedback = () => {
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();

  // State
  const [stats, setStats] = useState({
    total: 0,
    good: 0,
    average: 0,
    bad: 0,
  });
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentDate] = useState(new Date());

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterRating, setFilterRating] = useState<
    "All" | "Good" | "Average" | "Bad"
  >("All");
  const [filterResolved, setFilterResolved] = useState<
    "All" | "Unresolved" | "Resolved"
  >("All");

  // Detailed View Modal
  const [selectedRecord, setSelectedRecord] = useState<FeedbackRecord | null>(
    null,
  );
  const [resolutionInput, setResolutionInput] = useState("");
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/feedback?page=${page}&limit=${limit}`,
      );
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
        setStats(data.stats);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalRecords(data.pagination.total);
        }
      } else {
        toast.error(data.message || "Failed to fetch feedback");
      }
    } catch (err) {
      toast.error("System error fetching feedback");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchFeedback();
  }, [page, fetchFeedback]);

  const [showForm, setShowForm] = useState(false);
  const [experience, setExperience] = useState<"Good" | "Average" | "Bad">(
    "Good",
  );
  const [treatmentStatus, setTreatmentStatus] = useState("Ongoing (Active)");
  const [comments, setComments] = useState("");

  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null,
  );

  const handlePatientSearch = async (query: string) => {
    setPatientSearchQuery(query);
    setSelectedPatientId(null);
    if (query.length === 0) {
      setPatientSearchResults([]);
      return;
    }
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/feedback?action=search_patients&search=${query}`,
      );
      const data = await res.json();
      if (data.success) {
        setPatientSearchResults(data.data);
      }
    } catch (err) {}
  };

  // Header Logic (Notifications)
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const notifRef = useRef<HTMLButtonElement>(null);

  const [fileViewerConfig, setFileViewerConfig] = useState({
    isOpen: false,
    url: "",
    fileName: "",
    downloadUrl: "",
    downloadFileName: "",
  });

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/notifications?employee_id=${user?.employee_id || ""}`,
      );
      const data = await res.json();
      if (data.success || data.status === "success") {
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user?.employee_id]);

  useEffect(() => {
    if (user?.employee_id) {
      fetchNotifs();
      const inv = setInterval(fetchNotifs, 30000);
      return () => clearInterval(inv);
    }
  }, [fetchNotifs, user?.employee_id]);

  const exportToCSV = () => {
    if (!records || records.length === 0) return;
    const header = "Date,Patient,Phone,Rating,Status,Comment,Resolved\n";
    const csvRules = records
      .map(
        (r) =>
          `"${r.date}","${r.patient_name}","${r.phone_number || ""}","${r.rating}","${r.status}","${(r.comment || "").replace(/"/g, '""')}","${r.is_resolved ? "Yes" : "No"}"`,
      )
      .join("\n");
    const csvBlob = new Blob([header + csvRules], {
      type: "text/csv;charset=utf-8;",
    });
    const csvUrl = window.URL.createObjectURL(csvBlob);

    const htmlContent = `
      <html><head>
      <title>Patient Feedback Report</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: #fff; margin: 0; }
        .header-container { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
        h2 { margin: 0; font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.05em; }
        .timestamp { color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        th, td { padding: 16px 20px; text-align: left; border-bottom: 1px solid #f1f5f9; }
        th { background: #f8fafc; color: #475569; text-transform: uppercase; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; border-bottom: 2px solid #e2e8f0; }
        tr:last-child td { border-bottom: none; }
        tr:nth-child(even) { background: #f8fafc; }
        td { font-size: 14px; color: #334155; font-weight: 500; }
        .rating-Good { color: #059669; font-weight: 800; background: #d1fae5; padding: 4px 10px; border-radius: 20px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        .rating-Average { color: #475569; font-weight: 800; background: #f1f5f9; padding: 4px 10px; border-radius: 20px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        .rating-Bad { color: #e11d48; font-weight: 800; background: #ffe4e6; padding: 4px 10px; border-radius: 20px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        .status { font-weight: 600; opacity: 0.7; }
        .comment { font-style: italic; color: #64748b; }
      </style></head><body>
      <div class="header-container">
        <h2>Patient Feedback Report</h2>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Patient</th><th>Phone</th><th>Rating</th><th>Status</th><th>Comment</th><th>Resolved</th></tr></thead>
        <tbody>
          ${records
            .map(
              (r) => `
            <tr>
              <td style="white-space:nowrap; font-weight:600;">${(() => {
                const d = new Date(r.date);
                return isNaN(d.getTime()) ? r.date : format(d, "MMM dd, yyyy");
              })()}</td>
              <td style="font-weight: 800;">${r.patient_name}</td>
              <td style="font-family: monospace; font-size:13px; font-weight: 600;">${r.phone_number || "-"}</td>
              <td><span class="rating-${r.rating}">${r.rating}</span></td>
              <td class="status">${r.status}</td>
              <td class="comment">${r.comment ? `"${r.comment}"` : "-"}</td>
              <td style="font-weight: 800; color: ${r.is_resolved ? "#059669" : "#64748b"};">${r.is_resolved ? "YES" : "NO"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      </body></html>
    `;
    const htmlBlob = new Blob([htmlContent], {
      type: "text/html;charset=utf-8;",
    });
    const htmlUrl = window.URL.createObjectURL(htmlBlob);

    setFileViewerConfig({
      isOpen: true,
      url: htmlUrl,
      fileName: `patient_feedback_report.html`,
      downloadUrl: csvUrl,
      downloadFileName: `patient_feedback.csv`,
    });
  };

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      toast.error("Please select a patient first.");
      return;
    }

    let mapStatus = "active";
    if (treatmentStatus === "Treatment Completed") mapStatus = "completed";
    else if (treatmentStatus === "Discontinued / Stopped")
      mapStatus = "discontinued";

    const toastId = toast.loading("Saving feedback...");

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/feedback`, {
        method: "POST",
        body: JSON.stringify({
          action: "submit",
          patient_id: selectedPatientId,
          feedback_type: experience,
          patient_status: mapStatus,
          comments: comments,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Feedback saved successfully!", { id: toastId });
        setShowForm(false);
        setComments("");
        setPatientSearchQuery("");
        setSelectedPatientId(null);
        setExperience("Good");
        setTreatmentStatus("Ongoing (Active)");
        fetchFeedback();
      } else {
        toast.error(data.message || "Failed to submit feedback", {
          id: toastId,
        });
      }
    } catch (err) {
      toast.error("System error submitting feedback", { id: toastId });
    }
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
          <div className="space-y-6">
            <h1 className="text-5xl font-serif font-normal tracking-tight leading-tight text-slate-900 dark:text-slate-100">
              Patient{" "}
              <span
                className={`italic ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
              >
                Feedback
              </span>
            </h1>
            <p className="text-slate-500 text-base leading-relaxed max-w-xs">
              Monitor patient satisfaction and treatment experiences for{" "}
              {format(currentDate, "MMMM yyyy")}.
            </p>
          </div>
        </div>

        {/* Vertical Stats Stack */}
        <div className="space-y-10 w-full flex-1 flex flex-col justify-center py-6">
          {/* Stat 1: Total Satisfaction */}
          <div
            className={`p-8 rounded-[32px] border transition-all duration-300 ${isDark ? "bg-[#121212] border-white/5" : "bg-white border-emerald-100 shadow-sm"}`}
          >
            <div className="flex items-center gap-3 opacity-60 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Smile size={20} strokeWidth={2} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Total Response
              </span>
            </div>
            <div>
              <div
                className={`text-5xl font-medium tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {stats.total}
              </div>
            </div>
          </div>

          {/* Stat 2: Breakdown */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 opacity-40 px-2 group">
              <PieChart
                size={14}
                className="group-hover:rotate-12 transition-transform"
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                Experience Breakdown
              </span>
            </div>
            <div
              className={`p-8 rounded-[32px] border flex flex-col gap-6 ${isDark ? "bg-[#121212] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}
            >
              <div className="flex justify-between items-center border-b pb-6 border-dashed border-slate-200 dark:border-white/5">
                <div>
                  <div className="text-3xl font-medium text-emerald-600 dark:text-emerald-400">
                    {stats.good}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    Positive Reviews
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <Smile size={22} />
                </div>
              </div>
              <div className="flex justify-between items-center border-b pb-6 border-dashed border-slate-200 dark:border-white/5">
                <div>
                  <div className={`text-3xl font-medium text-slate-500`}>
                    {stats.average}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    Average
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-500/10 text-slate-500">
                  <Meh size={22} />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-3xl font-medium text-rose-500">
                    {stats.bad}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-1">
                    Critical
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                  <Frown size={22} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Graph */}
        <div
          className={`p-6 rounded-[32px] border block ${isDark ? "bg-[#121212] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}
        >
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              7-Day Trend
            </span>
          </div>
          <div className="flex items-end justify-between h-20 pb-4 gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const dStr = format(d, "yyyy-MM-dd");
              const count = records.filter((r) => {
                try {
                  return format(new Date(r.date), "yyyy-MM-dd") === dStr;
                } catch {
                  return false;
                }
              }).length;
              const maxCount = Math.max(
                ...Array.from({ length: 7 }).map((_, j) => {
                  const x = new Date();
                  x.setDate(x.getDate() - (6 - j));
                  const xStr = format(x, "yyyy-MM-dd");
                  return records.filter((rk) => {
                    try {
                      return format(new Date(rk.date), "yyyy-MM-dd") === xStr;
                    } catch {
                      return false;
                    }
                  }).length;
                }),
                1,
              );
              let height = (count / maxCount) * 100;
              if (count === 0) height = 5;
              return (
                <div
                  key={i}
                  className={`w-full rounded-t-md opacity-30 hover:opacity-100 transition-all relative group flex justify-center cursor-help ${isDark ? "bg-emerald-400" : "bg-emerald-500"}`}
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-7 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap z-50">
                    {count}
                  </div>
                  <div className="absolute -bottom-5 text-[8px] font-bold opacity-60 uppercase tracking-widest">
                    {format(d, "dd")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute top-1/2 left-0 w-full h-full bg-gradient-to-t from-emerald-500/[0.02] to-transparent pointer-events-none" />
      </div>

      {/* === MAIN CONTENT (Right Panel) === */}
      <main className="flex-1 h-screen overflow-hidden relative flex flex-col p-8 lg:p-12 gap-8">
        {/* Global Header */}
        <div className="flex justify-between items-end shrink-0">
          <div>
            <h2 className="text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-100">
              Feedback Activity
            </h2>
            <p className="text-slate-500 text-base mt-1">
              Manage patient reviews and treatment status
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchFeedback()}
              className={`w-12 h-12 border rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-[#121212] border-white/5 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"} ${loading ? "animate-spin" : ""}`}
            >
              <RefreshCw size={20} className="text-slate-500" />
            </button>
            <div className="relative">
              <button
                ref={notifRef}
                onClick={() => setShowNotifPopup(!showNotifPopup)}
                className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all hover:scale-105 ${isDark ? "bg-[#121212] border-white/5 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"} relative text-slate-500`}
              >
                <Bell size={20} strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Card (Table Container) */}
        <div
          className={`flex-1 rounded-[40px] border overflow-hidden flex flex-col shadow-sm transition-colors ${isDark ? "bg-[#0A0A0A] border-white/5" : "bg-white border-slate-200/60"}`}
        >
          {/* Toolbar Row */}
          <div
            className={`flex flex-col xl:flex-row items-center justify-between gap-6 p-8 border-b ${isDark ? "border-white/5" : "border-slate-100"}`}
          >
            <div className="flex items-center gap-4 w-full xl:w-auto">
              <div
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl border flex-1 xl:w-96 transition-all ${isDark ? "bg-[#121212] border-white/5 focus-within:border-emerald-500/30" : "bg-slate-50 border-slate-100 focus-within:bg-white focus-within:border-emerald-500/30 shadow-inner focus-within:shadow-sm"}`}
              >
                <Search size={18} className="opacity-30" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="bg-transparent border-none outline-none text-sm w-full font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Quick Filters */}
              <div
                className={`flex items-center gap-1 p-1.5 rounded-2xl border ${isDark ? "bg-[#121212] border-white/5" : "bg-slate-50 border-slate-200 shadow-inner"}`}
              >
                {["All", "Good", "Bad", "Needs Attention"].map((f) => {
                  const isActive =
                    (f === "Needs Attention" &&
                      filterResolved === "Unresolved" &&
                      filterRating === "Bad") ||
                    (f === "All" &&
                      filterRating === "All" &&
                      filterResolved === "All") ||
                    (f === "Good" &&
                      filterRating === "Good" &&
                      filterResolved === "All") ||
                    (f === "Bad" &&
                      filterRating === "Bad" &&
                      filterResolved === "All");
                  return (
                    <button
                      key={f}
                      onClick={() => {
                        if (f === "Needs Attention") {
                          setFilterRating("Bad");
                          setFilterResolved("Unresolved");
                        } else if (f === "All") {
                          setFilterRating("All");
                          setFilterResolved("All");
                        } else if (f === "Good") {
                          setFilterRating("Good");
                          setFilterResolved("All");
                        } else if (f === "Bad") {
                          setFilterRating("Bad");
                          setFilterResolved("All");
                        }
                      }}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${isActive ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                    >
                      {f === "Needs Attention" && (
                        <span className="mr-1.5 inline-block w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                      )}
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={exportToCSV}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl border text-sm font-semibold transition-all shadow-sm active:scale-95 ${isDark ? "bg-[#121212] border-white/5 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50"}`}
              >
                <i className="fa-solid fa-download opacity-40"></i>
                Export
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
              >
                <Plus size={20} /> New Feedback
              </button>
            </div>
          </div>

          {/* Feedback Cards Collection */}
          <div
            className={`flex-1 overflow-y-auto custom-scrollbar p-6 ${isDark ? "bg-[#050505]" : "bg-slate-50/50"}`}
          >
            <div className="flex flex-col gap-4 max-w-7xl mx-auto">
              {loading && records.length === 0 ? (
                <div className="p-10 flex flex-col gap-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-32 w-full rounded-[32px] animate-pulse ${isDark ? "bg-white/5" : "bg-white"}`}
                    ></div>
                  ))}
                </div>
              ) : records.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center opacity-40">
                  <MessageSquare size={48} className="mb-4" />
                  <p className="font-bold uppercase tracking-widest text-sm">
                    No Feedback Records Found
                  </p>
                </div>
              ) : (
                records
                  .filter((r) => {
                    const matchesSearch = r.patient_name
                      .toLowerCase()
                      .includes(search.toLowerCase());
                    const matchesRating =
                      filterRating === "All" || r.rating === filterRating;
                    const matchesResolved =
                      filterResolved === "All" ||
                      (filterResolved === "Resolved"
                        ? r.is_resolved
                        : !r.is_resolved);
                    return matchesSearch && matchesRating && matchesResolved;
                  })
                  .map((row) => {
                    const dateObj = new Date(row.date);
                    const dateFormatted = isNaN(dateObj.getTime())
                      ? row.date
                      : format(dateObj, "MMM dd, yyyy");
                    const timeFormatted = isNaN(dateObj.getTime())
                      ? ""
                      : format(dateObj, "hh:mm a");

                    return (
                      <div
                        key={row.id}
                        className={`relative z-10 p-6 rounded-[32px] border transition-all hover:shadow-xl hover:-translate-y-0.5 hover:z-50 cursor-pointer group flex flex-col gap-4 ${isDark ? "bg-[#141619] border-white/5 hover:border-emerald-500/20" : "bg-white border-slate-200/60 shadow-sm hover:shadow-black/5"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(row);
                          setResolutionInput("");
                        }}
                      >
                        <div className="flex flex-col xl:flex-row gap-6 xl:items-center justify-between">
                          {/* Left: Patient Info & Date */}
                          <div className="flex items-center gap-5 flex-1 w-full xl:w-auto overflow-hidden">
                            <div
                              className={`w-14 h-14 shrink-0 rounded-[20px] flex items-center justify-center text-xl font-bold uppercase shadow-inner ${isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-700 border border-slate-200/60"}`}
                            >
                              {row.patient_name.charAt(0)}
                            </div>
                            <div className="truncate">
                              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3 truncate">
                                <span className="truncate">
                                  {row.patient_name}
                                </span>
                                {row.status === "Completed" && (
                                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] uppercase tracking-widest font-black border border-blue-500/20">
                                    Completed
                                  </span>
                                )}
                                {row.status === "Ongoing" && (
                                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] uppercase tracking-widest font-black border border-amber-500/20">
                                    Ongoing
                                  </span>
                                )}
                                {row.status === "Discontinued" && (
                                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[9px] uppercase tracking-widest font-black border border-rose-500/20">
                                    Discontinued
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-bold opacity-50 uppercase tracking-widest mt-1.5 flex items-center gap-2 truncate">
                                <span className="truncate">
                                  Added by {row.added_by}
                                </span>
                                <span className="shrink-0">•</span>
                                <span className="shrink-0">
                                  {dateFormatted} {timeFormatted}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Middle: Rating */}
                          <div className="shrink-0 w-full xl:w-auto flex xl:justify-center border-l-0 xl:border-l border-t xl:border-t-0 pt-4 xl:pt-0 border-slate-100 dark:border-white/5 xl:pl-6">
                            <span
                              className={`px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 w-32 ${row.rating === "Good" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : row.rating === "Average" ? "bg-slate-500/10 text-slate-600 dark:text-slate-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full animate-pulse ${row.rating === "Good" ? "bg-emerald-500" : row.rating === "Average" ? "bg-slate-500" : "bg-rose-500"}`}
                              />
                              {row.rating}
                            </span>
                          </div>

                          {/* Middle: Comment */}
                          <div className="flex-1 w-full xl:w-auto xl:max-w-md xl:px-4">
                            <div className="text-sm font-medium text-slate-600 dark:text-slate-300 italic p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 relative group/comment transition-colors">
                              <div className="line-clamp-2">
                                {row.is_resolved && (
                                  <span className="inline-block mr-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md text-[9px] font-black not-italic tracking-widest uppercase border border-emerald-500/20">
                                    Resolved
                                  </span>
                                )}
                                {row.comment ? (
                                  `"${row.comment}"`
                                ) : (
                                  <span className="opacity-40 not-italic tracking-wider text-[11px] uppercase">
                                    No comment provided
                                  </span>
                                )}
                              </div>

                              {row.comment && row.comment.length > 50 && (
                                <div className="absolute z-[100] left-0 top-full mt-3 hidden group-hover/comment:block w-80 p-5 bg-slate-800 text-white text-xs rounded-2xl shadow-2xl whitespace-normal break-words not-italic leading-relaxed border border-slate-700">
                                  "{row.comment}"
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="shrink-0 flex items-center justify-end gap-3 w-full xl:w-auto">
                            {row.phone_number && (
                              <a
                                href={`https://wa.me/${row.phone_number.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${row.patient_name}, PhysioEZ wants to know about your recent treatment! Please fill out this quick feedback form: https://physioez.com/feedback/${row.id}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border shadow-sm flex-1 xl:flex-none ${isDark ? "bg-[#1C1C1C] border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"}`}
                                title="Request Feedback via WhatsApp"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <i className="fa-brands fa-whatsapp text-lg"></i>
                                <span className="hidden sm:inline">
                                  Request
                                </span>
                              </a>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRecord(row);
                                setResolutionInput("");
                              }}
                              className={`px-5 py-3 rounded-2xl transition-all border flex items-center justify-center gap-2 flex-1 xl:flex-none ${row.rating === "Bad" && !row.is_resolved ? (isDark ? "bg-rose-500/20 border-rose-500/30 hover:bg-rose-500/30 shadow-md shadow-rose-500/20 text-rose-400" : "bg-rose-50 hover:bg-rose-100 border-rose-200 shadow-sm text-rose-700") : isDark ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm"}`}
                            >
                              {row.rating === "Bad" && !row.is_resolved ? (
                                <span className="text-[11px] uppercase font-black tracking-widest flex items-center gap-2">
                                  <i className="fa-solid fa-triangle-exclamation"></i>{" "}
                                  Resolve
                                </span>
                              ) : (
                                <span className="text-[11px] uppercase font-black tracking-widest flex items-center gap-2">
                                  <Eye size={16} /> View
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          <div
            className={`px-10 py-6 border-t flex items-center justify-between shrink-0 ${isDark ? "border-white/5" : "border-slate-100"}`}
          >
            <div className="text-sm font-medium text-slate-500">
              Showing{" "}
              <span className="text-slate-900 dark:text-white font-bold">
                {records.length}
              </span>{" "}
              of {totalRecords} entries
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${page === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"} ${isDark ? "border-white/10" : "border-slate-200 shadow-sm"}`}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${page >= totalPages ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"} ${isDark ? "border-white/10" : "border-slate-200 shadow-sm"}`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* New Feedback Entry Sheet */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[10020] bg-black/30 backdrop-blur-md flex items-center justify-center p-6 md:p-10 text-slate-900 dark:text-slate-200">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 z-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`w-full max-w-2xl z-10 shadow-2xl rounded-[32px] flex flex-col overflow-hidden max-h-[90vh] ${isDark ? "bg-[#0A0A0A] border border-white/5" : "bg-white border border-slate-200"}`}
            >
              <div className="px-8 py-6 border-b dark:border-white/5 flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-medium tracking-tight">
                  New Submission
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  <Plus size={20} className="rotate-45 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-[#121212]/30 space-y-8 custom-scrollbar">
                {/* Search Patient */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">
                    Find Patient
                  </label>
                  <div
                    className={`relative flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all ${isDark ? "bg-[#121212] border-white/5 focus-within:border-emerald-500/30" : "bg-slate-50 border-slate-100 focus-within:bg-white focus-within:border-emerald-500/30 shadow-inner focus-within:shadow-sm"}`}
                  >
                    <Search size={20} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Name or Phone #"
                      value={patientSearchQuery}
                      onChange={(e) => handlePatientSearch(e.target.value)}
                      className="bg-transparent border-none outline-none text-base w-full font-medium"
                    />

                    {patientSearchQuery &&
                      !selectedPatientId &&
                      patientSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                          {patientSearchResults.map((p) => (
                            <div
                              key={p.patient_id}
                              onClick={() => {
                                setSelectedPatientId(p.patient_id);
                                setPatientSearchQuery(
                                  `${p.patient_name} - ${p.phone_number}`,
                                );

                                let uiStatus = p.status;
                                if (uiStatus === "inactive")
                                  uiStatus = "discontinued";

                                if (uiStatus === "active")
                                  setTreatmentStatus("Ongoing (Active)");
                                else if (uiStatus === "completed")
                                  setTreatmentStatus("Treatment Completed");
                                else if (uiStatus === "discontinued")
                                  setTreatmentStatus("Discontinued / Stopped");

                                setPatientSearchResults([]);
                              }}
                              className="px-5 py-3 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                            >
                              <div className="font-semibold">
                                {p.patient_name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {p.phone_number}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                {/* Experience */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">
                    Overall Experience
                  </label>
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      {
                        label: "Good",
                        icon: Smile,
                        color: "text-emerald-500",
                        bg: "bg-emerald-500/10",
                      },
                      {
                        label: "Average",
                        icon: Meh,
                        color: "text-slate-500",
                        bg: "bg-slate-500/10",
                      },
                      {
                        label: "Bad",
                        icon: Frown,
                        color: "text-rose-500",
                        bg: "bg-rose-500/10",
                      },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setExperience(item.label as any)}
                        className={`flex flex-col items-center gap-3 p-6 rounded-[24px] border-2 transition-all ${
                          experience === item.label
                            ? `border-emerald-500 ${item.bg} ${item.color} scale-[1.05]`
                            : `border-transparent opacity-40 hover:opacity-100 ${isDark ? "bg-[#121212]" : "bg-slate-50"}`
                        }`}
                      >
                        <item.icon size={32} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Treatment Status */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">
                    Treatment Status
                  </label>
                  <div className="relative">
                    <select
                      value={treatmentStatus}
                      onChange={(e) => setTreatmentStatus(e.target.value)}
                      className={`w-full appearance-none pl-5 pr-12 py-4 rounded-2xl border text-base font-medium outline-none cursor-pointer transition-all ${isDark ? "bg-[#121212] border-white/5" : "bg-slate-50 border-slate-100"}`}
                    >
                      <option>Ongoing (Active)</option>
                      <option>Treatment Completed</option>
                      <option>Discontinued / Stopped</option>
                    </select>
                    <ChevronDown
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"
                      size={20}
                    />
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">
                    Additional Comments
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Share detailed feedback..."
                    className={`w-full h-40 p-5 rounded-2xl border text-base font-medium outline-none transition-all resize-none ${isDark ? "bg-[#121212] border-white/5 focus:border-emerald-500/30" : "bg-slate-50 border-slate-100 focus:bg-white focus:shadow-sm"}`}
                  />
                </div>
              </div>

              <div className="p-10 border-t dark:border-white/5">
                <button
                  onClick={handleSubmit}
                  className="w-full py-5 rounded-[24px] bg-emerald-600 text-white text-lg font-semibold tracking-wide hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95"
                >
                  Save Submission <Send size={22} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRecord && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl rounded-[32px] border shadow-2xl z-[101] overflow-hidden flex flex-col max-h-[90vh] ${isDark ? "bg-[#121212] border-white/10" : "bg-white border-slate-200"}`}
            >
              <div className="p-8 border-b dark:border-white/5 flex items-center justify-between shadow-sm z-10">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-2">
                    {selectedRecord.patient_name}
                  </h2>
                  <div className="text-sm font-medium text-slate-500 flex items-center gap-3">
                    <span className="flex items-center gap-2">
                      <i className="fa-solid fa-phone text-xs opacity-60" />{" "}
                      {selectedRecord.phone_number || "N/A"}
                    </span>
                    <span>•</span>
                    <span>
                      {format(
                        new Date(selectedRecord.date),
                        "MMM dd, yyyy 'at' hh:mm a",
                      )}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
                >
                  <Plus
                    size={24}
                    className="rotate-45 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"
                  />
                </button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8 relative">
                <div className="grid grid-cols-2 gap-6">
                  <div
                    className={`p-5 rounded-2xl border ${isDark ? "bg-[#1A1A1A] border-white/5" : "bg-slate-50 border-slate-100"}`}
                  >
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3">
                      Rating
                    </label>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold ${selectedRecord.rating === "Good" ? "bg-emerald-500/10 text-emerald-500" : selectedRecord.rating === "Average" ? "bg-slate-500/10 text-slate-500" : "bg-rose-500/10 text-rose-500"}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${selectedRecord.rating === "Good" ? "bg-emerald-500" : selectedRecord.rating === "Average" ? "bg-slate-500" : "bg-rose-500"}`}
                      />
                      {selectedRecord.rating}
                    </div>
                  </div>
                  <div
                    className={`p-5 rounded-2xl border ${isDark ? "bg-[#1A1A1A] border-white/5" : "bg-slate-50 border-slate-100"}`}
                  >
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3">
                      Treatment Status
                    </label>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedRecord.status}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-3">
                    Feedback Provided
                  </label>
                  <div
                    className={`p-6 rounded-2xl border text-base font-medium leading-relaxed shadow-sm ${isDark ? "bg-[#1A1A1A] border-white/5 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-700"}`}
                  >
                    {selectedRecord.comment ? (
                      `"${selectedRecord.comment}"`
                    ) : (
                      <span className="italic opacity-50">
                        No additional comments provided.
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-dashed dark:border-white/10 pt-8 mt-8">
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center justify-between">
                    <span className="text-slate-400">Resolution Tracking</span>
                    {selectedRecord.is_resolved && (
                      <span className="text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg font-bold flex items-center gap-2">
                        <i className="fa-solid fa-check"></i> Resolved
                      </span>
                    )}
                  </label>

                  {selectedRecord.is_resolved ? (
                    <div
                      className={`p-6 rounded-2xl border text-base shadow-sm space-y-3 ${isDark ? "bg-[#1A1A1A] border-emerald-500/20 text-emerald-100" : "bg-emerald-50 border-emerald-100 text-emerald-900"}`}
                    >
                      <div className="font-semibold text-sm opacity-80 uppercase tracking-wider mb-2 flex justify-between">
                        <span>
                          Note from {selectedRecord.resolved_by_name || "Staff"}
                        </span>
                        <span>
                          {selectedRecord.resolved_at
                            ? format(
                                new Date(selectedRecord.resolved_at),
                                "MMM dd, yyyy",
                              )
                            : ""}
                        </span>
                      </div>
                      <div className="font-medium leading-relaxed">
                        {selectedRecord.resolution_note}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <textarea
                        value={resolutionInput}
                        onChange={(e) => setResolutionInput(e.target.value)}
                        className={`w-full h-32 p-5 rounded-2xl border text-base font-medium outline-none resize-none transition-all shadow-inner ${isDark ? "bg-[#1A1A1A] border-white/10 focus:border-emerald-500/50" : "bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500/50"}`}
                        placeholder="Type resolution steps or actions taken after contacting the patient..."
                      />
                      <button
                        disabled={
                          submittingResolution || !resolutionInput.trim()
                        }
                        onClick={async () => {
                          setSubmittingResolution(true);
                          const toastId = toast.loading(
                            "Marking as resolved...",
                          );
                          try {
                            const res = await authFetch(
                              `${API_BASE_URL}/reception/feedback`,
                              {
                                method: "POST",
                                body: JSON.stringify({
                                  action: "resolve",
                                  feedback_id: selectedRecord.id,
                                  resolution_note: resolutionInput,
                                }),
                              },
                            );
                            const data = await res.json();
                            if (data.success) {
                              toast.success("Resolved successfully!", {
                                id: toastId,
                              });
                              setSelectedRecord(null);
                              setResolutionInput("");
                              fetchFeedback();
                            } else throw new Error(data.message);
                          } catch (err: any) {
                            toast.error(err.message || "Failed to resolve", {
                              id: toastId,
                            });
                          } finally {
                            setSubmittingResolution(false);
                          }
                        }}
                        className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2 shadow-xl shadow-emerald-500/20"
                      >
                        {submittingResolution ? (
                          <RefreshCw className="animate-spin" />
                        ) : (
                          <>
                            <i className="fa-solid fa-check-double"></i> Mark
                            Issue as Resolved
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
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

export default Feedback;
