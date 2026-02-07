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
  MapPin,
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
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-opacity-30 hover:opacity-80 transition-opacity cursor-pointer ${getStatusColors(currentStatus)}`}
      >
        <span className="truncate max-w-[80px]">{currentStatus}</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
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
              className="fixed z-[99999] bg-[#f3edf7] dark:bg-[#2b2930] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col p-2 min-w-[140px] border border-[#eaddff] dark:border-[#49454f]"
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
                                    w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all mb-1 last:mb-0
                                    ${
                                      currentStatus?.toLowerCase() === opt.value
                                        ? "bg-[#3b82f6] text-white shadow-sm"
                                        : "text-[#1d1b20] dark:text-[#e6e1e5] hover:bg-[#e8def8] dark:hover:bg-[#4a4458]"
                                    }
                                `}
                >
                  {opt.label}
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

  const {
    registrations: storeRegistrations,
    options: storeOptions,
    serviceTracks: storeServiceTracks,
    pagination: storePagination,
    lastParams,
    detailsCache,
    registrationsCache,
    setRegistrations,
    setOptions,
    setServiceTracks,
    setPagination,
    setLastParams,
    setLastFetched,
    setDetailsCache,
    setRegistrationsCache,
  } = useRegistrationStore();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [referrerFilter, setReferrerFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initial load ref to prevent multiple spinners
  const isFirstLoad = useRef(true);

  // Background scroll lock
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
        if (
          lastParams &&
          cacheKey === JSON.stringify(lastParams) &&
          storeRegistrations &&
          storeRegistrations.length > 0 // Ensure we have data
        ) {
          setIsLoading(false);
          return;
        }

        if (registrationsCache && registrationsCache[cacheKey]) {
          const cached = registrationsCache[cacheKey];
          setRegistrations(cached.data);
          // setPagination(cached.pagination); // We handle pagination locally now
          setLastParams(currentParams);
          setIsLoading(false);
          return;
        }
      }

      if (isFirstLoad.current || !storeRegistrations || forceRefresh === true)
        setIsLoading(true);

      try {
        const res = await authFetch(`${API_BASE_URL}/reception/registration`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      storeRegistrations,
      registrationsCache,
      lastParams,
      setRegistrations,
      setPagination,
      setLastParams,
      setLastFetched,
      setRegistrationsCache,
    ],
  );

  const handleRefresh = async () => {
    if (refreshCooldown > 0) return;

    const promise = fetchRegistrations(true);
    sonnerToast.promise(promise, {
      loading: "Refreshing registrations...",
      success: "Registrations updated",
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

  // Fetch dashboard stats if missing
  useEffect(() => {
    if (!dashboardData && user?.branch_id) {
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
  }, [dashboardData, user?.branch_id]);

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
    fetchRegistrations();
  }, [fetchRegistrations]);

  const fetchOptions = useCallback(async () => {
    if (!user?.branch_id) return;

    // Cache check
    if (
      storeOptions &&
      storeServiceTracks &&
      Object.keys(storeOptions).length > 0
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
        if (data.data.service_tracks) {
          const mappedTracks = data.data.service_tracks.map((track: any) => ({
            id: track.id,
            name: track.name,
            buttonLabel: track.button_label,
            icon: track.icon,
            themeColor: track.theme_color,
            fields:
              typeof track.fields === "string"
                ? JSON.parse(track.fields)
                : track.fields,
            pricing:
              typeof track.pricing === "string"
                ? JSON.parse(track.pricing)
                : track.pricing,
            scheduling:
              typeof track.scheduling === "string"
                ? JSON.parse(track.scheduling)
                : track.scheduling,
            permissions:
              typeof track.permissions === "string"
                ? JSON.parse(track.permissions)
                : track.permissions,
            isActive: !!track.is_active,
          }));
          setServiceTracks(mappedTracks);
        }
      }
    } catch (err) {
      console.error("Failed to fetch options:", err);
    }
  }, [
    user?.branch_id,
    storeOptions,
    storeServiceTracks,
    setOptions,
    setServiceTracks,
  ]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    // Optimistic update
    const updatedRegistrations = registrations.map((reg: any) =>
      reg.registration_id === id ? { ...reg, status: newStatus } : reg,
    );
    setRegistrations(updatedRegistrations);

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          id,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(`Registration status updated to ${newStatus}`, "success");
        fetchRegistrations();
      } else {
        showToast(data.message || "Failed to update status", "error");
        fetchRegistrations(); // Revert on failure
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast("An error occurred while updating status", "error");
      fetchRegistrations(); // Revert on error
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_details",
          registration_id: selectedRegistration.registration_id,
          ...editData,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setIsEditing(false);
        fetchDetails(selectedRegistration.registration_id, true);
        fetchRegistrations(true);
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

  const formatDateSafe = (dateStr: string, formatPattern: string) => {
    if (!dateStr) return "N/A";
    const date = parseISO(dateStr.replace(" ", "T"));
    return isValid(date) ? format(date, formatPattern) : "Invalid Date";
  };

  const getStatusColors = (status: string) => {
    const s = status?.toLowerCase()?.trim();
    switch (s) {
      case "consulted":
        return "bg-[#ccebc4]/30 text-[#006e1c] dark:text-[#88d99d] border-[#ccebc4] dark:border-[#0c3b10]";
      case "closed":
        return "bg-[#ffdad6]/30 text-[#93000a] dark:text-[#ffb4ab] border-[#ffdad6] dark:border-[#93000a]";
      case "pending":
        return "bg-[#ffefc2]/30 text-[#675402] dark:text-[#dec650] border-[#ffefc2] dark:border-[#675402]";
      default:
        return "bg-[#e0e2ec]/30 text-[#43474e] dark:text-[#c4c7c5] border-[#e0e2ec] dark:border-[#43474e]";
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
            className={`hidden xl:flex w-[450px] flex-col justify-between p-10 border-r relative shrink-0 transition-colors duration-300 z-50 ${
              isDark
                ? "bg-[#0A0A0A] border-[#151515]"
                : "bg-white border-gray-200"
            }`}
          >
            {/* Brand & Greeting */}
            <div className="space-y-10 z-10 text-[#1a1c1e] dark:text-[#e3e2e6]">
              <div className="space-y-4">
                <h1 className="text-5xl font-serif font-normal tracking-tight leading-tight">
                  Registration{" "}
                  <span
                    className={`italic ${isDark ? "text-[#4ADE80]" : "text-[#16a34a]"}`}
                  >
                    Ops
                  </span>
                </h1>
                <p className="text-gray-500 text-lg font-medium">
                  Here's your daily registration overview.
                </p>
              </div>
            </div>

            {/* --- REDESIGNED STATS PANEL --- */}
            <div className="space-y-10 w-full flex-1 flex flex-col justify-center py-6 text-[#1a1c1e] dark:text-[#e3e2e6]">
              {/* SECTION 1: REGISTRATION OVERVIEW */}
              <div className="space-y-6">
                {/* Big Numbers */}
                <div className="flex items-baseline justify-between border-b border-dashed pb-6 dark:border-[#2A2D2A] border-gray-200">
                  <div>
                    <div className="text-8xl font-medium tracking-tighter leading-none">
                      {dashboardData?.registration.today_total || 0}
                    </div>
                    <div className="text-sm font-black opacity-40 mt-2 uppercase tracking-widest">
                      Today
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-medium">
                      {dashboardData?.registration.month_total || 0}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-wide opacity-40 mt-1">
                      Month
                    </div>
                  </div>
                </div>

                {/* Text-based Status List */}
                <div className="space-y-4 pl-1">
                  <div className="flex items-center justify-between text-sm group">
                    <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]"></span>{" "}
                      Pending Case
                    </span>
                    <span className="font-bold text-lg">
                      {dashboardData?.registration.pending || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm group">
                    <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"></span>{" "}
                      Consultation Done
                    </span>
                    <span className="font-bold text-lg">
                      {dashboardData?.registration.consulted || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm group">
                    <span className="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]"></span>{" "}
                      Verification Required
                    </span>
                    <span className="font-bold text-lg">
                      {dashboardData?.registration.approval_pending || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: LIVE CENSUS */}
              <div className="space-y-6 pt-4 border-t border-dashed dark:border-[#2A2D2A] border-gray-200">
                <div className="flex items-center gap-3 opacity-50">
                  <Users size={22} className="text-[#4ade80]" />
                  <span className="text-sm font-bold uppercase tracking-[0.2em]">
                    Client Census
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-5xl font-medium tracking-tight">
                      {dashboardData?.patients.active || 0}
                    </div>
                    <div className="text-xs font-black opacity-40 mt-2 uppercase tracking-wider">
                      Active Patients in System
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#CCEBC4]/30 text-[#006e1c] dark:text-[#88d99d] border border-[#CCEBC4]/20">
                    <Users size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* Decoration */}
            <div className="absolute top-1/2 left-0 w-full h-full bg-gradient-to-t from-green-900/5 to-transparent pointer-events-none" />
          </motion.div>

          {/* Main Content (Right Panel) */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 custom-scrollbar">
            <div className="max-w-[1600px] mx-auto">
              {/* Filter Area */}
              {/* Top Control Bar */}
              <div className="flex flex-col gap-6 mb-10">
                {/* Search & Filters Bar */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                  <div className="relative group w-full lg:max-w-md">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors cursor-pointer"
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
                      className="w-full pl-11 pr-6 py-3.5 rounded-2xl bg-[#f0f4f9] dark:bg-white/5 border border-transparent focus:border-emerald-500/20 outline-none text-sm font-medium transition-all shadow-sm"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
                    <div className="min-w-[180px] flex-1 lg:flex-none">
                      <CustomSelect
                        value={statusFilter}
                        onChange={setStatusFilter}
                        placeholder="Status"
                        className="!py-3.5 !rounded-2xl !bg-[#f0f4f9] dark:!bg-white/5 !border-[#eef2f6] dark:!border-white/5 shadow-sm"
                        options={[
                          { value: "", label: "All Status" },
                          { value: "pending", label: "Pending" },
                          { value: "consulted", label: "Consulted" },
                          { value: "closed", label: "Closed" },
                        ]}
                      />
                    </div>
                    <div className="min-w-[200px] flex-1 lg:flex-none">
                      <CustomSelect
                        value={referrerFilter}
                        onChange={setReferrerFilter}
                        placeholder="Referrer"
                        className="!py-3.5 !rounded-2xl !bg-[#f0f4f9] dark:!bg-white/5 !border-[#eef2f6] dark:!border-white/5 shadow-sm"
                        options={[
                          { value: "", label: "All Referrers" },
                          ...options.referred_by.map((r) => ({
                            value: r,
                            label: r,
                          })),
                        ]}
                      />
                    </div>
                    <div className="min-w-[200px] flex-1 lg:flex-none">
                      <CustomSelect
                        value={conditionFilter}
                        onChange={setConditionFilter}
                        placeholder="Condition"
                        className="!py-3.5 !rounded-2xl !bg-[#f0f4f9] dark:!bg-white/5 !border-[#eef2f6] dark:!border-white/5 shadow-sm"
                        options={[
                          { value: "", label: "All Conditions" },
                          ...options.conditions.map((c) => ({
                            value: c,
                            label: c,
                          })),
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats & Actions Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="px-6 py-2 bg-[#f0f4f9] dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-full text-[11px] font-black uppercase tracking-widest text-[#43474e] dark:text-[#c4c7c5]">
                      Total:{" "}
                      <span className="text-[#1a1c1e] dark:text-white ml-1">
                        {pagination.total} Records
                      </span>
                    </div>
                    <div className="px-6 py-2 bg-[#e8f5e9] dark:bg-emerald-500/10 border border-emerald-500/10 rounded-full text-[11px] font-black uppercase tracking-widest text-emerald-600">
                      Showing {registrations.length} in this page
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        navigate("/reception/registration/cancelled")
                      }
                      className="flex items-center gap-2 px-6 py-3 bg-[#f0f4f9] dark:bg-white/5 text-[#43474e] dark:text-[#c4c7c5] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-white/10 transition-all border border-black/5 dark:border-white/5 shadow-sm"
                    >
                      <HistoryIcon size={16} className="opacity-40" />
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
                      className="flex items-center gap-2 px-6 py-3 bg-[#ffdad6] dark:bg-[#93000a]/30 text-[#410002] dark:text-[#ffdad6] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#ffada4] dark:hover:bg-[#93000a]/50 transition-all shadow-sm"
                    >
                      <RotateCcw size={16} />
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid Layout */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#3b82f6]/20 border-t-[#3b82f6] rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <UserPlus size={24} className="text-[#3b82f6]" />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#43474e] dark:text-[#c4c7c5] animate-pulse">
                    Flipping through records...
                  </p>
                </div>
              ) : registrations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#1a1c1e] rounded-[32px] border-2 border-dashed border-[#e0e2ec] dark:border-[#43474e]">
                  <div className="w-20 h-20 rounded-full bg-[#e0e2ec] dark:bg-[#43474e] flex items-center justify-center text-[#43474e] dark:text-[#c4c7c5] mb-6">
                    <Search size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6] mb-2 font-serif">
                    No records found
                  </h3>
                  <p className="text-[#43474e] dark:text-[#c4c7c5] max-w-xs text-center text-sm leading-relaxed">
                    We couldn't find any registrations matching your current
                    search criteria.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Table Header */}
                  <div className="hidden lg:grid grid-cols-[1.8fr_1.3fr_1fr_1.3fr_1fr_1fr] gap-6 px-10 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-black/[0.03] dark:border-white/[0.03] mb-4">
                    <div className="flex items-center gap-2">
                      Patient Details
                    </div>
                    <div className="flex items-center gap-2">Contact</div>
                    <div className="flex items-center gap-2">Consultation</div>
                    <div className="flex items-center gap-2">Created At</div>
                    <div className="text-center">Status</div>
                    <div className="text-right pr-4">Control</div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col gap-3"
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
                        className={`group rounded-[28px] px-8 py-5 border transition-all hover:shadow-2xl hover:scale-[1.01] cursor-pointer relative overflow-hidden grid lg:grid-cols-[1.8fr_1.3fr_1fr_1.3fr_1fr_1fr] gap-6 items-center ${isDark ? "bg-[#1a1c1e] border-white/5 hover:border-emerald-500/30" : "bg-white border-[#f0f0f0] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-emerald-500/20"}`}
                      >
                        {/* Status Vertical Accent */}
                        <div
                          className={`absolute left-0 top-0 w-1 h-full transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                            reg.status === "consulted"
                              ? "bg-emerald-500"
                              : reg.status === "pending"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                          }`}
                        />

                        {/* Patient Details */}
                        <div
                          className="flex items-center gap-5 min-w-0"
                          onClick={() => fetchDetails(reg.registration_id)}
                        >
                          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-inner border border-black/5 dark:border-white/5 flex-shrink-0">
                            <PatientAvatar
                              photoPath={reg.patient_photo_path}
                              name={reg.patient_name}
                            />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <h3 className="text-base font-black text-[#1a1c1e] dark:text-[#e3e2e6] leading-tight group-hover:text-emerald-600 transition-colors truncate">
                              {reg.patient_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 font-black font-mono tracking-tighter text-slate-500">
                                #{reg.registration_id}
                              </span>
                              {reg.consultation_type && (
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/5 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-500/10">
                                  {reg.consultation_type}
                                </span>
                              )}
                              {reg.payment_method && (
                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-widest border border-black/5">
                                  {reg.payment_method}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Contact */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Contact Number
                          </span>
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400">
                              <Phone size={14} />
                            </div>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                              {reg.phone_number}
                            </p>
                          </div>
                        </div>

                        {/* Consultation */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Consultation
                          </span>
                          <p className="text-base font-black text-[#1a1c1e] dark:text-[#e3e2e6] flex items-baseline gap-0.5">
                            <span className="text-xs opacity-40">₹</span>
                            {reg.consultation_amount}
                          </p>
                        </div>

                        {/* Created At */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Registered On
                          </span>
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400">
                              <Calendar size={14} />
                            </div>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                              {formatDateSafe(reg.created_at, "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>

                        {/* Status & Control Override for Pending Approval */}
                        {reg.approval_status === "pending" ? (
                          <div className="col-span-2 flex items-center justify-between pl-4 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 bg-amber-500/5 px-4 py-2 rounded-full border border-amber-500/10">
                                Pending Approval
                              </span>
                            </div>
                            <button
                              onClick={() => fetchDetails(reg.registration_id)}
                              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20"
                              title="View Details"
                            >
                              <Eye size={20} />
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
                            <div className="flex items-center justify-end gap-2 pr-4">
                              <button
                                onClick={() =>
                                  fetchDetails(reg.registration_id)
                                }
                                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all border border-transparent hover:border-emerald-500/20"
                                title="View Details"
                              >
                                <Eye size={20} />
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Pagination Area */}
              {!isLoading && pagination.total_pages > 1 && (
                <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-[#f0f4f9]/50 dark:bg-white/[0.02] rounded-[32px] border border-black/[0.03] dark:border-white/[0.03]">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                    Showing{" "}
                    <span className="text-[#3b82f6]">{currentPage}</span> of{" "}
                    <span className="text-[#3b82f6]">
                      {pagination.total_pages}
                    </span>{" "}
                    pages
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="p-3 rounded-full bg-[#fdfcff] dark:bg-[#1a1c1e] border border-[#e0e2ec] dark:border-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] disabled:opacity-30 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                      {[...Array(pagination.total_pages)].map((_, i) => {
                        const page = i + 1;
                        if (
                          page === 1 ||
                          page === pagination.total_pages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 rounded-full font-bold text-xs transition-all ${
                                currentPage === page
                                  ? "bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20"
                                  : "bg-[#e0e2ec] dark:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] hover:bg-[#c9cdd6] dark:hover:bg-[#5b5e66]"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }
                        return null;
                      })}
                    </div>
                    <button
                      disabled={currentPage === pagination.total_pages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="p-3 rounded-full bg-[#fdfcff] dark:bg-[#1a1c1e] border border-[#e0e2ec] dark:border-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] disabled:opacity-30 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] transition-all"
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
          <div className="fixed inset-0 z-[1000] flex justify-end p-6 gap-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsDetailsModalOpen(false);
                setIsDynamicModalOpen(false);
                setSelectedTrack(null);
              }}
              className="absolute inset-0 bg-[#001f25]/20 backdrop-blur-[2px] pointer-events-auto"
            />
            {/* --- SUB-DRAWER: DYNAMIC SERVICE --- */}
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

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-white dark:bg-[#0F110F] w-full max-w-4xl h-full shadow-[-32px_0_128px_-16px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col relative z-20 border border-black/5 dark:border-white/5 rounded-[40px] pointer-events-auto"
            >
              {/* Header: Profile Plate */}
              <div className="px-10 py-8 flex items-center justify-between relative overflow-hidden shrink-0 border-b border-black/5 dark:border-white/5">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent opacity-50 transition-opacity" />
                <div className="relative z-10 flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[28px] overflow-hidden border-2 border-white dark:border-white/10 shadow-xl flex-shrink-0 bg-slate-50 dark:bg-white/5">
                    <PatientAvatar
                      photoPath={selectedRegistration.patient_photo_path}
                      name={selectedRegistration.patient_name}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold text-[#1a1c1e] dark:text-white tracking-tight">
                        {selectedRegistration.patient_name}
                      </h2>
                      <div
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColors(selectedRegistration.status)} shadow-sm`}
                      >
                        {selectedRegistration.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-xl font-mono text-[10px] tracking-tighter text-slate-500 border border-black/5">
                        <HistoryIcon size={10} />
                        {selectedRegistration.registration_id}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock size={12} className="text-emerald-500" />
                        {formatDateSafe(
                          selectedRegistration.created_at,
                          "MMM dd, yyyy • HH:mm",
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                  <div className="flex items-center bg-slate-100/50 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/5">
                    <button
                      onClick={() =>
                        navigateToBill(selectedRegistration.registration_id)
                      }
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm"
                      title="Print Invoice"
                    >
                      <Printer size={18} />
                    </button>
                    <button
                      onClick={
                        isEditing ? () => setIsEditing(false) : startEditing
                      }
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${isEditing ? "bg-amber-500 text-white hover:bg-amber-600" : "text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-white/10"}`}
                      title={isEditing ? "Discard Changes" : "Modify Record"}
                    >
                      {isEditing ? (
                        <RotateCcw size={18} />
                      ) : (
                        <Edit2 size={18} />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          title: "Delete Sequence?",
                          message:
                            "This action will archive the registration permanently.",
                          onConfirm: () => {
                            handleUpdateStatus(
                              selectedRegistration.registration_id,
                              "closed",
                            );
                            setIsDetailsModalOpen(false);
                            setConfirmModal((p) => ({ ...p, isOpen: false }));
                          },
                        })
                      }
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-white/10 transition-all"
                      title="Archive Record"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="w-12 h-12 flex items-center justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-10 space-y-12">
                  {/* 1. Quick Workflow Actions */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <Zap size={16} />
                        </div>
                        <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                          Bureau Workflow Tracks
                        </h4>
                      </div>
                      {(selectedRegistration.approval_status === "pending" ||
                        selectedRegistration.approval_status ===
                        "rejected") && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500 text-white rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
                            <Lock size={10} />
                            <span>Operations Locked</span>
                          </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {serviceTracks.map((track, idx) => {
                        const Icon =
                          AVAILABLE_ICONS.find((i) => i.name === track.icon)
                            ?.icon || Zap;
                        return (
                          <button
                            key={track.id || idx}
                            disabled={
                              selectedRegistration.approval_status ===
                              "pending" ||
                              selectedRegistration.approval_status ===
                              "rejected"
                            }
                            onClick={() => {
                              setSelectedTrack(track);
                              setIsDynamicModalOpen(true);
                            }}
                            className={`flex flex-col gap-4 p-5 bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[32px] transition-all group relative overflow-hidden ${
                              selectedRegistration.approval_status ===
                                "pending" ||
                              selectedRegistration.approval_status ===
                                "rejected"
                                ? "opacity-40 cursor-not-allowed grayscale-[0.8]"
                                : "hover:shadow-xl hover:border-emerald-500/20"
                            }`}
                          >
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all shadow-sm shrink-0"
                              style={{
                                backgroundColor: `${track.themeColor}15`,
                                color: track.themeColor,
                              }}
                            >
                              <Icon size={20} strokeWidth={2.5} />
                            </div>
                            <div className="text-left">
                              <span className="block text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                {track.buttonLabel || track.name}
                              </span>
                              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">
                                Init {track.name}
                              </span>
                            </div>
                            <div className="absolute bottom-4 right-4 text-emerald-500/0 group-hover:text-emerald-500/20 transition-all translate-x-4 group-hover:translate-x-0">
                              <Plus size={20} strokeWidth={3} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Structured Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Status Banner */}
                    <div className="lg:col-span-12">
                      {selectedRegistration.patient_exists_count > 0 ? (
                        <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                              <Check size={14} strokeWidth={3} />
                            </div>
                            <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tight">
                              Linked Clinic Record: Patient ID #
                              {
                                selectedRegistration.existing_services?.[0]
                                  ?.patient_id
                              }
                            </span>
                          </div>
                          <button
                            onClick={() => navigate("/reception/patients")}
                            className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/10"
                          >
                            Show Registry
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center">
                            <AlertCircle size={14} strokeWidth={3} />
                          </div>
                          <span className="text-[11px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight">
                            Waiting for clinical profiling - No existing records
                            found
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Identity Column */}
                    <div className="lg:col-span-12 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Identity Section */}
                        <div className="bg-white dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[40px] p-8 space-y-8 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500">
                              <User size={16} />
                            </div>
                            <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                              Identity Plate
                            </h4>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
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
                                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-black/10 rounded-lg text-sm font-bold focus:ring-2 ring-emerald-500/20 outline-none"
                                />
                              ) : (
                                <p className="text-lg font-black text-slate-900 dark:text-white">
                                  {selectedRegistration.age || "N/A"}{" "}
                                  <span className="text-[10px] text-slate-400">
                                    Y/O
                                  </span>
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
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
                                    { label: "Other", value: "Other" },
                                  ]}
                                  className="!py-1.5 !rounded-lg !bg-slate-50"
                                />
                              ) : (
                                <p className="text-lg font-black text-slate-900 dark:text-white">
                                  {selectedRegistration.gender || "N/A"}
                                </p>
                              )}
                            </div>
                            <div className="col-span-2 space-y-1.5 pt-4 border-t border-black/5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Primary Link
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
                                  className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-emerald-500/20 rounded-xl text-lg font-black focus:ring-4 ring-emerald-500/5 outline-none"
                                />
                              ) : (
                                <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                    <Phone size={14} />
                                  </div>
                                  <p className="text-xl font-black tracking-tighter">
                                    {selectedRegistration.phone_number}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="col-span-2 space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Documented Residence
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
                                  className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-black/10 rounded-xl text-xs font-bold min-h-[80px] focus:ring-2 ring-emerald-500/20 outline-none"
                                />
                              ) : (
                                <div className="flex items-start gap-2">
                                  <MapPin
                                    size={12}
                                    className="text-slate-300 mt-1 shrink-0"
                                  />
                                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight line-clamp-2">
                                    {selectedRegistration.address ||
                                      "No documented residence"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Clinical Section */}
                        <div className="bg-white dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[40px] p-8 space-y-8 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                              <Activity size={16} />
                            </div>
                            <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                              Clinical Sequence
                            </h4>
                          </div>

                          <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 space-y-1.5 bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-black/5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Diagnosis / Concern
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
                                  className="w-full px-3 py-1 bg-transparent border-b-2 border-emerald-500/20 text-sm font-bold focus:border-emerald-500 outline-none"
                                />
                              ) : (
                                <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                  {selectedRegistration.chief_complain ||
                                    "General Clinical Inquiry"}
                                </p>
                              )}
                            </div>

                            <div className="col-span-6 space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Service
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
                                  options={options.types.map((t) => ({
                                    label: t,
                                    value: t,
                                  }))}
                                  className="!py-1.5 !rounded-lg !bg-slate-50"
                                />
                              ) : (
                                <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-white/10 rounded-lg inline-block">
                                  {selectedRegistration.consultation_type ||
                                    "IN_CLINIC"}
                                </p>
                              )}
                            </div>
                            <div className="col-span-6 space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Referrer
                              </label>
                              {isEditing ? (
                                <CustomSelect
                                  value={editData.reffered_by || ""}
                                  onChange={(v) =>
                                    setEditData({ ...editData, reffered_by: v })
                                  }
                                  options={options.referred_by.map((r) => ({
                                    label: r,
                                    value: r,
                                  }))}
                                  className="!py-1.5 !rounded-lg !bg-slate-50"
                                />
                              ) : (
                                <p className="text-sm font-black text-slate-400 uppercase tracking-tight">
                                  {selectedRegistration.reffered_by ||
                                    "Direct Walk-in"}
                                </p>
                              )}
                            </div>

                            <div className="col-span-6 space-y-1.5 pt-4 border-t border-black/5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Accounting Fee
                              </label>
                              {isEditing ? (
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
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
                                    className="w-full pl-7 pr-4 py-2 bg-slate-50 dark:bg-white/5 border border-black/10 rounded-xl text-lg font-black focus:ring-4 ring-emerald-500/5 outline-none"
                                  />
                                </div>
                              ) : (
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                  <span className="text-xs opacity-30 mr-1 font-serif">
                                    ₹
                                  </span>
                                  {selectedRegistration.consultation_amount}
                                </p>
                              )}
                            </div>
                            <div className="col-span-6 space-y-1.5 pt-4 border-t border-black/5">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Payment Logic
                              </label>
                              {isEditing ? (
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
                                  className="!py-2 !rounded-xl !bg-slate-50"
                                />
                              ) : (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                  <CreditCard
                                    size={14}
                                    className="text-emerald-500"
                                  />
                                  <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                                    {selectedRegistration.payment_method ||
                                      "CASH"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Notes Area */}
                      <div className="bg-slate-50 dark:bg-white/[0.01] border border-black/5 dark:border-white/5 rounded-[40px] p-8 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400">
                            <HistoryIcon size={14} />
                          </div>
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Clinical Observations & Notes
                          </h4>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400/60 leading-relaxed italic text-center py-4 border-2 border-dashed border-black/5 rounded-[24px]">
                          No Documented Clinical Observations for this sequence.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="shrink-0 px-10 py-6 border-t border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                    Active Session Link
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <button
                      onClick={handleSaveDetails}
                      disabled={isSaving}
                      className="px-10 py-3.5 bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-3 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Check size={16} strokeWidth={3} />
                      )}
                      Save Changes
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsDetailsModalOpen(false)}
                      className="px-10 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- BILL MODAL --- */}
      <AnimatePresence>
        {isBillModalOpen && selectedRegistration && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
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
                  <button
                    onClick={handlePrintBill}
                    className="flex items-center gap-2 px-5 py-2 bg-[#006e1c] text-white rounded-full text-xs font-black shadow-lg hover:opacity-90 transition-all"
                  >
                    <Printer size={16} /> Print
                  </button>
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
