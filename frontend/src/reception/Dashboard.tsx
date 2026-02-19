import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { API_BASE_URL, authFetch } from "../config";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import ActionFAB from "../components/ActionFAB";
import {
  Users,
  ClipboardList,
  TestTube2,
  Wallet,
  Calendar,
  Clock,
  ArrowUpRight,
  AlertCircle,
  Camera,
  Loader2,
  X,
  RefreshCw,
  Check,
  Search,
  Bell,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Hourglass,
  Phone,
  LayoutGrid,
  Banknote,
  Info,
  StickyNote,
  UserPlus,
  FlaskConical,
  PhoneCall,
  Beaker,
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import CustomSelect from "../components/ui/CustomSelect";
import DatePicker from "../components/ui/DatePicker";
import ChatModal from "../components/Chat/ChatModal";
import KeyboardShortcuts, {
  type ShortcutItem,
} from "../components/KeyboardShortcuts";
import LogoutConfirmation from "../components/LogoutConfirmation";
import DailyIntelligence from "../components/DailyIntelligence";
import { useUIStore } from "../store/useUIStore";
import { useDashboardStore } from "../store";
import Sidebar from "../components/Sidebar";
import NotesDrawer from "../components/NotesDrawer";

type ModalType =
  | "registration"
  | "test"
  | "inquiry"
  | "test_inquiry"
  | "approvals"
  | null;

const TimePicker = ({
  value,
  onChange,
  onClose,
  slots,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  slots: any[];
}) => {
  const [selected, setSelected] = useState(value || "");

  const confirm = () => {
    onChange(selected);
    onClose();
  };

  const selectedLabel =
    slots?.find((s: any) => s.time === selected)?.label || "--:--";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10005] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#ece6f0] dark:bg-[#2b2930] w-[340px] rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="bg-[#ece6f0] dark:bg-[#2b2930] px-6 pt-6 pb-4 border-b border-[#79747e]/10 pt-8 shrink-0">
          <p className="text-[#49454f] dark:text-[#cac4d0] text-xs font-medium uppercase tracking-wide mb-1">
            Select time
          </p>
          <div className="flex justify-center items-center bg-[#eaddff] dark:bg-[#4f378b] rounded-xl py-4 px-8 w-fit mx-auto mb-2">
            <span className="text-5xl font-normal text-[#21005d] dark:text-[#eaddff] tracking-tight">
              {selectedLabel.replace(/ (AM|PM)/, "")}
            </span>
            <div className="flex flex-col ml-3 gap-1">
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${selectedLabel.includes("AM") ? "bg-[#21005d] text-[#eaddff]" : "text-[#21005d] border border-[#21005d]/20"}`}
              >
                AM
              </span>
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${selectedLabel.includes("PM") ? "bg-[#21005d] text-[#eaddff]" : "text-[#21005d] border border-[#21005d]/20"}`}
              >
                PM
              </span>
            </div>
          </div>
        </div>

        {/* Body (Grid) */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-3 gap-2">
            {slots?.map((slot: any) => (
              <button
                key={slot.time}
                disabled={slot.disabled}
                onClick={() => setSelected(slot.time)}
                className={`py-2 px-1 text-sm rounded-lg border transition-all ${
                  selected === slot.time
                    ? "bg-[#6750a4] dark:bg-[#d0bcff] text-white dark:text-[#381e72] border-[#6750a4] dark:border-[#d0bcff]"
                    : slot.disabled
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                      : "bg-transparent border-[#79747e] text-[#49454f] dark:text-[#cac4d0] hover:bg-[#6750a4]/10"
                }`}
              >
                <span
                  className={slot.disabled ? "line-through decoration-2" : ""}
                >
                  {slot.label.split(" ")[0]}{" "}
                  <span className="text-[10px]">
                    {slot.label.split(" ")[1]}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {(!slots || slots.length === 0) && (
            <p className="text-center text-slate-400 py-8">
              No slots available for this date.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 pt-2 shrink-0 bg-[#ece6f0] dark:bg-[#2b2930]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full transition-colors"
          >
            OK
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    data,
    setData,
    formOptions,
    setFormOptions,
    lastSync,
    setLastSync,
    lastAccessTime,
    pendingApprovals,
    setPendingApprovals,
    timeSlots: storeTimeSlots,
    setTimeSlots,
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    showGlobalSearch,
    setShowGlobalSearch,
  } = useDashboardStore();

  const { hasDashboardAnimated, setHasDashboardAnimated } = useUIStore();

  const [isLoading, setIsLoading] = useState(!data);
  // ... other state ...
  const notifList = notifications || [];
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [showNotes, setShowNotes] = useState(false);

  // Handle navigation state to open modals
  useEffect(() => {
    const state = location.state as { openModal: ModalType };
    if (state?.openModal) {
      setActiveModal(state.openModal);
      // Clear state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Mark animation as complete on mount
  useEffect(() => {
    if (!hasDashboardAnimated) {
      setHasDashboardAnimated(true);
    }
  }, []);

  // Animation Variants

  const leftPanelEntrance = {
    hidden: { x: -100, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1,
      },
    },
  } as any;

  const mainContentEntrance = {
    hidden: { y: 100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.2,
        staggerChildren: 0.1,
      },
    },
  } as any;

  // Combined Entrance + Hover for Cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 50, damping: 20 },
    },
    hover: {
      scale: 1.02,
      y: -5,
      boxShadow:
        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 300, damping: 25 },
    },
    tap: { scale: 0.98 },
  } as any;

  // Header Logic (Search, Notifications, Profile)

  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Form logic
  const formRef = useRef<HTMLFormElement>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showRegPayment, setShowRegPayment] = useState(false);
  const [showTestPayment, setShowTestPayment] = useState(false);

  // Test form Logic
  const [selectedTests, setSelectedTests] = useState<
    Record<string, { checked: boolean; amount: string }>
  >({});
  const [otherTestName, setOtherTestName] = useState("");

  const [totalAmount, setTotalAmount] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [dueAmount, setDueAmount] = useState("");

  // Split Payment States
  const [regPaymentSplits, setRegPaymentSplits] = useState<{
    [key: string]: number;
  }>({});
  const [testPaymentSplits, setTestPaymentSplits] = useState<{
    [key: string]: number;
  }>({});

  // Registration form
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<
    | "registration"
    | "test_visit"
    | "test_assigned"
    | "inquiry"
    | "test_inquiry"
    | null
  >(null);
  const [testVisitDate, setTestVisitDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [testAssignedDate, setTestAssignedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [appointmentTime, setAppointmentTime] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Inquiry Dates
  const [inquiryDate, setInquiryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [testInquiryDate, setTestInquiryDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Dropdown States (Controlled)
  const [regGender, setRegGender] = useState("");
  const [regSource, setRegSource] = useState("");
  const [regConsultType, setRegConsultType] = useState("");

  const [testGender, setTestGender] = useState("");
  const [testLimb, setTestLimb] = useState("");
  const [testDoneBy, setTestDoneBy] = useState("");

  const [inqGender, setInqGender] = useState("");
  const [inqService, setInqService] = useState("");
  const [inqSource, setInqSource] = useState("");
  const [inqCommType, setInqCommType] = useState("");
  const [inqComplaint, setInqComplaint] = useState("");

  const [tiTestName, setTiTestName] = useState("");
  const [regComplaint, setRegComplaint] = useState("");

  // Approval Logic
  const [showApprovals, setShowApprovals] = useState(false);
  const pendingList = pendingApprovals || [];
  const currentSlots = storeTimeSlots?.slots || [];

  const fetchApprovals = useCallback(async () => {
    if (!user?.branch_id) return;
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/get_pending_approvals?branch_id=${user.branch_id}`,
      );
      const data = await res.json();
      if (data.success) {
        setPendingApprovals(data.data || []);
      }
    } catch (e) {
      console.error("Error fetching approvals", e);
    }
  }, [user?.branch_id]);

  // Theme Logic from store
  const { isDark, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // --- GRANULAR FETCHERS ---

  const fetchMainDashboard = useCallback(async () => {
    if (!user?.branch_id) return;
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/dashboard?branch_id=${user.branch_id}`,
      );
      const data = await res.json();
      if (data.status === "success") {
        setData(data.data);
        if (data.data.serverTime) setLastSync(data.data.serverTime);
      }
    } catch (e) {
      console.error("Error fetching dashboard stats:", e);
    }
  }, [user?.branch_id, setData, setLastSync]);

  const fetchFormOptionsData = useCallback(async () => {
    if (!user?.branch_id) return;
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/form_options?branch_id=${user.branch_id}&appointment_date=${appointmentDate}&service_type=physio`,
      );
      const data = await res.json();
      if (data.status === "success") {
        setFormOptions(data.data);
        if (Object.keys(selectedTests).length === 0) {
          const initialTests: Record<
            string,
            { checked: boolean; amount: string }
          > = {};
          data.data.testTypes?.forEach(
            (t: { test_code: string; default_cost: string | number }) => {
              const cost = parseFloat(String(t.default_cost)) || 0;
              initialTests[t.test_code] = {
                checked: false,
                amount: cost > 0 ? cost.toFixed(2) : "",
              };
            },
          );
          setSelectedTests(initialTests);
        }
      }
    } catch (e) {
      console.error("Error fetching form options:", e);
    }
  }, [user?.branch_id, appointmentDate, setFormOptions, selectedTests]);

  // --- LOGIC: FETCHING ---
  const fetchNotifs = useCallback(async () => {
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/notifications?employee_id=${user?.employee_id || ""}`,
      );
      const data = await res.json();
      if (data.success || data.status === "success") {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user?.employee_id, setNotifications, setUnreadCount]);

  const isInitialLoad = useRef(!data);
  const fetchAll = useCallback(
    async (showLoading = true) => {
      if (!user?.branch_id) return;
      if (showLoading) setIsLoading(true);

      try {
        window.dispatchEvent(new CustomEvent("trigger-system-status-check"));
        await Promise.all([
          fetchMainDashboard(),
          fetchFormOptionsData(),
          fetchNotifs(),
          fetchApprovals(),
        ]);
        isInitialLoad.current = false;
      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [
      user?.branch_id,
      appointmentDate,
      fetchMainDashboard,
      fetchFormOptionsData,
      fetchApprovals,
      fetchNotifs,
    ],
  );

  // Cooldown Logic
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(() => {
        setRefreshCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  const handleRefresh = async () => {
    if (refreshCooldown > 0 || isLoading) return;

    // Trigger system status check manually on refresh
    window.dispatchEvent(new CustomEvent("trigger-system-status-check"));

    if (!lastSync) {
      await fetchAll();
      setRefreshCooldown(20);
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Checking for updates...");

    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/check_updates?branch_id=${user?.branch_id}&last_sync=${lastSync}`,
      );
      const updateData = await res.json();

      if (updateData.success) {
        if (updateData.hasChanges) {
          toast.loading("Changes found, updating...", { id: toastId });

          const syncTasks = [];

          // Granular Sync Logic
          const mainDataTables = [
            "registration",
            "tests",
            "patients",
            "quick_inquiry",
            "test_inquiry",
            "attendance",
            "payments",
          ];
          const hasMainChanges = mainDataTables.some(
            (table) => updateData.changes[table],
          );

          if (hasMainChanges) syncTasks.push(fetchMainDashboard());
          if (updateData.changes["notifications"])
            syncTasks.push(fetchNotifs());
          if (updateData.changes["registration"] || updateData.changes["tests"])
            syncTasks.push(fetchApprovals());

          // If registration modal is open, always refresh slots if registration changes detected
          if (
            activeModal === "registration" &&
            appointmentDate &&
            updateData.changes["registration"]
          ) {
            syncTasks.push(fetchTimeSlots(appointmentDate));
          }

          if (syncTasks.length > 0) {
            await Promise.all(syncTasks);
            // Clear search cache if patients or related records changed
            if (hasMainChanges) {
              useDashboardStore.setState({ searchCache: {} });
            }
            toast.success("System updated with latest records", {
              id: toastId,
            });
          } else {
            toast.success("System is up to date", { id: toastId });
          }

          if (updateData.serverTime) setLastSync(updateData.serverTime);
        } else {
          toast.success("No new changes found", { id: toastId });
          if (updateData.serverTime) setLastSync(updateData.serverTime);
        }
      } else {
        await fetchAll();
        toast.info("Full system sync completed", { id: toastId });
      }
    } catch (err) {
      console.error("Refresh Error:", err);
      await fetchAll();
      toast.error("Sync failed, fallback complete", { id: toastId });
    } finally {
      setIsLoading(false);
      setRefreshCooldown(20);
    }
  };

  // Fetch Time Slots
  const fetchTimeSlots = useCallback(
    async (date: string) => {
      if (!user?.branch_id) return;
      try {
        const res = await authFetch(
          `${API_BASE_URL}/reception/get_slots?date=${date}`,
        );
        const data = await res.json();
        if (data.success) {
          setTimeSlots(date, data.slots);
        }
      } catch (e) {
        console.error("Error fetching time slots:", e);
      }
    },
    [user?.branch_id, setTimeSlots],
  );

  const handleSmartUpdate = useCallback(async () => {
    if (!user?.branch_id) return;

    const now = Date.now();
    const prevAccess = lastAccessTime || 0;
    const diff = (now - prevAccess) / 1000;

    // Update last access time immediately as the "page is opened"
    useDashboardStore.setState({ lastAccessTime: now });

    // If never synced or no data, do a full fetch
    if (!data || !lastSync) {
      await fetchAll();
      return;
    }

    // Within 15s window - skip all server hits
    // if (diff < 15) {
    //   return;
    // }

    // Over 15s - check if DB actually changed before doing a heavy fetch
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/check_updates?branch_id=${user.branch_id}&last_sync=${lastSync}`,
      );
      const updateData = await res.json();

      if (updateData.success && updateData.hasChanges) {
        const syncTasks = [];

        // Granular Sync Logic
        const mainDataTables = [
          "registration",
          "tests",
          "patients",
          "quick_inquiry",
          "test_inquiry",
          "attendance",
          "payments",
        ];
        const hasMainChanges = mainDataTables.some(
          (table) => updateData.changes[table],
        );

        if (hasMainChanges) syncTasks.push(fetchMainDashboard());
        if (updateData.changes["notifications"]) syncTasks.push(fetchNotifs());
        if (updateData.changes["registration"] || updateData.changes["tests"])
          syncTasks.push(fetchApprovals());

        // If registration modal is open, always refresh slots if registration changes detected
        if (
          activeModal === "registration" &&
          appointmentDate &&
          updateData.changes["registration"]
        ) {
          syncTasks.push(fetchTimeSlots(appointmentDate));
        }

        if (syncTasks.length > 0) {
          await Promise.all(syncTasks);
          // Clear search cache if patients or related records changed
          if (hasMainChanges) {
            useDashboardStore.setState({ searchCache: {} });
          }
        }

        if (updateData.serverTime) setLastSync(updateData.serverTime);
      }
    } catch (err) {
      console.error("Smart update check failed:", err);
    }
  }, [
    user?.branch_id,
    lastAccessTime,
    data,
    lastSync,
    fetchAll,
    fetchMainDashboard,
    fetchNotifs,
    fetchApprovals,
    activeModal,
    appointmentDate,
    fetchTimeSlots,
    setLastSync,
  ]);

  // Fetch time slots when registration modal is opened
  useEffect(() => {
    if (activeModal === "registration" && appointmentDate) {
      if (storeTimeSlots?.date !== appointmentDate) {
        fetchTimeSlots(appointmentDate);
      }
    }
  }, [activeModal, appointmentDate, fetchTimeSlots, storeTimeSlots]);

  useEffect(() => {
    // Run smart update check on mount/opening
    if (user?.branch_id) {
      handleSmartUpdate();
    }
    // Click outside handler for popups
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        // Only close if not clicking the search modal as well
        if (!(e.target as Element).closest("#search-modal-container")) {
          setShowGlobalSearch(false);
        }
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest("#notif-popup")
      )
        setShowNotifPopup(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setShowProfilePopup(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [fetchAll]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (activeModal && formRef.current) {
      // Find first visible input, select, or textarea
      const inputs = formRef.current.querySelectorAll(
        "input, select, textarea",
      );
      for (let i = 0; i < inputs.length; i++) {
        const el = inputs[i] as HTMLElement;
        if (
          el.offsetParent !== null &&
          !el.hasAttribute("disabled") &&
          !el.hasAttribute("readonly")
        ) {
          setTimeout(() => el.focus(), 100);
          break;
        }
      }
    }
  }, [activeModal]);

  // Global ESC & Hotkey Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. ESC Key Logic
      if (e.key === "Escape") {
        // Priority Order (LIFOish)
        if (showGlobalSearch) setShowGlobalSearch(false);
        else if (showShortcuts) setShowShortcuts(false);
        else if (showLogoutConfirm) setShowLogoutConfirm(false);
        else if (showPhotoModal) closePhotoModal();
        else if (showApprovals) setShowApprovals(false);
        else if (showChatModal) setShowChatModal(false);
        else if (showNotifPopup) setShowNotifPopup(false);
        else if (showProfilePopup) setShowProfilePopup(false);
        else if (activeModal) closeModal();
      }

      // 2. Quick Search Shortcut (Alt + S)
      const isS =
        e.key.toLowerCase() === "s" || e.code.toLowerCase() === "keys";
      if (e.altKey && isS && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        setShowGlobalSearch(true);
      }

      // 3. Branch Notes Shortcut (Alt + E)
      if (
        e.altKey &&
        e.key.toLowerCase() === "e" &&
        !e.shiftKey &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
        e.stopPropagation();
        setShowNotes((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [
    showGlobalSearch,
    showShortcuts,
    showLogoutConfirm,
    showPhotoModal,
    showChatModal,
    showNotifPopup,
    showProfilePopup,
    activeModal,
  ]);

  const handleAppointmentDateChange = async (newDate: string) => {
    setAppointmentDate(newDate);
    if (user?.branch_id) {
      try {
        const optRes = await authFetch(
          `${API_BASE_URL}/reception/form_options?branch_id=${user.branch_id}&appointment_date=${newDate}`,
        );
        const optData = await optRes.json();
        if (optData.status === "success" && formOptions)
          setFormOptions({ ...formOptions, timeSlots: optData.data.timeSlots });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleTestCheckChange = (testCode: string, checked: boolean) => {
    setSelectedTests((prev) => {
      const newState = { ...prev };
      if (!newState[testCode])
        newState[testCode] = { checked: false, amount: "" };
      newState[testCode].checked = checked;
      // Auto fill default amount if checking
      if (checked && !newState[testCode].amount) {
        const test = formOptions?.testTypes?.find(
          (t: any) => t.test_code === testCode,
        );
        if (test && test.default_cost)
          newState[testCode].amount = String(test.default_cost);
      }
      return newState;
    });
  };

  const handleTestAmountChange = (testCode: string, amount: string) => {
    setSelectedTests((prev) => {
      const newState = { ...prev };
      if (!newState[testCode])
        newState[testCode] = { checked: false, amount: "" };
      newState[testCode].amount = amount;
      return newState;
    });
  };

  useEffect(() => {
    if (activeModal !== "test") return;
    let total = 0;
    Object.values(selectedTests).forEach((t) => {
      if (t.checked) total += parseFloat(t.amount) || 0;
    });
    setTotalAmount(total > 0 ? total.toFixed(2) : "");

    const adv = parseFloat(advanceAmount) || 0;
    const disc = parseFloat(discountAmount) || 0;
    const due = total - adv - disc;
    setDueAmount(due > 0 ? due.toFixed(2) : "0.00");
  }, [selectedTests, advanceAmount, discountAmount, activeModal]);

  // Scroll Lock for Modals
  useEffect(() => {
    if (
      activeModal ||
      showChatModal ||
      showPhotoModal ||
      showDatePicker ||
      showTimePicker
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    activeModal,
    showChatModal,
    showPhotoModal,
    showDatePicker,
    showTimePicker,
  ]);

  // --- LOGIC: WEBCAM ---
  const startWebcam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e) {
      console.error(e);
    }
  };
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      streamRef.current = null;
    }
  };
  const openPhotoModal = () => {
    setShowPhotoModal(true);
    setPhotoCaptured(false);
    setTimeout(() => startWebcam(), 100);
  };
  const closePhotoModal = () => {
    stopWebcam();
    setShowPhotoModal(false);
    setPhotoCaptured(false);
  };
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const v = videoRef.current,
        c = canvasRef.current;
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
      setPhotoCaptured(true);
    }
  };
  const retakePhoto = () => setPhotoCaptured(false);
  const usePhoto = () => {
    if (canvasRef.current) {
      setPhotoData(canvasRef.current.toDataURL("image/jpeg", 0.8));
      closePhotoModal();
    }
  };

  // --- LOGIC: SUBMIT ---
  const closeModal = () => {
    setActiveModal(null);
    setAdvanceAmount("");
    setDiscountAmount("");
    setDueAmount("");
    setSubmitMessage(null);
    setPhotoData(null);
    setAppointmentTime("");
    // Reset Dropdowns
    setRegGender("");
    setRegSource("");
    setRegConsultType("");
    setTestGender("");
    setTestLimb("");
    setTestDoneBy("");
    setInqGender("");
    setInqService("");
    setInqSource("");
    setInqCommType("");
    setInqComplaint("");
    setTiTestName("");
    setRegComplaint("");
    setRegPaymentSplits({});
    setTestPaymentSplits({});

    if (formOptions?.testTypes) {
      const initialTests: Record<string, { checked: boolean; amount: string }> =
        {};
      formOptions.testTypes.forEach(
        (t: { test_code: string; default_cost: string | number }) => {
          const cost = parseFloat(String(t.default_cost)) || 0;
          initialTests[t.test_code] = {
            checked: false,
            amount: cost > 0 ? cost.toFixed(2) : "",
          };
        },
      );
      setSelectedTests(initialTests);
    }
  };

  const handleSubmit = async () => {
    if (!formRef.current || !user?.branch_id || !user?.employee_id) return;
    const formData = new FormData(formRef.current);
    const formObject: Record<string, string> = {};
    formData.forEach((value, key) => {
      formObject[key] = value.toString();
    });
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      let endpoint = "";
      let payload: Record<string, unknown> = {
        branch_id: user.branch_id,
        employee_id: user.employee_id,
      };

      if (activeModal === "registration") {
        endpoint = `${API_BASE_URL}/reception/registration_submit`;

        // Auto-fill split if only 1 method
        const totalReq = parseFloat(formObject.amount) || 0;
        let finalSplits = { ...regPaymentSplits };
        if (Object.keys(finalSplits).length === 1) {
          const m = Object.keys(finalSplits)[0];
          finalSplits[m] = totalReq;
        }

        const currentSum = Object.values(finalSplits).reduce(
          (a, b) => a + b,
          0,
        );
        if (currentSum !== totalReq) {
          setSubmitMessage({
            type: "error",
            text: `Payment split total (₹${currentSum}) does not match Consultation Amount (₹${totalReq})`,
          });
          setIsSubmitting(false);
          return;
        }
        payload = {
          ...payload,
          patient_name: formObject.patient_name,
          phone: formObject.phone,
          email: formObject.email || "",
          gender: formObject.gender,
          age: formObject.age,
          conditionType: formObject.conditionType,
          conditionType_other: formObject.conditionType_other || "",
          referralSource: formObject.referralSource,
          referred_by: formObject.referred_by || "",
          occupation: formObject.occupation || "",
          address: formObject.address || "",
          inquiry_type: formObject.inquiry_type,
          appointment_date: formObject.appointment_date || null,
          appointment_time: formObject.appointment_time || null,
          amount: formObject.amount || "0",
          payment_method: Object.keys(finalSplits).join(","),
          payment_amounts: finalSplits,
          remarks: formObject.remarks || "",
          patient_photo_data: photoData || "",
        };
      } else if (activeModal === "test") {
        endpoint = `${API_BASE_URL}/reception/test_submit`;
        const testNames = Object.entries(selectedTests)
          .filter(([, val]) => val.checked)
          .map(([key]) => key);
        const testAmounts: Record<string, number> = {};
        Object.entries(selectedTests).forEach(([key, val]) => {
          if (val.checked && val.amount)
            testAmounts[key] = parseFloat(val.amount) || 0;
        });

        // Auto-fill split if only 1 method
        const totalReq = parseFloat(advanceAmount) || 0;
        let finalSplits = { ...testPaymentSplits };
        if (Object.keys(finalSplits).length === 1) {
          const m = Object.keys(finalSplits)[0];
          finalSplits[m] = totalReq;
        }

        const currentSum = Object.values(finalSplits).reduce(
          (a, b) => a + b,
          0,
        );
        if (currentSum !== totalReq) {
          setSubmitMessage({
            type: "error",
            text: `Payment split total (₹${currentSum}) does not match Advance Amount (₹${totalReq})`,
          });
          setIsSubmitting(false);
          return;
        }

        payload = {
          ...payload,
          patient_name: formObject.patient_name,
          age: formObject.age,
          gender: formObject.gender,
          dob: formObject.dob || null,
          parents: formObject.parents || "",
          relation: formObject.relation || "",
          phone_number: formObject.phone_number || "",
          alternate_phone_no: formObject.alternate_phone_no || "",
          address: formObject.address || "",
          referred_by: formObject.referred_by || "",
          limb: formObject.limb || null,
          test_names: testNames,
          test_amounts: testAmounts,
          other_test_name: otherTestName,
          visit_date: formObject.visit_date,
          assigned_test_date: formObject.assigned_test_date,
          test_done_by: formObject.test_done_by,
          total_amount: parseFloat(totalAmount) || 0,
          advance_amount: parseFloat(advanceAmount) || 0,
          discount: parseFloat(discountAmount) || 0,
          payment_method: Object.keys(finalSplits).join(","),
          payment_amounts: finalSplits,
        };
      } else if (activeModal === "inquiry") {
        endpoint = `${API_BASE_URL}/reception/inquiry_submit`;
        payload = {
          ...payload,
          patient_name: formObject.patient_name,
          age: formObject.age,
          gender: formObject.gender,
          phone: formObject.phone,
          inquiry_type: formObject.inquiry_type || null,
          communication_type: formObject.communication_type || null,
          referralSource: formObject.referralSource || "self",
          conditionType: formObject.conditionType || "",
          conditionType_other: formObject.conditionType_other || "",
          remarks: formObject.remarks || "",
          expected_date: formObject.expected_date || null,
        };
      } else if (activeModal === "test_inquiry") {
        endpoint = `${API_BASE_URL}/reception/test_inquiry_submit`;
        payload = {
          ...payload,
          patient_name: formObject.patient_name,
          test_name: formObject.test_name,
          referred_by: formObject.referred_by || "",
          phone_number: formObject.phone_number,
          expected_visit_date: formObject.expected_visit_date || null,
        };
      }

      const response = await authFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        setSubmitMessage({
          type: "success",
          text: result.message || "Submitted successfully!",
        });
        const dashRes = await authFetch(
          `${API_BASE_URL}/reception/dashboard?branch_id=${user.branch_id}`,
        );
        const dashData = await dashRes.json();
        if (dashData.status === "success") setData(dashData.data);

        // Smart refresh: Clear cached slots and trigger update check after successful submit
        if (activeModal === "registration") {
          useDashboardStore.setState({ timeSlots: null });
        }

        // Clear search cache on successful submission
        useDashboardStore.setState({ searchCache: {} });
        handleRefresh();

        setTimeout(() => closeModal(), 1500);
      } else {
        setSubmitMessage({
          type: "error",
          text: result.message || "Submission failed",
        });
      }
    } catch (error) {
      console.error(error);
      setSubmitMessage({ type: "error", text: "An error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper
  const fmt = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

  const actionButtons = [
    {
      id: "registration" as ModalType,
      label: "Registration",
      icon: UserPlus,
      color: "bg-[#ccebc4] text-[#0c200e] hover:bg-[#b0d8a4]",
    },
    {
      id: "test" as ModalType,
      label: "Book Test",
      icon: FlaskConical,
      color: "bg-[#d0e4ff] text-[#001d36] hover:bg-[#b0d2ff]",
    },
    {
      id: "inquiry" as ModalType,
      label: "Inquiry",
      icon: PhoneCall,
      color: "bg-[#eaddff] text-[#21005d] hover:bg-[#d0bcff]",
    },
    {
      id: "test_inquiry" as ModalType,
      label: "Test Inquiry",
      icon: Beaker,
      color: "bg-[#ffdad6] text-[#410002] hover:bg-[#ffb4ab]",
    },
  ];

  // MD3 Styled Inputs
  const inputClass =
    "w-full px-4 py-3 bg-[#e0e2ec] dark:bg-[#43474e] border-b-2 border-[#74777f] dark:border-[#8e918f] focus:border-[#006e1c] dark:focus:border-[#88d99d] rounded-t-lg text-[#1a1c1e] dark:text-[#e3e2e6] text-base focus:outline-none transition-colors placeholder:text-[#43474e] dark:placeholder:text-[#8e918f] focus:bg-[#dadae2] dark:focus:bg-[#50545c]";
  const labelClass =
    "block text-xs font-medium text-[#43474e] dark:text-[#c4c7c5] mb-1 px-1";

  // Keyboard Shortcuts with Grouping
  const shortcuts: ShortcutItem[] = [
    // General
    {
      keys: ["Alt", "/"],
      description: "Keyboard Shortcuts",
      group: "General",
      action: () => setShowShortcuts((prev) => !prev),
    },

    // Modals
    {
      keys: ["Alt", "R"],
      description: "New Registration",
      group: "Modals",
      action: () => setActiveModal("registration"),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "T"],
      description: "Book Test",
      group: "Modals",
      action: () => setActiveModal("test"),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "I"],
      description: "New Inquiry",
      group: "Modals",
      action: () => setActiveModal("inquiry"),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "Shift", "I"],
      description: "Test Inquiry",
      group: "Modals",
      action: () => setActiveModal("test_inquiry"),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "C"],
      description: "Toggle Chat",
      group: "Modals",
      action: () => setShowChatModal((prev) => !prev),
    },
    {
      keys: ["Alt", "X"],
      description: "Consultation",
      group: "Navigation",
      action: () => navigate("/reception/inquiry"),
    },
    {
      keys: ["Alt", "N"],
      description: "Notifications",
      group: "Modals",
      action: () => setShowNotifPopup((prev) => !prev),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "A"],
      description: "Approvals",
      group: "Modals",
      action: () => setShowApprovals((prev) => !prev),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "P"],
      description: "Profile",
      group: "Modals",
      action: () => setShowProfilePopup((prev) => !prev),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "E"],
      description: "Branch Notes",
      group: "Modals",
      action: () => setShowNotes((prev) => !prev),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "Shift", "E"],
      description: "Quick Note",
      group: "Modals",
      action: () => setShowNotes(true),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "S"],
      description: "Quick Search",
      group: "General",
      action: () => {
        setShowGlobalSearch(true);
      },
    },
    {
      keys: ["Alt", "L"],
      description: "Logout",
      group: "Actions",
      action: () => setShowLogoutConfirm(true),
    },

    // Actions
    {
      keys: ["Alt", "W"],
      description: "Toggle Theme",
      group: "Actions",
      action: toggleTheme,
    },
    {
      keys: ["Ctrl", "R"],
      description: "Reload Page",
      group: "Actions",
      action: () => window.location.reload(),
    },

    // Navigation
    {
      keys: ["Alt", "1"],
      description: "Dashboard",
      group: "Navigation",
      action: () => navigate("/reception/dashboard"),
    },
    {
      keys: ["Alt", "2"],
      description: "Schedule",
      group: "Navigation",
      action: () => navigate("/reception/schedule"),
    },
    {
      keys: ["Alt", "3"],
      description: "Inquiry List",
      group: "Navigation",
      action: () => navigate("/reception/inquiry"),
    },
    {
      keys: ["Alt", "4"],
      description: "Registration List",
      group: "Navigation",
      action: () => navigate("/reception/registration"),
    },
    {
      keys: ["Alt", "5"],
      description: "Patients List",
      group: "Navigation",
      action: () => navigate("/reception/patients"),
    },
  ];

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? "bg-[#050505] text-[#E2E8F0]" : "bg-[#FAFAFA] text-[#1A1A1A]"}`}
    >
      <Sidebar
        onShowChat={() => setShowChatModal(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      {/* === STATS PANEL (Left Column) === */}
      <motion.div
        variants={leftPanelEntrance}
        initial={hasDashboardAnimated ? "visible" : "hidden"}
        animate="visible"
        className={`hidden xl:flex w-[400px] flex-col justify-between p-10 border-r relative shrink-0 transition-colors duration-300 z-50 ${isDark ? "bg-[#0A0A0A] border-[#151515]" : "bg-white border-gray-200"}`}
      >
        {/* Brand & Greeting */}
        <div className="space-y-10 z-10">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded flex items-center justify-center text-[#4ADE80] ${isDark ? "bg-[#1C1C1C]" : "bg-green-50"}`}
            >
              <LayoutGrid size={18} />
            </div>
            <span className="font-bold tracking-widest text-xs uppercase text-gray-500">
              PhysioEZ Core
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl font-serif font-normal tracking-tight leading-tight text-[#1a1c1e] dark:text-[#e3e2e6]">
              Hello,{" "}
              <span
                className={`italic ${isDark ? "text-[#4ADE80]" : "text-[#16a34a]"}`}
              >
                {user?.name?.split(" ")[0] || "Receptionist"}
              </span>
            </h1>
            <p className="text-gray-500 text-lg">
              Here's your daily branch overview.
            </p>
          </div>
        </div>

        {/* --- REDESIGNED STATS PANEL --- */}
        <div className="space-y-10 w-full flex-1 flex flex-col justify-center py-6">
          {/* SECTION 1: REGISTRATION */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 opacity-50 text-[#1a1c1e] dark:text-[#e3e2e6]">
              <ClipboardList size={18} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">
                Registration
              </span>
            </div>

            {/* Big Numbers */}
            <div className="flex items-baseline justify-between border-b border-dashed pb-6 dark:border-[#2A2D2A] border-gray-200">
              <div>
                <div
                  className={`text-8xl font-medium tracking-tighter leading-none ${isDark ? "text-white" : "text-[#0F172A]"}`}
                >
                  {data?.registration.today_total || 0}
                </div>
                <div className="text-sm font-medium opacity-40 mt-2 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  Today
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-4xl font-medium ${isDark ? "text-white" : "text-[#0F172A]"}`}
                >
                  {data?.registration.month_total || 0}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wide opacity-40 mt-1 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  Month
                </div>
              </div>
            </div>

            {/* Text-based Status List */}
            <div className="space-y-3 pl-1 text-[#1a1c1e] dark:text-[#e3e2e6]">
              <div className="flex items-center justify-between text-sm group">
                <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                  <span className="w-1.5 h-1.5 rounded-sm bg-orange-500"></span>{" "}
                  Pending
                </span>
                <span className="font-bold">
                  {data?.registration.pending || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm group">
                <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                  <span className="w-1.5 h-1.5 rounded-sm bg-green-500"></span>{" "}
                  Done
                </span>
                <span className="font-bold">
                  {data?.registration.consulted || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm group">
                <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                  <span className="w-1.5 h-1.5 rounded-sm bg-yellow-500"></span>{" "}
                  Approval
                </span>
                <span className="font-bold">
                  {data?.registration.approval_pending || 0}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: INQUIRIES */}
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-3 opacity-50 text-[#1a1c1e] dark:text-[#e3e2e6]">
              <Phone size={18} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">
                Inquiries
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[#1a1c1e] dark:text-[#e3e2e6]">
                <div
                  className={`text-5xl font-medium tracking-tight ${isDark ? "text-white" : "text-[#0F172A]"}`}
                >
                  {data?.inquiry.total_today || 0}
                </div>
                <div className="text-xs font-bold opacity-40 mt-2 flex gap-4">
                  <span>Quick: {data?.inquiry.quick || 0}</span>
                  <span>Test: {data?.inquiry.test || 0}</span>
                </div>
              </div>
              <button
                onClick={() => navigate("/reception/inquiry")}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all hover:scale-110 active:scale-90 ${isDark ? "border-white/10 bg-white/5 hover:bg-emerald-500/10 text-emerald-500" : "border-gray-200 bg-white hover:bg-emerald-50 text-emerald-600 shadow-sm"}`}
                title="View Inquiries"
              >
                <ArrowUpRight
                  size={20}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Decoration */}
        <div className="absolute top-1/2 left-0 w-full h-full bg-gradient-to-t from-green-900/10 to-transparent pointer-events-none" />
      </motion.div>

      {/* === MAIN CONTENT (Right Panel) === */}
      <main className="flex-1 h-screen overflow-y-auto bg-transparent relative">
        <motion.div
          variants={mainContentEntrance}
          initial={hasDashboardAnimated ? "visible" : "hidden"}
          animate="visible"
          className="p-6 lg:p-10 max-w-[1920px] mx-auto space-y-10"
        >
          {/* HEADER SECTION (Search, Refresh, Notif) */}
          <div
            className={`flex flex-wrap lg:flex-nowrap justify-between items-center gap-4 bg-transparent backdrop-blur-sm sticky top-0 py-3 transition-all duration-300 z-[45]`}
          >
            <div
              className={`flex flex-nowrap lg:flex-wrap items-center gap-2 transition-all duration-300 ${showGlobalSearch ? "opacity-20 blur-[2px] pointer-events-none scale-98" : "opacity-100"} overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide max-w-full`}
            >
              {actionButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setActiveModal(btn.id)}
                  className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full transition-all duration-300 shadow-sm border shrink-0 ${
                    isDark
                      ? "bg-[#1A1C1A] text-white/70 hover:text-white hover:bg-[#252825] border-white/5"
                      : "bg-white text-gray-600 hover:text-gray-900 border-gray-100 hover:shadow-md"
                  }`}
                >
                  <btn.icon size={16} strokeWidth={2} />
                  <span className="text-[10px] sm:text-xs font-bold tracking-tight whitespace-nowrap">
                    {btn.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <div
                ref={searchRef}
                className="relative z-[160] flex-1 lg:flex-none lg:w-[320px] xl:w-[400px]"
              >
                <div
                  onClick={() => setShowGlobalSearch(true)}
                  className={`flex items-center px-4 py-2.5 sm:py-3 rounded-[24px] border transition-all duration-300 cursor-text ${
                    isDark
                      ? "bg-[#121412]/80 border-[#2A2D2A] hover:bg-[#121412] shadow-2xl shadow-black/20"
                      : "bg-white border-gray-100 shadow-xl shadow-black/[0.03] hover:bg-white"
                  } backdrop-blur-md`}
                >
                  <Search size={18} className="opacity-30 flex-shrink-0" />
                  <div className="bg-transparent px-3 text-sm sm:text-base w-full opacity-30 font-medium select-none truncate">
                    Search anything...
                  </div>
                  <div
                    className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-black tracking-tight opacity-40 shrink-0 ${isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}
                  >
                    <span className="text-[12px] opacity-60">⌥</span>
                    <span>S</span>
                  </div>
                </div>
              </div>

              {/* Utilities Area */}
              <div className="flex items-center p-1 sm:p-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 shrink-0">
                <div className="flex flex-col items-end mr-2">
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading || refreshCooldown > 0}
                    className={`w-10 h-10 flex items-center justify-center rounded-[14px] transition-all hover:bg-white dark:hover:bg-white/10 ${isLoading ? "animate-spin" : ""} ${refreshCooldown > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={
                      refreshCooldown > 0
                        ? `Wait ${refreshCooldown}s`
                        : "Refresh Dashboard"
                    }
                  >
                    <RefreshCw
                      size={18}
                      strokeWidth={2}
                      className="opacity-40"
                    />
                  </button>
                </div>

                <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />

                {/* Notifications */}
                <div className="relative flex items-center">
                  <button
                    ref={notifRef}
                    onClick={() => {
                      setShowNotifPopup(!showNotifPopup);
                      setShowProfilePopup(false);
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-[14px] transition-all hover:bg-white dark:hover:bg-white/10 relative"
                  >
                    <Bell size={18} strokeWidth={2} className="opacity-40" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1A1C1A]" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifPopup && (
                      <motion.div
                        id="notif-popup"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5 }}
                        className={`absolute top-full right-0 mt-3 w-80 rounded-[24px] shadow-2xl border overflow-hidden z-[60] ${isDark ? "bg-[#1A1C1A] border-[#2A2D2A]" : "bg-white border-gray-100"}`}
                      >
                        <div className="px-5 py-4 border-b dark:border-white/5 border-gray-100 flex items-center justify-between">
                          <span className="font-bold text-sm">
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#CCEBC4] text-[#0C200E]">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto p-1.5">
                          {notifList.map((n: any) => (
                            <div
                              key={n.notification_id}
                              className={`p-3 rounded-xl transition-all cursor-pointer group mb-1 ${
                                n.is_read === 0
                                  ? isDark
                                    ? "bg-[#CCEBC4]/5 hover:bg-[#CCEBC4]/10"
                                    : "bg-green-50 hover:bg-green-100/50"
                                  : isDark
                                    ? "hover:bg-white/5"
                                    : "hover:bg-gray-50"
                              }`}
                            >
                              <p
                                className={`text-xs leading-snug ${n.is_read === 0 ? "font-bold" : ""} ${isDark ? "text-gray-200" : "text-gray-800"}`}
                              >
                                {n.message}
                              </p>
                              <p className="text-[9px] opacity-30 font-medium mt-1 uppercase">
                                {n.time_ago}
                              </p>
                            </div>
                          ))}
                          {notifList.length === 0 && (
                            <div className="py-10 text-center opacity-30 flex flex-col items-center gap-2">
                              <Bell size={24} strokeWidth={1.5} />
                              <p className="text-sm font-medium">
                                All notifications cleared
                              </p>
                            </div>
                          )}
                        </div>
                        {notifList.length > 0 && (
                          <div className="p-3 border-t dark:border-white/5 border-gray-100 text-center">
                            <button className="text-[10px] font-black text-[#4ADE80] uppercase tracking-widest hover:opacity-80">
                              Mark all as read
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />

                <button
                  onClick={() => setShowIntelligence(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-[14px] transition-all hover:bg-white dark:hover:bg-white/10 text-indigo-500"
                  title="Daily Intelligence"
                >
                  <Info size={19} strokeWidth={2.5} />
                </button>

                <div className="relative group/note">
                  <button
                    onClick={() => setShowNotes(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-[14px] transition-all hover:bg-white dark:hover:bg-white/10 text-pink-500"
                    title="Branch Notes"
                  >
                    <StickyNote size={19} strokeWidth={2.5} />
                  </button>
                  {/* Hint */}
                  <div
                    className={`absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1 py-0.5 rounded-md border text-[8px] font-black tracking-tighter opacity-0 group-hover/note:opacity-100 transition-opacity bg-white dark:bg-[#1A1C1A] ${isDark ? "border-white/10 text-white/40" : "border-gray-200 text-slate-400"}`}
                  >
                    <span className="opacity-60 text-[10px]">⌥</span>
                    <span>E</span>
                  </div>
                </div>
              </div>

              {/* Approvals */}
              {pendingList.length > 0 && (
                <button
                  onClick={() => setShowApprovals(true)}
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-colors hover:bg-gray-50 dark:hover:bg-[#1A1C1A] relative animate-pulse ${isDark ? "border-[#2A2D2A] bg-[#121412] text-[#FFB4AB]" : "border-gray-200 bg-white text-[#B3261E]"}`}
                >
                  <Hourglass size={20} strokeWidth={1.5} />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#B3261E] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#121412]">
                    {pendingList.length}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* --- REDESIGNED STATS GRID - 4 Columns --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* 1. CENSUS */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
              className={`p-6 rounded-[32px] border flex flex-col justify-between gap-4 ${isDark ? "bg-[#121412] border-[#2A2D2A]" : "bg-white border-gray-200 shadow-sm"}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 opacity-60 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  <Users size={18} strokeWidth={2} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Census
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  <span className="text-5xl font-serif font-medium leading-none tracking-tight">
                    {data?.patients.today_attendance || 0}
                  </span>
                  <span className="text-sm font-bold opacity-60">Attended</span>
                </div>
                <div className="text-xs font-bold opacity-40 mt-1 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  Total: {data?.patients.total_ever || 0}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-dashed border-gray-100 dark:border-[#2A2D2A] text-[#1a1c1e] dark:text-[#e3e2e6]">
                <div className="flex flex-col">
                  <span className="text-lg font-bold">
                    {data?.patients.active || 0}
                  </span>
                  <span className="text-[10px] uppercase font-bold opacity-50">
                    Active
                  </span>
                </div>
                <div className="w-px h-8 bg-gray-100 dark:bg-[#2A2D2A]" />
                <div className="flex flex-col">
                  <span className="text-lg font-bold opacity-50">
                    {data?.patients.inactive || 0}
                  </span>
                  <span className="text-[10px] uppercase font-bold opacity-30">
                    Inactive
                  </span>
                </div>
              </div>
            </motion.div>

            {/* 2. LAB OPS */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
              className={`p-6 rounded-[32px] border flex flex-col justify-between gap-4 ${isDark ? "bg-[#121412] border-[#2A2D2A]" : "bg-white border-gray-200 shadow-sm"}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 opacity-60 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  <TestTube2 size={18} strokeWidth={2} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Lab Ops
                  </span>
                </div>
                <div className="text-[10px] font-bold opacity-40 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  M: {data?.tests.total_month || 0}
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  <span className="text-5xl font-serif font-medium leading-none tracking-tight">
                    {data?.tests.today_total || 0}
                  </span>
                  <span className="text-sm font-bold opacity-60">Tests</span>
                </div>
                <div className="text-xs font-bold opacity-40 mt-1 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  Rev: {fmt(data?.tests.revenue_today || 0)}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-100 dark:border-[#2A2D2A]">
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600 leading-none">
                    {data?.tests.approval_pending || 0}
                  </div>
                  <div className="text-[9px] uppercase font-bold opacity-40 mt-1">
                    Wait
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-500 leading-none">
                    {data?.tests.pending || 0}
                  </div>
                  <div className="text-[9px] uppercase font-bold opacity-40 mt-1">
                    Proc
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-500 leading-none">
                    {data?.tests.completed || 0}
                  </div>
                  <div className="text-[9px] uppercase font-bold opacity-40 mt-1">
                    Done
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3. REVENUE */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
              className={`p-6 rounded-[32px] border flex flex-col justify-between gap-4 ${isDark ? "bg-[#121412] border-[#2A2D2A]" : "bg-white border-gray-200 shadow-sm"}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 opacity-60 text-[#1a1c1e] dark:text-[#e3e2e6]">
                  <Wallet size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Revenue
                  </span>
                </div>
                <div className="text-right text-[#1a1c1e] dark:text-[#e3e2e6]">
                  <div className="text-[9px] font-bold opacity-40 uppercase tracking-wider">
                    Breakdown
                  </div>
                  <div className="text-xl font-serif font-medium leading-none mt-1">
                    {fmt(data?.collections.today_total || 0)}
                  </div>
                  <div className="text-[8px] font-bold opacity-40 uppercase">
                    Total
                  </div>
                </div>
              </div>

              <div className="mt-2 text-[#1a1c1e] dark:text-[#e3e2e6]">
                <div className="text-4xl font-serif font-medium leading-none tracking-tight">
                  {fmt(data?.collections.today_total || 0)}
                </div>
                <div className="text-xs font-bold opacity-40 mt-1">
                  Today's Revenue
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-dashed border-gray-100 dark:border-[#2A2D2A] text-[#1a1c1e] dark:text-[#e3e2e6]">
                <div>
                  <div className="text-[10px] font-bold opacity-40 uppercase">
                    REG
                  </div>
                  <div className="font-bold text-sm">
                    {fmt(data?.collections.reg_amount || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold opacity-40 uppercase">
                    TX
                  </div>
                  <div className="font-bold text-sm">
                    {fmt(data?.collections.treatment_amount || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold opacity-40 uppercase">
                    LAB
                  </div>
                  <div className="font-bold text-sm">
                    {fmt(data?.collections.test_amount || 0)}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 4. DUES ALERT */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
              className={`p-6 rounded-[32px] border flex flex-col justify-between gap-4 relative ${isDark ? "bg-[#121412] border-[#2A2D2A]" : "bg-white border-red-100 shadow-sm"}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 text-red-500">
                  <AlertCircle size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Dues Alert
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider">
                    Pending
                  </div>
                  <div className="text-[10px] font-bold text-red-500 mt-0.5">
                    Pt:{" "}
                    <span className="text-red-600">
                      {fmt(data?.collections.patient_dues || 0)}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold text-red-500">
                    Test:{" "}
                    <span className="text-red-600">
                      {fmt(data?.collections.test_dues || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-4xl font-serif font-medium leading-none tracking-tight text-red-500">
                  {fmt(data?.collections.today_dues || 0)}
                </div>
                <div className="text-xs font-bold text-red-400 mt-1">
                  Pending Today
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500 cursor-pointer hover:opacity-80">
                  View All <ArrowUpRight size={12} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* BOTTOM ROW: SCHEDULE & ACTIVITY */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-20">
            {/* TODAY'S SCHEDULE - Spans 2 Columns */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className={`col-span-1 xl:col-span-2 p-8 rounded-[32px] h-[450px] flex flex-col ${isDark ? "bg-[#121412] border border-[#2A2D2A]" : "bg-white border-gray-200 shadow-sm"}`}
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="font-bold text-lg text-[#1a1c1e] dark:text-[#e3e2e6]">
                  Schedule
                </h3>
                <button
                  onClick={() => navigate("/reception/schedule")}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-[#1a1c1e] dark:text-[#e3e2e6]"
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {!data?.schedule?.length ? (
                  <div className="col-span-full text-center py-10 opacity-50 text-[#1a1c1e] dark:text-[#e3e2e6]">
                    No appointments scheduled
                  </div>
                ) : (
                  data.schedule.map((user: any) => (
                    <div
                      key={user.id}
                      className={`p-4 rounded-2xl border transition-colors group flex items-start gap-4 ${isDark ? "border-[#2A2D2A] hover:border-[#4ADE80]/50" : "border-gray-100 hover:border-gray-300"}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${user.status.toLowerCase() === "pending" ? "bg-orange-500/20 text-orange-500" : "bg-green-500/20 text-green-500"}`}
                      >
                        {user.patient_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="font-bold truncate text-[#1a1c1e] dark:text-[#e3e2e6]">
                            {user.patient_name}
                          </div>
                          <div className="text-xs font-bold opacity-40 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-[#1a1c1e] dark:text-[#e3e2e6]">
                            {user.appointment_time}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${user.status.toLowerCase() === "pending" ? "bg-orange-500" : "bg-green-500"}`}
                          />
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wide ${user.status.toLowerCase() === "pending" ? "text-[#b3261e] dark:text-[#ffb4ab]" : "text-[#006e1c] dark:text-[#88d99d]"}`}
                          >
                            {user.status}
                          </span>

                          {/* 2. Approval Status */}
                          {user.approval_status === "pending" && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowApprovals(true);
                              }}
                              className="text-[10px] font-bold uppercase tracking-wide text-yellow-600 dark:text-yellow-400 flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-900"
                            >
                              <Hourglass size={8} /> Waiting Approval
                            </span>
                          )}
                          {user.approval_status === "approved" && (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[#006e1c] dark:text-[#88d99d] flex items-center gap-1 bg-[#ccebc4]/30 px-1.5 py-0.5 rounded">
                              <CheckCircle2 size={10} /> Approved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* WEEKLY REVENUE - Spans 1 Column */}
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className={`rounded-[32px] p-8 flex flex-col justify-between relative overflow-hidden min-h-[350px] ${isDark ? "bg-[#1A1C1A] text-white" : "bg-white border border-gray-200 shadow-sm text-gray-900"}`}
            >
              {/* Header */}
              <div className="flex justify-between items-center z-10 w-full">
                <div className="flex items-center gap-3">
                  <Banknote
                    size={18}
                    className={isDark ? "text-gray-400" : "text-gray-500"}
                  />
                  <span className="font-bold text-sm">Weekly Revenue</span>
                </div>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border tracking-wider ${isDark ? "bg-[#2A2D2A] text-[#4ADE80] border-[#4ADE80]/20" : "bg-green-50 text-green-600 border-green-200"}`}
                >
                  Live
                </span>
              </div>

              {/* Bar Chart Visualization */}
              <div className="flex items-end justify-between h-40 mt-8 px-1 gap-3 w-full">
                {(data?.weekly || []).map(
                  (
                    day: { total: number; date: string; day: string },
                    index: number,
                  ) => {
                    const max = Math.max(
                      ...(data?.weekly || []).map(
                        (d: { total: number }) => d.total,
                      ),
                      1,
                    );
                    const height = `${(day.total / max) * 100}%`;
                    const isToday =
                      day.date === new Date().toISOString().split("T")[0];

                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center gap-3 w-full h-full group cursor-pointer relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none mb-1">
                          {fmt(day.total)}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black rotate-45 -mt-0.5"></div>
                        </div>

                        <div
                          className={`w-full rounded-t-md h-full relative overflow-hidden ${isDark ? "bg-[#222422]" : "bg-gray-100"}`}
                        >
                          {/* Fill */}
                          <div
                            className={`absolute bottom-0 w-full transition-all duration-500 ease-out rounded-t-md ${isToday ? (isDark ? "bg-[#4ADE80]" : "bg-[#16a34a]") : isDark ? "bg-[#333633] group-hover:bg-[#4ADE80]/30" : "bg-gray-300 group-hover:bg-gray-400"}`}
                            style={{ height: height }}
                          />
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider ${isToday ? (isDark ? "text-[#4ADE80]" : "text-[#16a34a]") : isDark ? "text-zinc-600" : "text-gray-400"}`}
                        >
                          {day.day}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>

              {/* Footer Stats */}
              <div
                className={`flex justify-between items-end pt-6 border-t mt-2 ${isDark ? "border-[#2A2D2A]" : "border-gray-100"}`}
              >
                <div
                  className={`text-xs font-medium ${isDark ? "text-zinc-500" : "text-gray-500"}`}
                >
                  Total this week
                </div>
                <div
                  className={`text-1xl font-bold tracking-tight ${isDark ? "text-zinc-100" : "text-gray-900"}`}
                >
                  {data?.weekly
                    ? fmt(
                        data.weekly.reduce(
                          (a: number, b: { total: number }) => a + b.total,
                          0,
                        ),
                      )
                    : fmt(0)}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <ActionFAB onAction={(action) => setActiveModal(action as any)} />

      {/* --- MODALS --- */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#fdfcff] dark:bg-[#111315] w-full max-w-[1400px] max-h-[90vh] overflow-y-auto rounded-[32px] shadow-2xl overflow-hidden transition-colors duration-300"
            >
              <div className="px-8 py-6 border-b border-[#e0e2ec] dark:border-[#43474e] flex items-center justify-between bg-[#fdfcff] dark:bg-[#111315] sticky top-0 z-10 transition-colors">
                <div>
                  <h2
                    className="text-2xl text-[#1a1c1e] dark:text-[#e3e2e6]"
                    style={{ fontFamily: "serif" }}
                  >
                    {activeModal === "registration" &&
                      "New Patient Registration"}
                    {activeModal === "test" && "Book Lab Test"}
                    {activeModal === "inquiry" && "New Inquiry"}
                    {activeModal === "test_inquiry" && "Test Inquiry"}
                  </h2>
                  <p className="text-sm text-[#43474e] dark:text-[#c4c7c5]">
                    Enter details below
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-10 h-10 rounded-full hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] flex items-center justify-center transition-colors"
                >
                  <X size={24} className="text-[#43474e] dark:text-[#c4c7c5]" />
                </button>
              </div>
              <div className="p-8">
                {activeModal === "registration" && (
                  <form
                    ref={formRef}
                    onSubmit={(e) => e.preventDefault()}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6"
                  >
                    <input
                      type="hidden"
                      name="patient_photo_data"
                      value={photoData || ""}
                    />

                    {/* Column 1: Patient Details */}
                    <div className="space-y-6">
                      <div className="pb-2 border-b border-[#74777f]/10 mb-4">
                        <h3 className="text-sm font-bold text-[#006e1c] uppercase tracking-wider">
                          Patient Information
                        </h3>
                      </div>
                      <div>
                        <label className={labelClass}>Patient Name *</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            name="patient_name"
                            required
                            className={inputClass}
                            placeholder="Full Name"
                          />
                          <button
                            type="button"
                            onClick={openPhotoModal}
                            className="w-12 h-12 flex items-center justify-center bg-[#ccebc4] rounded-xl text-[#0c200e] hover:bg-[#b0d8a4] transition-colors shadow-sm"
                          >
                            <Camera size={20} />
                          </button>
                        </div>
                        {photoData && (
                          <div className="mt-2 text-xs text-green-600 flex items-center gap-1 font-bold">
                            <Check size={12} /> Photo captured
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Age *</label>
                          <input
                            type="text"
                            name="age"
                            required
                            className={inputClass}
                            placeholder="25"
                          />
                        </div>
                        <div>
                          <CustomSelect
                            label="Gender *"
                            value={regGender}
                            onChange={setRegGender}
                            options={[
                              { label: "Male", value: "Male" },
                              { label: "Female", value: "Female" },
                              { label: "Other", value: "Other" },
                            ]}
                            placeholder="Select"
                          />
                          <input
                            type="hidden"
                            name="gender"
                            value={regGender}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Referred By *</label>
                        <input
                          list="referrers"
                          name="referred_by"
                          required
                          className={inputClass}
                          placeholder="Type or select"
                        />
                        <datalist id="referrers">
                          {formOptions?.referrers.map((r: string) => (
                            <option key={r} value={r} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <CustomSelect
                          label="Chief Complaint *"
                          value={regComplaint}
                          onChange={setRegComplaint}
                          options={[
                            ...(formOptions?.chiefComplaints.map(
                              (c: {
                                complaint_name: string;
                                complaint_code: string;
                              }) => ({
                                label: c.complaint_name,
                                value: c.complaint_code,
                              }),
                            ) || []),
                            { label: "Other", value: "other" },
                          ]}
                          placeholder="Select Complaint"
                        />
                        <input
                          type="hidden"
                          name="conditionType"
                          value={regComplaint}
                        />
                        {regComplaint === "other" && (
                          <div className="mt-2">
                            <input
                              type="text"
                              name="conditionType_other"
                              className={inputClass}
                              placeholder="Specify other complaint"
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className={labelClass}>Occupation</label>
                        <input
                          type="text"
                          name="occupation"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Phone No *</label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          maxLength={10}
                          className={inputClass}
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Email</label>
                        <input
                          type="email"
                          name="email"
                          className={inputClass}
                          placeholder="patient@example.com"
                        />
                      </div>
                    </div>

                    {/* Column 2: Administrative & Payment */}
                    <div className="space-y-6">
                      <div className="pb-2 border-b border-[#74777f]/10 mb-4">
                        <h3 className="text-sm font-bold text-[#006e1c] uppercase tracking-wider">
                          Administrative Details
                        </h3>
                      </div>
                      <div>
                        <label className={labelClass}>Address</label>
                        <input
                          type="text"
                          name="address"
                          className={inputClass}
                          placeholder="Full Address"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Appointment Date</label>
                          <div
                            onClick={() => {
                              setActiveDateField("registration");
                              setShowDatePicker(true);
                            }}
                            className={`${inputClass} cursor-pointer flex items-center justify-between`}
                          >
                            <span>
                              {new Date(appointmentDate).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                            <Calendar
                              size={18}
                              className="text-[#43474e] dark:text-[#c4c7c5]"
                            />
                          </div>
                          <input
                            type="hidden"
                            name="appointment_date"
                            value={appointmentDate}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Time Slot *</label>
                          <div
                            onClick={() => setShowTimePicker(true)}
                            className={`${inputClass} cursor-pointer flex items-center justify-between`}
                          >
                            <span>
                              {currentSlots.find(
                                (t: any) => t.time === appointmentTime,
                              )?.label || "Select Time"}
                            </span>
                            <Clock
                              size={18}
                              className="text-[#43474e] dark:text-[#c4c7c5]"
                            />
                          </div>
                          <input
                            type="hidden"
                            name="appointment_time"
                            value={appointmentTime}
                          />
                        </div>
                      </div>

                      <div>
                        <CustomSelect
                          label="Consultation Type *"
                          value={regConsultType}
                          onChange={setRegConsultType}
                          options={
                            formOptions?.consultationTypes.map(
                              (t: {
                                consultation_name: string;
                                consultation_code: string;
                              }) => ({
                                label: t.consultation_name,
                                value: t.consultation_code,
                              }),
                            ) || []
                          }
                          placeholder="Select"
                        />
                        <input
                          type="hidden"
                          name="inquiry_type"
                          value={regConsultType}
                        />
                      </div>

                      <div>
                        <CustomSelect
                          label="How did you hear?"
                          value={regSource}
                          onChange={setRegSource}
                          options={
                            formOptions?.referralSources.map(
                              (s: {
                                source_name: string;
                                source_code: string;
                              }) => ({
                                label: s.source_name,
                                value: s.source_code,
                              }),
                            ) || []
                          }
                          placeholder="Select source"
                        />
                        <input
                          type="hidden"
                          name="referralSource"
                          value={regSource}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Amount (₹) *</label>
                        <input
                          type="number"
                          name="amount"
                          required
                          className={`${inputClass} font-bold text-lg`}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <div
                          onClick={() => setShowRegPayment(!showRegPayment)}
                          className="flex items-center justify-between cursor-pointer p-3 bg-[#f2f6fa] dark:bg-[#1a1c1e] rounded-2xl hover:bg-[#e0e4e9] dark:hover:bg-[#25282c] transition-all border border-transparent hover:border-[#006e1c]/20"
                        >
                          <div>
                            <label className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6] cursor-pointer">
                              Payment Method *
                            </label>
                            <p className="text-[10px] text-[#43474e] dark:text-[#c4c7c5] font-medium uppercase tracking-wider mt-0.5">
                              Select one or more methods
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {Object.keys(regPaymentSplits).length > 0 && (
                              <span className="text-xs font-bold text-white bg-[#006e1c] px-3 py-1 rounded-full shadow-lg">
                                {Object.keys(regPaymentSplits).length} selected
                              </span>
                            )}
                            {showRegPayment ? (
                              <ChevronUp size={20} className="text-[#006e1c]" />
                            ) : (
                              <ChevronDown
                                size={20}
                                className="text-[#43474e] dark:text-[#c4c7c5]"
                              />
                            )}
                          </div>
                        </div>
                        <AnimatePresence>
                          {showRegPayment && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="bg-white dark:bg-[#111315] rounded-2xl p-2 border border-[#e0e2ec] dark:border-[#43474e] shadow-inner mt-2 space-y-1">
                                {formOptions?.paymentMethods.map(
                                  (m: {
                                    method_code: string;
                                    method_name: string;
                                  }) => (
                                    <div
                                      key={m.method_code}
                                      className={`flex items-center gap-2 p-1.5 rounded-xl transition-all ${regPaymentSplits[m.method_code] !== undefined ? "bg-[#ccebc4]/20 border border-[#006e1c]" : "bg-[#e0e2ec]/30 border border-transparent hover:bg-[#e0e2ec]/50"}`}
                                    >
                                      <div
                                        onClick={() => {
                                          const newSplits = {
                                            ...regPaymentSplits,
                                          };
                                          if (
                                            newSplits[m.method_code] !==
                                            undefined
                                          )
                                            delete newSplits[m.method_code];
                                          else newSplits[m.method_code] = 0;
                                          setRegPaymentSplits(newSplits);
                                        }}
                                        className="flex items-center gap-3 cursor-pointer flex-1"
                                      >
                                        <div
                                          className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${regPaymentSplits[m.method_code] !== undefined ? "bg-[#006e1c] border-[#006e1c] shadow-md shadow-green-500/20" : "border-[#74777f]"}`}
                                        >
                                          {regPaymentSplits[m.method_code] !==
                                            undefined && (
                                            <Check
                                              size={14}
                                              className="text-white"
                                              strokeWidth={4}
                                            />
                                          )}
                                        </div>
                                        <span className="text-sm font-semibold text-[#1a1c1e] dark:text-[#e3e2e6]">
                                          {m.method_name}
                                        </span>
                                      </div>
                                      {regPaymentSplits[m.method_code] !==
                                        undefined &&
                                        Object.keys(regPaymentSplits).length >
                                          1 && (
                                          <div className="flex items-center gap-2 bg-white dark:bg-black/40 px-3 py-2 rounded-xl border border-[#006e1c]/30 min-w-[140px]">
                                            <span className="text-xs font-black text-[#006e1c]">
                                              ₹
                                            </span>
                                            <input
                                              type="number"
                                              value={
                                                regPaymentSplits[
                                                  m.method_code
                                                ] || ""
                                              }
                                              onChange={(e) =>
                                                setRegPaymentSplits({
                                                  ...regPaymentSplits,
                                                  [m.method_code]:
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                })
                                              }
                                              className="flex-1 bg-transparent border-none text-sm font-black text-right outline-none appearance-none text-[#1a1c1e] dark:text-[#e3e2e6]"
                                              placeholder="0.00"
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            />
                                          </div>
                                        )}
                                    </div>
                                  ),
                                )}
                                <div className="mt-2 pt-2 border-t border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center px-1">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-[#43474e] dark:text-[#c4c7c5]">
                                    {Object.keys(regPaymentSplits).length === 1
                                      ? "Selected"
                                      : "Total Allocation"}
                                  </span>
                                  <span className="text-base font-black text-[#006e1c] dark:text-[#88d99d]">
                                    {Object.keys(regPaymentSplits).length === 1
                                      ? `Single Method`
                                      : `₹${Object.values(regPaymentSplits)
                                          .reduce((a, b) => a + b, 0)
                                          .toLocaleString()}`}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div>
                        <label className={labelClass}>Remarks</label>
                        <textarea
                          name="remarks"
                          className={`${inputClass} min-h-[100px] resize-none pt-3`}
                          placeholder="Additional clinical or administrative remarks..."
                        ></textarea>
                      </div>
                    </div>
                  </form>
                )}
                {activeModal === "test" && (
                  <form
                    ref={formRef}
                    onSubmit={(e) => e.preventDefault()}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className={labelClass}>Patient Name *</label>
                        <input
                          type="text"
                          name="patient_name"
                          required
                          className={inputClass}
                          placeholder="Full Name"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Age *</label>
                        <input
                          type="text"
                          name="age"
                          required
                          className={inputClass}
                          placeholder="25"
                        />
                      </div>
                      <div>
                        <CustomSelect
                          label="Gender *"
                          value={testGender}
                          onChange={setTestGender}
                          options={[
                            { label: "Male", value: "Male" },
                            { label: "Female", value: "Female" },
                            { label: "Other", value: "Other" },
                          ]}
                          placeholder="Select"
                        />
                        <input type="hidden" name="gender" value={testGender} />
                      </div>
                      <div>
                        <label className={labelClass}>Date of Birth</label>
                        <input type="date" name="dob" className={inputClass} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className={labelClass}>Parents/Guardian</label>
                        <input
                          type="text"
                          name="parents"
                          className={inputClass}
                          placeholder="Name"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Relation</label>
                        <input
                          type="text"
                          name="relation"
                          className={inputClass}
                          placeholder="e.g. Father"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Phone</label>
                        <input
                          type="tel"
                          name="phone_number"
                          maxLength={10}
                          className={inputClass}
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Alt. Phone</label>
                        <input
                          type="tel"
                          name="alternate_phone_no"
                          maxLength={10}
                          className={inputClass}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Address</label>
                      <input
                        type="text"
                        name="address"
                        className={inputClass}
                        placeholder="Full Address"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Referred By *</label>
                        <input
                          list="test_referrers"
                          name="referred_by"
                          required
                          className={inputClass}
                          placeholder="Type or select"
                        />
                        <datalist id="test_referrers">
                          {formOptions?.referrers.map((r: string) => (
                            <option key={r} value={r} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <CustomSelect
                          label="Limb"
                          value={testLimb}
                          onChange={setTestLimb}
                          options={
                            formOptions?.limbTypes.map(
                              (l: {
                                limb_code: string;
                                limb_name: string;
                              }) => ({
                                label: l.limb_name,
                                value: l.limb_code,
                              }),
                            ) || []
                          }
                          placeholder="Select Limb"
                        />
                        <input type="hidden" name="limb" value={testLimb} />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Select Tests *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                        {formOptions?.testTypes
                          ?.filter(
                            (t: { test_code: string }) =>
                              t.test_code !== "other",
                          )
                          .map(
                            (test: {
                              test_code: string;
                              test_name: string;
                            }) => (
                              <div
                                key={test.test_code}
                                onClick={() =>
                                  handleTestCheckChange(
                                    test.test_code,
                                    !selectedTests[test.test_code]?.checked,
                                  )
                                }
                                className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col gap-2 ${selectedTests[test.test_code]?.checked ? "border-[#006e1c] bg-[#ccebc4]/30 dark:bg-[#0c3b10]/30" : "border-transparent bg-[#e0e2ec]/50 dark:bg-[#1a1c1e] hover:bg-[#e0e2ec] dark:hover:bg-[#30333b]"}`}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center ${selectedTests[test.test_code]?.checked ? "bg-[#006e1c] border-[#006e1c]" : "border-[#43474e]"}`}
                                  >
                                    {selectedTests[test.test_code]?.checked && (
                                      <Check size={10} className="text-white" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-[#1a1c1e] dark:text-[#e3e2e6]">
                                    {test.test_name}
                                  </span>
                                </div>
                                {selectedTests[test.test_code]?.checked && (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={
                                      selectedTests[test.test_code]?.amount ||
                                      ""
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                      handleTestAmountChange(
                                        test.test_code,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-white dark:bg-[#111315] border border-[#e0e2ec] dark:border-[#43474e] rounded-lg px-2 py-1 text-sm outline-none"
                                    placeholder="Amount"
                                  />
                                )}
                              </div>
                            ),
                          )}
                      </div>
                      {/* Other Test */}
                      {formOptions?.testTypes
                        ?.filter(
                          (t: { test_code: string }) => t.test_code === "other",
                        )
                        .map(
                          (test: { test_code: string; test_name: string }) => (
                            <div
                              key={test.test_code}
                              className={`mt-3 p-3 border rounded-xl transition-all ${selectedTests[test.test_code]?.checked ? "border-[#006e1c] bg-[#ccebc4]/30" : "border-transparent bg-[#e0e2ec]/50 dark:bg-[#1a1c1e]"}`}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  onClick={() =>
                                    handleTestCheckChange(
                                      test.test_code,
                                      !selectedTests[test.test_code]?.checked,
                                    )
                                  }
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center ${selectedTests[test.test_code]?.checked ? "bg-[#006e1c] border-[#006e1c]" : "border-[#43474e]"}`}
                                  >
                                    {selectedTests[test.test_code]?.checked && (
                                      <Check size={10} className="text-white" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-[#1a1c1e] dark:text-[#e3e2e6]">
                                    {test.test_name}
                                  </span>
                                </div>
                                {selectedTests[test.test_code]?.checked && (
                                  <>
                                    <input
                                      type="text"
                                      value={otherTestName}
                                      onChange={(e) =>
                                        setOtherTestName(e.target.value)
                                      }
                                      placeholder="Test Name"
                                      className="flex-1 bg-white dark:bg-[#111315] border border-[#e0e2ec] dark:border-[#43474e] rounded-lg px-3 py-1.5 text-sm outline-none"
                                    />
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={
                                        selectedTests[test.test_code]?.amount ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleTestAmountChange(
                                          test.test_code,
                                          e.target.value,
                                        )
                                      }
                                      className="w-32 bg-white dark:bg-[#111315] border border-[#e0e2ec] dark:border-[#43474e] rounded-lg px-3 py-1.5 text-sm outline-none"
                                      placeholder="Amount"
                                    />
                                  </>
                                )}
                              </div>
                            </div>
                          ),
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className={labelClass}>Date of Visit *</label>
                        <div
                          onClick={() => {
                            setActiveDateField("test_visit");
                            setShowDatePicker(true);
                          }}
                          className={`${inputClass} cursor-pointer flex items-center justify-between`}
                        >
                          <span>
                            {new Date(testVisitDate).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                          <Calendar
                            size={18}
                            className="text-[#43474e] dark:text-[#c4c7c5]"
                          />
                        </div>
                        <input
                          type="hidden"
                          name="visit_date"
                          value={testVisitDate}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Assigned Date *</label>
                        <div
                          onClick={() => {
                            setActiveDateField("test_assigned");
                            setShowDatePicker(true);
                          }}
                          className={`${inputClass} cursor-pointer flex items-center justify-between`}
                        >
                          <span>
                            {new Date(testAssignedDate).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                          <Calendar
                            size={18}
                            className="text-[#43474e] dark:text-[#c4c7c5]"
                          />
                        </div>
                        <input
                          type="hidden"
                          name="assigned_test_date"
                          value={testAssignedDate}
                        />
                      </div>
                      <div>
                        <CustomSelect
                          label="Test Done By *"
                          value={testDoneBy}
                          onChange={setTestDoneBy}
                          options={
                            formOptions?.staffMembers?.map(
                              (s: {
                                employee_id: number;
                                staff_name: string;
                              }) => ({
                                label: s.staff_name,
                                value: s.staff_name,
                              }),
                            ) || []
                          }
                          placeholder="Select"
                        />
                        <input
                          type="hidden"
                          name="test_done_by"
                          value={testDoneBy}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Receipt No</label>
                        <input
                          type="text"
                          name="receipt_no"
                          className={inputClass}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#f2f6fa] dark:bg-[#1a1c1e] p-4 rounded-xl">
                      <div>
                        <label className={labelClass}>Total Amount *</label>
                        <input
                          type="number"
                          name="total_amount"
                          required
                          className={`${inputClass} font-bold`}
                          value={totalAmount}
                          onChange={(e) => setTotalAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Advance</label>
                        <input
                          type="number"
                          name="advance_amount"
                          className={inputClass}
                          value={advanceAmount}
                          onChange={(e) => setAdvanceAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Discount</label>
                        <input
                          type="number"
                          name="discount"
                          className={inputClass}
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Due Amount</label>
                        {parseFloat(advanceAmount) <= 0 ||
                        parseFloat(discountAmount) > 200 ? (
                          <div
                            className={`${inputClass} flex items-center gap-1 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10`}
                          >
                            <Hourglass size={14} />{" "}
                            <span className="text-xs font-bold uppercase">
                              Pending Approval
                            </span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            name="due_amount"
                            readOnly
                            className={`${inputClass} bg-transparent border border-[#ffdad6] text-[#b3261e] dark:text-[#ffb4ab] font-bold`}
                            value={dueAmount}
                          />
                        )}
                      </div>
                    </div>

                    {/* Payment Method Section - Moved to end */}
                    <div
                      className={
                        parseFloat(advanceAmount || "0") > 0 ? "" : "hidden"
                      }
                    >
                      <div
                        onClick={() => setShowTestPayment(!showTestPayment)}
                        className="flex items-center justify-between cursor-pointer p-3 bg-[#e8eaed] dark:bg-[#28282a] rounded-xl hover:bg-[#dadae2] dark:hover:bg-[#30333b] transition-colors mb-3"
                      >
                        <label className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6] cursor-pointer">
                          Payment Method *
                        </label>
                        <div className="flex items-center gap-2">
                          {Object.keys(testPaymentSplits).length > 0 && (
                            <span className="text-xs font-bold text-[#006e1c] dark:text-[#88d99d] bg-[#ccebc4] dark:bg-[#0c3b10] px-2 py-1 rounded-full">
                              {Object.keys(testPaymentSplits).length} selected
                            </span>
                          )}
                          {showTestPayment ? (
                            <ChevronUp
                              size={20}
                              className="text-[#43474e] dark:text-[#c4c7c5]"
                            />
                          ) : (
                            <ChevronDown
                              size={20}
                              className="text-[#43474e] dark:text-[#c4c7c5]"
                            />
                          )}
                        </div>
                      </div>
                      <AnimatePresence>
                        {showTestPayment && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="bg-[#f8f9fa] dark:bg-[#1e1e20] rounded-xl p-3 border border-[#e0e2ec] dark:border-[#43474e]">
                              <div className="grid grid-cols-2 gap-3">
                                {formOptions?.paymentMethods.map(
                                  (m: {
                                    method_code: string;
                                    method_name: string;
                                  }) => (
                                    <div
                                      key={m.method_code}
                                      className={`flex items-center gap-2 p-2 rounded-lg transition-all ${testPaymentSplits[m.method_code] !== undefined ? "bg-white dark:bg-[#2c2c2e] shadow-sm border border-[#006e1c]" : "bg-[#e8eaed] dark:bg-[#28282a] border border-transparent hover:border-[#006e1c]/30"}`}
                                    >
                                      <div
                                        onClick={() => {
                                          const newSplits = {
                                            ...testPaymentSplits,
                                          };
                                          if (
                                            newSplits[m.method_code] !==
                                            undefined
                                          )
                                            delete newSplits[m.method_code];
                                          else newSplits[m.method_code] = 0;
                                          setTestPaymentSplits(newSplits);
                                        }}
                                        className="flex items-center gap-2 cursor-pointer flex-1"
                                      >
                                        <div
                                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${testPaymentSplits[m.method_code] !== undefined ? "bg-[#006e1c] border-[#006e1c]" : "border-[#74777f]"}`}
                                        >
                                          {testPaymentSplits[m.method_code] !==
                                            undefined && (
                                            <Check
                                              size={14}
                                              className="text-white"
                                              strokeWidth={3}
                                            />
                                          )}
                                        </div>
                                        <span className="text-sm font-semibold text-[#1a1c1e] dark:text-[#e3e2e6]">
                                          {m.method_name}
                                        </span>
                                      </div>
                                      {testPaymentSplits[m.method_code] !==
                                        undefined &&
                                        Object.keys(testPaymentSplits).length >
                                          1 && (
                                          <div className="flex items-center gap-1.5 bg-[#f0f0f0] dark:bg-[#3a3a3c] px-3 py-1.5 rounded-lg min-w-[120px]">
                                            <span className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5]">
                                              ₹
                                            </span>
                                            <input
                                              type="number"
                                              value={
                                                testPaymentSplits[
                                                  m.method_code
                                                ] || ""
                                              }
                                              onChange={(e) =>
                                                setTestPaymentSplits({
                                                  ...testPaymentSplits,
                                                  [m.method_code]:
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                })
                                              }
                                              className="flex-1 bg-transparent border-none text-sm font-semibold text-right outline-none appearance-none text-[#1a1c1e] dark:text-[#e3e2e6]"
                                              placeholder="0.00"
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            />
                                          </div>
                                        )}
                                    </div>
                                  ),
                                )}
                              </div>
                              <div className="mt-3 pt-2 border-t border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-wide text-[#43474e] dark:text-[#c4c7c5]">
                                  {Object.keys(testPaymentSplits).length === 1
                                    ? "Payment Method Selected"
                                    : "Advance Split"}
                                </span>
                                <span className="text-sm font-black text-[#006e1c] dark:text-[#88d99d]">
                                  {Object.keys(testPaymentSplits).length === 1
                                    ? `.`
                                    : `₹${Object.values(testPaymentSplits)
                                        .reduce((a, b) => a + b, 0)
                                        .toLocaleString()}`}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <input
                        type="hidden"
                        name="payment_method"
                        value={
                          parseFloat(advanceAmount || "0") > 0 ? "cash" : "none"
                        }
                      />
                    </div>
                  </form>
                )}
                {(activeModal === "inquiry" ||
                  activeModal === "test_inquiry") && (
                  <form
                    ref={formRef}
                    onSubmit={(e) => e.preventDefault()}
                    className="space-y-6"
                  >
                    {activeModal === "inquiry" && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Patient Name *</label>
                            <input
                              type="text"
                              name="patient_name"
                              required
                              className={inputClass}
                              placeholder="Full Name"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Age *</label>
                            <input
                              type="text"
                              name="age"
                              required
                              className={inputClass}
                              placeholder="e.g. 25 years"
                            />
                          </div>

                          <div>
                            <CustomSelect
                              label="Gender *"
                              value={inqGender}
                              onChange={setInqGender}
                              options={[
                                { label: "Male", value: "Male" },
                                { label: "Female", value: "Female" },
                                { label: "Other", value: "Other" },
                              ]}
                              placeholder="Select"
                            />
                            <input
                              type="hidden"
                              name="gender"
                              value={inqGender}
                            />
                          </div>
                          <div>
                            <CustomSelect
                              label="Inquiry Service *"
                              value={inqService}
                              onChange={setInqService}
                              options={
                                formOptions?.inquiryServiceTypes.map(
                                  (s: {
                                    service_code: string;
                                    service_name: string;
                                  }) => ({
                                    label: s.service_name,
                                    value: s.service_code,
                                  }),
                                ) || []
                              }
                              placeholder="Select"
                            />
                            <input
                              type="hidden"
                              name="inquiry_type"
                              value={inqService}
                            />
                          </div>

                          <div>
                            <CustomSelect
                              label="How did you hear? *"
                              value={inqSource}
                              onChange={setInqSource}
                              options={
                                formOptions?.referralSources.map(
                                  (s: {
                                    source_code: string;
                                    source_name: string;
                                  }) => ({
                                    label: s.source_name,
                                    value: s.source_code,
                                  }),
                                ) || []
                              }
                              placeholder="Select"
                            />
                            <input
                              type="hidden"
                              name="referralSource"
                              value={inqSource}
                            />
                          </div>
                          <div>
                            <CustomSelect
                              label="Communication Type *"
                              value={inqCommType}
                              onChange={setInqCommType}
                              options={[
                                "Call",
                                "Walk-in",
                                "Email",
                                "Chat",
                                "Whatsapp",
                              ].map((v) => ({ label: v, value: v }))}
                              placeholder="Select"
                            />
                            <input
                              type="hidden"
                              name="communication_type"
                              value={inqCommType}
                            />
                          </div>

                          <div>
                            <CustomSelect
                              label="Chief Complaint *"
                              value={inqComplaint}
                              onChange={setInqComplaint}
                              options={
                                formOptions?.chiefComplaints.map(
                                  (c: {
                                    complaint_code: string;
                                    complaint_name: string;
                                  }) => ({
                                    label: c.complaint_name,
                                    value: c.complaint_code,
                                  }),
                                ) || []
                              }
                              placeholder="Select"
                            />
                            <input
                              type="hidden"
                              name="conditionType"
                              value={inqComplaint}
                            />
                            {inqComplaint === "other" && (
                              <div className="mt-2">
                                <input
                                  type="text"
                                  name="conditionType_other"
                                  className={inputClass}
                                  placeholder="Specify other complaint"
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <label className={labelClass}>Mobile No. *</label>
                            <input
                              type="tel"
                              name="phone"
                              required
                              maxLength={10}
                              className={inputClass}
                              placeholder="1234567890"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>
                              Plan to Visit Date *
                            </label>
                            <div
                              onClick={() => {
                                setActiveDateField("inquiry");
                                setShowDatePicker(true);
                              }}
                              className={`${inputClass} cursor-pointer flex items-center justify-between`}
                            >
                              <span>
                                {new Date(inquiryDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                              <Calendar
                                size={18}
                                className="text-[#43474e] dark:text-[#c4c7c5]"
                              />
                            </div>
                            <input
                              type="hidden"
                              name="expected_date"
                              value={inquiryDate}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Remarks</label>
                            <textarea
                              name="remarks"
                              className={`${inputClass} min-h-[50px] resize-none pt-3`}
                              placeholder="Notes..."
                            ></textarea>
                          </div>
                        </div>
                      </>
                    )}

                    {activeModal === "test_inquiry" && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Patient Name *</label>
                            <input
                              type="text"
                              name="patient_name"
                              required
                              className={inputClass}
                              placeholder="Full Name"
                            />
                          </div>
                          <div>
                            <CustomSelect
                              label="Test Name *"
                              value={tiTestName}
                              onChange={setTiTestName}
                              options={
                                formOptions?.testTypes.map(
                                  (t: {
                                    test_code: string;
                                    test_name: string;
                                  }) => ({
                                    label: t.test_name,
                                    value: t.test_code,
                                  }),
                                ) || []
                              }
                              placeholder="Select"
                            />
                            <input
                              type="hidden"
                              name="test_name"
                              value={tiTestName}
                            />
                          </div>

                          <div>
                            <label className={labelClass}>Referred By *</label>
                            <input
                              list="ti_referrers"
                              name="referred_by"
                              required
                              className={inputClass}
                              placeholder="Type"
                            />
                            <datalist id="ti_referrers">
                              {formOptions?.referrers.map((r: string) => (
                                <option key={r} value={r} />
                              ))}
                            </datalist>
                          </div>
                          <div>
                            <label className={labelClass}>Mobile No. *</label>
                            <input
                              type="tel"
                              name="phone_number"
                              required
                              maxLength={10}
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>
                            Expected Visit Date *
                          </label>
                          <div
                            onClick={() => {
                              setActiveDateField("test_inquiry");
                              setShowDatePicker(true);
                            }}
                            className={`${inputClass} cursor-pointer flex items-center justify-between`}
                          >
                            <span>
                              {new Date(testInquiryDate).toLocaleDateString(
                                "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                            <Calendar
                              size={18}
                              className="text-[#43474e] dark:text-[#c4c7c5]"
                            />
                          </div>
                          <input
                            type="hidden"
                            name="expected_visit_date"
                            value={testInquiryDate}
                          />
                        </div>
                      </>
                    )}
                  </form>
                )}
              </div>
              <div className="p-6 border-t border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center bg-[#fdfcff] dark:bg-[#111315] sticky bottom-0 z-10 transition-colors">
                {submitMessage ? (
                  <span
                    className={`text-sm font-bold px-4 py-2 rounded-lg ${submitMessage?.type === "success" ? "bg-[#ccebc4] text-[#0c200e]" : "bg-[#ffdad6] text-[#410002]"}`}
                  >
                    {submitMessage?.text}
                  </span>
                ) : (
                  <span></span>
                )}
                <div className="flex gap-4">
                  <button
                    onClick={closeModal}
                    className="px-6 py-3 text-[#006e1c] dark:text-[#88d99d] font-bold hover:bg-[#ccebc4]/30 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-[#006e1c] text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:bg-[#005313] transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting && (
                      <Loader2 size={18} className="animate-spin" />
                    )}
                    Submit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PHOTO MODAL --- */}
      <AnimatePresence>
        {showPhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[10001] flex items-center justify-center p-4"
          >
            <div className="bg-[#1a1c1e] p-4 rounded-[28px] w-full max-w-lg shadow-2xl">
              <h3 className="text-white text-lg font-bold mb-4 ml-2">
                Capture Photo
              </h3>
              <div className="bg-black rounded-xl overflow-hidden aspect-video border border-[#43474e] relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${photoCaptured ? "hidden" : ""}`}
                ></video>
                <canvas
                  ref={canvasRef}
                  className={`w-full h-full object-cover ${photoCaptured ? "" : "hidden"}`}
                ></canvas>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={closePhotoModal}
                  className="px-6 py-2 text-[#c4c7c5] font-bold hover:text-white transition-colors"
                >
                  Close
                </button>
                {!photoCaptured ? (
                  <button
                    onClick={capturePhoto}
                    className="px-6 py-2 bg-[#d0e4ff] text-[#001d36] rounded-full font-bold hover:bg-[#b0d2ff]"
                  >
                    Snap
                  </button>
                ) : (
                  <>
                    <button
                      onClick={retakePhoto}
                      className="px-6 py-2 bg-[#43474e] text-white rounded-full font-bold hover:bg-[#5f6368]"
                    >
                      Retake
                    </button>
                    <button
                      onClick={usePhoto}
                      className="px-6 py-2 bg-[#ccebc4] text-[#0c200e] rounded-full font-bold hover:bg-[#b0d8a4]"
                    >
                      Use Photo
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CHAT MODAL --- */}
      {showChatModal && (
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
        />
      )}
      {/* --- DATE PICKER --- */}
      <AnimatePresence>
        {showDatePicker && (
          <DatePicker
            value={
              activeDateField === "registration"
                ? appointmentDate
                : activeDateField === "test_visit"
                  ? testVisitDate
                  : activeDateField === "test_assigned"
                    ? testAssignedDate
                    : activeDateField === "inquiry"
                      ? inquiryDate
                      : activeDateField === "test_inquiry"
                        ? testInquiryDate
                        : ""
            }
            onChange={(d: string) => {
              if (activeDateField === "registration")
                handleAppointmentDateChange(d);
              else if (activeDateField === "test_visit") setTestVisitDate(d);
              else if (activeDateField === "test_assigned")
                setTestAssignedDate(d);
              else if (activeDateField === "inquiry") setInquiryDate(d);
              else if (activeDateField === "test_inquiry")
                setTestInquiryDate(d);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        )}
      </AnimatePresence>
      {/* --- TIME PICKER --- */}
      <AnimatePresence>
        {showTimePicker && (
          <TimePicker
            value={appointmentTime}
            onChange={(t: string) => setAppointmentTime(t)}
            onClose={() => setShowTimePicker(false)}
            slots={currentSlots}
          />
        )}
      </AnimatePresence>
      {/* --- GLOBAL COMPONENTS --- */}
      {/* --- APPROVALS MODAL --- */}
      <AnimatePresence>
        {showApprovals && (
          <div
            className="fixed inset-0 z-[10020] bg-black/20 backdrop-blur-md flex items-center justify-center p-6 md:p-10"
            onClick={(e) =>
              e.target === e.currentTarget && setShowApprovals(false)
            }
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className={`w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border transition-colors ${isDark ? "bg-[#121412] border-white/5" : "bg-white border-gray-100"}`}
            >
              <div className="px-8 py-6 flex items-center justify-between sticky top-0 z-10 transition-colors">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    Pending Approvals
                  </h2>
                  <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest mt-0.5">
                    Review zero-cost requests
                  </p>
                </div>
                <button
                  onClick={() => setShowApprovals(false)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"}`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 pb-8 overflow-y-auto custom-scrollbar flex-1">
                {pendingList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 opacity-20">
                    <CheckCircle2 size={48} strokeWidth={1} className="mb-3" />
                    <p className="text-sm font-medium">No pending approvals.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingList.map((item: any, idx: number) => (
                      <div
                        key={`${item.type}-${item.id}-${idx}`}
                        className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? "bg-white/5 border-white/5" : "bg-white border-gray-100 shadow-sm"}`}
                      >
                        <div className="flex gap-4 items-center">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`px-2 py-0.5 rounded text-[12px] font-black uppercase tracking-widest ${item.type === "registration" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"}`}
                              >
                                {item.type}
                              </span>
                              <span className="text-[10px] opacity-30 font-bold">
                                {new Date(item.created_at).toLocaleString()}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold">
                              {item.patient_name}
                            </h3>
                            <p className="text-xs opacity-50 font-medium">
                              {item.type === "test"
                                ? `Test: ${item.test_name}`
                                : `Consultation`}
                            </p>

                            {item.type === "registration" && (
                              <p className="text-sm font-bold mt-2">
                                Amount:{" "}
                                <span className="text-[#006e1c] dark:text-[#4ade80]">
                                  ₹{item.amount}
                                </span>
                              </p>
                            )}

                            {item.type === "test" && (
                              <div className="flex items-center gap-2 mt-3">
                                <div
                                  className={`px-3 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"}`}
                                >
                                  <p className="text-[8px] font-bold uppercase opacity-30 mb-0.5">
                                    Total
                                  </p>
                                  <p className="text-xs font-black">
                                    ₹{item.amount}
                                  </p>
                                </div>
                                <div
                                  className={`px-3 py-1.5 rounded-lg border bg-yellow-500/5 border-yellow-500/10`}
                                >
                                  <p className="text-[8px] font-bold uppercase text-yellow-600 opacity-50 mb-0.5">
                                    Paid
                                  </p>
                                  <p className="text-xs font-black text-yellow-600">
                                    ₹0
                                  </p>
                                </div>
                                <div
                                  className={`px-3 py-1.5 rounded-lg border ${isDark ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"}`}
                                >
                                  <p className="text-[8px] font-bold uppercase opacity-30 mb-0.5">
                                    Discount
                                  </p>
                                  <p className="text-xs font-black">₹0</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-yellow-500/5 text-yellow-600 dark:text-yellow-500 border border-yellow-500/10 shrink-0">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Awaiting Approval
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <KeyboardShortcuts
        shortcuts={shortcuts}
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        onToggle={() => setShowShortcuts((prev) => !prev)}
      />

      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          navigate("/login");
        }}
      />

      <DailyIntelligence
        isOpen={showIntelligence}
        onClose={() => setShowIntelligence(false)}
      />

      <NotesDrawer isOpen={showNotes} onClose={() => setShowNotes(false)} />
    </div>
  );
};

export default ReceptionDashboard;
