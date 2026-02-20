import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
} from "lucide-react";

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addDays,
  subDays,
} from "date-fns";
import { API_BASE_URL, authFetch } from "../config";
import { toast } from "sonner";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import Sidebar from "../components/Sidebar";
import DatePicker from "../components/ui/DatePicker";
import PageHeader from "../components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";

// Interfaces
interface AttendanceRecord {
  id: number;
  patient_name: string;
  treatment: string;
  progress_current: number;
  progress_total: number;
  status: "Present" | "Absent" | "Pending";
  last_active?: string;
}

interface AttendanceHistory {
  success: boolean;
  patient: {
    id: number;
    name: string;
    total_days: number;
    present_days: number;
    remaining_days: number;
  };
  attendance_history: {
    date: string; // "yyyy-MM-dd"
    status: "present" | "pending" | "rejected" | "absent";
    remarks?: string;
  }[];
}

const Attendance = () => {
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();

  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Data
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    pending: 0,
  });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Present" | "Absent" | "Pending"
  >("All");

  // History Panel State

  const [selectedPatientHistory, setSelectedPatientHistory] =
    useState<AttendanceHistory | null>(null);
  const [attendanceCalendarMonth, setAttendanceCalendarMonth] = useState(
    new Date(),
  );
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<Date | null>(
    null,
  );
  const [selectedDateHistory, setSelectedDateHistory] = useState<
    AttendanceHistory["attendance_history"]
  >([]);

  // --- Fetchers ---

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const res = await authFetch(
        `${API_BASE_URL}/reception/attendance_data?date=${dateStr}`,
      );
      const data = await res.json();
      if (data.success) {
        const transformed: AttendanceRecord[] =
          data.data.attendance_records.map((r: any) => ({
            id: r.patient_id,
            patient_name: r.patient_name,
            treatment:
              r.treatment_type.charAt(0).toUpperCase() +
              r.treatment_type.slice(1),
            progress_current: r.attendance_count || 0,
            progress_total: r.treatment_days || 0,
            status:
              r.status === "present"
                ? "Present"
                : r.status === "pending"
                  ? "Pending"
                  : "Absent",
            last_active:
              r.attendance_id && r.status === "present"
                ? format(currentDate, "dd MMM")
                : r.last_attendance_date
                  ? format(new Date(r.last_attendance_date), "dd MMM")
                  : "Never",
          }));

        const presentCount = transformed.filter(
          (r) => r.status === "Present",
        ).length;
        const absentCount = transformed.filter(
          (r) => r.status === "Absent",
        ).length;
        const pendingCount = transformed.filter(
          (r) => r.status === "Pending",
        ).length;

        setStats({
          total: transformed.length,
          present: presentCount,
          absent: absentCount,
          pending: pendingCount,
        });
        setRecords(transformed);
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  const fetchAttendanceHistory = async (patientId: number) => {
    if (!patientId) {
      toast.error("Invalid Patient ID");
      return;
    }
    const loadToast = toast.loading("Loading history...");
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/get_attendance_history?patient_id=${patientId}`,
      );
      const data = await res.json();
      if (data.success) {
        const transformed: AttendanceHistory = {
          success: true,
          patient: {
            id: data.patient.id,
            name: data.patient.name,
            total_days: data.stats?.total_days || 0,
            present_days: data.stats?.present_count || 0,
            remaining_days: data.stats?.remaining || 0,
          },
          attendance_history: Array.isArray(data.history)
            ? data.history.map((item: any) => ({
                date: item.attendance_date
                  ? format(new Date(item.attendance_date), "yyyy-MM-dd")
                  : "",
                status: item.status || "present",
                remarks: item.remarks || "",
              }))
            : [],
        };
        setSelectedPatientHistory(transformed);
        setSelectedHistoryDate(null);
        setSelectedDateHistory([]);
        toast.dismiss(loadToast);
      } else {
        toast.error("Failed to load history", { id: loadToast });
      }
    } catch (e) {
      console.error(e);
      toast.error("Error fetching history", { id: loadToast });
    }
  };

  const fetchAttendanceHistoryForDate = async (
    patientId: number,
    date: Date,
  ) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await authFetch(
        `${API_BASE_URL}/reception/get_attendance_history?patient_id=${patientId}&date=${dateStr}`,
      );
      const data = await res.json();
      if (data.success) {
        const history = Array.isArray(data.history)
          ? data.history.map((item: any) => ({
              date: item.attendance_date
                ? format(new Date(item.attendance_date), "yyyy-MM-dd")
                : "",
              status: item.status || "present",
              remarks: item.remarks || "",
            }))
          : [];
        setSelectedDateHistory(history);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Refresh Logic ---
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(() => setRefreshCooldown((p) => p - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  useEffect(() => {
    if (user?.employee_id) fetchData();
  }, [fetchData, user?.employee_id]);

  const handleRefresh = async () => {
    if (refreshCooldown > 0) return;
    await fetchData();
    setRefreshCooldown(10);
    toast.success("Data updated");
  };

  // --- Derived State ---
  const filteredRecords = useMemo(() => {
    let res = records;
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(
        (r) =>
          r.patient_name.toLowerCase().includes(q) ||
          r.id.toString().includes(q),
      );
    }
    if (statusFilter !== "All") {
      res = res.filter((r) => r.status === statusFilter);
    }
    return res;
  }, [records, search, statusFilter]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(attendanceCalendarMonth));
    const end = endOfWeek(endOfMonth(attendanceCalendarMonth));
    return eachDayOfInterval({ start, end });
  }, [attendanceCalendarMonth]);

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${isDark ? "bg-[#0A0A0B] text-slate-200" : "bg-[#F9FAFB] text-slate-800"}`}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <PageHeader
          title="Attendance"
          subtitle="Management System"
          icon={Users}
          onRefresh={handleRefresh}
          refreshCooldown={refreshCooldown}
          isLoading={loading}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* === LEFT PANEL (INTEGRATED INSIGHT) === */}
          <div
            className={`w-[580px] flex flex-col shrink-0 z-40 transition-all border-r ${isDark ? "bg-[#0D0D0E] border-white/5" : "bg-white border-slate-200/60 shadow-[10px_0_30px_rgba(0,0,0,0.02)]"}`}
          >
            <AnimatePresence mode="wait">
              {selectedPatientHistory ? (
                <motion.div
                  key={selectedPatientHistory.patient.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full overflow-hidden"
                >
                  {/* Seamless Header */}
                  <div className="p-8 pt-10 border-b relative">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Attendance Insight
                      </h3>
                      <div className="flex gap-2">
                        <button
                          className={`p-2 rounded-xl border ${isDark ? "border-white/10 hover:bg-white/5" : "border-slate-200 hover:bg-slate-50"}`}
                        >
                          <Filter size={16} className="text-slate-400" />
                        </button>
                      </div>
                    </div>

                    {/* 2x2 Integrated Stat Grid (Moved to top as Overview) */}
                    <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-white/5 border rounded-2xl overflow-hidden border-slate-200 dark:border-white/5 mb-8">
                      {[
                        {
                          label: "Attendance",
                          value: `${Math.round((selectedPatientHistory.patient.present_days / (selectedPatientHistory.patient.present_days + selectedPatientHistory.patient.remaining_days)) * 100)}%`,
                          color: "text-emerald-500",
                        },
                        {
                          label: "Completed",
                          value: selectedPatientHistory.patient.present_days,
                          color: "text-slate-900 dark:text-white",
                        },
                        {
                          label: "Remaining",
                          value: selectedPatientHistory.patient.remaining_days,
                          color: "text-amber-500",
                        },
                        {
                          label: "Total Days",
                          value: selectedPatientHistory.patient.total_days,
                          color: "text-slate-400",
                        },
                      ].map((stat, idx) => (
                        <div
                          key={idx}
                          className={`p-4 ${isDark ? "bg-[#0D0D0E]" : "bg-white"}`}
                        >
                          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
                            {stat.label}
                          </p>
                          <p
                            className={`text-xl font-semibold tracking-tight ${stat.color}`}
                          >
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-black text-lg font-semibold shadow-xl">
                        {selectedPatientHistory.patient.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
                          {selectedPatientHistory.patient.name}
                        </h2>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-0.5 inline-block">
                          ID: #{selectedPatientHistory.patient.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Calendar & Feed - Scrollable */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="mb-12">
                      <div className="flex items-center justify-between mb-8 px-1">
                        <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
                          Patient Logs
                        </h4>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setAttendanceCalendarMonth(
                                subMonths(attendanceCalendarMonth, 1),
                              )
                            }
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <span className="text-[10px] font-semibold min-w-[70px] text-center">
                            {format(attendanceCalendarMonth, "MMM yyyy")}
                          </span>
                          <button
                            onClick={() =>
                              setAttendanceCalendarMonth(
                                addMonths(attendanceCalendarMonth, 1),
                              )
                            }
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-y-1">
                        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                          <span
                            key={d}
                            className="text-[10px] font-medium text-slate-300 uppercase h-6 flex items-center justify-center"
                          >
                            {d}
                          </span>
                        ))}
                        {calendarDays.map((d, i) => {
                          const dateStr = format(d, "yyyy-MM-dd");
                          const dayRecords = (
                            selectedPatientHistory.attendance_history || []
                          ).filter((r) => r.date === dateStr);
                          const latestRecord =
                            dayRecords.length > 0 ? dayRecords[0] : null;
                          const isPresent = latestRecord?.status === "present";
                          const isPending = latestRecord?.status === "pending";
                          const isRejected =
                            latestRecord?.status === "rejected";

                          const isSelected =
                            selectedHistoryDate &&
                            isSameDay(d, selectedHistoryDate);
                          const isCurrent = isSameMonth(
                            d,
                            attendanceCalendarMonth,
                          );
                          const isTodayDate = isSameDay(d, new Date());

                          return (
                            <button
                              key={i}
                              onClick={() => {
                                setSelectedHistoryDate(d);
                                fetchAttendanceHistoryForDate(
                                  selectedPatientHistory.patient.id,
                                  d,
                                );
                              }}
                              className={`w-9 h-9 rounded-xl text-[11px] font-semibold transition-all relative flex flex-col items-center justify-center mx-auto
                                    ${!isCurrent ? "opacity-10 pointer-events-none" : "hover:bg-slate-100 dark:hover:bg-white/5"}
                                    ${isSelected ? (isDark ? "bg-emerald-500 text-white shadow-lg" : "bg-slate-900 text-white") : ""}
                                    ${isPresent && !isSelected ? "text-emerald-500 bg-emerald-500/5" : ""}
                                    ${isPending && !isSelected ? "text-amber-500 bg-amber-500/5" : ""}
                                    ${isRejected && !isSelected ? "text-rose-500 bg-rose-500/5" : ""}
                                    ${isTodayDate && !isSelected ? "border-b-2 border-emerald-500" : ""}
                                  `}
                            >
                              {format(d, "d")}
                              {(isPresent || isPending || isRejected) &&
                                !isSelected && (
                                  <div
                                    className={`absolute bottom-1 w-1 h-1 rounded-full ${isPresent ? "bg-emerald-500" : isPending ? "bg-amber-500" : "bg-rose-500"}`}
                                  />
                                )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Activity Timeline */}
                    <div>
                      <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-8 px-1">
                        Activity Feed
                      </h4>
                      <div className="space-y-8 relative pl-4">
                        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-slate-200 dark:bg-white/5" />

                        {(selectedHistoryDate
                          ? selectedDateHistory
                          : selectedPatientHistory.attendance_history || []
                        )
                          .slice(0, 10)
                          .map((h, i) => (
                            <div key={i} className="relative pl-10 group">
                              <div
                                className={`absolute left-[-4px] top-1.5 w-2 h-2 rounded-full border-2 ${isDark ? "border-[#0D0D0E]" : "border-white"} z-10 
                                  ${h.status === "present" ? "bg-emerald-500" : h.status === "pending" ? "bg-amber-500" : h.status === "rejected" ? "bg-rose-500" : "bg-slate-300"}`}
                              />
                              <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-1">
                                  <span
                                    className={`text-[12px] font-bold capitalize
                                    ${h.status === "present" ? "text-emerald-500" : h.status === "pending" ? "text-amber-500" : h.status === "rejected" ? "text-rose-500" : "text-slate-500"}`}
                                  >
                                    {h.status}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-400">
                                    {format(new Date(h.date), "dd MMM yyyy")}
                                  </span>
                                </div>
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                  {h.remarks ||
                                    "No remarks provided for this record."}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none opacity-40">
                  <div className="w-20 h-20 rounded-[40px] border-2 border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center mb-6">
                    <Users size={32} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Attendance Insight
                  </h3>
                  <p className="text-[11px] font-medium leading-relaxed max-w-[200px]">
                    Select a patient from the list <br /> to view engagement
                    analytics.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* === MAIN CONTENT === */}
          <main className="flex-1 overflow-hidden flex flex-col p-6 lg:p-10">
            {/* Top Overview Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              {/* Scheduled Card */}
              <div
                className={`p-6 rounded-[32px] border flex items-center justify-between ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200/60 shadow-sm"}`}
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                    Scheduled
                  </p>
                  <p className="text-3xl font-semibold tracking-tight">
                    {stats.total}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? "bg-white/5" : "bg-slate-50"}`}
                >
                  <Users size={20} className="text-blue-500" />
                </div>
              </div>

              {/* Present Card */}
              <div
                className={`p-6 rounded-[32px] border flex items-center justify-between ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200/60 shadow-sm"}`}
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                    Present
                  </p>
                  <p className="text-3xl font-semibold tracking-tight text-emerald-500">
                    {stats.present}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}
                >
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>
              </div>

              {/* Absent Card */}
              <div
                className={`p-6 rounded-[32px] border flex items-center justify-between ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200/60 shadow-sm"}`}
              >
                <div>
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em] mb-1">
                    Absent
                  </p>
                  <p className="text-3xl font-semibold tracking-tight text-rose-500">
                    {stats.absent}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? "bg-rose-500/10" : "bg-rose-50"}`}
                >
                  <Users size={20} className="text-rose-500" />
                </div>
              </div>

              {/* Efficiency Card */}
              <div
                className={`p-6 rounded-[32px] border flex items-center justify-between ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-200/60 shadow-sm"}`}
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                    Efficiency
                  </p>
                  <p className="text-3xl font-semibold tracking-tight">
                    {stats.total > 0
                      ? Math.round((stats.present / stats.total) * 100)
                      : 0}
                    %
                  </p>
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      className="stroke-slate-100 dark:stroke-white/5"
                      strokeWidth="4"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      className="stroke-emerald-500"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - (stats.total > 0 ? stats.present / stats.total : 0))}`}
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Minimal Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
              <div className="relative group w-full md:w-[400px]">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or ID..."
                  className={`w-full pl-12 pr-6 py-3.5 rounded-2xl text-[13px] font-medium outline-none transition-all border ${isDark ? "bg-white/[0.03] border-white/5 focus:bg-white/[0.05]" : "bg-white border-slate-200/60 focus:border-slate-300 shadow-sm"}`}
                />
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex p-1 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-100/50 border border-slate-200/50"}`}
                >
                  {(["All", "Present", "Absent", "Pending"] as const).map(
                    (s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-5 py-2 rounded-lg text-[11px] font-semibold transition-all ${statusFilter === s ? (isDark ? "bg-white text-black shadow-lg" : "bg-white text-slate-900 shadow-sm") : "text-slate-500 hover:text-slate-800"}`}
                      >
                        {s}
                      </button>
                    ),
                  )}
                </div>

                <div
                  className={`flex items-center gap-1 p-1 rounded-xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200/60 shadow-sm"}`}
                >
                  <button
                    onClick={() => setCurrentDate(subDays(currentDate, 1))}
                    className={`p-2 rounded-lg transition-all ${isDark ? "hover:bg-white/5 text-slate-400" : "hover:bg-slate-50 text-slate-500"}`}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    onClick={() => setShowDatePicker(true)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all ${isDark ? "text-slate-200 hover:bg-white/5" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    <Calendar size={15} className="text-emerald-500" />
                    {format(currentDate, "dd MMM")}
                  </button>

                  <button
                    onClick={() => setCurrentDate(addDays(currentDate, 1))}
                    className={`p-2 rounded-lg transition-all ${isDark ? "hover:bg-white/5 text-slate-400" : "hover:bg-slate-50 text-slate-500"}`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Premium Table Container */}
            <div
              className={`flex-1 rounded-[32px] border overflow-hidden flex flex-col ${isDark ? "bg-[#0D0D0E] border-white/5" : "bg-white border-slate-200/60 shadow-sm shadow-slate-200/40"}`}
            >
              {/* Header */}
              <div
                className={`grid grid-cols-12 px-10 py-5 border-b text-[10px] font-semibold uppercase tracking-[0.2em] ${isDark ? "border-white/5 text-slate-500" : "border-slate-100 text-slate-400 bg-slate-50/30"}`}
              >
                <div className="col-span-1">ID</div>
                <div className="col-span-5">Patient Information</div>
                <div className="col-span-3">Treatment Plan</div>
                <div className="col-span-3 text-right pr-4">Status</div>
              </div>

              {/* Table Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="h-64 flex flex-col items-center justify-center opacity-30">
                    <RefreshCw className="animate-spin mb-4" />
                    <span className="text-[11px] font-medium uppercase tracking-widest">
                      Syncing Records
                    </span>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center opacity-20 italic text-sm">
                    No records found for this period.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredRecords.map((record: any) => (
                      <div
                        key={record.id || record.patient_id}
                        onClick={() =>
                          fetchAttendanceHistory(record.id || record.patient_id)
                        }
                        className={`grid grid-cols-12 px-10 py-6 items-center group cursor-pointer transition-all ${
                          selectedPatientHistory?.patient.id ===
                          (record.id || record.patient_id)
                            ? isDark
                              ? "bg-white/[0.02]"
                              : "bg-slate-50"
                            : "hover:bg-slate-50/50 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className="col-span-1 font-mono text-[11px] font-semibold text-slate-400">
                          #{record.id || record.patient_id}
                        </div>

                        <div className="col-span-5 flex items-center gap-5">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-semibold border transition-all group-hover:scale-105 ${isDark ? "bg-[#1A1A1B] border-white/5" : "bg-slate-50 border-slate-100"}`}
                          >
                            {record.patient_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white mb-0.5">
                              {record.patient_name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                                Last active: {record.last_active || "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                              {record.treatment}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              ({record.progress_current}/{record.progress_total}{" "}
                              Sessions)
                            </span>
                          </div>
                          <div className="w-1/2 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-900 dark:bg-emerald-500 rounded-full transition-all duration-700"
                              style={{
                                width: `${(record.progress_current / record.progress_total) * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="col-span-3 flex justify-end">
                          <div
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all border ${
                              record.status === "Present"
                                ? isDark
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                  : "bg-emerald-50 border-emerald-100 text-emerald-600"
                                : record.status === "Pending"
                                  ? isDark
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                    : "bg-amber-50 border-amber-100 text-amber-600"
                                  : "bg-slate-100 dark:bg-white/5 border-transparent text-slate-400"
                            }`}
                          >
                            {record.status === "Present" && (
                              <CheckCircle2 size={14} />
                            )}
                            {record.status === "Pending" && <Clock size={14} />}
                            {record.status}
                          </div>
                          <button className="ml-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-900 dark:hover:text-white">
                            <ArrowUpRight size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Date Picker Overlay */}
        <AnimatePresence>
          {showDatePicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <DatePicker
                value={format(currentDate, "yyyy-MM-dd")}
                onChange={(d) => setCurrentDate(new Date(d))}
                onClose={() => setShowDatePicker(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Attendance;
