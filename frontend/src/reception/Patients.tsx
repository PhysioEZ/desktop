import { useState, useEffect, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Printer,
  RefreshCw,
  Users,
  Activity,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { usePatientStore } from "../store/usePatientStore";
import { useThemeStore } from "../store/useThemeStore";
import { API_BASE_URL, authFetch } from "../config";
import CustomSelect from "../components/ui/CustomSelect";
import PatientDetailsModal from "../components/patients/PatientDetailsModal";
import AttendanceModal from "../components/patients/modals/AttendanceModal";
import TokenPreviewModal from "../components/patients/modals/TokenPreviewModal";
import RevertAttendanceModal from "../components/patients/modals/RevertAttendanceModal";
import PageHeader from "../components/PageHeader";
import Sidebar from "../components/Sidebar";
import ActionFAB from "../components/ActionFAB";
import DailyIntelligence from "../components/DailyIntelligence";
import NotesDrawer from "../components/NotesDrawer";
import { toast } from "sonner";

const Patients = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();

  // Store State
  const {
    patients,
    isLoading,
    pagination,
    filters,
    metaData,
    setFilters,
    setPage,
    fetchPatients,
    fetchMetaData,
    openPatientDetails,
  } = usePatientStore();

  // Local UI State
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  // Modals State
  const [attendanceModal, setAttendanceModal] = useState<{
    open: boolean;
    patient: any | null;
  }>({ open: false, patient: null });
  const [tokenModal, setTokenModal] = useState<{
    open: boolean;
    patientId: number | null;
  }>({ open: false, patientId: null });

  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [revertModal, setRevertModal] = useState<{
    open: boolean;
    patient: any | null;
  }>({ open: false, patient: null });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    if (user?.branch_id) fetchMetaData(user.branch_id);
  }, [user?.branch_id]);

  const isFirstMount = useRef(true);

  // Fetch Patients on Filter/Page Change
  useEffect(() => {
    if (!user?.branch_id) return;

    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (
        patients.length > 0 &&
        filters.search === "" &&
        filters.service_type === "" &&
        filters.doctor === "" &&
        filters.treatment === "" &&
        filters.status === ""
      ) {
        return;
      }
    }

    const runFetch = () => fetchPatients(user.branch_id as number);

    if (patients.length === 0) {
      runFetch();
    } else {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(runFetch, 300);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [pagination.page, filters, user?.branch_id]);

  // Refresh Cooldown
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(() => setRefreshCooldown((p) => p - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  const handleRefresh = async () => {
    if (refreshCooldown > 0 || !user?.branch_id) return;
    const loadToast = toast.loading("Refreshing patients...");
    try {
      await fetchPatients(user.branch_id);
      await fetchMetaData(user.branch_id);
      toast.success("Patient list updated", { id: loadToast });
      setRefreshCooldown(20);
    } catch (e) {
      toast.error("Failed to refresh", { id: loadToast });
    }
  };

  const handleMarkAttendance = async (e: React.MouseEvent, patient: any) => {
    e.stopPropagation();
    if (patient.today_attendance === "present") return;

    const cost = parseFloat(patient.cost_per_day || "0");
    const balance = parseFloat(patient.effective_balance || "0");

    if (Math.round(balance * 100) >= Math.round(cost * 100) || cost === 0) {
      const loadingToast = toast.loading("Marking attendance...");
      try {
        const res = await authFetch(`${API_BASE_URL}/reception/attendance`, {
          method: "POST",
          body: JSON.stringify({
            patient_id: patient.patient_id,
            payment_amount: "0",
            mode: "",
            remarks: "Auto: Debited from Balance",
            status: "present",
          }),
        });
        const data = await res.json();
        if (data.success || data.status === "success") {
          toast.success("Attendance marked successfully");
          fetchPatients(user!.branch_id);
        } else {
          toast.error(data.message || "Failed to mark attendance");
        }
      } catch (err) {
        toast.error("Error marking attendance");
      } finally {
        toast.dismiss(loadingToast);
      }
    } else {
      setAttendanceModal({ open: true, patient });
    }
  };

  const handlePrintToken = (e: React.MouseEvent, patientId: number) => {
    e.stopPropagation();
    setTokenModal({ open: true, patientId });
  };

  const handleRevertAttendance = async () => {
    if (!revertModal.patient || !user?.branch_id) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/attendance`, {
        method: "POST",
        body: JSON.stringify({
          action: "revert",
          patient_id: revertModal.patient.patient_id,
        }),
      });
      const data = await res.json();
      if (data.success || data.status === "success") {
        toast.success("Attendance reverted successfully");
        await fetchPatients(user.branch_id);
      } else {
        toast.error(data.message || "Failed to revert attendance");
      }
    } catch (err) {
      toast.error("Error reverting attendance");
    }
  };

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? "bg-[#050505] text-slate-200" : "bg-[#FAFAFA] text-slate-900"}`}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <PageHeader
          title="Patients"
          subtitle="Operations Center"
          icon={Users}
          onRefresh={handleRefresh}
          refreshCooldown={refreshCooldown}
          isLoading={isLoading}
          onShowIntelligence={() => setShowIntelligence(true)}
          onShowNotes={() => setShowNotes(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          <div
            className={`hidden xl:flex w-[400px] flex-col justify-between p-10 border-r relative shrink-0 transition-colors duration-300 z-50 ${isDark ? "bg-[#0A0A0A] border-[#151515]" : "bg-white border-gray-100"}`}
          >
            <div className="space-y-10 z-10 transition-all duration-500">
              <div className="space-y-4">
                <h1 className="text-5xl font-serif font-normal tracking-tight leading-tight text-slate-900 dark:text-slate-100">
                  Patients &nbsp;
                  <span
                    className={`italic ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  >
                    Ops
                  </span>
                </h1>
                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[280px]">
                  Daily operational overview & patient registry.
                </p>
              </div>
            </div>

            {/* --- REDESIGNED STATS PANEL --- */}
            <div className="space-y-8 w-full flex-1 flex flex-col py-6">
              {/* SECTION 1: VOLUME OVERVIEW */}
              <div className="space-y-6">
                {/* Big Numbers */}
                <div className="flex items-end justify-between p-7 bg-[#F8F9FA] dark:bg-white/5 rounded-[32px] border border-dashed border-gray-200 dark:border-white/10 relative overflow-hidden group transition-all hover:bg-white dark:hover:bg-white/[0.08]">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={80} className="text-emerald-500" />
                  </div>

                  <div className="relative z-10">
                    <div className="text-7xl font-medium tracking-tighter leading-none text-[#022c22] dark:text-emerald-50">
                      {metaData.counts?.active_count || 0}
                    </div>
                    <div className="text-[10px] font-black opacity-50 mt-3 uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active Patients
                    </div>
                  </div>
                  <div className="text-right relative z-10">
                    <div className="text-3xl font-medium opacity-60">
                      {metaData.counts?.new_today || 0}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1">
                      Today's
                    </div>
                  </div>
                </div>

                {/* Global Registry Totals */}
                <div className="pt-4 border-t border-gray-100 dark:border-white/5 mt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 px-4">
                    Global Registry
                  </p>
                  <div className="space-y-1">
                    {[
                      {
                        label: "Total Patients",
                        value: metaData.counts?.total_count || 0,
                        dot: "bg-slate-400",
                      },
                      {
                        label: "Active Cases",
                        value: metaData.counts?.active_count || 0,
                        dot: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
                        text: "text-emerald-600",
                      },
                      {
                        label: "Completed",
                        value: metaData.counts?.terminated_count || 0,
                        dot: "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]",
                        text: "text-blue-600",
                      },
                      {
                        label: "Paused Registry",
                        value: metaData.counts?.inactive_count || 0,
                        dot: "bg-rose-400 shadow-[0_0_10px_rgba(251,113,113,0.3)]",
                        text: "text-rose-500",
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center justify-between text-sm group p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-default"
                      >
                        <span className="flex items-center gap-4 opacity-70 group-hover:opacity-100 transition-opacity font-medium">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${stat.dot}`}
                          ></span>
                          {stat.label}
                        </span>
                        <span
                          className={`font-bold text-lg ${stat.text || ""}`}
                        >
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="pt-8 border-t border-dashed border-slate-200 dark:border-white/5 mt-auto">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Powered by PhysioEZ</span>
                <span>OS v4.1.2</span>
              </div>
            </div> */}
          </div>

          <main className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col p-6 md:p-8 lg:p-10 gap-8 bg-[#FAFAFA] dark:bg-[#0A0A0A] pb-40">
            {/* Premium Control Bar */}
            <div className="flex flex-col gap-6 mb-2">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="relative group w-full lg:max-w-md">
                  <Search
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search by name, ID or phone..."
                    value={filters.search}
                    onChange={(e) => setFilters({ search: e.target.value })}
                    className="w-full pl-12 pr-6 py-4 rounded-[20px] bg-white dark:bg-[#1A1C1E] border border-gray-100 dark:border-white/5 focus:border-emerald-500/30 outline-none text-sm font-medium transition-all shadow-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end w-full lg:w-auto">
                  {[
                    { label: "All", value: "" },
                    { label: "Active", value: "active" },
                    { label: "Paused", value: "inactive" },
                    { label: "Finished", value: "completed" },
                  ].map((chip) => {
                    const isSelected = filters.status === chip.value;
                    return (
                      <button
                        key={chip.label}
                        onClick={() => setFilters({ status: chip.value })}
                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                          isSelected
                            ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:text-black shadow-md"
                            : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50 dark:bg-white/5 dark:border-white/5"
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CustomSelect
                  value={filters.doctor}
                  onChange={(v) => setFilters({ doctor: v })}
                  options={[
                    { label: "All Doctors", value: "" },
                    ...metaData.doctors.map((d) => ({
                      label: `Dr. ${d}`,
                      value: d,
                    })),
                  ]}
                  placeholder="Doctor"
                  className="!rounded-[18px] !py-3 !bg-white dark:!bg-[#1A1C1E] !border-gray-100 dark:!border-white/5 shadow-sm"
                />

                <CustomSelect
                  value={filters.service_type}
                  onChange={(v) => setFilters({ service_type: v })}
                  options={[
                    { label: "All Services", value: "" },
                    ...metaData.services.map((s) => ({ label: s, value: s })),
                  ]}
                  placeholder="Service"
                  className="!rounded-[18px] !py-3 !bg-white dark:!bg-[#1A1C1E] !border-gray-100 dark:!border-white/5 shadow-sm"
                />

                <CustomSelect
                  value={filters.treatment}
                  onChange={(v) => setFilters({ treatment: v })}
                  options={[
                    { label: "All Types", value: "" },
                    ...metaData.treatments.map((t) =>
                      typeof t === "string" ? { label: t, value: t } : t,
                    ),
                  ]}
                  placeholder="Type"
                  className="!rounded-[18px] !py-3 !bg-white dark:!bg-[#1A1C1E] !border-gray-100 dark:!border-white/5 shadow-sm"
                />
              </div>
            </div>

            {/* Registry List */}
            <div className="flex-1">
              {isLoading ? (
                <div className="h-40 flex flex-col items-center justify-center opacity-30 gap-4">
                  <RefreshCw size={24} className="animate-spin" />
                  <p className="text-[9px] font-black uppercase tracking-widest">
                    Syncing Registry...
                  </p>
                </div>
              ) : patients.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center opacity-30 gap-4">
                  <p className="text-xs font-medium">No results found.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Table Header */}
                  <div className="hidden lg:grid grid-cols-[1.8fr_1.3fr_1.2fr_1.1fr_1fr_1fr] gap-6 px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-black/[0.03] dark:border-white/[0.03] select-none">
                    <div>Patient</div>
                    <div>Contact</div>
                    <div>Progress</div>
                    <div className="text-right">Financials</div>
                    <div className="text-center">Presence</div>
                    <div className="text-right pr-4">Action</div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-3 pb-40"
                  >
                    {patients.map((patient, idx) => {
                      const totalDays = patient.treatment_days || 1;
                      const progress = Math.min(
                        100,
                        (patient.attendance_count / totalDays) * 100,
                      );
                      const isPresent = patient.today_attendance === "present";
                      const isPending = patient.today_attendance === "pending";
                      const effectiveBalance = isNaN(
                        parseFloat(String(patient.effective_balance)),
                      )
                        ? 0
                        : parseFloat(String(patient.effective_balance));

                      return (
                        <motion.div
                          key={patient.patient_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: { delay: idx * 0.02 },
                          }}
                          onClick={() => openPatientDetails(patient)}
                          className={`group rounded-[24px] px-8 py-4 border transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-[1px] cursor-pointer relative grid lg:grid-cols-[1.8fr_1.3fr_1.2fr_1.1fr_1fr_1fr] gap-6 items-center ${
                            isDark
                              ? "bg-[#141619] border-white/5 hover:border-emerald-500/20"
                              : "bg-white border-gray-100 hover:border-emerald-500/20 shadow-sm"
                          } ${activeDropdown === patient.patient_id ? "z-[100]" : "z-0"}`}
                        >
                          <div
                            className={`absolute left-0 top-0 w-1.5 h-full transition-all duration-300 opacity-0 group-hover:opacity-100 rounded-l-[24px] ${
                              patient.patient_status === "active"
                                ? "bg-emerald-500"
                                : "bg-slate-300"
                            }`}
                          />

                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-sm">
                              {patient.patient_name.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[16px] font-bold text-slate-900 dark:text-[#e3e2e6] truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                {patient.patient_name}
                              </span>
                              <span className="text-[10px] font-black opacity-40 uppercase tracking-tighter">
                                #{patient.patient_id} •{" "}
                                {patient.patient_gender?.charAt(0) || "O"} •{" "}
                                {patient.patient_age || "?"}Y
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 font-mono tracking-tight">
                              {patient.patient_phone ||
                                patient.phone_number ||
                                "-"}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 truncate opacity-60">
                              {patient.address || "-"}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <span className="truncate max-w-[80px]">
                                {patient.treatment_type || "General"}
                              </span>
                              <span>
                                {patient.attendance_count}/{totalDays}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="text-right pr-4">
                            <div
                              className={`text-sm ${
                                effectiveBalance > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : effectiveBalance < 0
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-orange-500"
                              }`}
                            >
                              {effectiveBalance < 0 ? "-" : ""}₹
                              {Math.abs(effectiveBalance).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex justify-center">
                            {isPresent ? (
                              <div className="relative">
                                <div className="flex items-center bg-emerald-500/10 dark:bg-emerald-500/5 rounded-xl border border-emerald-500/20 overflow-hidden min-w-[124px]">
                                  <div className="flex-1 py-2.5 px-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 text-center border-r border-emerald-500/20">
                                    Present
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdown(
                                        activeDropdown === patient.patient_id
                                          ? null
                                          : patient.patient_id,
                                      );
                                    }}
                                    className={`px-3 py-2.5 hover:bg-emerald-500/10 transition-all flex items-center justify-center ${activeDropdown === patient.patient_id ? "bg-emerald-500/10" : ""}`}
                                  >
                                    <ChevronDown
                                      size={14}
                                      strokeWidth={3}
                                      className={`text-orange-500 transition-transform duration-300 ${activeDropdown === patient.patient_id ? "rotate-180" : ""}`}
                                    />
                                  </button>
                                </div>

                                <AnimatePresence>
                                  {activeDropdown === patient.patient_id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-[60]"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveDropdown(null);
                                        }}
                                      />
                                      <motion.div
                                        initial={{
                                          opacity: 0,
                                          y: 10,
                                          scale: 0.95,
                                        }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{
                                          opacity: 0,
                                          y: 10,
                                          scale: 0.95,
                                        }}
                                        className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#1A1C1E] border border-gray-200 dark:border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[70] overflow-hidden"
                                      >
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveDropdown(null);
                                            setRevertModal({
                                              open: true,
                                              patient,
                                            });
                                          }}
                                          className="w-full px-5 py-4 flex items-center gap-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-xs font-bold uppercase tracking-widest"
                                        >
                                          <RotateCcw size={16} />
                                          Revert Entry
                                        </button>
                                      </motion.div>
                                    </>
                                  )}
                                </AnimatePresence>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isPending) {
                                    handleMarkAttendance(e, patient);
                                  }
                                }}
                                className={`w-full max-w-[124px] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                  isPending
                                    ? "bg-amber-500 text-white"
                                    : "bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 shadow-lg"
                                }`}
                              >
                                {isPending ? "Pending" : "Mark Present"}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center justify-end gap-2 transition-all duration-300">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintToken(e, patient.patient_id);
                              }}
                              disabled={patient.print_count > 3}
                              title={
                                patient.print_count > 0
                                  ? `Remaining reprints: ${Math.max(0, 4 - patient.print_count)}`
                                  : "Generate Token"
                              }
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-emerald-600 border border-transparent hover:border-emerald-500/20 transition-all shadow-sm disabled:opacity-20 disabled:cursor-not-allowed disabled:grayscale"
                            >
                              <Printer size={15} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openPatientDetails(patient);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-emerald-600 border border-transparent hover:border-emerald-500/20 transition-all shadow-sm"
                            >
                              <Eye size={17} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              )}
            </div>

            {/* Compact Centered Pagination */}
            <div className="flex justify-center mt-8">
              <div
                className={`flex items-center gap-6 px-6 py-3 rounded-full border shadow-xl ${isDark ? "bg-[#141619] border-white/5" : "bg-white border-gray-100"}`}
              >
                <button
                  onClick={() => setPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="w-10 h-10 rounded-full border border-gray-100 dark:border-white/5 flex items-center justify-center transition-all disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/20 shadow-sm disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2">
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 dark:bg-white/5 px-5 py-2 rounded-full border border-gray-100 dark:border-white/5">
                    Page{" "}
                    <span className="text-slate-900 dark:text-white mx-1">
                      {pagination.page}
                    </span>{" "}
                    / {pagination.total_pages}
                  </div>
                </div>

                <button
                  onClick={() => setPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                  className="w-10 h-10 rounded-full border border-gray-100 dark:border-white/5 flex items-center justify-center transition-all disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/20 shadow-sm disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>

      <ActionFAB
        onAction={(act) =>
          navigate("/reception/dashboard", { state: { openModal: act } })
        }
      />

      {/* Global Overlays */}
      <PatientDetailsModal />
      <AttendanceModal
        isOpen={attendanceModal.open}
        patient={attendanceModal.patient}
        onClose={() => setAttendanceModal({ open: false, patient: null })}
        onSuccess={() => fetchPatients(user!.branch_id)}
      />
      <TokenPreviewModal
        isOpen={tokenModal.open}
        patientId={tokenModal.patientId}
        onClose={() => setTokenModal({ open: false, patientId: null })}
      />
      <RevertAttendanceModal
        isOpen={revertModal.open}
        patientName={revertModal.patient?.patient_name || ""}
        onClose={() => setRevertModal({ open: false, patient: null })}
        onConfirm={handleRevertAttendance}
      />
      <DailyIntelligence
        isOpen={showIntelligence}
        onClose={() => setShowIntelligence(false)}
      />
      <NotesDrawer isOpen={showNotes} onClose={() => setShowNotes(false)} />
    </div>
  );
};

export default Patients;
