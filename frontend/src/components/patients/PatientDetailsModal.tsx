import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  IndianRupee,
  Printer,
  User,
  Power,
  FilePlus,
  Edit,
  CreditCard,
  ChevronDown,
  Loader2,
  Calendar,
  Phone,
  Activity,
  AlertCircle,
  Clock,
  History,
  Wallet,
  Info,
  Stethoscope,
} from "lucide-react";
import { usePatientStore } from "../../store/usePatientStore";
import { format } from "date-fns";
import { API_BASE_URL, authFetch } from "../../config";
import PayDuesModal from "./modals/PayDuesModal";
import AddTestModal from "./modals/AddTestModal";
import EditPlanModal from "./modals/EditPlanModal";
import ChangePlanModal from "./modals/ChangePlanModal";
import { toast } from "sonner";
import { printPatientStatement } from "../../utils/printToken";

// --- Sub-components (Defined first to avoid ReferenceErrors) ---

// Material 3 Colored Badge
const Badge = ({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "success" | "error" | "warning";
}) => {
  const variants = {
    primary:
      "bg-[#f1f5f9] text-[#475569] dark:bg-[#1e293b] dark:text-[#94a3b8]",
    success:
      "bg-[#dcfce7] text-[#14532d] dark:bg-[#052e16] dark:text-[#bbf7d0]",
    error: "bg-[#fee2e2] text-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#fecaca]",
    warning:
      "bg-[#fef3c7] text-[#78350f] dark:bg-[#451a03] dark:text-[#fde68a]",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${variants[variant]}`}
    >
      {children}
    </span>
  );
};

// Material 3 Assist Chip
const ActionChip = ({
  label,
  icon: Icon,
  onClick,
  variant = "default",
}: {
  label: string;
  icon: any;
  onClick: () => void;
  variant?: "default" | "danger" | "success" | "blue";
}) => {
  const variants = {
    default:
      "text-[#475569] dark:text-[#cac4d0] bg-transparent border-[#cbd5e1] hover:bg-[#f0fdf4] hover:text-[#166534] hover:border-[#166534]",
    danger:
      "text-[#b3261e] border-[#b3261e] bg-transparent hover:bg-[#b3261e]/10",
    success:
      "text-[#15803d] border-[#15803d] bg-transparent hover:bg-[#15803d]/10",
    blue: "text-[#16a34a] border-[#16a34a] bg-transparent hover:bg-[#16a34a]/10",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all active:scale-95 ${variants[variant]}`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
};

const InfoRow = ({
  label,
  value,
  isFull = false,
}: {
  label: string;
  value: string;
  isFull?: boolean;
}) => (
  <div
    className={isFull ? "col-span-full border-b border-[#e2e8f0]/60 pb-2" : ""}
  >
    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-0.5">
      {label}
    </p>
    <p className="text-sm font-bold text-[#0f172a] dark:text-[#e2e8f0] leading-snug">
      {value}
    </p>
  </div>
);

const SummaryBox = ({
  label,
  value,
  sub,
  isError,
  isSuccess,
}: {
  label: string;
  value: string;
  sub?: string;
  isError?: boolean;
  isSuccess?: boolean;
}) => (
  <div className="bg-white/60 dark:bg-white/5 p-3 rounded-2xl border border-white/80 dark:border-white/10 shadow-sm">
    <p className="text-[9px] font-black text-[#43474e] dark:text-[#cac4d0] uppercase tracking-tighter mb-1 line-clamp-1">
      {label}
    </p>
    <p
      className={`text-sm font-black flex items-baseline gap-1 ${isError ? "text-[#b3261e]" : isSuccess ? "text-[#006e1c] dark:text-[#88d99d]" : "text-[#1d1b20] dark:text-[#e6e1e5]"}`}
    >
      {value} {sub && <span className="text-[8px] opacity-60">{sub}</span>}
    </p>
  </div>
);

const StatRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: any;
  highlight?: boolean;
}) => (
  <div className="flex justify-between items-center text-sm font-bold">
    <span className="text-[#49454f] dark:text-[#cac4d0]">{label}</span>
    <span
      className={`${highlight ? "text-[#16a34a] dark:text-[#4ade80] font-black" : "text-[#0f172a] dark:text-[#e6e1e5]"}`}
    >
      {value}
    </span>
  </div>
);

// Material 3 Styled Section (Accordion)
const Section = ({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-[#f8fafc] dark:bg-[#1e293b] rounded-[24px] border border-[#e2e8f0] dark:border-[#334155] overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-5 hover:bg-[#e2e8f0]/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#f0fdf4] dark:bg-[#064e3b] rounded-xl text-[#16a34a] dark:text-[#4ade80]">
            <Icon size={18} />
          </div>
          <h4 className="font-black text-[#0f172a] dark:text-[#f8fafc] uppercase tracking-[0.15em] text-[11px]">
            {title}
          </h4>
        </div>
        <div
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          <ChevronDown
            size={20}
            className="text-[#94a3b8]"
          />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 border-t border-[#e2e8f0]/60 dark:border-[#334155]/60">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PatientDetailsModal = () => {
  const {
    selectedPatient,
    isDetailsModalOpen,
    closePatientDetails,
    patientDetails,
    isLoadingDetails,
    fetchPatientDetails,
  } = usePatientStore();

  const [modals, setModals] = useState({
    payDues: false,
    addTest: false,
    editPlan: false,
    changePlan: false,
  });

  const toggleModal = (key: keyof typeof modals, state: boolean) => {
    setModals((prev) => ({ ...prev, [key]: state }));
  };

  const handleRefresh = () => {
    if (selectedPatient) fetchPatientDetails(selectedPatient.patient_id);
  };

  const handleToggleStatus = async () => {
    if (!selectedPatient) return;
    if (!confirm("Are you sure you want to toggle this patient's status?"))
      return;

    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/toggle_patient_status`,
        {
          method: "POST",
          body: JSON.stringify({ patient_id: selectedPatient.patient_id }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Status updated successfully");
        handleRefresh();
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (e) {
      toast.error("Error updating status");
    }
  };

  const handlePrintBill = async () => {
    if (!selectedPatient?.patient_id) return;
    const loadingToast = toast.loading("Generating bill...");
    try {
       const res = await authFetch(`${API_BASE_URL}/reception/tokens?action=get_data&patient_id=${selectedPatient.patient_id}`);
       const json = await res.json();
       if (json.success || json.status === 'success') {
          printPatientStatement(json.data);
          toast.success("Bill sent to printer");
       } else {
          toast.error(json.message || "Failed to load bill data");
       }
    } catch (e) {
       console.error(e);
       toast.error("Error generating bill");
    } finally {
       toast.dismiss(loadingToast);
    }
  };

  const data = { ...selectedPatient, ...patientDetails };

  if (!isDetailsModalOpen || !selectedPatient) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePatientDetails}
          className="absolute inset-0 bg-[#1d1b20]/40 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="relative w-full w-[90vw] max-w-[90vw] h-[90vh] bg-[#fffbff] dark:bg-[#1c1b1f] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-[#cac4d0] dark:border-[#49454f]"
        >
          {/* Simplified M3 Header */}
          <div className="px-8 pt-8 pb-8 mb-2 flex items-start justify-between bg-[#f8fafc] dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155]">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-[28px] bg-[#f0fdf4] dark:bg-[#064e3b] p-1 shadow-inner overflow-hidden border-2 border-white dark:border-[#334155]">
                  <div className="w-full h-full rounded-[24px] bg-[#16a34a] flex items-center justify-center text-4xl font-black text-white overflow-hidden">
                    {data.patient_photo_path ? (
                      <img
                        src={`/admin/${data.patient_photo_path}`}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      data.patient_name?.charAt(0) || "P"
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-[#1e293b] p-1.5 rounded-full shadow-lg border border-[#e2e8f0] dark:border-[#334155]">
                  <Activity size={16} className="text-[#16a34a]" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-3xl font-black text-[#1d1b20] dark:text-[#e6e1e5] tracking-tight">
                    {data.patient_name}
                  </h2>
                  <Badge
                    variant={
                      data.patient_status === "active" ? "success" : "error"
                    }
                  >
                    {data.patient_status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[#49454f] dark:text-[#cac4d0] font-bold text-sm">
                  <span className="bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1] px-2.5 py-0.5 rounded-full text-xs tracking-wider">
                    #{data.patient_uid}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} className="text-[#16a34a]" />{" "}
                    {data.patient_phone}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#16a34a]" />{" "}
                    {data.patient_age} Yrs / {data.patient_gender}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions in Header */}
            <div className="hidden lg:flex flex-wrap gap-2 items-center justify-end flex-1 mx-8">
                  <ActionChip
                    label="Print Bill"
                    icon={Printer}
                    onClick={handlePrintBill}
                  />
                  <ActionChip
                    label="Profile View"
                    icon={User}
                    onClick={() =>
                      window.open(
                        `../patients_profile?patient_id=${data.patient_id}`,
                        "_blank",
                      )
                    }
                  />
                  <div className="h-6 w-px bg-[#cac4d0] dark:bg-[#49454f] mx-1" />
                  <ActionChip
                    label="Pay Dues"
                    icon={IndianRupee}
                    onClick={() => toggleModal("payDues", true)}
                    variant="success"
                  />
                  <ActionChip
                    label="Add Test"
                    icon={FilePlus}
                    onClick={() => toggleModal("addTest", true)}
                  />
                  <ActionChip
                    label="Change Plan"
                    icon={CreditCard}
                    onClick={() => toggleModal("changePlan", true)}
                    variant="blue"
                  />
                 <ActionChip
                    label="Edit Plan"
                    icon={Edit}
                    onClick={() => toggleModal("editPlan", true)}
                  />
                   <ActionChip
                    label="Status"
                    icon={Power}
                    onClick={handleToggleStatus}
                    variant="danger"
                  />
            </div>

            <button
              onClick={closePatientDetails}
              className="p-3 hover:bg-[#cac4d0]/30 rounded-full transition-all text-[#49454f] dark:text-[#cac4d0]"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto bg-[#fffbff] dark:bg-[#1c1b1f]">
            {isLoadingDetails ? (
              <div className="flex h-96 items-center justify-center flex-col gap-4">
                <Loader2 className="animate-spin text-[#16a34a]" size={48} />
                <p className="text-[#16a34a] font-black uppercase tracking-widest text-xs">
                  Accessing Patient Records...
                </p>
              </div>
            ) : (
              <div className="p-8">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Content (8 cols) */}
                  <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Section
                        title="Personal Information"
                        icon={User}
                        defaultOpen={true}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <InfoRow
                            label="Full Name"
                            value={data.patient_name || ""}
                          />
                          <div className="flex justify-between items-center border-b border-[#cac4d0]/20 pb-2">
                            <div>
                                <p className="text-[10px] font-black text-[#64748b] uppercase tracking-wider mb-1">
                                  Status
                                </p>
                              <Badge
                                variant={
                                  data.patient_status === "active"
                                    ? "success"
                                    : "error"
                                }
                              >
                                {data.patient_status || "Unknown"}
                              </Badge>
                            </div>
                          </div>
                          <InfoRow
                            label="Age / Gender"
                            value={`${data.patient_age || data.age || "?"} Years / ${data.patient_gender || data.gender || "?"}`}
                          />
                          <InfoRow
                            label="Phone Number"
                            value={
                              data.patient_phone || data.phone_number || ""
                            }
                          />
                          <InfoRow
                            label="Email Address"
                            value={data.email || "-"}
                          />
                          <InfoRow
                            label="Occupation"
                            value={data.occupation || "-"}
                          />
                          <InfoRow
                            label="Residential Address"
                            value={data.address || "-"}
                            isFull
                          />
                        </div>
                      </Section>

                      <Section title="Medical Profile" icon={Stethoscope}>
                        <div className="grid grid-cols-1 gap-5">
                          <InfoRow
                            label="Assigned Doctor"
                            value={`Dr. ${data.assigned_doctor || "-"}`}
                          />
                          <InfoRow
                            label="Service Category"
                            value={data.service_type || "-"}
                          />
                          <InfoRow
                            label="Main Complaint"
                            value={
                              data.patient_condition ||
                              "No specific condition recorded."
                            }
                            isFull
                          />
                          <InfoRow
                            label="Patient History / Referral"
                            value={
                              data.referralSource === "other"
                                ? data.reffered_by || "-"
                                : data.referralSource ||
                                  data.reffered_by ||
                                  "Direct / Walk-in"
                            }
                            isFull
                          />
                        </div>
                      </Section>

                      <Section title="Attendance Overview" icon={History}>
                        <div className="space-y-6">
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">
                              Sessions Progression
                            </span>
                            <span className="text-xl font-black text-[#1d1b20] dark:text-[#e6e1e5]">
                              {data.attendance_count} / {data.treatment_days}{" "}
                              <span className="text-[10px] text-[#49454f]">
                                DAYS
                              </span>
                            </span>
                          </div>
                          <div className="h-4 w-full bg-[#f1f5f9] dark:bg-[#49454f] rounded-full overflow-hidden p-1 shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(100, ((data.attendance_count || 0) / (data.treatment_days || 1)) * 100)}%`,
                              }}
                              className="h-full bg-[#16a34a] rounded-full flex items-center justify-end px-1"
                            >
                              <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                            </motion.div>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-[#f8fafc] dark:bg-[#052e16]/20 rounded-xl border border-[#e2e8f0]/60">
                            <Clock size={16} className="text-[#16a34a]" />
                            <p className="text-xs font-bold text-[#49454f] dark:text-[#cac4d0]">
                              Last Session:{" "}
                              {data.last_visit
                                ? format(new Date(data.last_visit), "PPP")
                                : data.attendance?.[0]
                                  ? format(
                                      new Date(
                                        data.attendance[0].attendance_date,
                                      ),
                                      "PPP",
                                    )
                                  : "No history yet"}
                            </p>
                          </div>
                        </div>
                      </Section>

                      <Section
                        title="Clinical Records & Remarks"
                        icon={AlertCircle}
                      >
                        <div className="bg-[#f8fafc] dark:bg-[#111315] border border-[#e2e8f0] dark:border-[#43474e] rounded-[20px] overflow-hidden">
                           {(() => {
                               const raw = data.remarks || "";
                               const parts = raw.split(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/g);
                               const logs = [];
                               
                               if (parts.length < 2) {
                                   if (!raw.trim()) return <div className="p-6 text-sm text-slate-400 italic text-center">No additional remarks have been added to this patient profile.</div>;
                                   return <div className="p-5 text-sm text-slate-800 dark:text-slate-200">{raw}</div>;
                               }

                               // If there is meaningful text BEFORE the first timestamp, include it.
                               if (parts[0] && parts[0].trim()) {
                                    logs.push({ date: null, msg: parts[0].trim() });
                               }

                               for (let i = 1; i < parts.length; i += 2) {
                                   logs.push({ date: parts[i], msg: parts[i+1]?.trim() });
                               }

                               return (
                                   <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto custom-scrollbar">
                                       {logs.map((log, idx) => (
                                           <div key={idx} className="p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                               <div className="shrink-0 flex flex-col items-center mt-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
                                               </div>
                                               <div className="flex-1">
                                                   {log.date && (
                                                       <p className="text-[10px] font-bold text-slate-400 font-mono mb-0.5 uppercase tracking-wider flex items-center gap-2">
                                                           {format(new Date(log.date), "MMM dd, yyyy • hh:mm a")}
                                                       </p>
                                                   )}
                                                   <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{log.msg}</p>
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               );
                           })()}
                        </div>
                      </Section>
                    </div>

                    {/* Row 2: Treatment Details */}
                    <Section title="Treatment Plan Details" icon={Calendar}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <InfoRow
                          label="Treatment Type"
                          value={data.treatment_type || "Custom"}
                        />
                        <InfoRow
                          label="Duration"
                          value={`${data.treatment_days || 0} Days`}
                        />
                        <InfoRow
                          label="Session Time"
                          value={data.treatment_time_slot || "09:00 AM"}
                        />
                        <InfoRow
                          label="Treatment Period"
                          value={`${data.start_date} → ${data.end_date}`}
                        />
                        <InfoRow
                          label="Cost Per Day"
                          value={`₹${data.cost_per_day}`}
                        />
                        <InfoRow
                          label="Package Cost"
                          value={`₹${data.package_cost || "-"}`}
                        />
                        <InfoRow
                          label="Total Plan Cost"
                          value={`₹${data.total_amount || 0}`}
                        />
                        <InfoRow
                          label="Discount"
                          value={`${data.discount_amount ? "₹" + data.discount_amount : "0%"}`}
                        />
                      </div>
                    </Section>

                    <Section
                      title="Historical Timeline"
                      icon={Calendar}
                      defaultOpen={false}
                    >
                      <div className="space-y-3">
                        {data.history?.map((h: any, i: number) => {
                          const isPackage = h.treatment_type === "package";
                          const dailyCost =
                            isPackage && h.treatment_days > 0
                              ? parseFloat(h.package_cost) /
                                parseInt(h.treatment_days)
                              : parseFloat(h.treatment_cost_per_day);

                          return (
                            <div
                              key={i}
                              className="group p-4 bg-white dark:bg-[#2b2930] border border-[#e2e8f0] dark:border-[#49454f] rounded-[20px] transition-all hover:border-[#16a34a] hover:shadow-md"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h5 className="font-black text-[#16a34a] uppercase text-xs tracking-widest">
                                  Plan #{i + 1}
                                </h5>
                                <span className="text-[10px] font-bold text-[#49454f] dark:text-[#cac4d0]">
                                  {h.start_date} → {h.end_date}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <div>
                                  <span className="text-[10px] text-gray-500 uppercase font-bold block">
                                    Type
                                  </span>
                                  <span className="font-bold text-[#1d1b20] dark:text-[#e6e1e5] capitalize">
                                    {h.treatment_type}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-500 uppercase font-bold block">
                                    Cost/Day
                                  </span>
                                  <span className="font-black text-[#1d1b20] dark:text-[#e6e1e5]">
                                    ₹{dailyCost.toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-500 uppercase font-bold block">
                                    Total
                                  </span>
                                  <span className="font-black text-[#16a34a] dark:text-[#eaddff]">
                                    ₹
                                    {parseFloat(
                                      h.total_amount || 0,
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-gray-500 uppercase font-bold block">
                                    Paid
                                  </span>
                                  <span className="font-black text-[#006e1c] dark:text-[#88d99d]">
                                    ₹
                                    {parseFloat(
                                      h.advance_payment || 0,
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {!data.history?.length && (
                          <div className="text-center py-8 opacity-40">
                            <Info className="mx-auto mb-2" /> No previous
                            records found
                          </div>
                        )}
                      </div>
                    </Section>
                  </div>

                  {/* Right Financial Panel (4 cols) */}
                  <div className="lg:col-span-12 xl:col-span-4">
                    <div className="sticky top-0 space-y-6">
                      {/* Primary M3 Financial Card */}
                      <div className="bg-[#f8fafc] dark:bg-[#0f172a] p-6 rounded-[28px] border border-[#e2e8f0] dark:border-[#334155] shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#f1f5f9] rounded-full -translate-y-16 translate-x-16" />

                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2.5 bg-[#16a34a] rounded-2xl text-white shadow-lg shadow-[#16a34a]/30">
                            <Wallet size={24} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-black text-[#0f172a] dark:text-[#eaddff] text-base uppercase tracking-widest">
                              Financial Summary
                            </h3>
                            <p className="text-[10px] font-bold text-[#64748b] dark:text-[#eaddff]/70 uppercase">
                              Plan: {data.treatment_type}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex flex-col items-center justify-center p-6 bg-white/40 dark:bg-black/20 rounded-[24px] backdrop-blur-sm border border-white/50">
                            <p className="text-[11px] font-black text-[#49454f] dark:text-[#cac4d0] uppercase tracking-[0.2em] mb-1">
                              Effective Balance
                            </p>
                            <p
                              className={`text-4xl font-black tracking-tight ${(data.effective_balance || 0) < 0 ? "text-[#b3261e]" : "text-[#006e1c] dark:text-[#88d99d]"}`}
                            >
                              ₹
                              {parseFloat(
                                String(data.effective_balance || "0"),
                              ).toLocaleString()}
                            </p>
                            {(data.effective_balance || 0) < 0 && (
                              <div className="mt-2 flex items-center gap-1.5 text-[#b3261e] font-black uppercase text-[10px] tracking-widest animate-pulse">
                                <AlertCircle size={14} /> Settlement Required
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <SummaryBox
                              label="Base Plan Cost"
                              value={`₹${parseFloat(String(data.cost_per_day || "0")).toLocaleString()}`}
                              sub="/ DAY"
                            />
                            <SummaryBox
                              label="Total Incoming"
                              value={`₹${data.payments?.reduce((acc: number, p: any) => acc + parseFloat(String(p.amount)), 0).toLocaleString() || "0"}`}
                              isSuccess
                            />
                            <SummaryBox
                              label="Consumed"
                              value={`₹${parseFloat(String(data.total_consumed || "0")).toLocaleString()}`}
                            />
                            <SummaryBox
                              label="Started On"
                              value={
                                data.start_date
                                  ? format(
                                      new Date(data.start_date),
                                      "dd MMM yy",
                                    )
                                  : "-"
                              }
                            />
                            {parseFloat(String(data.due_amount || "0")) > 0 && (
                              <SummaryBox
                                label="Outstanding"
                                value={`₹${parseFloat(String(data.due_amount || "0")).toLocaleString()}`}
                                isError
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Short Quick Stats */}
                      <div className="bg-[#f8fafc] dark:bg-[#1e293b] p-5 rounded-[24px] border border-[#e2e8f0] dark:border-[#334155]">
                        <h5 className="font-black text-[#49454f] dark:text-[#cac4d0] text-[10px] uppercase tracking-widest mb-4">
                          Engagement Stats
                        </h5>
                        <div className="space-y-4">
                          <StatRow label="Visit Frequency" value="Dailly" />
                          <StatRow
                            label="Total Invoices"
                            value={data.payments?.length || 0}
                          />
                          <StatRow
                            label="Recovery Status"
                            value={
                              (
                                ((data.attendance_count || 0) /
                                  (data.treatment_days || 1)) *
                                100
                              ).toFixed(0) + "%"
                            }
                            highlight
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <PayDuesModal
        isOpen={modals.payDues}
        onClose={() => toggleModal("payDues", false)}
        patientId={selectedPatient.patient_id}
        currentDue={parseFloat(String(data.due_amount || "0"))}
        onSuccess={handleRefresh}
      />
      <AddTestModal
        isOpen={modals.addTest}
        onClose={() => toggleModal("addTest", false)}
        patient={data as any}
        onSuccess={handleRefresh}
      />
      <EditPlanModal
        isOpen={modals.editPlan}
        onClose={() => toggleModal("editPlan", false)}
        patient={data as any}
        onSuccess={handleRefresh}
      />
      <ChangePlanModal
        isOpen={modals.changePlan}
        onClose={() => toggleModal("changePlan", false)}
        patient={data as any}
        onSuccess={handleRefresh}
      />
    </AnimatePresence>
  );
};

export default PatientDetailsModal;
