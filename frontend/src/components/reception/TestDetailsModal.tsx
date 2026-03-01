import { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Users,
  FlaskConical,
  Wallet,
  MapPin,
  Calendar,
  Check,
  Edit,
  ChevronDown,
  ChevronUp,
  Activity,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL, authFetch } from "../../config";
import { toast } from "sonner";
import { useConfigStore } from "../../store";
import SplitPaymentInput from "./SplitPaymentInput";
import DatePicker from "../ui/DatePicker";
import { useSmartRefresh } from "../../hooks/useSmartRefresh";

interface TestRecord {
  uid: string;
  patient_name: string;
  test_name: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  test_status: string;
  test_uid: string;
}

interface TestItem {
  item_id: number;
  test_id: number;
  test_name: string;
  test_status: string;
  payment_status: string;
  total_amount: number;
  advance_amount: number;
  discount: number;
  due_amount: number;
  limb?: string | null;
  referred_by?: string | null;
  test_done_by?: string | null;
  assigned_test_date?: string | null;
  payment_method?: string | null;
}

interface FullTestDetails {
  test_id: number;
  test_uid: string;
  visit_date: string;
  assigned_test_date: string;
  patient_name: string;
  phone_number: string;
  alternate_phone_no?: string | null;
  gender: string;
  age: string;
  dob?: string | null;
  parents?: string | null;
  relation?: string | null;
  address?: string | null;
  limb?: string | null;
  test_name: string;
  referred_by?: string | null;
  test_done_by?: string | null;
  total_amount: number;
  advance_amount: number;
  discount: number;
  due_amount: number;
  payment_method: string;
  payment_status: string;
  test_status: string;
  test_items: TestItem[];
  test_payments?: {
    payment_id: number;
    amount: number;
    payment_method: string;
    created_at: string;
  }[];
}

interface TestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestRecord | null;
  onTestUpdate?: () => Promise<void>;
}

const TestDetailsModal = ({ isOpen, onClose, test, onTestUpdate }: TestDetailsModalProps) => {
  const [fullDetails, setFullDetails] = useState<FullTestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<FullTestDetails>>({});
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {},
  );
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const { smartRefresh } = useSmartRefresh();

  const { paymentMethods, fetchPaymentMethods } = useConfigStore();
  const [pendingPayments, setPendingPayments] = useState<
    Record<number, { method: string; amount: number }[]>
  >({});

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
      if (test?.uid) {
        fetchDetails();
      }
    } else {
      setFullDetails(null);
      setIsEditing(false);
      setExpandedItems({});
      setPendingPayments({});
      setShowMoreInfo(false);
      setShowDatePicker(false);
    }
  }, [isOpen, test]);

  // Expand first item on load
  useEffect(() => {
    if (fullDetails?.test_items?.length) {
      setExpandedItems((prev) => ({
        ...prev,
        [fullDetails.test_items[0].item_id]: true,
      }));
    }
  }, [fullDetails]);

  const fetchDetails = async () => {
    if (!test?.uid) return;
    setIsLoading(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/reception/tests?action=fetch_details&test_id=${test.uid}`,
        {
          method: "POST",
          body: JSON.stringify({ action: "fetch_details", test_id: test.uid }),
        },
      );
      const res = await response.json();
      if (res.success) {
        setFullDetails(res.data);
      } else {
        toast.error(res.message || "Failed to fetch details");
      }
    } catch (err) {
      toast.error("An error occurred while fetching details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshCooldown > 0) return;
    smartRefresh("test", {
      onSuccess: async () => {
        await fetchDetails();
        setRefreshCooldown(20);
      },
    });
  };

  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(() => setRefreshCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  const toggleItem = (itemId: number) => {
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleUpdateStatus = async (
    itemId: number | null,
    newStatus: string,
    type: "test" | "payment",
  ) => {
    if (!fullDetails || !fullDetails.test_id) {
      toast.error("Test ID not found");
      return;
    }
    const toastId = toast.loading(`Updating ${type} status...`);
    try {
      const body: any = {
        action: "update_item",
        item_id: itemId || fullDetails.test_id,
        test_id: fullDetails.test_id,
      };

      if (type === "test") body.test_status = newStatus;
      else body.payment_status = newStatus;

      // Optimistic UI update
      setFullDetails((prev) =>
        prev
          ? {
              ...prev,
              [type === "test" ? "test_status" : "payment_status"]: newStatus,
              test_items: prev.test_items.map((item) =>
                item.item_id === (itemId || prev.test_id)
                  ? {
                      ...item,
                      [type === "test" ? "test_status" : "payment_status"]:
                        newStatus,
                    }
                  : item,
              ),
            }
          : null,
      );

      const response = await authFetch(`${API_BASE_URL}/reception/tests`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      const res = await response.json();
      if (res.success) {
        toast.success(
          `${type === "test" ? "Test Status" : "Payment Status"} updated`,
          { id: toastId },
        );
        // Refetch to ensure consistency
        await fetchDetails();
        // Notify parent to refresh tests list
        if (onTestUpdate) {
          await onTestUpdate();
        }
      } else {
        toast.error(res.message || "Update failed", { id: toastId });
        // Revert optimistic update on failure
        await fetchDetails();
      }
    } catch (err) {
      toast.error("System error", { id: toastId });
      // Revert optimistic update on error
      await fetchDetails();
    }
  };

  const handleAddPayment = async (
    itemId: number | null,
    amount?: number,
    method: string = "cash",
    payments?: { method: string; amount: number }[],
  ) => {
    if (!fullDetails || !fullDetails.test_id) {
      toast.error("Test ID not found");
      return;
    }

    const toastId = toast.loading("Recording payment...");
    try {
      const response = await authFetch(`${API_BASE_URL}/reception/tests`, {
        method: "POST",
        body: JSON.stringify({
          action: "add_payment",
          test_id: fullDetails.test_id,
          item_id: itemId || fullDetails.test_id,
          amount,
          method,
          payments,
        }),
      });

      const res = await response.json();
      if (res.success) {
        toast.success("Payment recorded", { id: toastId });
        // Update payment status optimistically
        const newPaymentStatus = amount === fullDetails.due_amount ? "paid" : "partial";
        setFullDetails((prev) =>
          prev
            ? {
                ...prev,
                payment_status: newPaymentStatus,
                due_amount:
                  (prev.due_amount || 0) - (amount || 0) <= 0 ? 0 : (prev.due_amount || 0) - (amount || 0),
              }
            : null,
        );
        // Refetch to ensure consistency
        await fetchDetails();
        // Notify parent to refresh tests list
        if (onTestUpdate) {
          await onTestUpdate();
        }
      } else {
        toast.error(res.message || "Payment failed", { id: toastId });
      }
    } catch (err) {
      toast.error("System error", { id: toastId });
    }
  };

  const handleSaveMetadata = async () => {
    if (!fullDetails) return;
    setIsSaving(true);
    const toastId = toast.loading("Saving changes...");
    try {
      const response = await authFetch(`${API_BASE_URL}/reception/tests`, {
        method: "POST",
        body: JSON.stringify({
          action: "update_metadata",
          test_id: fullDetails.test_id,
          ...editedData,
        }),
      });

      const res = await response.json();
      if (res.success) {
        toast.success("Changes saved", { id: toastId });
        setIsEditing(false);
        setEditedData({});
        fetchDetails();
      } else {
        toast.error(res.message || "Save failed", { id: toastId });
      }
    } catch (err) {
      toast.error("System error", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (!test) return null;
  const data = fullDetails || ({} as Partial<FullTestDetails>);

  const getStatusColor = (status: string) => {
    if (status === "pending" || status === "Pending")
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    if (
      status === "completed" ||
      status === "Completed" ||
      status === "paid" ||
      status === "Paid"
    )
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
    if (
      status === "cancelled" ||
      status === "Cancelled" ||
      status === "unpaid" ||
      status === "Unpaid"
    )
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800";
    return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  };

  const renderInfoItem = (
    icon: any,
    label: string,
    value: string | undefined | null,
    fieldKey: keyof FullTestDetails,
  ) => {
    const Icon = icon;
    if (isEditing) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1.5 mb-3.5 last:mb-0"
        >
          {/* Top Label */}
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 pl-1">
            {label}
          </label>

          <div className="relative group">
            {/* Icon Overlay */}
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
              <Icon
                size={16}
                className="text-slate-300 group-focus-within:text-teal-500 transition-colors"
              />
            </div>

            {fieldKey === "dob" ? (
              <div
                onClick={() => setShowDatePicker(true)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-slate-700 dark:text-white cursor-pointer hover:bg-white dark:hover:bg-slate-800 hover:border-teal-400 transition-all flex items-center justify-between"
              >
                <span>
                  {(editedData[fieldKey] as string) ??
                    (data[fieldKey] as string) ??
                    "Select Date"}
                </span>
                <Calendar
                  size={14}
                  className="text-teal-500 opacity-40 group-hover:opacity-100 transition-opacity"
                />
              </div>
            ) : (
              <input
                type="text"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-10 py-3 text-sm font-semibold text-slate-700 dark:text-white placeholder-slate-300 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/5 transition-all"
                placeholder={`Enter ${label.toLowerCase()}...`}
                value={
                  (editedData[fieldKey] as string) ??
                  (data[fieldKey] as string) ??
                  ""
                }
                onChange={(e) =>
                  setEditedData((prev) => ({
                    ...prev,
                    [fieldKey]: e.target.value,
                  }))
                }
              />
            )}
          </div>
        </motion.div>
      );
    }

    return (
      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 group">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-teal-600 transition-colors">
            {label}
          </span>
        </div>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {value || "N/A"}
        </span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-end overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0, transition: { duration: 0.3 } }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full sm:w-[98%] max-w-[1600px] h-[100dvh] sm:h-[95vh] sm:mr-1 sm:rounded-3xl bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden border border-black/5 dark:border-white/10"
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shrink-0">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    {data.patient_name || test.patient_name || "Unknown"}
                  </h2>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${getStatusColor(test.test_status)}`}
                  >
                    {test.test_status}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                  ID: {test.test_uid} • {test.test_name}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedData({});
                      }}
                      className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold transition flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={handleSaveMetadata}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-lg bg-teal-600 text-white shadow-md text-xs font-bold hover:bg-teal-700 transition flex items-center gap-2"
                    >
                      <Check size={14} /> {isSaving ? "Saving..." : "Save"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 text-xs font-bold transition flex items-center gap-2 hover:bg-teal-100 dark:hover:bg-teal-900/50"
                  >
                    <Edit size={14} /> Edit
                  </button>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={isLoading || refreshCooldown > 0}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all relative group ${refreshCooldown > 0 ? "bg-slate-50 dark:bg-slate-800 text-slate-400" : "bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50"}`}
                  title={
                    refreshCooldown > 0
                      ? `Wait ${refreshCooldown}s`
                      : "Refresh Data"
                  }
                >
                  <RefreshCw
                    size={16}
                    className={
                      isLoading
                        ? "animate-spin"
                        : "group-hover:rotate-180 transition-transform duration-500"
                    }
                  />
                  {refreshCooldown > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                      {refreshCooldown}
                    </div>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Split Content */}
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center min-h-0">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                {/* Left Panel: Patient & Financials & Transactions */}
                <div className="w-full lg:w-[450px] p-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900/30 border-r border-slate-200 dark:border-white/5 h-full relative">
                  {/* Patient Info Card */}
                  <div className="bg-white dark:bg-slate-800/80 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-white/5 relative">
                    {/* Abstract bg element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                    <div
                      className="flex items-start gap-4 mb-6 relative z-10 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        !isEditing && setShowMoreInfo(!showMoreInfo)
                      }
                    >
                      <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xl font-black shadow-inner">
                        {data.patient_name ? (
                          data.patient_name.charAt(0).toUpperCase()
                        ) : (
                          <User size={24} />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight mb-1 flex items-center gap-2">
                          {data.patient_name || "Unknown Patient"}
                          {!isEditing && (
                            <motion.div
                              animate={{ rotate: showMoreInfo ? 180 : 0 }}
                              className="text-slate-400"
                            >
                              <ChevronDown size={14} />
                            </motion.div>
                          )}
                        </h4>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          <span>{data.gender || "N/A"}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                          <span>{data.age ? `${data.age} YRS` : "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 relative z-10 w-full">
                      {isEditing ? (
                        <div className="space-y-4 pb-4">
                          {renderInfoItem(
                            Phone,
                            "Phone Number",
                            data.phone_number,
                            "phone_number",
                          )}
                          {renderInfoItem(
                            Phone,
                            "Alt Phone",
                            data.alternate_phone_no,
                            "alternate_phone_no",
                          )}
                          {renderInfoItem(
                            MapPin,
                            "Address",
                            data.address,
                            "address",
                          )}
                          {renderInfoItem(
                            Calendar,
                            "Date of Birth",
                            data.dob,
                            "dob",
                          )}
                          {renderInfoItem(
                            Users,
                            "Parent/Guardian",
                            data.parents,
                            "parents",
                          )}
                          {renderInfoItem(
                            Users,
                            "Relation",
                            data.relation,
                            "relation",
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-white/5 space-y-3">
                            <div className="flex items-start gap-3">
                              <Phone
                                size={14}
                                className="text-slate-400 mt-0.5"
                              />
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                  Contact
                                </p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {data.phone_number || "N/A"}
                                </p>
                                {data.alternate_phone_no && (
                                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                                    {data.alternate_phone_no} (Alt)
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-start gap-3 pt-3 border-t border-slate-200 dark:border-white/5">
                              <MapPin
                                size={14}
                                className="text-slate-400 mt-0.5"
                              />
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                  Address
                                </p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                                  {data.address || "N/A"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {!showMoreInfo ? (
                            <button
                              onClick={() => setShowMoreInfo(true)}
                              className="w-full mt-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-white/5 focus:outline-none"
                            >
                              View More Details
                            </button>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="space-y-3 mt-1"
                            >
                              <div className="grid grid-cols-2 gap-3 mt-1">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Phone size={10} /> Alt Phone
                                  </p>
                                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                    {data.alternate_phone_no || "N/A"}
                                  </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Calendar size={10} /> DOB
                                  </p>
                                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                    {data.dob || "N/A"}
                                  </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Users size={10} /> Guardian
                                  </p>
                                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                    {data.parents || "N/A"}
                                  </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Users size={10} /> Relation
                                  </p>
                                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                    {data.relation || "N/A"}
                                  </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <User size={10} /> Referred By
                                  </p>
                                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                    {data.referred_by || "N/A"}
                                  </p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <Calendar size={10} /> Added On
                                  </p>
                                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                    {data.visit_date || "N/A"}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowMoreInfo(false)}
                                className="w-full mt-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-white/5 focus:outline-none flex items-center justify-center gap-1.5"
                              >
                                <ChevronUp size={12} /> View Less
                              </button>
                            </motion.div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financial Summary Card */}
                  <div
                    className={`rounded-[24px] p-5 shadow-lg border relative ${
                      parseFloat(String(data.due_amount || 0)) > 0
                        ? "bg-gradient-to-br from-rose-500/5 to-orange-500/5 border-rose-500/20 dark:from-rose-500/5 dark:to-orange-500/10 dark:border-rose-500/10"
                        : "bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20 dark:from-emerald-500/10 dark:to-teal-500/5 dark:border-emerald-500/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            parseFloat(String(data.due_amount || 0)) > 0
                              ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          <Wallet size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest">
                            Financial Summary
                          </h4>
                        </div>
                      </div>

                      <div
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          parseFloat(String(data.due_amount || 0)) > 0
                            ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/20"
                            : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/20"
                        }`}
                      >
                        {parseFloat(String(data.due_amount || 0)) > 0
                          ? "Pending Dues"
                          : "All Clear"}
                      </div>
                    </div>

                    <div className="space-y-4 relative z-10 w-full">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Total Bill
                          </span>
                          <div className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                            ₹
                            {parseFloat(String(data.total_amount || 0)).toFixed(
                              2,
                            )}
                          </div>
                        </div>

                        {parseFloat(String(data.discount || 0)) > 0 && (
                          <div className="text-right space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              Discount
                            </span>
                            <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
                              -₹
                              {parseFloat(String(data.discount || 0)).toFixed(
                                2,
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-4">
                        {/* Progress bar logic */}
                        <div>
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5">
                            <span className="text-emerald-600 dark:text-emerald-500">
                              Paid: ₹
                              {parseFloat(
                                String(data.total_paid || data.advance_amount || 0),
                              ).toFixed(2)}
                            </span>
                            <span className="text-slate-500">
                              {Number(data.total_amount) > 0 && (Number(data.total_amount) - Number(data.discount || 0)) > 0
                                ? (
                                    (parseFloat(
                                      String(data.total_paid || data.advance_amount || 0),
                                    ) /
                                      (parseFloat(String(data.total_amount || 1)) - parseFloat(String(data.discount || 0)))) *
                                    100
                                  ).toFixed(0)
                                : 0}
                              %
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Number(data.total_amount) > 0 && (Number(data.total_amount) - Number(data.discount || 0)) > 0 ? Math.min(100, (parseFloat(String(data.total_paid || data.advance_amount || 0)) / (parseFloat(String(data.total_amount || 1)) - parseFloat(String(data.discount || 0)))) * 100) : 0}%`,
                              }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </div>

                        <div
                          className={`p-4 rounded-xl flex items-center justify-between border ${
                            parseFloat(String(data.due_amount || 0)) > 0
                              ? "bg-white dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30"
                              : "bg-white dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
                          }`}
                        >
                          <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                            Balance Due
                          </span>
                          <span
                            className={`text-xl font-black tracking-tight ${
                              parseFloat(String(data.due_amount || 0)) > 0
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            ₹
                            {Math.max(
                              0,
                              parseFloat(String(data.due_amount || 0)),
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction History Section */}
                  <div className="bg-white dark:bg-slate-800/80 rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col gap-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={16} className="text-teal-500" />
                      <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                        Payment Transactions
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {data.test_payments && data.test_payments.length > 0 ? (
                        data.test_payments.map((p, idx) => (
                          <div
                            key={p.payment_id || idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 hover:border-teal-500/30 transition-colors"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-black text-slate-900 dark:text-white">
                                ₹{parseFloat(String(p.amount)).toFixed(2)}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {p.payment_method} •{" "}
                                {new Date(p.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                              <Check size={14} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 flex flex-col items-center justify-center opacity-30">
                          <Wallet size={32} strokeWidth={1} className="mb-2" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">
                            No transactions yet
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Test Items List */}
                <div className="w-full lg:flex-1 p-6 flex flex-col gap-4 overflow-y-auto bg-slate-50 dark:bg-slate-900 border-t lg:border-t-0 border-slate-200 dark:border-white/5 min-h-0 auto-rows-max">
                  <div className="flex items-center gap-2 mb-2">
                    <FlaskConical size={18} className="text-slate-400" />
                    <h3 className="text-sm font-black uppercase text-slate-700 dark:text-slate-300">
                      Recorded Test Items
                    </h3>
                  </div>

                  {data.test_items && data.test_items.length > 0 ? (
                    data.test_items.map((item, idx) => {
                      const expanded = expandedItems[item.item_id];
                      return (
                        <div
                          key={item.item_id}
                          className={`bg-white dark:bg-slate-800/80 rounded-[24px] shadow-sm border overflow-hidden transition-all duration-300 shrink-0 ${expanded ? "border-teal-500/30 dark:border-teal-500/30" : "border-slate-100 dark:border-white/5"}`}
                        >
                          {/* Accordion Header */}
                          <div
                            onClick={() => toggleItem(item.item_id)}
                            className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer relative group"
                          >
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-1 ${item.test_status.toLowerCase() === "completed" ? "bg-emerald-500" : item.test_status.toLowerCase() === "pending" ? "bg-amber-500" : "bg-slate-500"}`}
                            />
                            <div className="flex items-center gap-4 pl-2">
                              <div
                                className={`w-12 h-12 flex items-center justify-center rounded-2xl ${expanded ? "bg-teal-500 text-white shadow-md shadow-teal-500/20" : "bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 group-hover:bg-teal-50 dark:group-hover:bg-teal-500/10"} transition-all`}
                              >
                                <FlaskConical size={20} />
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                  {item.test_name}
                                </h4>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  {idx === 0 && data?.test_items?.length === 1
                                    ? "Original Details"
                                    : `Item #${item.item_id}`}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusColor(item.test_status)}`}
                              >
                                {item.test_status}
                              </span>
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${expanded ? "bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rotate-180" : "bg-slate-50 dark:bg-slate-900/50 text-slate-400"}`}
                              >
                                <ChevronDown size={18} />
                              </div>
                            </div>
                          </div>

                          {/* Accordion Body */}
                          <AnimatePresence>
                            {expanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-slate-50/50 dark:bg-slate-900/20"
                              >
                                <div className="p-6 border-t border-slate-100 dark:border-white/5">
                                  {/* Item Metadata Grid */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <MapPin size={12} /> Limb
                                      </p>
                                      <p className="text-sm font-black text-slate-800 dark:text-white truncate">
                                        {item.limb || "N/A"}
                                      </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <Calendar size={12} /> Date
                                      </p>
                                      <p className="text-sm font-black text-slate-800 dark:text-white truncate">
                                        {item.assigned_test_date ||
                                          data.assigned_test_date ||
                                          "N/A"}
                                      </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <User size={12} /> Performed By
                                      </p>
                                      <p className="text-sm font-black text-slate-800 dark:text-white truncate">
                                        {item.test_done_by ||
                                          data.test_done_by ||
                                          "N/A"}
                                      </p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <Users size={12} /> Referred By
                                      </p>
                                      <p className="text-sm font-black text-slate-800 dark:text-white truncate">
                                        {item.referred_by ||
                                          data.referred_by ||
                                          "N/A"}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Controls (Status / Payment) */}
                                  <div className="pt-6 border-t border-slate-200 dark:border-white/5 space-y-6">
                                    {/* Status Controls */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                          <FlaskConical size={12} /> Test Status
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                          {[
                                            "pending",
                                            "completed",
                                            "cancelled",
                                          ].map((status) => (
                                            <button
                                              key={status}
                                              onClick={() =>
                                                handleUpdateStatus(
                                                  item.item_id,
                                                  status,
                                                  "test",
                                                )
                                              }
                                              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                                item.test_status.toLowerCase() ===
                                                status
                                                  ? status === "completed"
                                                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                                    : status === "pending"
                                                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                                                      : "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                                                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/20"
                                              }`}
                                            >
                                              {status}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                          <Wallet size={12} /> Payment Status
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                          {["pending", "partial", "paid"].map(
                                            (status) => (
                                              <button
                                                key={status}
                                                onClick={() =>
                                                  handleUpdateStatus(
                                                    item.item_id,
                                                    status,
                                                    "payment",
                                                  )
                                                }
                                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                                                  item.payment_status.toLowerCase() ===
                                                  status
                                                    ? status === "paid"
                                                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                                      : status === "partial"
                                                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                                                        : "bg-slate-500 text-white shadow-md shadow-slate-500/20"
                                                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/20"
                                                }`}
                                              >
                                                {status}
                                              </button>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Add Payment Control — Split Payment */}
                                    <div className="w-full mt-4 space-y-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                                        <Wallet size={12} /> Record Payment
                                      </h5>
                                      <SplitPaymentInput
                                        paymentMethods={paymentMethods || []}
                                        totalDue={data.due_amount || 0}
                                        onPaymentChange={(payments) =>
                                          setPendingPayments((prev) => ({
                                            ...prev,
                                            [item.item_id]: payments,
                                          }))
                                        }
                                        isDark={document.documentElement.classList.contains('dark')}
                                      />

                                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest max-w-[150px]">
                                          Supports split billing.
                                        </p>
                                        <button
                                          onClick={() => {
                                            const payments =
                                              pendingPayments[item.item_id] ||
                                              [];
                                            const validPayments =
                                              payments.filter(
                                                (p) => p.amount > 0,
                                              );
                                            if (validPayments.length > 0) {
                                              handleAddPayment(
                                                item.item_id,
                                                undefined,
                                                undefined,
                                                validPayments,
                                              );
                                            } else {
                                              toast.error(
                                                "Please select a payment method and enter an amount",
                                              );
                                            }
                                          }}
                                          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg shadow-teal-500/20 active:scale-95"
                                        >
                                          Confirm
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-10 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-white/10 rounded-[24px]">
                      <FlaskConical
                        size={32}
                        className="mx-auto mb-3 opacity-30"
                      />
                      <p className="text-xs font-black uppercase tracking-widest">
                        No detailed items found
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer with Close Button */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 mt-auto">
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <X size={16} />
                Close
              </button>
            </div>

            {/* Date Picker Overlay */}
            <AnimatePresence>
              {showDatePicker && (
                <DatePicker
                  value={editedData.dob || data.dob || ""}
                  onChange={(date) =>
                    setEditedData((prev) => ({ ...prev, dob: date }))
                  }
                  onClose={() => setShowDatePicker(false)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TestDetailsModal;
