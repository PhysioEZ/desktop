import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  ChevronDown,
  Calendar,
  RefreshCw,
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
  CheckCircle2,
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
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
} from "lucide-react";
import CustomSelect from "../components/ui/CustomSelect";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/useAuthStore";
import { API_BASE_URL, authFetch, FILE_BASE_URL } from "../config";
import { format, parseISO, isValid } from "date-fns";
import { useDashboardStore } from "../store";
import DynamicServiceModal from "../components/reception/DynamicServiceModal";
import UpdatePaymentModal from "../components/reception/UpdatePaymentModal";
import GlobalSearch from "../components/GlobalSearch";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import type { ShortcutItem } from "../components/KeyboardShortcuts";

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

const Registration = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { searchCache, setSearchCache } = useDashboardStore();

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
  const [serviceTracks, setServiceTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [isDynamicModalOpen, setIsDynamicModalOpen] = useState(false);

  // Header State
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Header Effects
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      notifRef.current &&
      !notifRef.current.contains(e.target as Node) &&
      !(e.target as Element).closest("#notif-popup")
    )
      setShowNotifPopup(false);
    if (profileRef.current && !profileRef.current.contains(e.target as Node))
      setShowProfilePopup(false);
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notifications
  useEffect(() => {
    const fetchNotifs = async () => {
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
    };
    if (user?.employee_id) {
      fetchNotifs();
      const inv = setInterval(fetchNotifs, 30000);
      return () => clearInterval(inv);
    }
  }, [user?.employee_id]);

  // Fetch Active Service Tracks
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const response = await authFetch(`${API_BASE_URL}/admin/services`);
        const data = await response.json();
        if (data.status === "success") {
          // Only show active tracks
          setServiceTracks(data.data.filter((t: any) => t.isActive));
        }
      } catch (err) {
        console.error("Fetch tracks failed:", err);
      }
    };
    fetchTracks();
  }, []);

  // Global Search with Caching
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!user?.branch_id) {
      setSearchResults([]);
      return;
    }

    const query = globalSearchQuery.trim().toLowerCase();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    // Check cache
    if (searchCache[query]) {
      setSearchResults(searchCache[query]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authFetch(
          `${API_BASE_URL}/reception/search_patients?branch_id=${user.branch_id}&q=${encodeURIComponent(globalSearchQuery)}`,
        );
        const data = await res.json();
        if (data.success) {
          const results = data.results || [];
          setSearchResults(results);
          setSearchCache(query, results);
        }
      } catch (err) {
        console.error("Search Error:", err);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [globalSearchQuery, user?.branch_id]);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [referrerFilter, setReferrerFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    total_pages: 1,
  });

  const [options, setOptions] = useState<{
    referred_by: string[];
    conditions: string[];
    types: string[];
    payment_methods: string[];
  }>({ referred_by: [], conditions: [], types: [], payment_methods: [] });

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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const fetchRegistrations = useCallback(async () => {
    if (!user?.branch_id) return;

    // Show big loader only on first mount or when swapping pages for the first time
    if (isFirstLoad.current) setIsLoading(true);
    setIsSearching(true);

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fetch",
          branch_id: user.branch_id,
          search: debouncedSearch,
          status: statusFilter,
          referred_by: referrerFilter,
          condition: conditionFilter,
          page: currentPage,
          limit: 12,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setRegistrations(data.data || []);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch registrations:", err);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
      isFirstLoad.current = false;
    }
  }, [
    user?.branch_id,
    debouncedSearch,
    statusFilter,
    referrerFilter,
    conditionFilter,
    currentPage,
  ]);

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
      action: () => setShowGlobalModal(true),
    },
    {
      keys: ["Alt", "W"],
      description: "Toggle Theme",
      group: "General",
      action: toggleTheme,
    },
    {
      keys: ["Alt", "N"],
      description: "Notifications",
      group: "General",
      action: () => {
        setShowNotifPopup((p) => !p);
        setShowProfilePopup(false);
      },
    },
    {
      keys: ["Alt", "P"],
      description: "Profile",
      group: "General",
      action: () => {
        setShowProfilePopup((p) => !p);
        setShowNotifPopup(false);
      },
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
      action: () => {
        isFirstLoad.current = true;
        fetchRegistrations();
      },
      pageSpecific: true,
    },
    {
      keys: ["Alt", "F"],
      description: "Focus Search",
      group: "Registration",
      action: () => searchInputRef.current?.focus(),
      pageSpecific: true,
    },
    {
      keys: ["Alt", "X"],
      description: "Reset Filters",
      group: "Registration",
      action: () => {
        setSearchQuery("");
        setStatusFilter("");
        setReferrerFilter("");
        setConditionFilter("");
        setCurrentPage(1);
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
      keys: ["Alt", "E"],
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
        if (currentPage > 1) setCurrentPage((p) => p - 1);
      },
      pageSpecific: true,
    },
    {
      keys: ["Alt", "ArrowRight"],
      description: "Next Page",
      group: "Registration",
      action: () => {
        if (currentPage < pagination.total_pages) setCurrentPage((p) => p + 1);
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
        if (showGlobalModal) setShowGlobalModal(false);
        else if (showShortcuts) setShowShortcuts(false);
        else if (isDetailsModalOpen) setIsDetailsModalOpen(false);
        return;
      }

      // Standard Shortcuts (Alt based)
      let key = e.key.toUpperCase();
      if (e.key === "ArrowLeft") key = "ARROWLEFT";
      if (e.key === "ArrowRight") key = "ARROWRIGHT";
      const altKey = e.altKey;

      shortcuts.forEach((s) => {
        if (s.keys.includes("Alt") && altKey && s.keys.includes(key)) {
          e.preventDefault();
          if (s.action) s.action();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showGlobalModal,
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
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/registration`, {
        method: "POST",
        body: JSON.stringify({ action: "options", branch_id: user.branch_id }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setOptions(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch options:", err);
    }
  }, [user?.branch_id]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    // Optimistic update
    setRegistrations((prev) =>
      prev.map((reg) =>
        reg.registration_id === id ? { ...reg, status: newStatus } : reg,
      ),
    );

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

  const fetchDetails = async (id: number) => {
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/registration?action=details&id=${id}`,
        { method: "POST", body: JSON.stringify({ action: "details", id }) },
      );
      const data = await res.json();
      if (data.status === "success") {
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
        fetchDetails(selectedRegistration.registration_id);
        fetchRegistrations();
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
    <div className="min-h-screen bg-[#fdfcff] dark:bg-[#111315] text-[#1a1c1e] dark:text-[#e3e2e6] font-sans transition-colors duration-300 pb-20">
      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fdfcff]/80 dark:bg-[#111315]/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between border-b border-[#e0e2ec] dark:border-[#43474e] transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/reception/dashboard")}
          >
            <div className="w-10 h-10 rounded-xl bg-[#ccebc4] flex items-center justify-center text-[#0c200e] font-bold">
              PE
            </div>
            <h1
              className="text-2xl text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight hidden md:block"
              style={{ fontFamily: "serif" }}
            >
              PhysioEZ
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Search Bar */}
          <div
            ref={searchRef}
            className="hidden md:flex items-center relative z-50"
          >
            <div
              className="flex items-center bg-[#e0e2ec] dark:bg-[#43474e] rounded-full px-4 py-2 w-64 lg:w-96 transition-colors duration-300 cursor-pointer hover:bg-[#dadae2] dark:hover:bg-[#50545c]"
              onClick={() => setShowGlobalModal(true)}
            >
              <Search
                size={18}
                className="text-[#43474e] dark:text-[#c4c7c5] mr-2"
              />
              <span className="text-sm text-[#43474e] dark:text-[#8e918f]">
                {globalSearchQuery || "Search patients... (Alt + S)"}
              </span>
            </div>
          </div>

          <button
            onClick={fetchRegistrations}
            disabled={isSearching}
            className={`p-3 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors ${isSearching ? "animate-spin" : ""}`}
          >
            <RefreshCw size={22} strokeWidth={1.5} />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-3 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors"
          >
            <Moon size={22} strokeWidth={1.5} className="block dark:hidden" />
            <Sun size={22} strokeWidth={1.5} className="hidden dark:block" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              ref={notifRef}
              onClick={() => {
                setShowNotifPopup(!showNotifPopup);
                setShowProfilePopup(false);
              }}
              className="p-3 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors relative"
            >
              <Bell size={22} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute top-3 right-3 w-2 h-2 bg-[#b3261e] rounded-full"></span>
              )}
            </button>
            <AnimatePresence>
              {showNotifPopup && (
                <motion.div
                  id="notif-popup"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-full right-0 mt-2 w-80 bg-[#fdfcff] dark:bg-[#111315] rounded-[20px] shadow-xl border border-[#e0e2ec] dark:border-[#43474e] z-[60] overflow-hidden transition-colors"
                >
                  <div className="p-4 border-b border-[#e0e2ec] dark:border-[#43474e] font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">
                    Notifications
                  </div>
                  <div className="space-y-4">
                    {notifications.map((n, idx) => (
                      <div
                        key={n.notification_id || `notification-${idx}`}
                        className={`p-3 border-b border-[#e0e2ec] dark:border-[#43474e] hover:bg-[#e0e2ec]/50 dark:hover:bg-[#43474e]/50 ${n.is_read === 0 ? "bg-[#ccebc4]/20 dark:bg-[#ccebc4]/10" : ""}`}
                      >
                        <p className="text-sm text-[#1a1c1e] dark:text-[#e3e2e6]">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-[#43474e] dark:text-[#c4c7c5] mt-1">
                          {n.time_ago}
                        </p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-4 text-center text-sm text-[#43474e] dark:text-[#c4c7c5]">
                        No notifications
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" ref={profileRef}>
            <div
              onClick={() => {
                setShowProfilePopup(!showProfilePopup);
                setShowNotifPopup(false);
              }}
              className="w-10 h-10 bg-[#ccebc4] dark:bg-[#0c3b10] rounded-full flex items-center justify-center text-[#0c200e] dark:text-[#ccebc4] font-bold border border-[#74777f] dark:border-[#8e918f] ml-1 overflow-hidden cursor-pointer hover:ring-2 ring-[#ccebc4] transition-colors"
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <AnimatePresence>
              {showProfilePopup && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-[#fdfcff] dark:bg-[#111315] rounded-[20px] shadow-xl border border-[#e0e2ec] dark:border-[#43474e] z-[60] overflow-hidden p-2 transition-colors"
                >
                  <button
                    onClick={() => navigate("/reception/profile")}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] text-sm font-medium transition-colors"
                  >
                    <User size={18} /> Profile
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#ffdad6] dark:hover:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] text-sm font-medium mt-1 transition-colors"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* --- NAVIGATION CHIPS --- */}
      <div className="fixed top-[72px] left-0 right-0 z-40 bg-[#fdfcff]/80 dark:bg-[#111315]/80 backdrop-blur-md border-b border-[#e0e2ec] dark:border-[#43474e] transition-colors duration-300">
        <div className="flex gap-3 overflow-x-auto py-3 px-6 scrollbar-hide">
          {[
            { label: "Dashboard", path: "/reception/dashboard" },
            { label: "Schedule", path: "/reception/schedule" },
            { label: "Inquiry", path: "/reception/inquiry" },
            { label: "Registration", path: "/reception/registration" },
            { label: "Patients", path: "/reception/patients" },
            { label: "Billing", path: "/reception/billing" },
            { label: "Attendance", path: "/reception/attendance" },
            { label: "Tests", path: "/reception/tests" },
            { label: "Feedback", path: "/reception/feedback" },
            { label: "Reports", path: "/reception/reports" },
            { label: "Expenses", path: "/reception/expenses" },
            { label: "Support", path: "/reception/support" },
          ].map((nav) => (
            <button
              key={nav.label}
              onClick={() => {
                if (nav.label !== "Registration") navigate(nav.path);
              }}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${nav.label === "Registration" ? "bg-[#1a1c1e] text-white dark:bg-[#e3e2e6] dark:text-[#1a1c1e] shadow-md" : "bg-[#f2f6fa] dark:bg-[#1a1c1e] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] border border-[#74777f] dark:border-[#8e918f] text-[#43474e] dark:text-[#c4c7c5]"}`}
            >
              {nav.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- MAIN PAGE CONTENT --- */}
      <div className="max-w-[1600px] mx-auto p-6 pt-36">
        {/* Page Title & Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-4xl font-black text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight mb-1"
              style={{ fontFamily: "serif" }}
            >
              Registration
            </h1>
            <p className="text-base text-[#43474e] dark:text-[#c4c7c5] font-medium">
              Manage and monitor patient registrations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/reception/registration/cancelled")}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#ffdad6] text-[#410002] rounded-[16px] text-sm font-bold hover:bg-[#ffb4ab] transition-all"
            >
              <Trash2 size={18} /> Cancelled History
            </button>
            <button
              onClick={() => {
                isFirstLoad.current = true;
                fetchRegistrations();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#ccebc4] text-[#002105] rounded-[16px] text-sm font-bold hover:bg-[#b0f2a0] transition-all"
            >
              <RefreshCw
                size={18}
                className={isSearching ? "animate-spin" : ""}
              />{" "}
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#f0f4f9] dark:bg-[#1e2022] rounded-[24px] p-2 mb-8 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-[20px] shadow-sm px-4 py-3 flex items-center gap-3 border border-transparent focus-within:border-[#006e1c] dark:focus-within:border-[#88d99d] transition-all">
            <Search className="text-[#43474e] dark:text-[#c4c7c5]" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, phone or ID... (Alt + F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-base w-full text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#43474e] dark:placeholder:text-[#8e918f] font-medium"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <CustomSelect
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
              options={[
                { label: "All Status", value: "" },
                { label: "Pending", value: "pending" },
                { label: "Consulted", value: "consulted" },
                { label: "Closed", value: "closed" },
              ]}
              placeholder="Status"
              className="min-w-[150px] !rounded-[20px] !py-4 !border-none !bg-[#fdfcff] dark:!bg-[#1a1c1e] !shadow-sm !font-bold"
            />
            <CustomSelect
              value={referrerFilter}
              onChange={(v) => {
                setReferrerFilter(v);
                setCurrentPage(1);
              }}
              options={[
                { label: "All Referrers", value: "" },
                ...options.referred_by.map((r) => ({ label: r, value: r })),
              ]}
              placeholder="Referrer"
              className="min-w-[160px] !rounded-[20px] !py-4 !border-none !bg-[#fdfcff] dark:!bg-[#1a1c1e] !shadow-sm !font-bold"
            />
            <CustomSelect
              value={conditionFilter}
              onChange={(v) => {
                setConditionFilter(v);
                setCurrentPage(1);
              }}
              options={[
                { label: "All Conditions", value: "" },
                ...options.conditions.map((c) => ({ label: c, value: c })),
              ]}
              placeholder="Condition"
              className="min-w-[160px] !rounded-[20px] !py-4 !border-none !bg-[#fdfcff] dark:!bg-[#1a1c1e] !shadow-sm !font-bold"
            />
          </div>
        </div>

        {/* Cards / List View */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#006e1c] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-base font-bold text-[#43474e] dark:text-[#c4c7c5]">
              Loading registrations...
            </p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <div className="w-20 h-20 bg-[#e0e2ec] dark:bg-[#43474e] rounded-full flex items-center justify-center mb-6 text-[#1a1c1e] dark:text-[#e3e2e6]">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">
              No registrations found
            </h3>
            <p className="text-[#43474e] dark:text-[#c4c7c5] mt-2">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Header Row for Desktop */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-[#43474e] dark:text-[#c4c7c5] opacity-70">
              <div className="col-span-3">Patient</div>
              <div className="col-span-3">Clinical Details</div>
              <div className="col-span-2">Referrer & Date</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2 text-center">Status</div>
            </div>

            {registrations.map((reg, idx) => {
              const isPendingApproval = reg.approval_status === "pending";
              const isRejected = reg.approval_status === "rejected";

              return (
                <motion.div
                  key={reg.registration_id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.3 }}
                  onClick={() => fetchDetails(reg.registration_id)}
                  className={`
                                    group rounded-[20px] border p-4 lg:px-6 lg:py-4 transition-all relative overflow-hidden flex flex-col lg:grid lg:grid-cols-12 gap-4 items-start lg:items-center
                                    ${
                                      isPendingApproval
                                        ? "bg-[#f6f6f6] dark:bg-[#1f1f1f] border-[#e0e2ec] dark:border-[#43474e] cursor-not-allowed opacity-80"
                                        : isRejected
                                          ? "bg-[#fff8f7] dark:bg-[#2a1a1a] border-[#ffb4ab] dark:border-[#93000a] cursor-pointer hover:shadow-lg hover:shadow-red-900/10"
                                          : "bg-[#fdfcff] dark:bg-[#1a1c1e] border-[#e0e2ec] dark:border-[#43474e] hover:shadow-lg hover:border-[#ccebc4] dark:hover:border-[#005313] cursor-pointer"
                                    }
                                `}
                >
                  {/* 1. Identity Section */}
                  <div className="col-span-3 flex items-center gap-4 w-full">
                    <div className="relative shrink-0">
                      <div
                        className={`w-12 h-12 rounded-[14px] flex items-center justify-center font-black text-lg shadow-sm border overflow-hidden ${isPendingApproval ? "bg-[#e0e2ec] text-[#43474e] border-transparent" : "bg-[#ccebc4] dark:bg-[#0c3b10] text-[#002105] dark:text-[#ccebc4] border-[#ccebc4] dark:border-[#0c3b10]"}`}
                      >
                        {reg.patient_photo_path ? (
                          <img
                            src={getPhotoUrl(reg.patient_photo_path) || ""}
                            className="w-full h-full object-cover"
                            alt=""
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                              (
                                e.target as HTMLImageElement
                              ).parentElement!.innerText =
                                reg.patient_name?.charAt(0) || "?";
                            }}
                          />
                        ) : (
                          reg.patient_name?.charAt(0) || "?"
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-md px-1.5 py-0.5 text-[9px] font-bold text-[#43474e] dark:text-[#c4c7c5] shadow-sm border border-[#e0e2ec] dark:border-[#43474e]">
                        #{reg.registration_id}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-[#1a1c1e] dark:text-[#e3e2e6] leading-tight truncate">
                        {reg.patient_name}
                      </h3>
                      <p className="text-xs text-[#43474e] dark:text-[#c4c7c5] font-medium mt-0.5 flex items-center gap-1.5">
                        <Phone size={10} /> {reg.phone_number}
                      </p>
                    </div>
                  </div>

                  {/* 2. Clinical Section */}
                  <div className="col-span-3 w-full">
                    <div className="flex flex-col gap-1">
                      {reg.chief_complain ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPendingApproval ? "bg-[#74777f]" : "bg-[#b3261e]"}`}
                          ></span>
                          <span
                            className="text-sm font-semibold text-[#1a1c1e] dark:text-[#e3e2e6] truncate"
                            title={reg.chief_complain}
                          >
                            {reg.chief_complain}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-[#43474e] dark:text-[#c4c7c5] italic">
                          No complaint logged
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wide bg-[#f0f4f9] dark:bg-[#30333b] px-2 py-0.5 rounded-md w-fit">
                        {reg.consultation_type || "Consultation"}
                      </span>
                    </div>
                  </div>

                  {/* 3. Context Section */}
                  <div className="col-span-2 w-full">
                    <p
                      className="text-xs font-medium text-[#1a1c1e] dark:text-[#e3e2e6] mb-0.5 truncate"
                      title={reg.reffered_by}
                    >
                      <span className="text-[#43474e] dark:text-[#c4c7c5]">
                        By:
                      </span>{" "}
                      {reg.reffered_by || "Direct"}
                    </p>
                    <p className="text-[10px] text-[#43474e] dark:text-[#c4c7c5] font-medium flex items-center gap-1">
                      <Clock size={10} />{" "}
                      {formatDateSafe(reg.created_at, "MMM d, h:mm a")}
                    </p>
                  </div>

                  {/* 4. Financial Section */}
                  <div className="col-span-2 text-left lg:text-right w-full">
                    <p className="text-base font-black text-[#1a1c1e] dark:text-[#e3e2e6]">
                      ₹{reg.consultation_amount}
                    </p>
                    <p className="text-[10px] font-bold uppercase text-[#43474e] dark:text-[#c4c7c5] tracking-tight">
                      {reg.payment_method || "Unspecified"}
                    </p>
                  </div>

                  {/* 5. Status & Actions */}
                  <div className="col-span-2 flex items-center justify-between lg:justify-center gap-4 w-full">
                    {isPendingApproval ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#fff8f7] dark:bg-[#2a2424] text-[#ba1a1a] dark:text-[#ffb4ab] border border-[#ffdad6] dark:border-[#93000a] rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                        <Lock size={12} />
                        <span>Waiting Approval</span>
                      </div>
                    ) : isRejected ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedForPaymentFix(reg);
                          setIsPaymentModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#ba1a1a] text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md shadow-red-900/20 hover:bg-[#93000a] transition-colors"
                      >
                        <Edit2 size={12} className="text-white" />
                        <span>Fix Payment?</span>
                      </button>
                    ) : (
                      <>
                        <StatusDropdown
                          currentStatus={reg.status}
                          onUpdate={(val) =>
                            handleUpdateStatus(reg.registration_id, val)
                          }
                          getStatusColors={getStatusColors}
                        />

                        <button className="w-8 h-8 rounded-full bg-[#f0f4f9] dark:bg-[#30333b] flex items-center justify-center text-[#43474e] dark:text-[#c4c7c5] lg:opacity-0 lg:group-hover:opacity-100 dark:hover:bg-[#43474e] hover:bg-[#e0e2ec] transition-all">
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination (Floating) */}
        {!isLoading && registrations.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1c1e] dark:bg-[#e3e2e6] text-white dark:text-[#1a1c1e] px-4 py-2 rounded-full shadow-2xl z-30 flex items-center gap-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isSearching}
              className="p-1 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-xs font-bold tracking-widest">
              {currentPage} / {pagination.total_pages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))
              }
              disabled={currentPage === pagination.total_pages || isSearching}
              className="p-1 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedRegistration && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-[#001f25]/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-6xl max-h-[95vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-[#e0e2ec] dark:border-[#43474e]"
            >
              {/* Modal Header */}
              <div className="px-8 py-5 border-b border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center bg-[#fdfcff] dark:bg-[#1a1c1e]">
                <div>
                  <h2 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">
                    Registration Details
                  </h2>
                  <p className="text-xs text-[#43474e] dark:text-[#c4c7c5] mt-1">
                    View and manage patient registration
                  </p>
                </div>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-2 lg:p-1.5 bg-[#e0e2ec] dark:bg-[#43474e] text-[#43474e] dark:text-[#e3e2e6] rounded-full hover:bg-[#ffdad6] hover:text-[#410002] transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Patient Info Bar */}
              <div className="px-8 py-6 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">
                    {selectedRegistration.patient_name}
                  </h3>
                  <div className="flex items-center gap-4 text-[#43474e] dark:text-[#c4c7c5] text-xs font-medium">
                    <span className="bg-[#e0e2ec] dark:bg-[#43474e] px-2 py-0.5 rounded text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5]">
                      ID: #{selectedRegistration.registration_id}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {formatDateSafe(
                        selectedRegistration.created_at,
                        "yyyy-MM-dd HH:mm:ss",
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      navigateToBill(selectedRegistration.registration_id)
                    }
                    className="p-2 text-[#43474e] dark:text-[#c4c7c5] hover:text-[#1a1c1e] dark:hover:text-[#e3e2e6] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-xl transition-all border border-[#e0e2ec] dark:border-[#43474e]"
                    title="Print Bill"
                  >
                    <Printer size={18} />
                  </button>
                  {!isEditing ? (
                    <button
                      onClick={startEditing}
                      className="flex items-center gap-2 px-5 py-2 bg-[#006e1c] text-white rounded-full text-xs font-bold hover:bg-[#005313] transition-all shadow-md"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2 px-5 py-2 bg-[#e0e2ec] dark:bg-[#43474e] text-[#43474e] dark:text-[#c4c7c5] rounded-xl text-xs font-bold hover:bg-[#c4c7c5] dark:hover:bg-[#5b5e66] transition-all border border-[#74777f] dark:border-[#8e918f]"
                    >
                      <RotateCcw size={14} />
                      Cancel
                    </button>
                  )}
                  <span
                    className={`px-4 py-2 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-all ${getStatusColors(selectedRegistration.status)}`}
                  >
                    {selectedRegistration.status}
                  </span>
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: "Cancel Registration?",
                        message:
                          "Are you sure you want to cancel this registration? It will be moved to the Cancelled History for refund processing.",
                        onConfirm: () => {
                          handleUpdateStatus(
                            selectedRegistration.registration_id,
                            "closed",
                          );
                          setIsDetailsModalOpen(false);
                          setConfirmModal((prev) => ({
                            ...prev,
                            isOpen: false,
                          }));
                        },
                      });
                    }}
                    className="p-2 text-[#b3261e] dark:text-[#ffb4ab] hover:bg-[#ffdad6]/50 rounded-xl transition-all border border-[#e0e2ec] dark:border-[#43474e]"
                    title="Cancel Registration"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Container */}
              <div className="flex-1 overflow-auto p-8 pt-0 custom-scrollbar">
                <div className="space-y-8">
                  {/* Quick Actions */}
                  <div
                    className={`p-8 rounded-[32px] border border-[#d3e3fd] dark:border-[#0842a0] bg-gradient-to-br from-[#ecf3fe] to-[#d3e3fd]/30 dark:from-[#0842a0]/10 dark:to-[#0842a0]/20 relative overflow-hidden ${selectedRegistration.approval_status === "pending" || selectedRegistration.approval_status === "rejected" ? "slashed-bg" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h4 className="text-[11px] font-black text-[#041e49] dark:text-[#d3e3fd] uppercase tracking-[0.2em] flex items-center gap-2">
                          <Zap size={14} className="text-[#006a6a]" /> Bureau
                          Quick Converter
                        </h4>
                        <p className="text-xs text-[#041e49]/70 dark:text-[#d3e3fd]/70 font-medium mt-1">
                          Initialize treatment track conversion
                        </p>
                      </div>
                    </div>

                    {(selectedRegistration.approval_status === "pending" ||
                      selectedRegistration.approval_status === "rejected") && (
                      <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 text-center">
                        <div className="bg-[#b3261e] text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 border border-white/20">
                          <Lock size={14} />
                          <span>
                            {selectedRegistration.approval_status === "pending"
                              ? "Pending Approval"
                              : "Registration Rejected"}{" "}
                            - Actions Locked
                          </span>
                        </div>
                      </div>
                    )}

                    <div
                      className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 ${selectedRegistration.approval_status === "pending" || selectedRegistration.approval_status === "rejected" ? "opacity-40 pointer-events-none grayscale" : ""}`}
                    >
                      {/* Dynamic Service Tracks */}
                      {serviceTracks.map((track, idx) => {
                        const Icon =
                          AVAILABLE_ICONS.find((i) => i.name === track.icon)
                            ?.icon || Zap;
                        return (
                          <button
                            key={track.id || idx}
                            onClick={() => {
                              setSelectedTrack(track);
                              setIsDynamicModalOpen(true);
                            }}
                            className="flex items-center gap-4 p-5 bg-white dark:bg-[#1a1c1e] border-2 border-transparent hover:border-[#006a6a]/30 rounded-[24px] hover:shadow-xl transition-all group relative overflow-hidden shadow-sm"
                          >
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm"
                              style={{
                                backgroundColor: `${track.themeColor}15`,
                                color: track.themeColor,
                              }}
                            >
                              <Icon size={22} />
                            </div>
                            <div className="text-left">
                              <span className="block text-sm font-black text-[#1a1c1e] dark:text-[#e3e2e6] uppercase tracking-tight">
                                {track.buttonLabel || track.name}
                              </span>
                              <span className="block text-[9px] font-bold text-[#43474e] dark:text-[#c4c7c5] mt-0.5 uppercase opacity-60">
                                {track.name}
                              </span>
                            </div>
                            <div className="absolute top-0 right-0 w-8 h-8 bg-[#006a6a]/5 rounded-bl-3xl translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform"></div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedRegistration.patient_exists_count > 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-[#ccebc4]/20 border border-[#ccebc4] rounded-2xl flex items-center gap-3 text-[#006e1c] font-black text-sm shadow-sm ring-1 ring-[#ccebc4]/50"
                      >
                        <CheckCircle2 size={18} />
                        <span>
                          This patient is already in the clinical registry.
                          (Patient ID:{" "}
                          {selectedRegistration.existing_services?.[0]
                            ?.patient_id || "N/A"}
                          )
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-[#ffefc2]/30 border border-[#dec650] rounded-2xl flex items-center gap-3 text-[#675402] font-black text-sm shadow-sm ring-1 ring-[#675402]/20"
                      >
                        <AlertCircle size={18} />
                        <span>
                          ⚠️ No patient found for this Registration ID. You can
                          add them.
                        </span>
                      </motion.div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Personal Info */}
                    <div className="p-8 rounded-[32px] border border-[#e0e2ec] dark:border-[#43474e] bg-white/40 dark:bg-black/10 space-y-8 relative overflow-hidden shadow-inner">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#006a6a]/5 rounded-bl-full -mr-8 -mt-8 opacity-40"></div>
                      <div className="flex items-center justify-between relative z-10">
                        <h4 className="text-[11px] font-black text-[#006a6a] uppercase tracking-[0.2em] flex items-center gap-2">
                          <User size={14} /> Personal Identity
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-y-8 gap-x-6 relative z-10">
                        <div>
                          <label className="text-[10px] font-black text-[#43474e]/60 dark:text-[#c4c7c5]/60 uppercase tracking-widest block mb-2">
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
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#43474e] border border-[#e0e2ec] dark:border-[#43474e] rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-1 ring-[#006a6a]"
                            />
                          ) : (
                            <p className="text-base font-black text-[#1a1c1e] dark:text-[#e3e2e6]">
                              {selectedRegistration.age || "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-[#43474e]/60 dark:text-[#c4c7c5]/60 uppercase tracking-widest block mb-2">
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
                              className="bg-white dark:bg-[#43474e] rounded-xl text-sm"
                            />
                          ) : (
                            <p className="text-base font-black text-[#1a1c1e] dark:text-[#e3e2e6]">
                              {selectedRegistration.gender || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-black text-[#43474e]/60 dark:text-[#c4c7c5]/60 uppercase tracking-widest block mb-2">
                            Contact Link
                          </label>
                          {isEditing ? (
                            <div className="relative">
                              <Phone
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                size={14}
                              />
                              <input
                                type="text"
                                value={editData.phone_number || ""}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    phone_number: e.target.value,
                                  })
                                }
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#43474e] border border-[#e0e2ec] dark:border-[#43474e] rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-1 ring-[#006a6a]"
                              />
                            </div>
                          ) : (
                            <p className="text-base font-black text-[#1a1c1e] dark:text-[#e3e2e6] flex items-center gap-2">
                              <Phone size={14} className="text-[#006a6a]" />{" "}
                              {selectedRegistration.phone_number}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-black text-[#43474e]/60 dark:text-[#c4c7c5]/60 uppercase tracking-widest block mb-2">
                            Secure Email
                          </label>
                          {isEditing ? (
                            <input
                              type="email"
                              value={editData.email || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  email: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#43474e] border border-[#e0e2ec] dark:border-[#43474e] rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-1 ring-[#006a6a]"
                            />
                          ) : (
                            <p className="text-sm font-bold text-[#1a1c1e] dark:text-[#e3e2e6] truncate">
                              {selectedRegistration.email || "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-black text-[#43474e]/60 dark:text-[#c4c7c5]/60 uppercase tracking-widest block mb-2">
                            Residence Address
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
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#43474e] border border-[#e0e2ec] dark:border-[#43474e] rounded-xl text-sm font-bold shadow-sm outline-none min-h-[80px] focus:ring-1 ring-[#006a6a]"
                            />
                          ) : (
                            <p className="text-sm font-medium text-[#43474e] dark:text-[#c4c7c5] leading-relaxed">
                              {selectedRegistration.address || "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Clinical Info */}
                    <div className="p-8 rounded-[32px] border border-[#e0e2ec] dark:border-[#43474e] bg-white/40 dark:bg-black/10 space-y-8 relative overflow-hidden shadow-inner">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#b3261e]/5 rounded-bl-full -mr-8 -mt-8 opacity-40"></div>
                      <div className="flex items-center justify-between relative z-10">
                        <h4 className="text-[11px] font-black text-[#b3261e] uppercase tracking-[0.2em] flex items-center gap-2">
                          <Activity size={14} /> Clinical Registry
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-y-8 gap-x-6 relative z-10">
                        <div className="col-span-2">
                          <label className="text-[10px] font-black text-[#43474e]/60 dark:text-[#c4c7c5]/60 uppercase tracking-widest block mb-2">
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
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#43474e] border border-[#e0e2ec] dark:border-[#43474e] rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-1 ring-[#006a6a]"
                            />
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#b3261e]"></div>
                              <p className="text-base font-black text-[#1a1c1e] dark:text-[#e3e2e6]">
                                {selectedRegistration.chief_complain}
                              </p>
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-[#43474e]/60 dark:text-[#c4c7c5]/60 uppercase tracking-widest block mb-2">
                            Clinical Service
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
                              options={[
                                { label: "Select", value: "" },
                                ...options.types.map((t) => ({
                                  label: t,
                                  value: t,
                                })),
                              ]}
                              className="bg-white dark:bg-[#43474e] rounded-xl text-sm"
                            />
                          ) : (
                            <p className="text-sm font-black text-[#1a1c1e] dark:text-[#e3e2e6] uppercase tracking-wider bg-[#e0e2ec] dark:bg-[#43474e] px-3 py-1 rounded-lg w-fit">
                              {selectedRegistration.consultation_type}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-[#43474e]/60 dark:text-[#c4c7c5]/60 uppercase tracking-widest block mb-2">
                            Source / Referrer
                          </label>
                          {isEditing ? (
                            <CustomSelect
                              value={editData.reffered_by || ""}
                              onChange={(v) =>
                                setEditData({ ...editData, reffered_by: v })
                              }
                              options={[
                                { label: "Select", value: "" },
                                ...options.referred_by.map((r) => ({
                                  label: r,
                                  value: r,
                                })),
                              ]}
                              className="bg-white dark:bg-[#43474e] rounded-xl text-sm"
                            />
                          ) : (
                            <p className="text-base font-black text-[#1a1c1e] dark:text-[#e3e2e6]">
                              {selectedRegistration.reffered_by ||
                                "Direct Entry"}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-[#43474e]/60 dark:text-[#c4c7c5]/60 uppercase tracking-widest block mb-2">
                            Accounting Fee
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editData.consultation_amount || ""}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  consultation_amount: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#43474e] border border-[#e0e2ec] dark:border-[#43474e] rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-1 ring-[#006a6a]"
                            />
                          ) : (
                            <p className="text-xl font-black text-[#1a1c1e] dark:text-[#e3e2e6]">
                              ₹ {selectedRegistration.consultation_amount}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-[#43474e]/60 dark:text-[#c4c7c5]/60 uppercase tracking-widest block mb-2">
                            Payment Logic
                          </label>
                          {isEditing ? (
                            <CustomSelect
                              value={editData.payment_method || ""}
                              onChange={(v) =>
                                setEditData({ ...editData, payment_method: v })
                              }
                              options={[
                                { label: "Cash", value: "Cash" },
                                { label: "Online", value: "Online" },
                                { label: "Card", value: "Card" },
                              ]}
                              className="bg-white dark:bg-[#43474e] rounded-xl text-sm"
                            />
                          ) : (
                            <p className="text-sm font-black text-[#1a1c1e] dark:text-[#e3e2e6] uppercase tracking-[0.1em] flex items-center gap-2">
                              <CreditCard
                                size={14}
                                className="text-[#006a6a]"
                              />{" "}
                              {selectedRegistration.payment_method}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2 pt-2">
                          <label className="text-[10px] font-black text-[#43474e]/60 dark:text-[#c4c7c5]/60 uppercase tracking-widest block mb-2">
                            Doctor's Observational Notes
                          </label>
                          <div className="p-5 bg-white/60 dark:bg-black/20 border border-[#e0e2ec] dark:border-[#43474e] rounded-[24px] text-sm text-[#43474e] dark:text-[#c4c7c5] font-medium leading-relaxed min-h-[80px] shadow-inner font-sans">
                            {selectedRegistration.doctor_notes ||
                              "No specialized clinical notes recorded for this patient yet."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-[#e0e2ec] dark:border-[#43474e] bg-[#fdfcff] dark:bg-[#1a1c1e] flex justify-end gap-3">
                {isEditing ? (
                  <button
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#006e1c] text-white rounded-full text-xs font-black shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                    onClick={handleSaveDetails}
                  >
                    <Check size={16} />{" "}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                ) : (
                  <button
                    className="px-8 py-2.5 bg-[#e0e2ec] dark:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] rounded-full text-xs font-bold hover:bg-[#c9cdd6] dark:hover:bg-[#5b5e66] transition-all"
                    onClick={() => setIsDetailsModalOpen(false)}
                  >
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- BILL MODAL --- */}
      <AnimatePresence>
        {isBillModalOpen && selectedRegistration && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150]"
          >
            <div
              className={`px-4 py-3 rounded-full shadow-lg flex items-center gap-3 ${toast.type === "success" ? "bg-[#006e1c] text-white" : toast.type === "error" ? "bg-[#ba1a1a] text-white" : "bg-[#00639b] text-white"}`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span className="text-xs font-bold tracking-wide">
                {toast.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- GLOBAL SEARCH MODAL --- */}
      <GlobalSearch
        isOpen={showGlobalModal}
        onClose={() => setShowGlobalModal(false)}
        searchQuery={globalSearchQuery}
        setSearchQuery={setGlobalSearchQuery}
        searchResults={searchResults}
      />

      {/* --- DYNAMIC SERVICE MODAL --- */}
      {selectedRegistration && selectedTrack && (
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
              fetchDetails(selectedRegistration.registration_id);
            }
            fetchRegistrations();
          }}
        />
      )}

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

      {/* --- GLOBAL SEARCH MODAL --- */}
      <GlobalSearch
        isOpen={showGlobalModal}
        onClose={() => setShowGlobalModal(false)}
        searchQuery={globalSearchQuery}
        setSearchQuery={setGlobalSearchQuery}
        searchResults={searchResults}
      />

      {/* --- KEYBOARD SHORTCUTS MODAL & BUTTON --- */}
      <KeyboardShortcuts
        shortcuts={shortcuts}
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        onToggle={() => setShowShortcuts((p) => !p)}
      />

      {/* --- LOGOUT CONFIRMATION --- */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-sm rounded-[28px] shadow-2xl relative z-10 p-8 text-center border border-[#e0e2ec] dark:border-[#43474e]"
            >
              <div className="w-16 h-16 rounded-full bg-[#ffdad6] dark:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] mx-auto flex items-center justify-center mb-6">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-black text-[#1a1c1e] dark:text-[#e3e2e6] mb-2">
                Logout
              </h3>
              <p className="text-sm font-medium text-[#43474e] dark:text-[#c4c7c5] mb-8">
                Are you sure you want to log out of your account?
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 bg-[#e0e2ec] dark:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] rounded-full text-xs font-bold hover:bg-[#c9cdd6] dark:hover:bg-[#5b5e66] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="flex-1 py-2.5 bg-[#ba1a1a] text-white rounded-full text-xs font-bold hover:bg-[#93000a] transition-all shadow-md"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Registration;
