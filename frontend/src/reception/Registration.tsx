import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { toast as sonnerToast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  ChevronDown,
  Calendar,
  Phone,
  Stethoscope,
  X,
  Printer,
  Check,
  RotateCcw,
  Clock,
  UserPlus,
  AlertCircle,
  Trash2,
  History as HistoryIcon,
  RefreshCw,
  CheckCircle2,
  Search,
  User,
  Lock,
  Zap,
  Activity,
  HeartPulse,
  Syringe,
  Microscope,
  Dna,
  FlaskConical,
  Brain,
  HandHelping,
  ShieldPlus,
  Bone,
  Waves,
  Timer,
  Pill,
  Box,
  Plus,
  Eye,
  CreditCard,
  Users,
  FileText,
  Ticket,
} from "lucide-react";
import CustomSelect from "../components/ui/CustomSelect";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { API_BASE_URL, authFetch, FILE_BASE_URL } from "../config";
import { format, parseISO, isValid } from "date-fns";
import { useDashboardStore, useRegistrationStore } from "../store";
import { useThemeStore } from "../store/useThemeStore";
import DynamicServiceModal from "../components/reception/DynamicServiceModal";
import UpdatePaymentModal from "../components/reception/UpdatePaymentModal";
import PageHeader from "../components/PageHeader";
import Sidebar from "../components/Sidebar";
import DailyIntelligence from "../components/DailyIntelligence";
import NotesDrawer from "../components/NotesDrawer";
import LogoutConfirmation from "../components/LogoutConfirmation";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import type { ShortcutItem } from "../components/KeyboardShortcuts";
import ChatModal from "../components/Chat/ChatModal";
import ActionFAB from "../components/ActionFAB";

const AVAILABLE_ICONS = [
  { name: "Activity", icon: Activity },
  { name: "Zap", icon: Zap },
  { name: "Clock", icon: Clock },
  { name: "Calendar", icon: Calendar },
  { name: "Stethoscope", icon: Stethoscope },
  { name: "HeartPulse", icon: HeartPulse },
  { name: "Syringe", icon: Syringe },
  { name: "Microscope", icon: Microscope },
  { name: "Dna", icon: Dna },
  { name: "FlaskConical", icon: FlaskConical },
  { name: "Brain", icon: Brain },
  { name: "HandHelping", icon: HandHelping },
  { name: "ShieldPlus", icon: ShieldPlus },
  { name: "Bone", icon: Bone },
  { name: "Waves", icon: Waves },
  { name: "Timer", icon: Timer },
  { name: "Pill", icon: Pill },
  { name: "Box", icon: Box },
  { name: "User", icon: User },
  { name: "Check", icon: Check },
  { name: "CreditCard", icon: CreditCard },
  { name: "Plus", icon: Plus },
  { name: "Eye", icon: Eye },
  { name: "UserPlus", icon: UserPlus },
];

const StatusDropdown = ({
  currentStatus,
  onUpdate,
  getStatusColors,
}: {
  currentStatus: string;
  onUpdate: (val: string) => void;
  getStatusColors: (s: string) => string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
      });
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const close = () => setIsOpen(false);
    if (isOpen) {
      window.addEventListener("click", close);
      window.addEventListener("scroll", close, true);
    }
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [isOpen]);

  const options = [
    { value: "pending", label: "Pending" },
    { value: "consulted", label: "Consulted" },
    { value: "closed", label: "Closed" },
  ];

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggleOpen}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${getStatusColors(currentStatus)}`}
      >
        <span>{currentStatus}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed z-[99999] bg-white dark:bg-[#1A1C1E] rounded-2xl shadow-2xl overflow-hidden flex flex-col p-2 min-w-[160px] border border-slate-200 dark:border-white/5"
              style={{ top: coords.top, left: coords.left }}
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onUpdate(opt.value);
                    setIsOpen(false);
                  }}
                  className={`
                                    w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all mb-1 last:mb-0 flex items-center justify-between group
                                    ${
                                      currentStatus?.toLowerCase() ===
                                      opt.value?.toLowerCase()
                                        ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-black/20"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                                    }
                                `}
                >
                  {opt.label}
                  {currentStatus?.toLowerCase() ===
                    opt.value?.toLowerCase() && (
                    <Check size={12} strokeWidth={3} className="opacity-80" />
                  )}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

interface RegistrationRecord {
  registration_id: number;
  patient_name: string;
  phone_number: string;
  consultation_amount: string;
  status: string;
  created_at: string;
  approval_status?: string;
  chief_complain?: string;
  consultation_type?: string;
  reffered_by?: string;
  payment_method?: string;
  patient_photo_path?: string;
}

const getPhotoUrl = (path: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cleanPath = path.replace("admin/desktop/server/", "");
  return `${FILE_BASE_URL}/${cleanPath}`;
};

const PatientAvatar = ({
  photoPath,
  name,
}: {
  photoPath?: string;
  name: string;
}) => {
  const [error, setError] = useState(false);

  if (photoPath && !error && photoPath !== "null" && photoPath !== "") {
    return (
      <div className="w-full h-full overflow-hidden">
        <img
          src={getPhotoUrl(photoPath) || ""}
          alt={name}
          onError={() => setError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/10 flex items-center justify-center`}
    >
      <User size={32} strokeWidth={1.5} className="text-emerald-600/40" />
    </div>
  );
};

const Registration = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleFABAction = (action: any) => {
    navigate("/reception/dashboard", { state: { openModal: action } });
  };
  const { isDark, toggleTheme } = useThemeStore();
  const { data: dashboardData } = useDashboardStore();

  // Local state for UI only
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  // UI State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Payment Fix Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedForPaymentFix, setSelectedForPaymentFix] =
    useState<RegistrationRecord | null>(null);

  // Dynamic Service Track State

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

  // Header State
  const { setShowGlobalSearch, showGlobalSearch } = useDashboardStore();

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleClickOutside = () => {
    // General click outside handling if needed
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Use selectors for stability
  const storeRegistrations = useRegistrationStore((s) => s.registrations);
  const storeOptions = useRegistrationStore((s) => s.options);
  const storeServiceTracks = useRegistrationStore((s) => s.serviceTracks);
  const detailsCache = useRegistrationStore((s) => s.detailsCache);

  const setRegistrations = useRegistrationStore((s) => s.setRegistrations);
  const setOptions = useRegistrationStore((s) => s.setOptions);
  const setServiceTracks = useRegistrationStore((s) => s.setServiceTracks);
  const setLastParams = useRegistrationStore((s) => s.setLastParams);
  const setLastFetched = useRegistrationStore((s) => s.setLastFetched);
  const setRegistrationsCache = useRegistrationStore(
    (s) => s.setRegistrationsCache,
  );
  const setDetailsCache = useRegistrationStore((s) => s.setDetailsCache);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [referrerFilter, setReferrerFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [isLoading, setIsLoading] = useState(() => {
    const existing = useRegistrationStore.getState().registrations;
    return !existing || existing.length === 0;
  });
  const [currentPage, setCurrentPage] = useState(1);

  const storeData = storeRegistrations || [];

  // --- CLIENT SIDE FILTERING ---
  const filteredRegistrations = useMemo(() => {
    let data = [...storeData];
    // ... filter logic ...
    // Search Filter
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      data = data.filter(
        (r) =>
          r.patient_name?.toLowerCase().includes(lower) ||
          r.phone_number?.includes(lower) ||
          r.registration_id?.toString().includes(lower) ||
          r.patient_uid?.toLowerCase().includes(lower),
      );
    }

    // Status Filter
    if (statusFilter) {
      data = data.filter(
        (r) => r.status?.toLowerCase() === statusFilter.toLowerCase(),
      );
    } else {
      // By default, hide closed registrations (matches server-side fetch logic)
      data = data.filter((r) => r.status?.toLowerCase() !== "closed");
    }

    // Referrer Filter
    if (referrerFilter) {
      data = data.filter((r) => r.reffered_by === referrerFilter);
    }

    // Condition Filter
    if (conditionFilter) {
      data = data.filter((r) => r.chief_complain === conditionFilter);
    }

    return data;
  }, [storeData, searchQuery, statusFilter, referrerFilter, conditionFilter]);

  // Pagination Logic
  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(filteredRegistrations.length / ITEMS_PER_PAGE);

  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRegistrations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRegistrations, currentPage]);

  const registrations = paginatedRegistrations; // Use this for display

  const pagination = {
    total: filteredRegistrations.length,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    total_pages: totalPages || 1,
  };

  const options = storeOptions || {
    referred_by: [],
    conditions: [],
    types: [],
    payment_methods: [],
  };
  const serviceTracks = storeServiceTracks || [];

  // Pagination state is declared above but initialized here in state if needed,
  // actually I moved it up to be near pagination variable.
  // removing duplicate declaration if any.
  // const [currentPage, setCurrentPage] = useState(storePagination?.page || 1); <- REMOVED, declared above

  // Dynamic Service Track State
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [isDynamicModalOpen, setIsDynamicModalOpen] = useState(false);

  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(
    null,
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [printMenuCoords, setPrintMenuCoords] = useState({ top: 0, right: 0 });
  const printButtonRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initial load ref to prevent multiple spinners
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isDetailsModalOpen || isBillModalOpen || confirmModal.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isDetailsModalOpen, isBillModalOpen, confirmModal.isOpen]);

  const fetchRegistrations = useCallback(
    async (forceRefresh = false) => {
      if (!user?.branch_id) return;

      // FETCH ALL DATA (Limit 1000)
      const currentParams = {
        action: "fetch",
        branch_id: user.branch_id,
        limit: 1000,
        page: 1, // Get everything
        // No search/filter params sent to API
      };

      const cacheKey = JSON.stringify(currentParams);

      // Cache logic:
      if (!forceRefresh) {
        const {
          registrations: currentRegistrations,
          lastParams: currentLastParams,
          registrationsCache: currentCache,
        } = useRegistrationStore.getState();

        // ONLY use cache if we have both the raw data and the cache keyed for this exact request
        if (
          currentLastParams &&
          cacheKey === JSON.stringify(currentLastParams) &&
          currentRegistrations &&
          currentRegistrations.length > 0 &&
          currentCache &&
          currentCache[cacheKey]
        ) {
          setIsLoading(false);
          return;
        }
      }

      const { registrations: currentRegistrations } =
        useRegistrationStore.getState();

      if (isFirstLoad.current || !currentRegistrations || forceRefresh === true)
        setIsLoading(true);

      try {
        const res = await authFetch(`${API_BASE_URL}/reception/registration`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(forceRefresh && { "X-Refresh": "true" }),
          },
          body: JSON.stringify(currentParams),
        });
        const data = await res.json();
        if (data.status === "success") {
          setRegistrations(data.data || []);
          // setPagination(data.pagination); // Local pagination
          setLastParams(currentParams);
          setLastFetched(Date.now());
          setRegistrationsCache(cacheKey, data.data || [], data.pagination);
        }
      } catch (err) {
        console.error("Failed to fetch registrations:", err);
      } finally {
        setIsLoading(false);
        isFirstLoad.current = false;
      }
    },
    [
      user?.branch_id,
      setRegistrations,
      setLastParams,
      setLastFetched,
      setRegistrationsCache,
    ],
  );

  const handleRefresh = async () => {
    if (refreshCooldown > 0 || !user?.branch_id) return;

    const fetchDash = authFetch(
      `${API_BASE_URL}/reception/dashboard?branch_id=${user.branch_id}`,
      { headers: { "X-Refresh": "true" } },
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          useDashboardStore.setState({ data: data.data });
        }
      })
      .catch(console.error);

    const promise = Promise.all([fetchRegistrations(true), fetchDash]);

    sonnerToast.promise(promise, {
      loading: "Refreshing registrations & stats...",
      success: "Data updated",
      error: "Failed to refresh",
    });

    setRefreshCooldown(20);
  };

  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(
        () => setRefreshCooldown((prev) => prev - 1),
        1000,
      );
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, referrerFilter, conditionFilter]);

  // NO handleSearch needed for fetching anymore, just for UX (maybe scroll to top?)
  const handleSearch = () => {
    // No-op or just ensure page 1
    setCurrentPage(1);
  };

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(() => {
    if (user?.branch_id) {
      authFetch(
        `${API_BASE_URL}/reception/dashboard?branch_id=${user.branch_id}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            useDashboardStore.setState({ data: data.data });
          }
        })
        .catch(console.error);
    }
  }, [user?.branch_id]);

  useEffect(() => {
    if (!dashboardData && user?.branch_id) {
      fetchDashboardStats();
    }
  }, [dashboardData, user?.branch_id, fetchDashboardStats]);

  // DERIVED STATS FOR LEFT PANEL (Overall Registry)
  const registryStats = useMemo(() => {
    const data = storeRegistrations || [];
    return {
      total: data.length,
      // Strictly separate: Pending only counts items NOT stuck in approval
      pending: data.filter(
        (r) =>
          r.status?.toLowerCase() === "pending" &&
          r.approval_status?.toLowerCase() !== "pending",
      ).length,
      consulted: data.filter((r) =>
        ["consulted", "closed"].includes(r.status?.toLowerCase()),
      ).length,
      approval_pending: data.filter(
        (r) => r.approval_status?.toLowerCase() === "pending",
      ).length,
    };
  }, [storeRegistrations]);

  // --- Shortcuts ---
  const shortcuts: ShortcutItem[] = [
    // General
    {
      keys: ["Alt", "/"],
      description: "Keyboard Shortcuts",
      group: "General",
      action: () => setShowShortcuts((prev) => !prev),
    },
    {
      keys: ["Alt", "S"],
      description: "Global Search",
      group: "General",
      action: () => setShowGlobalSearch(true),
    },
    {
      keys: ["Alt", "W"],
      description: "Toggle Theme",
      group: "General",
      action: toggleTheme,
    },
    {
      keys: ["Alt", "L"],
      description: "Logout",
      group: "Actions",
      action: () => setShowLogoutConfirm(true),
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
      description: "Inquiry",
      group: "Navigation",
      action: () => navigate("/reception/inquiry"),
    },
    {
      keys: ["Alt", "4"],
      description: "Registration",
      group: "Navigation",
      action: () => navigate("/reception/registration"),
    },
    {
      keys: ["Alt", "5"],
      description: "Patients",
      group: "Navigation",
      action: () => navigate("/reception/patients"),
    },

    // Registration Specific
    {
      keys: ["Alt", "R"],
      description: "Refresh List",
      group: "Registration",
      action: () => handleRefresh(),
      pageSpecific: true,
    },
    {
      keys: ["Ctrl", "R"],
      description: "Refresh Page",
      group: "General",
      action: () => handleRefresh(),
    },
    {
      keys: ["Alt", "F"],
      description: "Focus Search",
      group: "Registration",
      action: () => searchInputRef.current?.focus(),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "C"],
      description: "Toggle Chat",
      group: "General",
      action: () => setShowChatModal((prev) => !prev),
    },
    {
      keys: ["Alt", "Shift", "X"],
      description: "Reset Filters",
      group: "Registration",
      action: () => {
        setSearchQuery("");
        // setActiveSearchQuery(""); // Removed
        setStatusFilter("");
        setReferrerFilter("");
        setConditionFilter("");
        setCurrentPage(1);
        // Force refresh after reset
        setTimeout(() => fetchRegistrations(true), 0);
      },
      pageSpecific: true,
    },
    {
      keys: ["Alt", "Q"],
      description: "Show Pending",
      group: "Registration",
      action: () => {
        setStatusFilter("pending");
        setCurrentPage(1);
      },
      pageSpecific: true,
    },
    {
      keys: ["Alt", "X"],
      description: "Show Consulted",
      group: "Registration",
      action: () => {
        setStatusFilter("consulted");
        setCurrentPage(1);
      },
      pageSpecific: true,
    },
    {
      keys: ["Alt", "Z"],
      description: "Clear Status",
      group: "Registration",
      action: () => {
        setStatusFilter("");
        setCurrentPage(1);
      },
      pageSpecific: true,
    },
    {
      keys: ["Alt", "ArrowLeft"],
      description: "Previous Page",
      group: "Registration",
      action: () => {
        if (currentPage > 1) setCurrentPage((p: number) => p - 1);
      },
      pageSpecific: true,
    },
    {
      keys: ["Alt", "ArrowRight"],
      description: "Next Page",
      group: "Registration",
      action: () => {
        if (currentPage < pagination.total_pages)
          setCurrentPage((p: number) => p + 1);
      },
      pageSpecific: true,
    },
    {
      keys: ["Alt", "H"],
      description: "Cancelled History",
      group: "Registration",
      action: () => navigate("/reception/registration/cancelled"),
      pageSpecific: true,
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape Handler
      if (e.key === "Escape") {
        if (showGlobalSearch) setShowGlobalSearch(false);
        else if (showShortcuts) setShowShortcuts(false);
        else if (isDetailsModalOpen) {
          setIsDetailsModalOpen(false);
          setIsDynamicModalOpen(false);
          setSelectedTrack(null);
        }
        return;
      }

      // Standard Shortcuts (Alt based)
      // Removed unused manual key/altKey checks as they are handled in the loop below

      shortcuts.forEach((s) => {
        const keys = s.keys.map((k) => k.toLowerCase());
        const altRequired = keys.includes("alt");
        const ctrlRequired = keys.includes("ctrl");
        const shiftRequired = keys.includes("shift");

        const targetKey = keys.filter(
          (k) => k !== "alt" && k !== "ctrl" && k !== "shift",
        )[0];

        const keyMatch = e.key.toLowerCase() === targetKey.toLowerCase();
        const altMatch = e.altKey === altRequired;
        const ctrlMatch = e.ctrlKey === ctrlRequired;
        const shiftMatch = e.shiftKey === shiftRequired;

        if (keyMatch && altMatch && ctrlMatch && shiftMatch) {
          e.preventDefault();
          if (s.action) s.action();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    setShowGlobalSearch, // Changed from showGlobalModal
    showShortcuts,
    showLogoutConfirm,
    isPaymentModalOpen,
    isDetailsModalOpen,
    fetchRegistrations,
    navigate,
  ]);

  useEffect(() => {
    if (!user?.branch_id) return;
    fetchRegistrations(false);
  }, [user?.branch_id, fetchRegistrations]);

  const fetchOptions = useCallback(async () => {
    if (!user?.branch_id) return;

    // Cache check — read from store directly to avoid dependency loop
    const { options: currentOptions, serviceTracks: currentTracks } =
      useRegistrationStore.getState();
    if (
      currentOptions &&
      Object.keys(currentOptions).length > 0 &&
      currentTracks &&
      currentTracks.length > 0
    ) {
      return;
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/registration`, {
        method: "POST",
        body: JSON.stringify({ action: "options", branch_id: user.branch_id }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setOptions(data.data);
        if (data.data && data.data.service_tracks) {
          const mappedTracks = data.data.service_tracks.map((track: any) => ({
            id: track.id,
            name: track.name || "Unnamed Service",
            buttonLabel: track.button_label || track.name || "Initialize",
            icon: track.icon || "Zap",
            themeColor: track.theme_color || "#10b981",
            fields:
              typeof track.fields === "string"
                ? JSON.parse(track.fields || "[]")
                : track.fields || [],
            pricing:
              typeof track.pricing === "string"
                ? JSON.parse(track.pricing || "{}")
                : track.pricing || {},
            scheduling:
              typeof track.scheduling === "string"
                ? JSON.parse(track.scheduling || "{}")
                : track.scheduling || {},
            permissions:
              typeof track.permissions === "string"
                ? JSON.parse(track.permissions || "{}")
                : track.permissions || {},
            isActive: !!track.is_active,
          }));
          setServiceTracks(mappedTracks);
        }
      }
    } catch (err) {
      console.error("Failed to fetch options:", err);
    }
  }, [user?.branch_id, setOptions, setServiceTracks]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    // Optimistic update - MUST use storeData (the full list) NOT registrations (the paginated slice)
    const updatedRegistrations = storeData.map((reg: any) =>
      reg.registration_id === id ? { ...reg, status: newStatus } : reg,
    );
    setRegistrations(updatedRegistrations);

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_status",
          id,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(`Registration status updated to ${newStatus}`, "success");
        // Update local list state optimistically for all pages
        const updatedRegistrations = storeData.map((reg: any) =>
          reg.registration_id === id ? { ...reg, status: newStatus } : reg,
        );
        // If it was closed, we hide it from the current view list
        const finalData =
          newStatus === "closed"
            ? updatedRegistrations.filter((r) => r.registration_id !== id)
            : updatedRegistrations;

        setRegistrations(finalData);

        // Clear only the cancelled cache so that page gets fresh view of recovery list from SQLite
        useRegistrationStore.setState({
          cancelledRegistrationsCache: null,
          registrationsCache: {}, // Clear page-cache as counts/pages changed
        });
      } else {
        showToast(data.message || "Failed to update status", "error");
        fetchRegistrations(false); // Revert to local SQLite state on failure
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast("An error occurred while updating status", "error");
      fetchRegistrations(false);
    }
  };

  const fetchDetails = async (id: number, forceRefresh = false) => {
    // Cache check
    if (!forceRefresh && detailsCache && detailsCache[id]) {
      setSelectedRegistration(detailsCache[id]);
      setIsEditing(false);
      setIsDetailsModalOpen(true);
      return;
    }

    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/registration?action=details&id=${id}`,
        { method: "POST", body: JSON.stringify({ action: "details", id }) },
      );
      const data = await res.json();
      if (data.status === "success") {
        setDetailsCache(id, data.data);
        setSelectedRegistration(data.data);
        setIsEditing(false); // Reset edit mode when opening new details
        setIsDetailsModalOpen(true);
        if (forceRefresh) {
          showToast("Registration Profile Updated", "success");
        }
      }
    } catch (err) {
      console.error("Failed to fetch details:", err);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedRegistration) return;
    setIsSaving(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_details",
          registration_id: selectedRegistration.registration_id,
          ...editData,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setIsEditing(false);
        // Clear details cache for this item
        setDetailsCache(selectedRegistration.registration_id, null);

        // Optimistic update of the list record
        const updatedList = storeData.map((reg) =>
          reg.registration_id === selectedRegistration.registration_id
            ? { ...reg, ...editData, status: editData.status || reg.status }
            : reg,
        );

        // If status changed to closed during edit, hide it
        const finalRegistrations =
          editData.status === "closed"
            ? updatedList.filter(
                (r) =>
                  r.registration_id !== selectedRegistration.registration_id,
              )
            : updatedList;

        setRegistrations(finalRegistrations);

        // Clear caches to reflect changes in other views
        useRegistrationStore.setState({
          registrationsCache: {},
          cancelledRegistrationsCache: null,
        });

        // Refresh details modal locally
        fetchDetails(selectedRegistration.registration_id, true);
        showToast("Clinical Profile Synchronized Successfully", "success");
      }
    } catch (err) {
      console.error("Failed to save details:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => {
    setEditData({ ...selectedRegistration });
    setIsEditing(true);
  };

  const navigateToBill = (_id: number) => {
    setIsBillModalOpen(true);
  };

  const handlePrintBill = () => {
    const printContent = document.getElementById("printable-bill");
    if (!printContent) return;

    const printWindow = window.open("", "", "height=800,width=800");
    if (!printWindow) return;

    printWindow.document.write("<html><head><title>Print Bill</title>");
    printWindow.document.write(
      '<script src="https://cdn.tailwindcss.com"></script>',
    );
    printWindow.document.write(
      '<style>@media print { body { padding: 0 !important; } .no-print { display: none; } } body { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }</style>',
    );
    printWindow.document.write('</head><body class="p-10 bg-white">');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();

    // Wait for Tailwind to process or images to load
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 1000);
  };

  const handlePrintThermalBill = () => {
    const printContent = document.getElementById("thermal-bill-template");
    if (!printContent) {
      sonnerToast.error("Thermal template not found");
      return;
    }

    const printWindow = window.open("", "", "height=600,width=400");
    if (!printWindow) return;

    printWindow.document.write("<html><head><title>Thermal Receipt</title>");
    printWindow.document.write(
      '<style>@media print { body { margin: 0; padding: 0; } } body { font-family: "Courier New", Courier, monospace; width: 80mm; }</style>',
    );
    printWindow.document.write("</head><body>");
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const formatDateSafe = (
    dateInput: any,
    formatPattern: string = "MMM dd, yyyy",
  ) => {
    if (!dateInput) return "N/A";

    let dateObj: Date;

    if (typeof dateInput === "number") {
      dateObj = new Date(dateInput);
    } else if (typeof dateInput === "string") {
      if (/^\d+\.?\d*$/.test(dateInput)) {
        // Handle numeric strings like "1764672665000"
        dateObj = new Date(parseFloat(dateInput));
      } else {
        // Standard ISO parsing
        dateObj = parseISO(dateInput.replace(" ", "T"));
      }
    } else {
      return "N/A";
    }

    return isValid(dateObj) ? format(dateObj, formatPattern) : "Invalid Date";
  };

  const getStatusColors = (status: string) => {
    const s = status?.toLowerCase()?.trim();
    switch (s) {
      case "consulted":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      case "closed":
        return "bg-rose-500/10 text-rose-600 border-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
    }
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#0A0A0A] overflow-hidden transition-colors duration-500">
      <Sidebar
        onShowChat={() => setShowChatModal(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <PageHeader
          title="Registration"
          subtitle="Operations Center"
          icon={UserPlus}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          refreshCooldown={refreshCooldown}
          onShowIntelligence={() => setShowIntelligence(true)}
          onShowNotes={() => setShowNotes(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* === STATS PANEL (Left Column) === */}
          <motion.div
            variants={leftPanelEntrance}
            initial="hidden"
            animate="visible"
            className={`hidden xl:flex w-[400px] flex-col justify-between p-8 border-r relative shrink-0 transition-colors duration-300 z-50 ${
              isDark
                ? "bg-[#0A0A0A] border-[#151515]"
                : "bg-white border-gray-100"
            }`}
          >
            {/* Brand & Greeting */}
            <div className="space-y-8 z-10 text-[#1a1c1e] dark:text-[#e3e2e6]">
              <div className="space-y-3">
                <h1 className="text-4xl font-serif font-normal tracking-tight leading-tight">
                  Registration{" "}
                  <span
                    className={`italic ${isDark ? "text-[#4ADE80]" : "text-[#16a34a]"}`}
                  >
                    Ops
                  </span>
                </h1>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">
                  Daily operational overview & patient registry.
                </p>
              </div>
            </div>

            {/* --- REDESIGNED STATS PANEL --- */}
            <div className="space-y-8 w-full flex-1 flex flex-col py-6 text-[#1a1c1e] dark:text-[#e3e2e6]">
              {/* SECTION 1: REGISTRATION OVERVIEW */}
              <div className="space-y-6">
                {/* Big Numbers */}
                <div className="flex items-end justify-between p-6 bg-[#F8F9FA] dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={80} className="text-emerald-500" />
                  </div>

                  <div className="relative z-10">
                    <div className="text-7xl font-medium tracking-tighter leading-none text-emerald-950 dark:text-emerald-50">
                      {dashboardData?.registration.today_total || 0}
                    </div>
                    <div className="text-[10px] font-black opacity-50 mt-2 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Today's Volume
                    </div>
                  </div>
                  <div className="text-right relative z-10">
                    <div className="text-3xl font-medium opacity-60">
                      {dashboardData?.registration.month_total || 0}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-wide opacity-40 mt-1">
                      This Month
                    </div>
                  </div>
                </div>

                {/* Global Registry Totals (Derived from Data) */}
                <div className="pt-4 border-t border-gray-100 dark:border-white/5 mt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-4">
                    Global Registry
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm group p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-default">
                      <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                        Total Records
                      </span>
                      <span className="font-bold text-lg">
                        {registryStats.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm group p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-default">
                      <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]"></span>
                        Overall Pending
                      </span>
                      <span className="font-bold text-lg text-amber-600">
                        {registryStats.pending}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm group p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-default">
                      <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></span>
                        Total Consulted
                      </span>
                      <span className="font-bold text-lg text-emerald-600">
                        {registryStats.consulted}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm group p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-default">
                      <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,113,0.3)]"></span>
                        Needs Approval
                      </span>
                      <span className="font-bold text-lg text-rose-500">
                        {registryStats.approval_pending}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: LIVE CENSUS */}
              <div className="mt-auto p-5 rounded-3xl bg-[#0F172A] dark:bg-black/40 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3 opacity-80">
                      <Users size={14} className="text-emerald-400" />
                      <span
                        className="text-[10px] font-black uppercase tracking-widest"
                        title="Total number of active patients currently in progress/treatment at this branch."
                      >
                        Active Patients
                      </span>
                    </div>
                    <div className="text-4xl font-medium tracking-tight">
                      {dashboardData?.patients.active || 0}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                    <Activity size={18} className="text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Decoration */}
            <div className="absolute top-1/2 left-0 w-full h-full bg-gradient-to-t from-emerald-900/5 to-transparent pointer-events-none" />
          </motion.div>

          {/* Main Content (Right Panel) */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 custom-scrollbar bg-[#FAFAFA] dark:bg-[#0A0A0A]">
            <div className="max-w-[1600px] mx-auto">
              {/* Filter Area */}
              {/* Top Control Bar */}
              <div className="flex flex-col gap-8 mb-10">
                {/* Search & Filters Bar */}
                <div className="flex flex-col xl:flex-row items-center justify-between gap-4 p-2">
                  <div className="relative group w-full xl:max-w-md">
                    <Search
                      size={18}
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors cursor-pointer"
                      onClick={handleSearch}
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search patient, phone or ID (Press Enter)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearch();
                        }
                      }}
                      className="w-full pl-12 pr-6 py-4 rounded-[20px] bg-white dark:bg-[#1A1C1E] border border-gray-100 dark:border-white/5 focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 outline-none text-sm font-medium transition-all shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                    <div className="min-w-[160px] flex-1 xl:flex-none">
                      <CustomSelect
                        value={statusFilter}
                        onChange={setStatusFilter}
                        placeholder="Status"
                        className="!py-3.5 !rounded-[20px] !bg-white dark:!bg-[#1A1C1E] !border-gray-100 dark:!border-white/5 !shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)]"
                        options={[
                          { value: "", label: "All Status" },
                          { value: "pending", label: "Pending" },
                          { value: "consulted", label: "Consulted" },
                          { value: "closed", label: "Closed" },
                        ]}
                      />
                    </div>
                    <div className="min-w-[180px] flex-1 xl:flex-none">
                      <CustomSelect
                        value={referrerFilter}
                        onChange={setReferrerFilter}
                        placeholder="Referrer"
                        className="!py-3.5 !rounded-[20px] !bg-white dark:!bg-[#1A1C1E] !border-gray-100 dark:!border-white/5 !shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)]"
                        options={[
                          { value: "", label: "All Referrers" },
                          ...options.referred_by.map((r: string) => ({
                            value: r,
                            label: r,
                          })),
                        ]}
                      />
                    </div>
                    <div className="min-w-[180px] flex-1 xl:flex-none">
                      <CustomSelect
                        value={conditionFilter}
                        onChange={setConditionFilter}
                        placeholder="Condition"
                        className="!py-3.5 !rounded-[20px] !bg-white dark:!bg-[#1A1C1E] !border-gray-100 dark:!border-white/5 !shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)]"
                        options={[
                          { value: "", label: "All Conditions" },
                          ...options.conditions.map((c: string) => ({
                            value: c,
                            label: c,
                          })),
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats & Actions Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                  <div className="flex items-center gap-3">
                    <div className="px-5 py-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-[#43474e] dark:text-[#c4c7c5] shadow-sm">
                      Total:{" "}
                      <span className="text-[#1a1c1e] dark:text-white ml-1">
                        {pagination.total} Records
                      </span>
                    </div>
                    <div className="px-5 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm">
                      Page {currentPage} of {pagination.total_pages}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        navigate("/reception/registration/cancelled")
                      }
                      className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/5 text-slate-500 dark:text-[#c4c7c5] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/10 transition-all border border-gray-100 dark:border-white/5 shadow-sm hover:shadow"
                    >
                      <HistoryIcon size={14} className="opacity-50" />
                      Cancelled History
                    </button>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("");
                        setReferrerFilter("");
                        setConditionFilter("");
                        setCurrentPage(1);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 dark:bg-[#93000a]/20 text-rose-700 dark:text-[#ffdad6] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-[#93000a]/40 transition-all border border-rose-100 dark:border-transparent shadow-sm hover:shadow"
                    >
                      <RotateCcw size={14} />
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Layout */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">
                    Loading Records...
                  </p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#1a1c1e] rounded-[32px] border border-dashed border-gray-200 dark:border-white/10 shadow-sm">
                  <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-[#43474e] flex items-center justify-center text-gray-400 dark:text-[#c4c7c5] mb-6">
                    <Search size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6] mb-2 font-serif">
                    No results found
                  </h3>
                  <p className="text-gray-400 dark:text-[#c4c7c5] max-w-xs text-center text-sm leading-relaxed">
                    Try adjusting your filters or search query to find the
                    registration you are looking for.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Table Header */}
                  <div className="hidden lg:grid grid-cols-[1.8fr_1.3fr_1fr_1.3fr_1fr_1fr] gap-6 px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-black/[0.03] dark:border-white/[0.03] mb-2 select-none">
                    <div className="flex items-center gap-2">Patient</div>
                    <div className="flex items-center gap-2">Contact</div>
                    <div className="flex items-center gap-2">Fees</div>
                    <div className="flex items-center gap-2">Date</div>
                    <div className="text-center">State</div>
                    <div className="text-right pr-4">Action</div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-3 pb-20"
                  >
                    {registrations.map((reg, idx) => (
                      <motion.div
                        key={reg.registration_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { delay: idx * 0.03 },
                        }}
                        className={`group rounded-[24px] px-8 py-5 border transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-[1px] cursor-pointer relative overflow-hidden grid lg:grid-cols-[1.8fr_1.3fr_1fr_1.3fr_1fr_1fr] gap-6 items-center ${
                          isDark
                            ? "bg-[#141619] border-white/5 hover:border-emerald-500/20"
                            : "bg-white border-gray-100 hover:border-emerald-500/20 shadow-sm"
                        }`}
                      >
                        {/* Status Vertical Accent */}
                        <div
                          className={`absolute left-0 top-0 w-1.5 h-full transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                            reg.status === "consulted"
                              ? "bg-emerald-500"
                              : reg.status === "pending"
                                ? "bg-amber-500"
                                : "bg-slate-300"
                          }`}
                        />

                        {/* Patient Details */}
                        <div
                          className="flex items-center gap-5 min-w-0"
                          onClick={() => fetchDetails(reg.registration_id)}
                        >
                          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-inner border border-black/5 dark:border-white/5 flex-shrink-0 relative group-hover:ring-2 ring-offset-2 ring-emerald-500 transition-all">
                            <PatientAvatar
                              photoPath={reg.patient_photo_path}
                              name={reg.patient_name}
                            />
                          </div>
                          <div className="flex flex-col min-w-0 gap-1.5">
                            <h3 className="text-[17px] font-bold text-[#1a1c1e] dark:text-[#e3e2e6] leading-none group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
                              {reg.patient_name}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 font-bold font-mono tracking-tight text-slate-500">
                                #{reg.registration_id}
                              </span>
                              {reg.consultation_type && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-500/20">
                                  {reg.consultation_type}
                                </span>
                              )}
                              {reg.payment_method && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-wider border border-slate-200 dark:border-white/10">
                                  {reg.payment_method}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Contact */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-emerald-500/60 transition-colors lg:hidden">
                            Contact
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors">
                              <Phone size={14} />
                            </div>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 font-mono tracking-tight">
                              {reg.phone_number}
                            </p>
                          </div>
                        </div>

                        {/* Consultation */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 lg:hidden">
                            Amount
                          </span>
                          <p className="text-base font-black text-[#1a1c1e] dark:text-[#e3e2e6] flex items-baseline gap-0.5">
                            <span className="text-xs opacity-40 font-serif">
                              ₹
                            </span>
                            {reg.consultation_amount}
                          </p>
                        </div>

                        {/* Created At */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 lg:hidden">
                            Date
                          </span>
                          <div className="flex items-center gap-2.5">
                            <Calendar size={14} className="text-slate-300" />
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                              {formatDateSafe(reg.created_at, "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>

                        {/* Status & Control Override for Pending Approval */}
                        {reg.approval_status === "pending" ? (
                          <div className="col-span-2 flex items-center justify-between pl-4 pr-1">
                            <div className="flex items-center gap-3 w-full justify-center">
                              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-900/30 w-full justify-center shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Pending Approval
                              </span>
                            </div>
                            <button
                              onClick={() => fetchDetails(reg.registration_id)}
                              className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-white/10 text-slate-400 hover:text-emerald-500 hover:scale-110 hover:shadow-lg transition-all border border-gray-100 dark:border-white/5 ml-4"
                              title="Review Request"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Status */}
                            <div className="flex justify-center">
                              <StatusDropdown
                                currentStatus={reg.status}
                                onUpdate={(s) =>
                                  handleUpdateStatus(reg.registration_id, s)
                                }
                                getStatusColors={getStatusColors}
                              />
                            </div>

                            {/* Control */}
                            <div className="flex items-center justify-end gap-2 pr-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300">
                              <button
                                onClick={() =>
                                  fetchDetails(reg.registration_id)
                                }
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-white/10 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:scale-110 active:scale-95 transition-all shadow-sm hover:shadow-md border border-gray-100 dark:border-white/5"
                                title="View Details"
                              >
                                <Eye size={18} />
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Compact Centered Pagination */}
              {!isLoading && pagination.total_pages > 1 && (
                <div className="flex justify-center mt-12 pb-10">
                  <div
                    className={`flex items-center gap-6 px-6 py-3 rounded-full border shadow-xl ${isDark ? "bg-[#141619] border-white/5" : "bg-white border-gray-100"}`}
                  >
                    <button
                      onClick={() => setCurrentPage((p) => p - 1)}
                      disabled={currentPage === 1}
                      className="w-10 h-10 rounded-full border border-gray-100 dark:border-white/5 flex items-center justify-center transition-all disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/20 shadow-sm disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-2">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 dark:bg-white/5 px-5 py-2 rounded-full border border-gray-100 dark:border-white/5">
                        Page{" "}
                        <span className="text-slate-900 dark:text-white mx-1">
                          {currentPage}
                        </span>{" "}
                        / {pagination.total_pages}
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={currentPage === pagination.total_pages}
                      className="w-10 h-10 rounded-full border border-gray-100 dark:border-white/5 flex items-center justify-center transition-all disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-emerald-500 hover:border-emerald-500/20 shadow-sm disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Global Components */}
      <ActionFAB onAction={handleFABAction} />
      <NotesDrawer isOpen={showNotes} onClose={() => setShowNotes(false)} />

      <DailyIntelligence
        isOpen={showIntelligence}
        onClose={() => setShowIntelligence(false)}
      />

      <LogoutConfirmation
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
      />

      {/* Registration Specific Modals */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedRegistration && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[1040] transition-opacity"
            />

            {/* Side Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-[1050] w-full max-w-[680px] bg-white dark:bg-[#0F110F] shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.15)] border-l border-gray-100 dark:border-white/5 flex flex-col h-full"
            >
              {/* 1. Header - Compact */}
              <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-[#0F110F]/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm shrink-0">
                    <PatientAvatar
                      photoPath={selectedRegistration.patient_photo_path}
                      name={selectedRegistration.patient_name}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {selectedRegistration.patient_name}
                      </h2>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${getStatusColors(selectedRegistration.status)}`}
                      >
                        {selectedRegistration.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 mt-1">
                      <span className="font-mono tracking-tight text-slate-500">
                        #{selectedRegistration.registration_id}
                      </span>
                      <span>•</span>
                      <span>
                        {formatDateSafe(
                          selectedRegistration.created_at,
                          "MMM dd, HH:mm",
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      fetchDetails(selectedRegistration.registration_id, true)
                    }
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100/80 text-slate-400 hover:text-emerald-500 transition-all active:rotate-180 duration-500"
                    title="Refresh Details"
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    onClick={
                      isEditing ? () => setIsEditing(false) : startEditing
                    }
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isEditing ? "bg-amber-100 text-amber-600" : "hover:bg-slate-100/80 text-slate-400 hover:text-slate-600"}`}
                  >
                    {isEditing ? <X size={16} /> : <Edit2 size={16} />}
                  </button>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100/80 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* 2. Scrollable Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0F110F]">
                <div className="p-6 space-y-8">
                  {/* Workflow Tracks - Horizontal Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Workflow Operations
                      </h4>
                      {(selectedRegistration.approval_status?.toLowerCase() ===
                        "pending" ||
                        selectedRegistration.approval_status?.toLowerCase() ===
                          "rejected") && (
                        <span className="text-[9px] font-bold text-rose-500 uppercase flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-full">
                          <Lock size={8} /> Locked
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {serviceTracks.map((track, idx) => {
                        const Icon =
                          AVAILABLE_ICONS.find((i) => i.name === track.icon)
                            ?.icon || Zap;
                        return (
                          <button
                            key={track.id || idx}
                            disabled={
                              selectedRegistration.approval_status?.toLowerCase() ===
                                "pending" ||
                              selectedRegistration.approval_status?.toLowerCase() ===
                                "rejected"
                            }
                            onClick={() => {
                              setSelectedTrack(track);
                              setIsDynamicModalOpen(true);
                            }}
                            className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                              selectedRegistration.approval_status?.toLowerCase() ===
                                "pending" ||
                              selectedRegistration.approval_status?.toLowerCase() ===
                                "rejected"
                                ? "bg-slate-50 border-slate-100 opacity-50"
                                : "bg-white border-slate-100 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5"
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selectedRegistration.approval_status?.toLowerCase() === "pending" || selectedRegistration.approval_status?.toLowerCase() === "rejected" ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white"}`}
                            >
                              <Icon size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block text-xs font-bold text-slate-700 dark:text-gray-200 truncate group-hover:text-emerald-700">
                                {track.buttonLabel || track.name}
                              </span>
                              <span className="block text-[10px] font-medium text-slate-400 truncate mt-0.5">
                                Initialize
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Alert Banner */}
                  {selectedRegistration.patient_exists_count > 0 ? (
                    <div className="flex items-center justify-between p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Check size={12} strokeWidth={3} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
                            Linked Patient Record
                          </p>
                          <p className="text-[10px] text-emerald-600 font-medium">
                            ID: #
                            {
                              selectedRegistration.existing_services?.[0]
                                ?.patient_id
                            }
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/reception/patients")}
                        className="px-3 py-1.5 bg-white rounded-lg text-[10px] font-bold text-emerald-700 shadow-sm border border-emerald-100 hover:bg-emerald-50 transition-colors"
                      >
                        View Registry
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-amber-50/60 border border-amber-100 rounded-2xl">
                      <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <AlertCircle size={14} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                          New Profile - Incomplete
                        </p>
                        <p className="text-[10px] text-amber-600 font-medium">
                          Please complete full registration.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Details Stack */}
                  <div className="space-y-8">
                    {/* Identity Section */}
                    <div className="relative">
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        <User size={12} /> Identity
                      </h4>

                      <div className="bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5 p-5 space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                              Age
                            </label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editData.age || ""}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    age: e.target.value,
                                  })
                                }
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-bold"
                              />
                            ) : (
                              <p className="text-base font-bold text-slate-700">
                                {selectedRegistration.age || "-"}
                                <span className="text-[10px] text-slate-400 ml-1 font-black">
                                  YEARS
                                </span>
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                              Gender
                            </label>
                            {isEditing ? (
                              <CustomSelect
                                value={editData.gender || ""}
                                onChange={(v) =>
                                  setEditData({ ...editData, gender: v })
                                }
                                options={[
                                  { label: "Male", value: "Male" },
                                  { label: "Female", value: "Female" },
                                ]}
                                className="!py-1 !text-xs"
                              />
                            ) : (
                              <p className="text-base font-bold text-slate-700">
                                {selectedRegistration.gender || "-"}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                            Mobile Number
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.phone_number || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  phone_number: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-bold"
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-slate-700">
                              <Phone size={14} className="text-emerald-500" />
                              <span className="text-base font-bold tracking-tight">
                                {selectedRegistration.phone_number}
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                            Residential Address
                          </label>
                          {isEditing ? (
                            <textarea
                              value={editData.address || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  address: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium resize-none leading-relaxed"
                              rows={3}
                            />
                          ) : (
                            <p className="text-xs font-medium text-slate-500 leading-normal">
                              {selectedRegistration.address || "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Clinical Section */}
                    <div className="relative">
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                        <Activity size={12} /> Clinical Sequence
                      </h4>

                      <div className="bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5 p-5 space-y-6">
                        <div className="p-4 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl shadow-sm">
                          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">
                            Diagnosis / Complaint
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.chief_complain || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  chief_complain: e.target.value,
                                })
                              }
                              className="w-full text-base font-bold border-b-2 border-emerald-500 outline-none pb-1 bg-transparent"
                            />
                          ) : (
                            <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                              {selectedRegistration.chief_complain ||
                                "Routine Checkup"}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                              Consultation Type
                            </label>
                            {isEditing ? (
                              <CustomSelect
                                value={editData.consultation_type || ""}
                                onChange={(v) =>
                                  setEditData({
                                    ...editData,
                                    consultation_type: v,
                                  })
                                }
                                options={options.types.map((t: string) => ({
                                  label: t,
                                  value: t,
                                }))}
                                className="!py-1 !text-xs"
                              />
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                {selectedRegistration.consultation_type}
                              </span>
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                              Referred By
                            </label>
                            {isEditing ? (
                              <CustomSelect
                                value={editData.reffered_by || ""}
                                onChange={(v) =>
                                  setEditData({ ...editData, reffered_by: v })
                                }
                                options={options.referred_by.map(
                                  (r: string) => ({ label: r, value: r }),
                                )}
                                className="!py-1 !text-xs"
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-700 truncate block bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                {selectedRegistration.reffered_by || "Self"}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                              Consultation Fee
                            </label>
                            {isEditing ? (
                              <div className="flex items-center text-lg font-black text-slate-900 group">
                                <span className="text-slate-400 mr-1.5 transition-colors group-focus-within:text-emerald-500">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  value={editData.consultation_amount || ""}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      consultation_amount: e.target.value,
                                    })
                                  }
                                  className="w-32 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-xl px-3 py-2 outline-none transition-all"
                                />
                              </div>
                            ) : (
                              <p className="text-xl font-black text-slate-900 dark:text-white">
                                ₹{selectedRegistration.consultation_amount}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                              Method
                            </label>
                            {isEditing ? (
                              <div className="w-48">
                                <CustomSelect
                                  value={editData.payment_method || ""}
                                  onChange={(v) =>
                                    setEditData({
                                      ...editData,
                                      payment_method: v,
                                    })
                                  }
                                  options={[
                                    { label: "CASH", value: "CASH" },
                                    { label: "CARD", value: "CARD" },
                                    { label: "UPI", value: "UPI" },
                                  ]}
                                  className="!py-2 !text-xs"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                <CreditCard size={12} />
                                <span className="text-[10px] font-black uppercase">
                                  {selectedRegistration.payment_method ||
                                    "CASH"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 dark:bg-white/[0.01] border border-gray-100 dark:border-white/5 rounded-xl p-4 text-center">
                    <span className="text-[10px] font-medium text-slate-400 italic">
                      No additional observations recorded.
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Footer - Fixed at Bottom */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.02] flex items-center justify-between sticky bottom-0 backdrop-blur-md">
                <button
                  onClick={() => {
                    handleUpdateStatus(
                      selectedRegistration.registration_id,
                      "closed",
                    );
                    setIsDetailsModalOpen(false);
                  }}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>

                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <button
                      onClick={handleSaveDetails}
                      disabled={isSaving}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:-translate-y-0.5"
                    >
                      {isSaving ? (
                        "Saving..."
                      ) : (
                        <>
                          <Check size={14} strokeWidth={3} /> Save Changes
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        navigateToBill(selectedRegistration.registration_id)
                      }
                      className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
                    >
                      <Printer size={14} /> Print Receipt
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Sub-Modal for Dynamic Service */}
            <AnimatePresence>
              {isDynamicModalOpen && selectedRegistration && selectedTrack && (
                <DynamicServiceModal
                  isOpen={isDynamicModalOpen}
                  onClose={() => {
                    setIsDynamicModalOpen(false);
                    setSelectedTrack(null);
                  }}
                  registration={selectedRegistration}
                  track={selectedTrack}
                  isStacked={true}
                  onSuccess={() => {
                    showToast(
                      `Successfully converted to ${selectedTrack.name} patient`,
                      "success",
                    );
                    if (selectedRegistration?.registration_id) {
                      fetchDetails(selectedRegistration.registration_id, true);
                    }
                    fetchRegistrations(true);
                  }}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>

      {/* --- BILL MODAL --- */}
      <AnimatePresence>
        {isBillModalOpen && selectedRegistration && (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBillModalOpen(false)}
              className="absolute inset-0 bg-[#001f2a]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden flex flex-col relative z-10 h-[85vh]"
            >
              {/* Bill Header */}
              <div className="px-8 py-5 border-b border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center bg-[#fdfcff] dark:bg-[#1a1c1e]">
                <h3 className="text-base font-black text-[#1a1c1e] dark:text-[#e3e2e6] flex items-center gap-2">
                  Bill Preview{" "}
                  <span className="text-[9px] bg-[#ccebc4] text-[#006e1c] px-2 py-0.5 rounded-full uppercase tracking-widest font-black">
                    Invoice
                  </span>
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative" ref={printButtonRef}>
                    <button
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setPrintMenuCoords({
                          top: rect.bottom + 8,
                          right: window.innerWidth - rect.right,
                        });
                        setShowPrintOptions(!showPrintOptions);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#006e1c] text-white rounded-full text-xs font-black shadow-lg hover:opacity-90 transition-all active:scale-95"
                    >
                      <Printer size={16} /> Print Receipt
                    </button>

                    {showPrintOptions &&
                      createPortal(
                        <>
                          <div
                            className="fixed inset-0 z-[2000] bg-transparent"
                            onClick={() => setShowPrintOptions(false)}
                          />
                          <AnimatePresence>
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="fixed z-[2001] w-56 bg-white dark:bg-[#1a1c1e] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[#e0e2ec] dark:border-[#43474e] overflow-hidden py-2"
                              style={{
                                top: printMenuCoords.top,
                                right: printMenuCoords.right,
                              }}
                            >
                              <div className="px-5 py-3 border-b border-slate-100 dark:border-white/5 mb-1 bg-slate-50/50 dark:bg-white/[0.02]">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  Select Format
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  handlePrintBill();
                                  setShowPrintOptions(false);
                                }}
                                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors text-left group"
                              >
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                                  <FileText size={18} />
                                </div>
                                <div>
                                  <p className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200">
                                    A4 Desktop
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-bold">
                                    Full Document
                                  </p>
                                </div>
                              </button>

                              <button
                                onClick={() => {
                                  handlePrintThermalBill();
                                  setShowPrintOptions(false);
                                }}
                                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors text-left group"
                              >
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                                  <Ticket size={18} />
                                </div>
                                <div>
                                  <p className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-200">
                                    Thermal (80mm)
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-bold">
                                    Compact POS
                                  </p>
                                </div>
                              </button>
                            </motion.div>
                          </AnimatePresence>
                        </>,
                        document.body,
                      )}
                  </div>
                  <button
                    onClick={() => setIsBillModalOpen(false)}
                    className="p-2 bg-[#e0e2ec] dark:bg-[#43474e] text-[#43474e] dark:text-[#c4c7c5] hover:bg-[#ffdad6] hover:text-[#93000a] rounded-full transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              {/* Bill Content */}
              <div className="flex-1 overflow-auto p-6 bg-[#f2f6fa] dark:bg-[#111315] font-serif custom-scrollbar">
                <div
                  id="printable-bill"
                  className="bg-white p-10 shadow-sm text-slate-900 mx-auto w-full max-w-[210mm] min-h-[297mm]"
                >
                  <div className="flex justify-between items-start pb-6 mb-8 border-b-2 border-slate-900">
                    <div className="flex flex-col gap-3">
                      <img
                        src="https://prospine.in/admin/assets/images/manipal.png"
                        alt="Logo"
                        className="h-14 w-auto object-contain"
                      />
                      <div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase">
                          Consultation Bill
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                          Date: {format(new Date(), "dd-MM-yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <h2 className="text-lg font-black">
                        {selectedRegistration.clinic_name || "Prospine"}
                      </h2>
                      <p className="text-[11px] font-medium text-slate-500 mt-1 max-w-[250px] leading-relaxed">
                        {selectedRegistration.address_line_1}
                        {selectedRegistration.address_line_2
                          ? `, ${selectedRegistration.address_line_2}`
                          : ""}
                        <br />
                        {selectedRegistration.city}
                        <br />
                        Phone: {selectedRegistration.phone_primary}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">
                        Bill To
                      </h4>
                      <p className="text-lg font-black text-slate-900">
                        {selectedRegistration.patient_name}
                      </p>
                      <p className="text-xs font-medium text-slate-500 mt-1">
                        {selectedRegistration.address || "Address not provided"}
                      </p>
                      <p className="text-xs font-bold text-slate-800 mt-1">
                        Contact: {selectedRegistration.phone_number}
                      </p>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1 w-full text-right">
                        Invoice Details
                      </h4>
                      <p className="text-xs font-bold text-slate-400">
                        Receipt No:{" "}
                        <span className="text-slate-900 font-black">
                          #REG-{selectedRegistration.registration_id}
                        </span>
                      </p>
                      <p className="text-xs font-bold text-slate-400 mt-1">
                        Status:{" "}
                        <span className="text-emerald-600 font-black uppercase">
                          {selectedRegistration.status}
                        </span>
                      </p>
                      <p className="text-xs font-bold text-slate-400 mt-1">
                        Method:{" "}
                        <span className="text-slate-900 font-black uppercase">
                          {selectedRegistration.payment_method}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mb-10">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-y-2 border-slate-900">
                          <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest">
                            Description
                          </th>
                          <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-right">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-4 px-4">
                            <span className="block text-sm font-bold text-slate-900 uppercase">
                              Consultation Fee
                            </span>
                            <span className="block text-xs font-medium text-slate-500 mt-1 italic">
                              Type: {selectedRegistration.consultation_type}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-sm font-black text-slate-900">
                              ₹{" "}
                              {parseFloat(
                                selectedRegistration.consultation_amount,
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-900">
                          <td className="py-4 px-4 text-right">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              Total Amount Payable
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-2xl font-black text-slate-900">
                              ₹{" "}
                              {parseFloat(
                                selectedRegistration.consultation_amount,
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="mt-auto pt-8 border-t border-dashed border-slate-300 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Thank you for choosing ProSpine
                    </p>
                    <p className="text-[9px] font-medium text-slate-400 mt-1 italic">
                      System generated document.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- THERMAL BILL TEMPLATE --- */}
      {selectedRegistration && (
        <div id="thermal-bill-template" className="hidden">
          <div
            style={{
              width: "72mm",
              padding: "4mm",
              fontFamily: "monospace",
              fontSize: "12px",
              lineHeight: "1.5",
              color: "black",
              backgroundColor: "white",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "20px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {selectedRegistration.clinic_name || "PROSPINE"}
              </div>
              <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.8 }}>
                {selectedRegistration.address_line_1}
              </div>
              <div style={{ fontSize: "11px", opacity: 0.8 }}>
                PH: {selectedRegistration.phone_primary}
              </div>
            </div>

            <div
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "14px",
                borderTop: "1px dashed black",
                borderBottom: "1px dashed black",
                padding: "8px 0",
                margin: "12px 0",
              }}
            >
              CONSULTATION BILL
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>PATIENT:</span>
                <span style={{ fontWeight: "bold" }}>
                  {selectedRegistration.patient_name}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>CONTACT:</span>
                <span>{selectedRegistration.phone_number}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>DATE:</span>
                <span>{format(new Date(), "dd-MM-yyyy")}</span>
              </div>
            </div>

            <div
              style={{ borderTop: "1px dashed black", margin: "12px 0" }}
            ></div>

            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>RECEIPT NO:</span>
                <span style={{ fontWeight: "bold" }}>
                  #REG-{selectedRegistration.registration_id}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>METHOD:</span>
                <span
                  style={{ fontWeight: "bold", textTransform: "uppercase" }}
                >
                  {selectedRegistration.payment_method}
                </span>
              </div>
            </div>

            <div
              style={{
                borderBottom: "1px solid black",
                fontWeight: "bold",
                marginBottom: "4px",
                paddingBottom: "2px",
              }}
            >
              DESCRIPTION
            </div>

            <div style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>CONSULTATION FEE</span>
                <span style={{ fontWeight: "bold" }}>
                  ₹
                  {parseFloat(
                    selectedRegistration.consultation_amount,
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ fontSize: "10px", fontStyle: "italic" }}>
                Type: {selectedRegistration.consultation_type}
              </div>
            </div>

            <div
              style={{ borderTop: "2px solid black", margin: "4px 0" }}
            ></div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                fontSize: "16px",
                padding: "8px 0",
              }}
            >
              <span>TOTAL PAYABLE:</span>
              <span>
                ₹
                {parseFloat(
                  selectedRegistration.consultation_amount,
                ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div
              style={{
                borderTop: "1px dashed black",
                margin: "24px 0 8px 0",
                paddingTop: "12px",
                textAlign: "center",
                fontSize: "11px",
                fontWeight: "bold",
              }}
            >
              THANK YOU FOR CHOOSING PROSPINE
            </div>
            <div
              style={{
                textAlign: "center",
                fontSize: "10px",
                fontStyle: "italic",
                opacity: 0.6,
              }}
            >
              System generated document
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                setConfirmModal((prev) => ({ ...prev, isOpen: false }))
              }
              className="absolute inset-0 bg-[#001f2a]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-sm rounded-[28px] shadow-2xl overflow-hidden relative z-10 border border-[#e0e2ec] dark:border-[#43474e] p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#ffdad6] dark:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] mx-auto flex items-center justify-center mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-[#1a1c1e] dark:text-[#e3e2e6] mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-sm font-medium text-[#43474e] dark:text-[#c4c7c5] leading-relaxed mb-8">
                {confirmModal.message}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="flex-1 py-2.5 bg-[#e0e2ec] dark:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] rounded-full text-xs font-bold hover:bg-[#c9cdd6] dark:hover:bg-[#5b5e66] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 py-2.5 bg-[#ba1a1a] text-white rounded-full text-xs font-bold hover:bg-[#93000a] transition-all shadow-md"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TOASTS --- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000]"
          >
            <div
              className={`px-4 py-3 rounded-full shadow-lg flex items-center gap-3 ${toast?.type === "success" ? "bg-[#006e1c] text-white" : toast?.type === "error" ? "bg-[#ba1a1a] text-white" : "bg-[#00639b] text-white"}`}
            >
              {toast?.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span className="text-xs font-bold tracking-wide">
                {toast?.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- PAYMENT FIX MODAL --- */}
      <UpdatePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedForPaymentFix(null);
        }}
        registration={selectedForPaymentFix}
        paymentMethods={options.payment_methods || []}
        onSuccess={() => {
          fetchRegistrations();
          setToast({
            message: "Payment updated & auto-approved",
            type: "success",
          });
        }}
      />

      {/* --- KEYBOARD SHORTCUTS MODAL & BUTTON --- */}
      <KeyboardShortcuts
        shortcuts={shortcuts}
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        onToggle={() => setShowShortcuts((p: boolean) => !p)}
      />

      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />
    </div>
  );
};

export default Registration;
