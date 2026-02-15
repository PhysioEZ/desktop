import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Printer,
  User,
  Power,
  FilePlus,
  Edit,
  CreditCard,
  Calendar,
  Phone,
  AlertCircle,
  Wallet,
  Stethoscope,
  Activity,
  MapPin,
  Mail,
  Briefcase,
  Archive,
  Layout,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Zap,
  History,
} from "lucide-react";
import { usePatientStore } from "../../store/usePatientStore";
import { format } from "date-fns";
import { API_BASE_URL, authFetch, FILE_BASE_URL } from "../../config";
import PayDuesModal from "./modals/PayDuesModal";
import AddTestModal from "./modals/AddTestModal";
import EditPlanModal from "./modals/EditPlanModal";
import ChangePlanModal from "./modals/ChangePlanModal";
import StatusChangeModal from "./modals/StatusChangeModal";
import { toast } from "sonner";
import { printPatientStatement } from "../../utils/printToken";

const getPhotoUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace("admin/desktop/server/", "");
  return `${FILE_BASE_URL}/${cleanPath}`;
};

// --- COMPONENTS ---

const TabButton = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 border-l-4 group ${
      active
        ? "bg-white/5 border-emerald-400 text-white"
        : "border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
    }`}
  >
    <Icon
      className={`w-5 h-5 transition-colors ${
        active
          ? "text-emerald-400"
          : "text-slate-500 group-hover:text-slate-300"
      }`}
    />
    <span className="font-bold tracking-wide text-sm">{label}</span>
    {active && (
      <motion.div
        layoutId="tabconfig"
        className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
      />
    )}
  </button>
);

const DetailField = ({
  label,
  value,
  icon: Icon,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  color = "emerald",
}: {
  label: string;
  value?: string | null;
  icon: React.ElementType;
  color?: string;
}) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:bg-white hover:shadow-sm transition-all group">
    <div
      className={`w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-white/5 shadow-sm group-hover:scale-110 transition-transform`}
    >
      <Icon size={18} />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </span>
      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
        {value || "Not Specified"}
      </span>
    </div>
  </div>
);

const StatCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  color = "emerald",
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  color?: "emerald" | "rose" | "blue" | "amber";
}) => {
  const colors: Record<string, string> = {
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  };

  return (
    <div className="p-6 rounded-[24px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colors[color] || colors.emerald}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest opacity-40">
            {trend === "up" ? <Activity size={12} /> : <Archive size={12} />}
            <span>{trend === "up" ? "Active" : "History"}</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-2">
        {value}
      </h3>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </span>
        {subtext && (
          <span className="text-[10px] font-medium text-slate-300 mt-1">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

const QuickAction = ({
  icon: Icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
}) => {
  const styles = {
    default:
      "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:bg-white/10",
    primary:
      "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-emerald-500/20 shadow-lg",
    danger:
      "bg-white dark:bg-white/5 text-rose-500 border-slate-200 dark:border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-500/10",
  };

  return (
    <button
      onClick={onClick}
      className={`group flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 ${styles[variant]}`}
    >
      <Icon size={14} strokeWidth={2.5} />
      <span>{label}</span>
    </button>
  );
};

const SectionHeader = ({
  title,
  icon: Icon,
}: {
  title: string;
  icon: React.ElementType;
}) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
      <Icon size={16} strokeWidth={2.5} />
    </div>
    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
      {title}
    </h3>
  </div>
);

const PatientDetailsModal = () => {
  const {
    selectedPatient,
    isDetailsModalOpen,
    closePatientDetails,
    patientDetails,
    isLoadingDetails,
    fetchPatientDetails,
  } = usePatientStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [modals, setModals] = useState({
    payDues: false,
    addTest: false,
    editPlan: false,
    changePlan: false,
    statusChange: false,
  });

  const toggleModal = (key: keyof typeof modals, state: boolean) =>
    setModals((prev) => ({ ...prev, [key]: state }));

  const handleRefresh = () =>
    selectedPatient && fetchPatientDetails(selectedPatient.patient_id);

  const handlePrintBill = async () => {
    if (!selectedPatient?.patient_id) return;
    const toastId = toast.loading("Processing clinical statement...");
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/tokens?action=get_data&patient_id=${selectedPatient.patient_id}`,
      );
      const json = await res.json();
      if (json.success || json.status === "success") {
        printPatientStatement(json.data);
        toast.success("Statement ready", { id: toastId });
      } else {
        toast.error(json.message || "Export failed", { id: toastId });
      }
    } catch {
      toast.error("System error", { id: toastId });
    }
  };

  const data = { ...selectedPatient, ...patientDetails };
  const dueAmount = parseFloat(String(data.due_amount || "0"));
  const walletBalance =
    (data.payments?.reduce(
      (acc: number, p: { amount: string | number }) =>
        acc + parseFloat(String(p.amount)),
      0,
    ) || 0) - parseFloat(String(data.total_consumed || "0"));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patientData = data as any;

  if (!isDetailsModalOpen || !selectedPatient) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 text-slate-800 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePatientDetails}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative w-full max-w-[90rem] h-[90vh] bg-white dark:bg-[#0c0d0f] rounded-[32px] shadow-2xl flex overflow-hidden ring-1 ring-white/10"
        >
          {/* --- LEFT SIDEBAR (DARK) --- */}
          <div className="w-[340px] shrink-0 bg-[#0f1115] text-slate-300 flex flex-col border-r border-white/5 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header / Profile */}
            <div className="p-8 pb-4 relative z-10 text-center">
              <div className="w-32 h-32 mx-auto rounded-[32px] p-2 bg-gradient-to-br from-white/10 to-transparent border border-white/10 shadow-2xl mb-6 relative group">
                <div className="w-full h-full rounded-[26px] overflow-hidden bg-slate-800 relative">
                  {getPhotoUrl(data.patient_photo_path) ? (
                    <img
                      src={getPhotoUrl(data.patient_photo_path) || ""}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                      <User size={48} strokeWidth={1} />
                    </div>
                  )}
                  <div
                    className={`absolute bottom-0 inset-x-0 h-1.5 ${data.patient_status === "active" ? "bg-emerald-500" : "bg-slate-500"}`}
                  />
                </div>
                <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-lg ${
                      data.patient_status === "active"
                        ? "bg-emerald-500 text-white border-emerald-400"
                        : "bg-slate-700 text-slate-300 border-slate-600"
                    }`}
                  >
                    {data.patient_status}
                  </span>
                </div>
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                {data.patient_name}
              </h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] font-mono mb-6">
                {data.patient_uid}
              </p>

              <div className="flex items-center justify-center gap-2 mb-8">
                <button className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5">
                  <Phone size={16} />
                </button>
                <button className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5">
                  <Mail size={16} />
                </button>
                <button className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5">
                  <MapPin size={16} />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-0 space-y-2 pb-6">
              <TabButton
                icon={Layout}
                label="Overview"
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
              />
              <TabButton
                icon={User}
                label="Profile Details"
                active={activeTab === "profile"}
                onClick={() => setActiveTab("profile")}
              />
              <TabButton
                icon={Stethoscope}
                label="Treatment Plan"
                active={activeTab === "treatment"}
                onClick={() => setActiveTab("treatment")}
              />
              <TabButton
                icon={CreditCard}
                label="Financials"
                active={activeTab === "financials"}
                onClick={() => setActiveTab("financials")}
              />
              <TabButton
                icon={Calendar}
                label="Attendance Log"
                active={activeTab === "attendance"}
                onClick={() => setActiveTab("attendance")}
              />
              <TabButton
                icon={Activity}
                label="Clinical Notes"
                active={activeTab === "clinical"}
                onClick={() => setActiveTab("clinical")}
              />
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-white/5 bg-[#0a0b0e]">
              {dueAmount > 0 ? (
                <button
                  onClick={() => toggleModal("payDues", true)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-rose-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Wallet size={16} />
                  Pay Due: ₹{dueAmount.toLocaleString()}
                </button>
              ) : (
                <button
                  onClick={() => toggleModal("addTest", true)}
                  className="w-full py-4 rounded-xl bg-white/5 text-emerald-400 border border-emerald-500/20 font-black uppercase text-xs tracking-widest hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-2"
                >
                  <FilePlus size={16} />
                  Add Record
                </button>
              )}
            </div>
          </div>

          {/* --- MAIN CONTENT (LIGHT) --- */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-[#0c0d0f] relative">
            {/* Header */}
            <div className="flex items-center justify-between px-10 py-6 bg-white/80 dark:bg-[#0c0d0f]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 z-20 sticky top-0">
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                  Patient Profile
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="text-sm font-medium text-slate-500 font-mono">
                    #{data.patient_id}
                  </span>
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <QuickAction
                  icon={Printer}
                  label="Print"
                  onClick={handlePrintBill}
                />
                <QuickAction
                  icon={ExternalLink}
                  label="Profile"
                  onClick={() =>
                    window.open(
                      `../patients_profile?patient_id=${data.patient_id}`,
                      "_blank",
                    )
                  }
                />
                <QuickAction
                  icon={CreditCard}
                  label="Change Plan"
                  onClick={() => toggleModal("changePlan", true)}
                />
                <QuickAction
                  icon={Edit}
                  label="Modify"
                  onClick={() => toggleModal("editPlan", true)}
                />
                <QuickAction
                  icon={Power}
                  label="Status"
                  onClick={() => toggleModal("statusChange", true)}
                  variant="danger"
                />
                <button
                  onClick={closePatientDetails}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors flex items-center justify-center ml-2 border border-slate-200 dark:border-white/10"
                >
                  <X size={20} className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
              {isLoadingDetails ? (
                <div className="h-full flex flex-col items-center justify-center animate-pulse">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-emerald-500 animate-spin mb-4" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Accessing Records...
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {activeTab === "overview" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      {/* Stats Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                          label="Total Consumed"
                          value={`₹${parseFloat(String(data.total_consumed || 0)).toLocaleString()}`}
                          icon={Activity}
                          color="blue"
                        />
                        {dueAmount > 0 ? (
                          <StatCard
                            label="Current Due"
                            value={`₹${dueAmount.toLocaleString()}`}
                            icon={AlertCircle}
                            color="rose"
                            subtext="Immediate Payment Required"
                          />
                        ) : (
                          <StatCard
                            label="Wallet Balance"
                            value={`₹${walletBalance.toLocaleString()}`}
                            icon={Wallet}
                            color={walletBalance < 0 ? "rose" : "emerald"}
                            subtext={
                              walletBalance < 0
                                ? "Outstanding Dues"
                                : "Available Credit"
                            }
                          />
                        )}
                        <StatCard
                          label="Treatment Days"
                          value={`${data.attendance_count || 0}/${data.treatment_days || 0}`}
                          icon={Calendar}
                          color="amber"
                          subtext={`${Math.round(((data.attendance_count || 0) / (data.treatment_days || 1)) * 100)}% Complete`}
                        />
                        <StatCard
                          label="Current Plan"
                          value={data.treatment_type || "No Plan"}
                          icon={Zap}
                          color="emerald"
                          subtext={
                            data.end_date
                              ? `Exp: ${format(new Date(data.end_date), "dd MMM")}`
                              : "No Expiry"
                          }
                        />
                      </div>

                      {/* Plan Progress & Quick Actions */}
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 p-8 rounded-[32px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-between relative overflow-hidden">
                          <div className="relative z-10">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2">
                              Plan Trajectory
                            </h3>
                            <p className="text-sm text-slate-500 max-w-md">
                              Patient is currently engaging with the{" "}
                              <strong className="text-emerald-500">
                                {data.treatment_type}
                              </strong>{" "}
                              plan. Attendance consistency is tracked for
                              optimal recovery.
                            </p>
                            <div className="mt-8 flex gap-8">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                  Start Date
                                </span>
                                <span className="text-sm font-black text-slate-800 dark:text-white">
                                  {data.start_date
                                    ? format(
                                        new Date(data.start_date),
                                        "dd MMM yyyy",
                                      )
                                    : "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                  Renewal
                                </span>
                                <span className="text-sm font-black text-slate-800 dark:text-white">
                                  {data.end_date
                                    ? format(
                                        new Date(data.end_date),
                                        "dd MMM yyyy",
                                      )
                                    : "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="relative w-40 h-40 mr-8 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                className="text-slate-100 dark:text-slate-800"
                              />
                              <circle
                                cx="80"
                                cy="80"
                                r="70"
                                stroke="currentColor"
                                strokeWidth="10"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 70}
                                strokeDashoffset={
                                  2 *
                                  Math.PI *
                                  70 *
                                  (1 -
                                    (data.attendance_count || 0) /
                                      (data.treatment_days || 1))
                                }
                                className="text-emerald-500 transition-all duration-1000 ease-out"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-3xl font-black text-slate-800 dark:text-white">
                                {data.attendance_count || 0}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase">
                                of {data.treatment_days}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Activity / Next Action */}
                        <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex flex-col relative overflow-hidden">
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-widest">
                              Recent Activity
                            </h4>
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                              <History size={16} />
                            </div>
                          </div>

                          <div className="space-y-4 flex-1">
                            {data.attendance?.slice(0, 3).map(
                              (
                                att: {
                                  date: string;
                                  attendance_date: string;
                                },
                                idx: number,
                              ) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3"
                                >
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" />
                                  <div className="flex-1">
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                      Attendance Marked
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-400">
                                      {format(
                                        new Date(
                                          att.date || att.attendance_date,
                                        ),
                                        "dd MMM, hh:mm a",
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                            {(!data.attendance ||
                              data.attendance.length === 0) && (
                              <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-bold text-slate-400">
                                  No recent activity
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setActiveTab("attendance")}
                            className="w-full bg-white dark:bg-white/5 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase text-slate-500 hover:text-emerald-500 transition-colors mt-4"
                          >
                            View All
                          </button>
                        </div>
                      </div>

                      {/* Quick Personal Info Strip */}
                      <div className="p-8 rounded-[32px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-sm">
                        <SectionHeader
                          title="Quick Identification"
                          icon={User}
                        />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                              Full Name
                            </span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white truncate block">
                              {data.patient_name}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                              Contact
                            </span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white truncate block">
                              {data.patient_phone || data.phone_number}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                              Age / Gender
                            </span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white truncate block">
                              {data.patient_age} Years • {data.patient_gender}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                              Condition
                            </span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white truncate block">
                              {data.patient_condition || "Active"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "profile" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      {/* Identity & Contact */}
                      <div className="bg-white dark:bg-white/[0.02] rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-white/5">
                        <SectionHeader title="Patient Identity" icon={User} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DetailField
                            label="Legal Name"
                            value={data.patient_name}
                            icon={User}
                          />
                          <DetailField
                            label="Primary Contact"
                            value={data.patient_phone || data.phone_number}
                            icon={Phone}
                          />
                          <DetailField
                            label="Email Address"
                            value={data.email}
                            icon={Mail}
                          />
                          <DetailField
                            label="Demographics"
                            value={`${data.patient_age} Years • ${data.patient_gender}`}
                            icon={Calendar}
                          />
                          <DetailField
                            label="Profession"
                            value={data.occupation}
                            icon={Briefcase}
                          />
                          <DetailField
                            label="Primary Address"
                            value={data.address}
                            icon={MapPin}
                          />
                        </div>
                      </div>

                      <div className="bg-white dark:bg-white/[0.02] rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-white/5">
                        <SectionHeader
                          title="Clinical Profile"
                          icon={Activity}
                        />

                        <div className="space-y-6">
                          <div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-2">
                              Chief Complaint
                            </span>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-sm font-medium italic text-slate-700 dark:text-slate-300">
                              "{data.chief_complain || "No Record"}"
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                                Lead Clinician
                              </span>
                              <span className="text-xs font-bold text-slate-800 dark:text-white">
                                {data.assigned_doctor?.replace(
                                  /^Dr\.\s*/i,
                                  "",
                                ) || "Unassigned"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">
                                Referral Path
                              </span>
                              <span className="text-xs font-bold text-slate-800 dark:text-white capitalize">
                                {data.referralSource || "Walk-in"}
                              </span>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                            <span className="text-[9px] font-black text-emerald-500 uppercase block mb-1">
                              Medical Status Summary
                            </span>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {data.patient_condition ||
                                "Patient under active observation."}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "treatment" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      {/* Active Treatment Card */}
                      <div className="bg-white dark:bg-white/[0.02] rounded-[32px] p-8 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                        <SectionHeader
                          title="Active Treatment"
                          icon={Stethoscope}
                        />

                        <h2 className="text-3xl font-black text-slate-800 dark:text-white capitalize mb-4">
                          {data.treatment_type || "No Plan Active"}
                        </h2>

                        <div className="flex items-baseline gap-2 mb-8">
                          <span className="text-4xl font-black text-emerald-500">
                            ₹
                            {parseFloat(
                              String(data.total_amount || "0"),
                            ).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Total Plan Value
                          </span>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-500">
                              Progress: {data.attendance_count || 0}/
                              {data.treatment_days || 0} Sessions
                            </span>
                            <span className="text-emerald-500">
                              {Math.round(
                                ((data.attendance_count || 0) /
                                  (data.treatment_days || 1)) *
                                  100,
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-1000"
                              style={{
                                width: `${Math.min(100, ((data.attendance_count || 0) / (data.treatment_days || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                            <div className="flex flex-col">
                              <span>Start Date</span>
                              <span className="text-slate-800 dark:text-white mt-1">
                                {data.start_date
                                  ? format(
                                      new Date(data.start_date),
                                      "dd MMM yyyy",
                                    )
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span>Renewal Date</span>
                              <span className="text-slate-800 dark:text-white mt-1">
                                {data.end_date
                                  ? format(
                                      new Date(data.end_date),
                                      "dd MMM yyyy",
                                    )
                                  : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Plan History */}
                      <div className="space-y-4">
                        <SectionHeader title="Plan History" icon={History} />
                        {data.history?.map(
                          (
                            h: {
                              treatment_type: string;
                              start_date: string;
                              end_date: string;
                              total_amount: string | number;
                            },
                            i: number,
                          ) => (
                            <div
                              key={i}
                              className="p-6 rounded-[24px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between shadow-sm"
                            >
                              <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                  <Archive size={20} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                    {h.treatment_type}
                                  </h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {h.start_date} — {h.end_date}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-emerald-500">
                                  ₹
                                  {parseFloat(
                                    String(h.total_amount || "0"),
                                  ).toLocaleString()}
                                </p>
                                <p className="text-[10px] font-bold text-slate-300 uppercase">
                                  Total Value
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                        {(!data.history || data.history.length === 0) && (
                          <div className="text-center py-20 text-slate-300 font-bold uppercase text-xs">
                            No historical records found
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "financials" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Compact Wallet Section */}
                      <div className="group relative bg-[#121417] rounded-[32px] p-8 shadow-xl overflow-hidden border border-white/5">
                        {/* Subtle Background Effects */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />

                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <Wallet size={24} strokeWidth={2.5} />
                              </div>
                              <div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">
                                  Financial Summary
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                    dueAmount > 0
                                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  }`}
                                >
                                  {dueAmount > 0 ? "Pending Dues" : "Paid Up"}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">
                                Total Outstanding
                              </span>
                              <h3 className="text-4xl font-black tracking-tighter text-white">
                                ₹{dueAmount.toLocaleString()}
                              </h3>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
                              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">
                                Available Credit
                              </span>
                              <span className="text-xl font-black text-emerald-400 tracking-tight">
                                ₹{walletBalance.toLocaleString()}
                              </span>
                            </div>
                            <div className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
                              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">
                                Net Consumption
                              </span>
                              <span className="text-xl font-black text-slate-200 tracking-tight">
                                ₹
                                {Math.round(
                                  parseFloat(
                                    String(data.total_consumed || "0"),
                                  ),
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleModal("payDues", true)}
                            className="group relative w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#00390a] font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/10 overflow-hidden"
                          >
                            <CreditCard size={16} strokeWidth={3} />
                            Initiate Payment
                            <ArrowRight
                              size={16}
                              strokeWidth={3}
                              className="group-hover:translate-x-1 transition-transform"
                            />
                          </button>
                        </div>
                      </div>

                      {/* Transaction Ledger */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                          <SectionHeader
                            title="Activity Ledger"
                            icon={History}
                          />
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                            {data.payments?.length || 0} Records
                          </div>
                        </div>

                        <div className="space-y-3">
                          {data.payments && data.payments.length > 0 ? (
                            data.payments
                              .slice()
                              .reverse()
                              .map((payment: any, idx: number) => (
                                <motion.div
                                  key={payment.payment_id || idx}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="group p-5 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between hover:border-emerald-500/30 transition-all"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                      <CreditCard size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight mb-0.5">
                                        {payment.payment_method ||
                                          payment.notes ||
                                          "Settlement"}
                                      </h4>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        {format(
                                          new Date(
                                            payment.payment_date ||
                                              payment.created_at,
                                          ),
                                          "dd MMM yyyy • HH:mm",
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <p className="text-xl font-black text-emerald-500 tracking-tight">
                                      ₹
                                      {parseFloat(
                                        String(payment.amount),
                                      ).toLocaleString()}
                                    </p>
                                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        Success
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                          ) : (
                            <div className="py-12 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[32px] text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                No transactional data available
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "attendance" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-8 rounded-[32px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                          Attendance Log
                        </h3>
                        <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {data.attendance?.length || 0} Records
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {data.attendance
                          ?.slice()
                          .sort(
                            (
                              a: { date: string; attendance_date: string },
                              b: { date: string; attendance_date: string },
                            ) =>
                              new Date(b.date || b.attendance_date).getTime() -
                              new Date(a.date || a.attendance_date).getTime(),
                          )
                          .map(
                            (
                              att: {
                                date: string;
                                attendance_date: string;
                                status: string;
                              },
                              idx: number,
                            ) => (
                              <div
                                key={idx}
                                className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:border-emerald-200 transition-all"
                              >
                                <div>
                                  <p className="text-sm font-black text-slate-800 dark:text-white">
                                    {format(
                                      new Date(att.date || att.attendance_date),
                                      "dd MMM yyyy",
                                    )}
                                  </p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                    {format(
                                      new Date(att.date || att.attendance_date),
                                      "EEEE",
                                    )}
                                  </p>
                                </div>
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${att.status === "present" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}
                                >
                                  {att.status === "present" ? (
                                    <CheckCircle2 size={14} />
                                  ) : (
                                    <AlertTriangle size={14} />
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "clinical" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-4 p-6 rounded-[24px] bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-900 dark:text-indigo-200">
                        <AlertCircle size={24} />
                        <div>
                          <h4 className="font-bold text-sm">
                            Clinical Observations
                          </h4>
                          <p className="text-xs opacity-70">
                            Logs are immutable and recorded by assigned
                            doctors/staff.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {(() => {
                          const raw = data.remarks || "";
                          const parts = raw.split(
                            /\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/g,
                          );
                          const logs = [];
                          if (parts.length < 2)
                            return (
                              <div className="text-center py-20 text-slate-300 font-bold uppercase text-xs">
                                No clinical logs available
                              </div>
                            );
                          for (let i = 1; i < parts.length; i += 2)
                            logs.push({ date: parts[i], msg: parts[i + 1] });
                          return logs.reverse().map((log, idx) => (
                            <div key={idx} className="flex gap-6">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900/20" />
                                {idx !== logs.length - 1 && (
                                  <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 my-2" />
                                )}
                              </div>
                              <div className="flex-1 pb-8">
                                <div className="p-6 rounded-[24px] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      {format(
                                        new Date(log.date),
                                        "dd MMM yyyy • hh:mm a",
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                    "{log.msg?.trim()}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {modals.payDues && (
        <PayDuesModal
          isOpen={modals.payDues}
          onClose={() => toggleModal("payDues", false)}
          patientId={selectedPatient.patient_id}
          currentDue={dueAmount}
          walletBalance={walletBalance}
          onSuccess={handleRefresh}
        />
      )}
      {modals.addTest && (
        <AddTestModal
          isOpen={modals.addTest}
          onClose={() => toggleModal("addTest", false)}
          patient={patientData}
          onSuccess={handleRefresh}
        />
      )}
      {modals.editPlan && (
        <EditPlanModal
          isOpen={modals.editPlan}
          onClose={() => toggleModal("editPlan", false)}
          patient={patientData}
          onSuccess={handleRefresh}
        />
      )}
      {modals.changePlan && (
        <ChangePlanModal
          isOpen={modals.changePlan}
          onClose={() => toggleModal("changePlan", false)}
          patient={patientData}
          onSuccess={handleRefresh}
        />
      )}
      {modals.statusChange && (
        <StatusChangeModal
          isOpen={modals.statusChange}
          onClose={() => toggleModal("statusChange", false)}
          patientId={data.patient_id || 0}
          currentStatus={data.patient_status || "active"}
        />
      )}
    </AnimatePresence>
  );
};

export default PatientDetailsModal;
