import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Trash2,
  Zap,
  Activity,
  Moon,
  Sun,
  LogOut,
  Settings,
  CreditCard,
  Clock,
  ChevronDown,
  Info,
  Box,
  User,
  Check,
  Eye,
  Stethoscope,
  UserPlus,
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
  HeartPulse,
  Pill,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { authFetch, API_BASE_URL } from "../config";
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

const IconComponent = ({
  name,
  size = 20,
  strokeWidth = 2,
  className = "",
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) => {
  const Icon = AVAILABLE_ICONS.find((i) => i.name === name)?.icon || Activity;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
};

/* --- Types --- */

type FieldType = "text" | "number" | "select" | "date" | "checkbox" | "heading";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  colSpan: 1 | 2;
  options?: { label: string; value: string }[];
}

interface ServicePlan {
  id: string;
  icon: string;
  name: string;
  subtitle: string;
  rate: number;
  days: number;
}

interface ServiceTrack {
  id: string;
  name: string;
  buttonLabel: string; // The text on the Registration page button
  icon: string;
  themeColor: string;
  fields: FormField[];
  pricing: {
    enabled: boolean;
    model: "multi-plan" | "fixed-rate";
    plans: ServicePlan[];
    fixedRate: number;
  };
  scheduling: {
    enabled: boolean;
    slotInterval: number;
    slotCapacity: number;
    startTime: string;
    endTime: string;
  };
  permissions: {
    allowDiscount: boolean;
    maxDiscountPercent: number;
    requireDiscountApproval: boolean;
    allowedPaymentMethods: string[];
    allowSplitPayment: boolean;
  };
  isActive: boolean;
}

const ServiceManager = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark"),
  );
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showGlobalModal, setShowGlobalModal] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [searchResults] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<ServiceTrack | null>(null);
  const [formData, setFormData] = useState<Partial<ServiceTrack>>({});
  const [activeTab, setActiveTab] = useState<
    "identity" | "treatment" | "schedule" | "permissions"
  >("identity");
  const [previewSelectedPlanId, setPreviewSelectedPlanId] =
    useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const [tracks, setTracks] = useState<ServiceTrack[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<
    { method_code: string; method_name: string }[]
  >([]);

  const fetchTracks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/services`);
      const data = await response.json();
      if (data.status === "success") {
        setTracks(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch tracks");
      }
    } catch (err: any) {
      console.error("Fetch Tracks Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/reception/get_payment_methods`,
      );
      const data = await response.json();
      if (data.status === "success") {
        setPaymentMethods(data.data);
      }
    } catch (err) {
      console.error("Fetch Payment Methods Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
    fetchPaymentMethods();
  }, [fetchTracks, fetchPaymentMethods]);

  const handleEdit = (track: ServiceTrack) => {
    setEditingTrack(track);
    setFormData(track);
    setPreviewSelectedPlanId(track.pricing?.plans?.[0]?.id || "");
    setIsEditorOpen(true);
    setActiveTab("identity");
  };

  const handleAddNew = () => {
    setEditingTrack(null);
    setFormData({
      name: "",
      buttonLabel: "",
      icon: "Activity",
      themeColor: "#14B8A6",
      fields: [],
      pricing: { enabled: true, model: "fixed-rate", plans: [], fixedRate: 0 },
      scheduling: {
        enabled: false,
        slotInterval: 60,
        slotCapacity: 1,
        startTime: "09:00",
        endTime: "18:00",
      },
      permissions: {
        allowDiscount: false,
        maxDiscountPercent: 0,
        requireDiscountApproval: true,
        allowedPaymentMethods: ["Cash", "UPI"],
        allowSplitPayment: false,
      },
      isActive: true,
    });
    setPreviewSelectedPlanId("");
    setIsEditorOpen(true);
    setActiveTab("identity");
  };

  const handleSave = async () => {
    try {
      const isEditing = !!editingTrack;
      const url = `${API_BASE_URL}/admin/services`;
      const method = isEditing ? "PUT" : "POST";

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.status === "success") {
        await fetchTracks();
        setIsEditorOpen(false);
      } else {
        throw new Error(data.message || "Saving failed");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save track");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this service track?",
      )
    )
      return;

    try {
      const response = await authFetch(
        `${API_BASE_URL}/admin/services?id=${id}`,
        {
          method: "DELETE",
        },
      );
      const data = await response.json();
      if (data.status === "success") {
        await fetchTracks();
      } else {
        throw new Error(data.message || "Delete failed");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete track");
    }
  };

  const toggleTheme = useCallback(() => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", newMode ? "dark" : "light");
  }, [isDarkMode]);

  const shortcuts: ShortcutItem[] = [
    {
      keys: ["Alt", "/"],
      description: "Toggle Keyboard Shortcuts",
      group: "General",
      action: () => setShowShortcuts((p) => !p),
    },
    {
      keys: ["Alt", "S"],
      description: "Open Global Search",
      group: "General",
      action: () => setShowGlobalModal(true),
    },
    {
      keys: ["Alt", "N"],
      description: "Add New Track",
      group: "Actions",
      action: handleAddNew,
    },
    {
      keys: ["Alt", "W"],
      description: "Toggle Dark Mode",
      group: "General",
      action: toggleTheme,
    },
    {
      keys: ["Alt", "L"],
      description: "Logout",
      group: "General",
      action: () => setShowLogoutConfirm(true),
    },
  ];

  useEffect(() => {
    if (
      isEditorOpen &&
      formData.pricing?.plans?.length &&
      !previewSelectedPlanId
    ) {
      setPreviewSelectedPlanId(formData.pricing.plans[0].id);
    }
  }, [isEditorOpen, formData.pricing?.plans]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === "/") {
          e.preventDefault();
          setShowShortcuts((p) => !p);
        }
        if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          setShowGlobalModal(true);
        }
        if (e.key.toLowerCase() === "n") {
          e.preventDefault();
          handleAddNew();
        }
        if (e.key.toLowerCase() === "w") {
          e.preventDefault();
          toggleTheme();
        }
        if (e.key.toLowerCase() === "l") {
          e.preventDefault();
          setShowLogoutConfirm(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

  return (
    <div className="min-h-screen bg-[#F8F9FF] dark:bg-[#0F1117] text-[#1C1B1F] dark:text-[#E6E1E5] transition-colors duration-300">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-[#1C1B22]/80 backdrop-blur-xl z-40 border-b border-gray-100 dark:border-gray-800">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                <Zap className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
                  PhysioEZ
                </h1>
                <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 tracking-[0.2em] uppercase">
                  Admin Panel
                </p>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              {[
                { label: "Admin Hub", path: "/admin/dashboard", active: false },
                {
                  label: "Service Tracks",
                  path: "/admin/services",
                  active: true,
                },
                { label: "Users", path: "/admin/users", active: false },
                { label: "Settings", path: "/admin/settings", active: false },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`
                                        px-5 py-2 rounded-xl text-xs font-bold transition-all
                                        ${
                                          item.active
                                            ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm"
                                            : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50"
                                        }
                                    `}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowGlobalModal(true)}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all rounded-xl hover:bg-white dark:hover:bg-gray-700"
              >
                <Search size={18} />
              </button>
              <button
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all rounded-xl hover:bg-white dark:hover:bg-gray-700"
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
            <div className="relative">
              <button
                onClick={logout}
                className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-all"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-8 max-w-[1700px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 px-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse"></div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#6366f1]/80">
                System Infrastructure / Blueprints
              </span>
            </div>
            <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-3">
              Service Tracks
            </h2>
            <p className="text-lg text-gray-400 dark:text-gray-500 font-medium max-w-2xl">
              Engineer custom clinical form experiences and synchronized
              operational logic for department-specific patient tracks.
            </p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddNew}
            className="h-16 px-10 rounded-[2rem] bg-[#6366f1] text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all flex items-center gap-4 border border-white/20"
          >
            <Plus size={22} strokeWidth={3} />
            Architect New Track
          </motion.button>
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {isLoading ? (
            <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#6366f1]/20 border-t-[#6366f1] rounded-full animate-spin"></div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                Updating with Blueprint Registry...
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {tracks.map((track: ServiceTrack, idx: number) => (
                <motion.div
                  key={track.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleEdit(track)}
                  className="bg-white dark:bg-[#111115] rounded-[3rem] border border-gray-100 dark:border-white/5 p-10 shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all group relative cursor-pointer overflow-hidden isolate"
                >
                  {/* Glassy Overlay Background */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-bl-[6rem] -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700 -z-10" />

                  <div className="relative z-10 flex items-start justify-between mb-10">
                    <div
                      className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl shadow-black/5 ring-1 ring-black/5 dark:ring-white/10 transition-all group-hover:scale-110 group-hover:-rotate-3"
                      style={{
                        backgroundColor: `${track.themeColor}15`,
                        color: track.themeColor,
                      }}
                    >
                      {/* <IconComponent name={track.icon} size={36} strokeWidth={2.5} /> */}
                      <Zap size={36} strokeWidth={2.5} />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(track.id);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-gray-50/50 dark:bg-white/5 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/20"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="relative z-10 mb-10">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-[#6366f1] transition-colors uppercase leading-[0.9] tracking-tighter mb-4">
                      {track.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 rounded-md bg-[#6366f1]/10 text-[#6366f1] text-[8px] font-black uppercase tracking-widest">
                        Interface
                      </div>
                      <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        {track.buttonLabel || "DEFAULT"}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-wrap gap-3 mb-10">
                    {track.pricing.enabled && (
                      <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-xl border border-emerald-100 dark:border-emerald-800">
                        Pricing Set
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleEdit(track)}
                    className="relative z-10 w-full h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:bg-[#6366f1] group-hover:text-white transition-all"
                  >
                    Refine Logic
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {!isLoading && tracks.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-30 select-none text-center">
              <Box size={64} className="mb-6 text-gray-300" />
              <p className="text-sm font-black uppercase tracking-[0.4em] text-gray-400">
                Blueprint Registry Empty
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Form Builder / Track Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditorOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-9xl max-h-[95vh] bg-white dark:bg-[#141218] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800"
            >
              {/* Editor Header */}
              <div className="px-10 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    {editingTrack
                      ? `Edit Track: ${formData.name}`
                      : "Blueprint New Service Track"}
                  </h2>
                  <div className="flex gap-4 mt-2">
                    {[
                      { id: "identity", label: "Identity", icon: User },
                      {
                        id: "treatment",
                        label: "Treatment Plans",
                        icon: Activity,
                      },
                      {
                        id: "schedule",
                        label: "Schedule & Logic",
                        icon: Clock,
                      },

                      {
                        id: "permissions",
                        label: "Permissions",
                        icon: Settings,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === tab.id ? "bg-[#6366f1] text-white shadow-lg shadow-indigo-500/30" : "text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
                      >
                        <tab.icon size={14} />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all text-gray-400"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex bg-gray-50/50 dark:bg-black/20">
                {/* Left Side: Configuration Workspace */}
                <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-10 border-r border-gray-100 dark:border-gray-800">
                  <div className="max-w-2xl mx-auto">
                    <AnimatePresence mode="wait">
                      {activeTab === "identity" && (
                        <motion.div
                          key="identity"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-8"
                        >
                          <div className="bg-white dark:bg-[#1C1B22] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="relative group">
                                <span className="absolute -top-2 left-4 px-2 bg-white dark:bg-[#1C1B22] text-[10px] font-black uppercase tracking-widest text-[#6366f1]">
                                  Track Name
                                </span>
                                <input
                                  type="text"
                                  value={formData.name || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. Physiotherapy"
                                  className="w-full h-14 px-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-transparent text-sm font-bold focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                                />
                              </div>
                              <div className="relative group">
                                <span className="absolute -top-2 left-4 px-2 bg-white dark:bg-[#1C1B22] text-[10px] font-black uppercase tracking-widest text-[#6366f1]">
                                  Registration Button Label
                                </span>
                                <input
                                  type="text"
                                  value={formData.buttonLabel || ""}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      buttonLabel: e.target.value,
                                    })
                                  }
                                  placeholder="e.g. Add to Physio"
                                  className="w-full h-14 px-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-transparent text-sm font-bold focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">
                                Brand Identity
                              </span>
                              <div className="grid grid-cols-12 gap-6 items-center">
                                <div className="col-span-4 flex items-center gap-4 h-16 px-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20">
                                  <div
                                    className="w-10 h-10 rounded-lg shadow-sm border border-white/20"
                                    style={{
                                      backgroundColor: formData.themeColor,
                                    }}
                                  ></div>
                                  <div className="flex-1 flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 uppercase">
                                      Theme Color
                                    </span>
                                    <input
                                      type="color"
                                      value={formData.themeColor}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,
                                          themeColor: e.target.value,
                                        })
                                      }
                                      className="w-full h-6 rounded cursor-pointer bg-transparent border-none p-0"
                                    />
                                  </div>
                                </div>
                                <div className="col-span-8 flex flex-wrap gap-2 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                  {AVAILABLE_ICONS.map((i) => (
                                    <button
                                      key={i.name}
                                      onClick={() =>
                                        setFormData({
                                          ...formData,
                                          icon: i.name,
                                        })
                                      }
                                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${formData.icon === i.name ? "bg-[#6366f1] text-white shadow-lg" : "bg-gray-50 dark:bg-black/20 text-gray-400 hover:text-gray-900"}`}
                                    >
                                      <i.icon size={18} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "treatment" && (
                        <motion.div
                          key="treatment"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-8"
                        >
                          <div className="bg-white dark:bg-[#1C1B22] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                                  <CreditCard size={24} />
                                </div>
                                <div>
                                  <h4 className="text-lg font-black text-gray-900 dark:text-white">
                                    Billing Strategy
                                  </h4>
                                  <p className="text-xs text-gray-500 font-medium">
                                    How should charges be calculated?
                                  </p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.pricing?.enabled}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      pricing: {
                                        ...formData.pricing!,
                                        enabled: e.target.checked,
                                      },
                                    })
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                              </label>
                            </div>

                            {formData.pricing?.enabled && (
                              <div className="space-y-6 border-t border-gray-50 dark:border-gray-800 pt-8">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    Active Treatment Plans
                                  </h5>
                                  <button
                                    onClick={() => {
                                      const newPlan: ServicePlan = {
                                        id: Math.random().toString(),
                                        icon: "Zap",
                                        name: "New Plan",
                                        subtitle: "Brief description",
                                        rate: 0,
                                        days: 1,
                                      };
                                      setFormData({
                                        ...formData,
                                        pricing: {
                                          ...formData.pricing!,
                                          plans: [
                                            ...(formData.pricing!.plans || []),
                                            newPlan,
                                          ],
                                        },
                                      });
                                    }}
                                    className="text-[10px] font-black uppercase tracking-widest text-[#6366f1] hover:underline"
                                  >
                                    + Add Plan
                                  </button>
                                </div>
                                <div className="space-y-4">
                                  {(formData.pricing.plans || []).map(
                                    (plan, idx) => (
                                      <div
                                        key={plan.id}
                                        className="bg-gray-50 dark:bg-black/20 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4 group"
                                      >
                                        <div className="flex gap-4">
                                          <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <input
                                                type="text"
                                                value={plan.name}
                                                placeholder="Plan Name (e.g. Daily Session)"
                                                onChange={(e) => {
                                                  const newPlans = [
                                                    ...formData.pricing!.plans,
                                                  ];
                                                  newPlans[idx] = {
                                                    ...plan,
                                                    name: e.target.value,
                                                  };
                                                  setFormData({
                                                    ...formData,
                                                    pricing: {
                                                      ...formData.pricing!,
                                                      plans: newPlans,
                                                    },
                                                  });
                                                }}
                                                className="bg-transparent border-b border-gray-200 dark:border-gray-800 text-sm font-black outline-none focus:border-[#6366f1] transition-all"
                                              />
                                              <input
                                                type="text"
                                                value={plan.subtitle}
                                                placeholder="Subtitle (e.g. Pay-per-day)"
                                                onChange={(e) => {
                                                  const newPlans = [
                                                    ...formData.pricing!.plans,
                                                  ];
                                                  newPlans[idx] = {
                                                    ...plan,
                                                    subtitle: e.target.value,
                                                  };
                                                  setFormData({
                                                    ...formData,
                                                    pricing: {
                                                      ...formData.pricing!,
                                                      plans: newPlans,
                                                    },
                                                  });
                                                }}
                                                className="bg-transparent border-b border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-400 outline-none focus:border-[#6366f1] transition-all"
                                              />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase text-gray-400">
                                                  Rate (₹)
                                                </span>
                                                <input
                                                  type="number"
                                                  value={plan.rate}
                                                  onChange={(e) => {
                                                    const newPlans = [
                                                      ...formData.pricing!
                                                        .plans,
                                                    ];
                                                    newPlans[idx] = {
                                                      ...plan,
                                                      rate: Number(
                                                        e.target.value,
                                                      ),
                                                    };
                                                    setFormData({
                                                      ...formData,
                                                      pricing: {
                                                        ...formData.pricing!,
                                                        plans: newPlans,
                                                      },
                                                    });
                                                  }}
                                                  className="w-full bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800 text-xs font-black outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                                                />
                                              </div>
                                              <div className="space-y-1">
                                                <span className="text-[10px] font-black uppercase text-gray-400">
                                                  Total Days
                                                </span>
                                                <input
                                                  type="number"
                                                  value={plan.days}
                                                  onChange={(e) => {
                                                    const newPlans = [
                                                      ...formData.pricing!
                                                        .plans,
                                                    ];
                                                    newPlans[idx] = {
                                                      ...plan,
                                                      days: Number(
                                                        e.target.value,
                                                      ),
                                                    };
                                                    setFormData({
                                                      ...formData,
                                                      pricing: {
                                                        ...formData.pricing!,
                                                        plans: newPlans,
                                                      },
                                                    });
                                                  }}
                                                  className="w-full bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-800 text-xs font-black outline-none focus:ring-2 focus:ring-[#6366f1]/20"
                                                />
                                              </div>
                                            </div>

                                            <div className="space-y-3">
                                              <span className="text-[10px] font-black uppercase text-gray-400">
                                                Card Icon selection (medical
                                                focused)
                                              </span>
                                              <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800">
                                                {AVAILABLE_ICONS.filter((i) =>
                                                  [
                                                    "Stethoscope",
                                                    "HeartPulse",
                                                    "Syringe",
                                                    "Microscope",
                                                    "Dna",
                                                    "FlaskConical",
                                                    "Brain",
                                                    "HandHelping",
                                                    "ShieldPlus",
                                                    "Bone",
                                                    "Waves",
                                                    "Timer",
                                                    "Pill",
                                                    "Activity",
                                                    "Zap",
                                                    "Clock",
                                                    "Box",
                                                    "Plus",
                                                  ].includes(i.name),
                                                ).map((i) => (
                                                  <button
                                                    key={i.name}
                                                    onClick={() => {
                                                      const newPlans = [
                                                        ...formData.pricing!
                                                          .plans,
                                                      ];
                                                      newPlans[idx] = {
                                                        ...plan,
                                                        icon: i.name,
                                                      };
                                                      setFormData({
                                                        ...formData,
                                                        pricing: {
                                                          ...formData.pricing!,
                                                          plans: newPlans,
                                                        },
                                                      });
                                                    }}
                                                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${plan.icon === i.name ? "bg-[#6366f1] text-white shadow-lg" : "bg-gray-50/50 dark:bg-black/20 text-gray-300 hover:text-gray-500 hover:bg-gray-100"}`}
                                                  >
                                                    <i.icon size={18} />
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => {
                                              const newPlans =
                                                formData.pricing!.plans.filter(
                                                  (_, i) => i !== idx,
                                                );
                                              setFormData({
                                                ...formData,
                                                pricing: {
                                                  ...formData.pricing!,
                                                  plans: newPlans,
                                                },
                                              });
                                            }}
                                            className="h-10 w-10 flex items-center justify-center text-gray-300 hover:text-red-500 transition-all"
                                          >
                                            <Trash2 size={18} />
                                          </button>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "schedule" && (
                        <motion.div
                          key="schedule"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-8"
                        >
                          <div className="bg-white dark:bg-[#1C1B22] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                  <Clock size={24} />
                                </div>
                                <div>
                                  <h4 className="text-lg font-black text-gray-900 dark:text-white">
                                    Scheduling Engine
                                  </h4>
                                  <p className="text-xs text-gray-500 font-medium">
                                    Slot management blueprint.
                                  </p>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.scheduling?.enabled}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      scheduling: {
                                        ...formData.scheduling!,
                                        enabled: e.target.checked,
                                      },
                                    })
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                              </label>
                            </div>

                            {formData.scheduling?.enabled && (
                              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-50 dark:border-gray-800">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black uppercase text-gray-400">
                                      Slot Duration
                                    </span>
                                    <span className="text-xs font-black text-[#6366f1]">
                                      {formData.scheduling.slotInterval} mins
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="15"
                                    max="120"
                                    step="15"
                                    value={formData.scheduling.slotInterval}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        scheduling: {
                                          ...formData.scheduling!,
                                          slotInterval: parseInt(
                                            e.target.value,
                                          ),
                                        },
                                      })
                                    }
                                    className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#6366f1]"
                                  />
                                </div>
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black uppercase text-gray-400">
                                      Max Capacity
                                    </span>
                                    <span className="text-xs font-black text-[#6366f1]">
                                      {formData.scheduling.slotCapacity}{" "}
                                      Pat/Slot
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    step="1"
                                    value={formData.scheduling.slotCapacity}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        scheduling: {
                                          ...formData.scheduling!,
                                          slotCapacity: parseInt(
                                            e.target.value,
                                          ),
                                        },
                                      })
                                    }
                                    className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#6366f1]"
                                  />
                                </div>
                                <div className="col-span-1 space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                                    Daily Start Time
                                  </label>
                                  <input
                                    type="time"
                                    value={formData.scheduling.startTime}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        scheduling: {
                                          ...formData.scheduling!,
                                          startTime: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full h-12 px-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 text-sm font-bold"
                                  />
                                </div>
                                <div className="col-span-1 space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                                    Daily End Time
                                  </label>
                                  <input
                                    type="time"
                                    value={formData.scheduling.endTime}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        scheduling: {
                                          ...formData.scheduling!,
                                          endTime: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full h-12 px-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 text-sm font-bold"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "permissions" && (
                        <motion.div
                          key="permissions"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-8"
                        >
                          <div className="bg-white dark:bg-[#1C1B22] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                            <div>
                              <h4 className="text-sm font-black text-gray-900 dark:text-white mb-4 uppercase tracking-widest">
                                Financial Permissions
                              </h4>
                              <div className="grid grid-cols-2 gap-6">
                                <div className="p-5 rounded-2xl bg-gray-50/50 dark:bg-black/20 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                  <div>
                                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase">
                                      Allow Discount
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-medium">
                                      Allow manual discounts on registration
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setFormData({
                                        ...formData,
                                        permissions: {
                                          ...formData.permissions!,
                                          allowDiscount:
                                            !formData.permissions
                                              ?.allowDiscount,
                                        },
                                      })
                                    }
                                    className={`w-12 h-6 rounded-full transition-all relative ${formData.permissions?.allowDiscount ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"}`}
                                  >
                                    <div
                                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.permissions?.allowDiscount ? "left-7" : "left-1"}`}
                                    />
                                  </button>
                                </div>
                                <div className="p-5 rounded-2xl bg-gray-50/50 dark:bg-black/20 border border-gray-100 dark:border-gray-800 space-y-3">
                                  <p className="text-xs font-black text-gray-900 dark:text-white uppercase">
                                    Max Discount %
                                  </p>
                                  <input
                                    type="number"
                                    value={
                                      formData.permissions
                                        ?.maxDiscountPercent || 0
                                    }
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        permissions: {
                                          ...formData.permissions!,
                                          maxDiscountPercent: Math.min(
                                            100,
                                            parseInt(e.target.value) || 0,
                                          ),
                                        },
                                      })
                                    }
                                    className="w-full h-10 px-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-black/20 text-xs font-bold"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-red-50/30 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-black text-red-600 uppercase">
                                  Approval Requirement
                                </p>
                                <p className="text-[10px] text-red-400 font-medium">
                                  Require admin approval for any discount
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    permissions: {
                                      ...formData.permissions!,
                                      requireDiscountApproval:
                                        !formData.permissions
                                          ?.requireDiscountApproval,
                                    },
                                  })
                                }
                                className={`w-12 h-6 rounded-full transition-all relative ${formData.permissions?.requireDiscountApproval ? "bg-red-500" : "bg-gray-200 dark:bg-gray-700"}`}
                              >
                                <div
                                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.permissions?.requireDiscountApproval ? "left-7" : "left-1"}`}
                                />
                              </button>
                            </div>

                            <div>
                              <h4 className="text-sm font-black text-gray-900 dark:text-white mb-4 uppercase tracking-widest">
                                Payment Methods
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                {paymentMethods.map((method) => (
                                  <button
                                    key={method.method_code}
                                    onClick={() => {
                                      const current =
                                        formData.permissions
                                          ?.allowedPaymentMethods || [];
                                      const next = current.includes(
                                        method.method_code,
                                      )
                                        ? current.filter(
                                            (m) => m !== method.method_code,
                                          )
                                        : [...current, method.method_code];
                                      setFormData({
                                        ...formData,
                                        permissions: {
                                          ...formData.permissions!,
                                          allowedPaymentMethods: next,
                                        },
                                      });
                                    }}
                                    className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${formData.permissions?.allowedPaymentMethods?.includes(method.method_code) ? "border-[#6366f1] bg-indigo-50/30 text-[#6366f1]" : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 text-gray-400"}`}
                                  >
                                    <div
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${formData.permissions?.allowedPaymentMethods?.includes(method.method_code) ? "border-[#6366f1] bg-[#6366f1] text-white" : "border-gray-200 dark:border-gray-700"}`}
                                    >
                                      {formData.permissions?.allowedPaymentMethods?.includes(
                                        method.method_code,
                                      ) && <Check size={12} />}
                                    </div>
                                    <span className="text-xs font-bold uppercase">
                                      {method.method_name}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="p-6 rounded-3xl bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between">
                              <div>
                                <p className="text-[11px] font-black text-indigo-600 uppercase">
                                  Allow Split Payment
                                </p>
                                <p className="text-[10px] text-indigo-400 font-medium">
                                  Enable multiple payment modes for a single
                                  invoice
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    permissions: {
                                      ...formData.permissions!,
                                      allowSplitPayment:
                                        !formData.permissions
                                          ?.allowSplitPayment,
                                    },
                                  })
                                }
                                className={`w-12 h-6 rounded-full transition-all relative ${formData.permissions?.allowSplitPayment ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"}`}
                              >
                                <div
                                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.permissions?.allowSplitPayment ? "left-7" : "left-1"}`}
                                />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Right Side: Live Canvas Viewer - MAXIMIZED FOR BUILDER FOCUS */}
                <div className="hidden lg:block w-[850px] bg-[#F8F9FC] dark:bg-[#0F1117] overflow-y-auto custom-scrollbar p-6 border-l border-gray-100 dark:border-gray-800">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-[10px] font-black text-[#6366f1] uppercase tracking-[0.2em]">
                        Blueprint Canvas
                      </h3>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">
                        Builder components only
                      </p>
                    </div>
                  </div>

                  {/* The Real-Time Form Preview Shell - MINIMAL PADDING, MAX WIDTH */}
                  <div className="rounded-[2.5rem] bg-white dark:bg-[#1A1C24] p-4 border border-gray-100 dark:border-gray-800 shadow-2xl relative overflow-hidden min-h-[800px]">
                    {/* SYSTEM HEADER PLACEHOLDER */}
                    <div className="mb-8 py-4 border-b border-gray-50 dark:border-gray-800 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-center bg-gray-50/30 dark:bg-black/10 rounded-2xl">
                      [ Patient Identity & Status Header ]
                    </div>

                    {/* 1. TREATMENT PLANS SECTION */}
                    {formData.pricing?.enabled && (
                      <div className="space-y-4 mb-10">
                        <div className="flex items-center gap-2 px-1">
                          <CreditCard size={14} className="text-gray-400" />
                          <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            Selected Treatment Plan
                          </h5>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {(formData.pricing.plans || []).map((plan) => {
                            const isSelected =
                              previewSelectedPlanId === plan.id;
                            return (
                              <div
                                key={plan.id}
                                onClick={() =>
                                  setPreviewSelectedPlanId(plan.id)
                                }
                                className={`flex-1 min-w-[200px] p-5 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col items-start ${isSelected ? "bg-indigo-50/30" : "border-gray-100 dark:border-gray-800 bg-white dark:bg-black/20 hover:border-gray-200"}`}
                                style={{
                                  borderColor: isSelected
                                    ? formData.themeColor
                                    : "transparent",
                                }}
                              >
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${isSelected ? "bg-white shadow-md" : "bg-gray-50 dark:bg-gray-800 text-gray-400"}`}
                                  style={{
                                    color: isSelected
                                      ? formData.themeColor
                                      : "inherit",
                                  }}
                                >
                                  <IconComponent name={plan.icon} size={18} />
                                </div>
                                <span className="text-[11px] font-black text-gray-900 dark:text-white mb-1 uppercase leading-none">
                                  {plan.name || "Plan Name"}
                                </span>
                                <span className="text-[9px] font-bold text-gray-400 leading-tight mb-4">
                                  {plan.subtitle || "Short description"}
                                </span>
                                <div
                                  className={`mt-auto w-full pt-3 border-t flex justify-between items-center ${isSelected ? "border-indigo-100" : "border-gray-50 dark:border-gray-800 text-gray-400"}`}
                                  style={{
                                    color: isSelected
                                      ? formData.themeColor
                                      : "inherit",
                                  }}
                                >
                                  <span className="text-xs font-black">
                                    ₹{plan.rate}
                                  </span>
                                  {isSelected && <Check size={12} />}
                                </div>
                              </div>
                            );
                          })}
                          {(formData.pricing.plans || []).length === 0 && (
                            <div className="col-span-3 py-10 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem] text-center flex flex-col items-center justify-center text-gray-300">
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                No Plans Defined
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 2. SCHEDULE & BILLING GRID */}
                    {(() => {
                      const selectedPlan =
                        formData.pricing?.plans?.find(
                          (p) => p.id === previewSelectedPlanId,
                        ) || formData.pricing?.plans?.[0];
                      const rate = selectedPlan?.rate || 0;
                      const days = selectedPlan?.days || 1;
                      const subtotal = rate * days;

                      return (
                        <div className="grid grid-cols-2 gap-8 mb-10">
                          {/* Schedule Configuration Block */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                              <Calendar size={14} className="text-gray-400" />
                              <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                Schedule Setup
                              </h5>
                            </div>
                            <div className="p-6 rounded-[2.5rem] bg-gray-50/50 dark:bg-black/20 border border-gray-100 dark:border-gray-800 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                                    Rate / Day
                                  </label>
                                  <div className="h-10 px-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center font-black text-xs">
                                    ₹ {rate}
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                                    Total Sessions
                                  </label>
                                  <div className="h-10 px-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center font-black text-xs">
                                    {days}
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                                  Start From Date
                                </label>
                                <div className="h-11 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-3 font-bold text-xs">
                                  <Calendar
                                    size={14}
                                    style={{ color: formData.themeColor }}
                                  />
                                  {new Date().toLocaleDateString()}
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">
                                  Preferred Time Slot
                                </label>
                                <div className="h-11 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between font-bold text-xs text-gray-400">
                                  <span>Choose clinical slot...</span>
                                  <ChevronDown size={14} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Billing Summary Block */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                              <Activity size={14} className="text-gray-400" />
                              <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                Billing Summary
                              </h5>
                            </div>
                            <div
                              className="p-6 rounded-[2.5rem] text-white shadow-xl space-y-6"
                              style={{
                                backgroundColor: formData.themeColor,
                                boxShadow: `0 20px 25px -5px ${formData.themeColor}33`,
                              }}
                            >
                              <div className="flex justify-between items-center opacity-80">
                                <span className="text-[10px] font-black uppercase">
                                  Subtotal Amount
                                </span>
                                <span className="text-base font-black">
                                  ₹{subtotal.toFixed(2)}
                                </span>
                              </div>
                              <div className="h-px bg-white/20 w-full" />
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black uppercase opacity-60">
                                    Discount Applied
                                  </span>
                                  <div className="text-sm font-black text-emerald-300">
                                    ₹0.00
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[8px] font-black uppercase opacity-60">
                                    Paid Amount
                                  </span>
                                  <div className="text-sm font-black">
                                    ₹0.00
                                  </div>
                                </div>
                              </div>
                              <div className="pt-2">
                                <span className="text-[8px] font-black uppercase opacity-60">
                                  Pending Balance
                                </span>
                                <div className="text-3xl font-black tracking-tighter">
                                  ₹{subtotal.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 4. PAYMENT DISTRIBUTION PLACEHOLDER */}
                    <div className="mt-10 p-8 rounded-[2.5rem] border-2 border-dashed border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-black/10 text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] text-center">
                      [ Dynamic Payment Distribution Module ]
                    </div>

                    {/* ACTION FOOTER SIMULATOR */}
                    <div className="mt-12 flex gap-4 justify-end pb-8">
                      <button className="h-13 px-8 rounded-2xl bg-gray-50 dark:bg-black/20 text-gray-500 font-bold text-xs uppercase tracking-widest border border-gray-100 dark:border-gray-800 hover:bg-gray-100 transition-all">
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          alert(
                            "Blueprint Registration Simulated Successfully! \n\nThis is a real-time preview of how the registration screen will function for your users.",
                          );
                        }}
                        className="h-13 px-10 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3"
                        style={{
                          backgroundColor: formData.themeColor,
                          boxShadow: `0 15px 25px -5px ${formData.themeColor}33`,
                        }}
                      >
                        <Zap size={16} />
                        {formData.buttonLabel || "Convert Patient"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-10 py-2 border-t border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-black/20 flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-400">
                  <Info size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest uppercase">
                    Draft state
                  </span>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsEditorOpen(false)}
                    className="h-12 px-8 rounded-2xl text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-xs uppercase tracking-widest"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSave}
                    className="h-12 px-12 rounded-2xl bg-[#6366f1] text-white font-black text-xs uppercase tracking-[0.1em] shadow-2xl shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Deploy Blueprint
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GlobalSearch
        isOpen={showGlobalModal}
        onClose={() => setShowGlobalModal(false)}
        searchQuery={globalSearchQuery}
        setSearchQuery={setGlobalSearchQuery}
        searchResults={searchResults}
      />
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        onToggle={() => setShowShortcuts(!showShortcuts)}
        shortcuts={shortcuts}
      />

      {/* Logout Confirmation */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1C1B22] rounded-[2rem] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 text-center"
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
                <LogOut size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                Confirm Logout
              </h3>
              <p className="text-sm text-gray-500 font-medium mb-8">
                Are you sure you want to end your session? Any unsaved blueprint
                changes will be lost.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 h-12 rounded-2xl text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="flex-1 h-12 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 uppercase tracking-widest text-[10px]"
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

const X = ({ size }: { size?: number }) => (
  <Plus size={size} className="rotate-45" />
);

export default ServiceManager;
