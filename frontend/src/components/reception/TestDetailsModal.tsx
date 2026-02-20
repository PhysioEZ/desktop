import { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Info,
  Users,
  FlaskConical,
  Wallet,
  AlertCircle,
  FileText,
  MapPin,
  Calendar,
  Check,
  Edit,
  TrendingDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL, authFetch } from "../../config";
import { toast } from "sonner";

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
}

interface TestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestRecord | null;
}

const TestDetailsModal = ({ isOpen, onClose, test }: TestDetailsModalProps) => {
  const [fullDetails, setFullDetails] = useState<FullTestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<FullTestDetails>>({});
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {},
  );

  useEffect(() => {
    if (isOpen && test?.uid) {
      fetchDetails();
    } else if (!isOpen) {
      setFullDetails(null);
      setIsEditing(false);
      setExpandedItems({});
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

  const toggleItem = (itemId: number) => {
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleUpdateStatus = async (
    itemId: number | null,
    newStatus: string,
    type: "test" | "payment",
  ) => {
    if (!fullDetails) return;
    const toastId = toast.loading(`Updating ${type} status...`);
    try {
      const body: any = {
        action: "update_item",
        item_id: itemId,
        test_id: fullDetails.test_id,
      };

      if (type === "test") body.test_status = newStatus;
      else body.payment_status = newStatus;

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
        fetchDetails();
      } else {
        toast.error(res.message || "Update failed", { id: toastId });
      }
    } catch (err) {
      toast.error("System error", { id: toastId });
    }
  };

  const handleAddPayment = async (
    itemId: number | null,
    amount: number,
    method: string = "cash",
  ) => {
    if (!fullDetails) return;
    if (amount <= 0 || isNaN(amount))
      return toast.error("Enter a valid amount");

    const toastId = toast.loading("Recording payment...");
    try {
      const response = await authFetch(`${API_BASE_URL}/reception/tests`, {
        method: "POST",
        body: JSON.stringify({
          action: "add_payment",
          test_id: fullDetails.test_id,
          item_id: itemId,
          amount,
          method,
        }),
      });

      const res = await response.json();
      if (res.success) {
        toast.success("Payment recorded", { id: toastId });
        fetchDetails();
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
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Icon size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {label}
            </span>
          </div>
          <input
            type="text"
            className="w-1/2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm font-medium text-slate-900 dark:text-white text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
            value={
              (editedData[fieldKey] as string) ??
              (data[fieldKey] as string) ??
              ""
            }
            onChange={(e) =>
              setEditedData((prev) => ({ ...prev, [fieldKey]: e.target.value }))
            }
          />
        </div>
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
            className="relative w-full sm:w-[95%] md:w-[85%] lg:w-[80%] max-w-7xl h-[100dvh] sm:h-[95vh] sm:mr-4 sm:rounded-3xl bg-slate-50 dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden border border-black/5 dark:border-white/10"
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
                {/* Left Panel: Patient & Financials */}
                <div className="w-full lg:w-1/3 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar shrink-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                  {/* Patient Info Card */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                        <User size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                          Patient Information
                        </h4>
                        <p className="text-xs text-slate-500">
                          Personal details & contact
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {renderInfoItem(
                        User,
                        "Patient Name",
                        data.patient_name,
                        "patient_name",
                      )}
                      {renderInfoItem(Info, "Age", data.age, "age")}
                      {renderInfoItem(User, "Gender", data.gender, "gender")}
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
                  </div>

                  {/* Financial Summary Card */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
                    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Wallet size={20} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                          Financial Summary
                        </h4>
                        <p className="text-xs text-slate-500">
                          Total payable details
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Total Amount
                        </span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">
                          ₹
                          {parseFloat(String(data.total_amount || 0)).toFixed(
                            2,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          Discount
                        </span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">
                          ₹{parseFloat(String(data.discount || 0)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase">
                          Total Paid
                        </span>
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                          ₹
                          {parseFloat(String(data.advance_amount || 0)).toFixed(
                            2,
                          )}
                        </span>
                      </div>
                      <div
                        className={`flex justify-between items-center p-3 rounded-xl border ${parseFloat(String(data.due_amount || 0)) > 0 ? "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/10 dark:border-rose-900/30 dark:text-rose-400" : "bg-slate-50 border-slate-100 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-white"}`}
                      >
                        <span className="text-xs font-bold uppercase">
                          Balance Due
                        </span>
                        <span className="text-sm font-black">
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

                {/* Right Panel: Test Items List */}
                <div className="w-full lg:w-2/3 p-6 flex flex-col gap-4 overflow-y-auto no-scrollbar bg-slate-50 dark:bg-slate-900 border-t lg:border-t-0 border-slate-200 dark:border-slate-800 h-full">
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
                          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-all duration-300"
                        >
                          {/* Accordion Header */}
                          <div
                            onClick={() => toggleItem(item.item_id)}
                            className="p-5 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-transparent dark:border-transparent transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                                <FlaskConical size={18} />
                              </div>
                              <div>
                                <h4 className="text-base font-bold text-slate-900 dark:text-white uppercase">
                                  {item.test_name}
                                </h4>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                  {idx === 0 && data.test_items.length === 1
                                    ? "Original Test Details"
                                    : `Item #${item.item_id}`}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border ${getStatusColor(item.test_status)}`}
                              >
                                {item.test_status}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 transition-transform">
                                {expanded ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
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
                                className="overflow-hidden"
                              >
                                <div className="p-6 border-t border-slate-100 dark:border-slate-700">
                                  {/* Item Metadata */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <FlaskConical
                                          size={14}
                                          className="text-slate-400"
                                        />
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                          Test Name
                                        </span>
                                      </div>
                                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {item.test_name}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <MapPin
                                          size={14}
                                          className="text-slate-400"
                                        />
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                          Limb
                                        </span>
                                      </div>
                                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {item.limb || "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <Calendar
                                          size={14}
                                          className="text-slate-400"
                                        />
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                          Assigned Date
                                        </span>
                                      </div>
                                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {item.assigned_test_date ||
                                          data.assigned_test_date ||
                                          "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <User
                                          size={14}
                                          className="text-slate-400"
                                        />
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                          Performed By
                                        </span>
                                      </div>
                                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {item.test_done_by ||
                                          data.test_done_by ||
                                          "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <Users
                                          size={14}
                                          className="text-slate-400"
                                        />
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                          Referred By
                                        </span>
                                      </div>
                                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {item.referred_by ||
                                          data.referred_by ||
                                          "N/A"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Item Financials */}
                                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 mb-6 border border-slate-100 dark:border-slate-700">
                                    <h5 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-4">
                                      <FileText
                                        size={16}
                                        className="text-teal-500"
                                      />{" "}
                                      Financial Details
                                    </h5>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                          Total
                                        </p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                          ₹
                                          {parseFloat(
                                            String(item.total_amount || 0),
                                          ).toFixed(2)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                          Discount
                                        </p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                          ₹
                                          {parseFloat(
                                            String(item.discount || 0),
                                          ).toFixed(2)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                          Paid
                                        </p>
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                          ₹
                                          {parseFloat(
                                            String(item.advance_amount || 0),
                                          ).toFixed(2)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                          Due
                                        </p>
                                        <p
                                          className={`text-sm font-bold ${item.due_amount > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}
                                        >
                                          ₹
                                          {Math.max(
                                            0,
                                            parseFloat(
                                              String(item.due_amount || 0),
                                            ),
                                          ).toFixed(2)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                          Method
                                        </p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                                          {item.payment_method || "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Controls (Status / Payment) */}
                                  <div className="pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Status Controls */}
                                    <div className="space-y-4">
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                          Test Status
                                        </label>
                                        <select
                                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-teal-500 outline-none"
                                          value={item.test_status}
                                          onChange={(e) =>
                                            handleUpdateStatus(
                                              item.item_id,
                                              e.target.value,
                                              "test",
                                            )
                                          }
                                        >
                                          <option value="pending">
                                            Pending
                                          </option>
                                          <option value="completed">
                                            Completed
                                          </option>
                                          <option value="cancelled">
                                            Cancelled
                                          </option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                          Payment Status
                                        </label>
                                        <select
                                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-teal-500 outline-none"
                                          value={item.payment_status}
                                          onChange={(e) =>
                                            handleUpdateStatus(
                                              item.item_id,
                                              e.target.value,
                                              "payment",
                                            )
                                          }
                                        >
                                          <option value="pending">
                                            Pending
                                          </option>
                                          <option value="partial">
                                            Partial
                                          </option>
                                          <option value="paid">Paid</option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* Add Payment Control */}
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                        Add Payment
                                      </label>
                                      <div className="flex gap-2">
                                        <div className="relative flex-1">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                                            ₹
                                          </span>
                                          <input
                                            type="number"
                                            id={`pay-input-${item.item_id}`}
                                            min="0"
                                            step="0.01"
                                            placeholder="Amount"
                                            className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-teal-500 outline-none"
                                          />
                                        </div>
                                        <select
                                          id={`pay-method-${item.item_id}`}
                                          className="w-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-teal-500 outline-none"
                                        >
                                          <option value="cash">Cash</option>
                                          <option value="online">Online</option>
                                          <option value="card">Card</option>
                                        </select>
                                        <button
                                          onClick={() => {
                                            const val = parseFloat(
                                              (
                                                document.getElementById(
                                                  `pay-input-${item.item_id}`,
                                                ) as HTMLInputElement
                                              )?.value,
                                            );
                                            const meth =
                                              (
                                                document.getElementById(
                                                  `pay-method-${item.item_id}`,
                                                ) as HTMLSelectElement
                                              )?.value || "cash";
                                            if (!isNaN(val) && val > 0)
                                              handleAddPayment(
                                                item.item_id,
                                                val,
                                                meth,
                                              );
                                          }}
                                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition"
                                        >
                                          Add
                                        </button>
                                      </div>
                                      <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                                        <Info size={10} /> Updates 'Paid' and
                                        'Due' amounts instantly.
                                      </p>
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
                    <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                      <FlaskConical
                        size={24}
                        className="mx-auto mb-2 opacity-50"
                      />
                      <p className="text-sm font-semibold uppercase tracking-widest">
                        No detailed items found
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TestDetailsModal;
