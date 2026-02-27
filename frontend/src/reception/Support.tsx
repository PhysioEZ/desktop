import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Ticket,
  Clock,
  CheckCircle2,
  HelpCircle,
  Plus,
  Upload,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  X,
  Phone,
  Banknote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { API_BASE_URL, authFetch, FILE_BASE_URL } from "../config";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import DailyIntelligence from "../components/DailyIntelligence";
import NotesDrawer from "../components/NotesDrawer";
import ChatModal from "../components/Chat/ChatModal";

interface SupportTicket {
  id: number;
  issue_id?: number;
  subject: string;
  description: string;
  category: string;
  status: string;
  created_at: string;
  priority: string;
  admin_response?: string;
  system_metadata?: Record<string, unknown> | string;
  attachments?: string[];
  reported_by_name?: string;
  branch_name?: string;
}

interface SystemService {
  service_name: string;
  service_slug: string;
  current_status:
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance"
  | string;
  last_updated?: string;
}

interface BranchOption {
  branch_id: number;
  branch_name: string;
}

const CATEGORY_OPTIONS = [
  { value: "billing", label: "Billing" },
  { value: "patient_records", label: "Patient Records" },
  { value: "hardware_printer", label: "Hardware/Printer" },
  { value: "software_bug", label: "Software Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "general", label: "General" },
];

const KB_ITEMS = [
  {
    q: "How do I reset the thermal printer?",
    a: "Power cycle the printer, verify paper roll orientation, then re-select the printer in Settings > Devices.",
    category: "hardware_printer",
  },
  {
    q: "Payments are not syncing. What should I check first?",
    a: "Check System Status for Payment Processing. If operational, retry from Billing > Refresh Ledger.",
    category: "billing",
  },
  {
    q: "Patient record updates are not visible across users.",
    a: "Refresh the patient page and confirm the same branch context is selected for all users before raising a ticket.",
    category: "patient_records",
  },
  {
    q: "How can I request a new feature?",
    a: "Create a support ticket with category Feature Request and include expected workflow plus business impact.",
    category: "feature_request",
  },
];

const CRITICAL_SERVICE_MATCH = [
  "database",
  "sms",
  "cloud",
  "whatsapp",
  "payment",
];

const isGlobalRole = (role?: string) =>
  ["admin", "developer", "superadmin", "owner"].includes(
    String(role || "").toLowerCase(),
  );

const statusTone = (status: string) => {
  if (status === "operational") return "text-emerald-500 bg-emerald-500/10";
  if (status === "degraded" || status === "maintenance")
    return "text-amber-500 bg-amber-500/10";
  return "text-rose-500 bg-rose-500/10";
};

const detectBrowserEngine = () => {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Blink (Edge)";
  if (ua.includes("Chrome/") || ua.includes("Chromium/")) return "Blink";
  if (ua.includes("Firefox/")) return "Gecko";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "WebKit";
  return "Unknown";
};

const Support = () => {
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();
  const [showChatModal, setShowChatModal] = useState(false);

  const isGlobalViewer = isGlobalRole(user?.role);

  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemService[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [search, setSearch] = useState("");
  const [kbSearch, setKbSearch] = useState("");
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState("all");
  const [viewScope, setViewScope] = useState<"branch" | "global">("branch");
  const [selectedBranchId, setSelectedBranchId] = useState<number | "all">(
    user?.branch_id || "all",
  );
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  );

  const [adminResponse, setAdminResponse] = useState("");
  const [respondingStatus, setRespondingStatus] = useState("Responded");
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const criticalServices = useMemo(() => {
    const filtered = systemStatus.filter((svc) => {
      const key = `${svc.service_name} ${svc.service_slug}`.toLowerCase();
      return CRITICAL_SERVICE_MATCH.some((token) => key.includes(token));
    });
    return filtered.length > 0 ? filtered : systemStatus.slice(0, 4);
  }, [systemStatus]);

  const overallStatus = useMemo(() => {
    if (criticalServices.some((s) => s.current_status === "major_outage")) {
      return "major_outage";
    }
    if (
      criticalServices.some(
        (s) =>
          s.current_status === "partial_outage" ||
          s.current_status === "degraded",
      )
    ) {
      return "partial_outage";
    }
    if (criticalServices.some((s) => s.current_status === "maintenance")) {
      return "maintenance";
    }
    return "operational";
  }, [criticalServices]);

  const filteredKbItems = useMemo(() => {
    const q = kbSearch.trim().toLowerCase();
    if (!q) return KB_ITEMS;
    return KB_ITEMS.filter(
      (item) =>
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    );
  }, [kbSearch]);

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      const matchesSearch =
        !q ||
        (t.subject || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q);
      const matchesCategory =
        ticketCategoryFilter === "all" || t.category === ticketCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [tickets, search, ticketCategoryFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const fetchBranches = useCallback(async () => {
    if (!isGlobalViewer) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/support`, {
        method: "POST",
        body: JSON.stringify({ action: "get_branches" }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setBranches(data.data || []);
      }
    } catch {
      toast.error("Failed to load branches");
    }
  }, [isGlobalViewer]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { action: "fetch" };
      if (isGlobalViewer) {
        payload.scope = viewScope;
        if (viewScope === "branch" && selectedBranchId !== "all") {
          payload.branch_id = selectedBranchId;
        }
      }

      const res = await authFetch(`${API_BASE_URL}/reception/support`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success") {
        setTickets(data.data.tickets || []);
        setStats(data.data.stats || { total: 0, pending: 0, resolved: 0 });
      }
    } catch {
      toast.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  }, [isGlobalViewer, viewScope, selectedBranchId]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/support`, {
        method: "POST",
        body: JSON.stringify({ action: "get_status" }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setSystemStatus(data.data || []);
      }
    } catch {
      console.error("Failed to fetch status");
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshCooldown > 0) return;
    setRefreshCooldown(30);
    await Promise.all([fetchData(), fetchStatus()]);
  }, [fetchData, fetchStatus, refreshCooldown]);

  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setTimeout(() => setRefreshCooldown(refreshCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [refreshCooldown]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 120000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitTicket = async () => {
    if (!description.trim() || !subject.trim()) {
      toast.error("Please provide a subject and description");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("action", "submit");
    formData.append("subject", subject);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("priority", priority);

    const metadata = {
      app_version:
        (import.meta as { env?: { VITE_APP_VERSION?: string } }).env
          ?.VITE_APP_VERSION || "3.2.0-web",
      browser: navigator.userAgent,
      browser_engine: detectBrowserEngine(),
      platform: navigator.platform,
      resolution: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      branch_id: user?.branch_id,
      user_role: user?.role,
    };
    formData.append("metadata", JSON.stringify(metadata));

    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/support`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Ticket submitted successfully!");
        setSubject("");
        setDescription("");
        setCategory("");
        setFiles([]);
        fetchData();
      } else {
        toast.error(data.message || "Submission failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFetchDetails = async (id: number) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/support`, {
        method: "POST",
        body: JSON.stringify({ action: "details", issue_id: id }),
      });
      const data = await res.json();
      if (data.status === "success") {
        const metadata = data.data?.system_metadata;
        setSelectedTicket({
          ...data.data,
          system_metadata:
            typeof metadata === "string"
              ? (() => {
                try {
                  return JSON.parse(metadata);
                } catch {
                  return { raw: metadata };
                }
              })()
              : metadata,
        });
      }
    } catch {
      toast.error("Failed to load ticket details");
    }
  };

  const handleRespond = async () => {
    if (!adminResponse.trim()) {
      toast.error("Please provide a response");
      return;
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/support`, {
        method: "POST",
        body: JSON.stringify({
          action: "respond",
          issue_id: selectedTicket?.id || selectedTicket?.issue_id,
          status: respondingStatus,
          response: adminResponse,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        toast.success("Response saved!");
        setSelectedTicket(null);
        fetchData();
      }
    } catch {
      toast.error("Failed to save response");
    }
  };

  useEffect(() => {
    if (selectedTicket) {
      setAdminResponse(selectedTicket.admin_response || "");
      setRespondingStatus(selectedTicket.status);
    }
  }, [selectedTicket]);

  return (
    <div
      className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? "bg-[#050505] text-slate-200" : "bg-[#FAFAFA] text-slate-900"}`}
    >
      {/* Ambient Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${isDark ? "bg-blue-500/30" : "bg-blue-400/20"}`}
        />
        <div
          className={`absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 ${isDark ? "bg-emerald-500/30" : "bg-emerald-400/20"}`}
        />
      </div>

      <Sidebar
        onShowChat={() => setShowChatModal(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      <div className="flex-1 h-screen overflow-hidden relative flex flex-col">
        <PageHeader
          title="Support"
          subtitle="Help & Documentation"
          icon={HelpCircle}
          onRefresh={handleRefresh}
          refreshCooldown={refreshCooldown}
          isLoading={loading}
          onShowIntelligence={() => setShowIntelligence(true)}
          onShowNotes={() => setShowNotes(true)}
        />


        <div className="flex-1 flex overflow-hidden">
          {/* === LEFT PANEL (STATS) === */}
          <aside
            className={`hidden xl:flex w-[320px] flex-col justify-between p-6 border-r relative shrink-0 transition-all duration-500 z-10 ${isDark ? "bg-slate-950/40 border-white/5 backdrop-blur-xl" : "bg-white/80 border-slate-200 backdrop-blur-xl"}`}
          >
            <div className="space-y-12 relative">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-500 glass shadow-inner ${isDark ? "" : "bg-emerald-50"}`}
                >
                  <HelpCircle size={24} className="animate-float" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold tracking-[0.3em] text-[10px] uppercase text-slate-400">
                    PhysioEZ Core
                  </span>
                  <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest">
                    v3.2.0 Enterprise
                  </span>
                </div>
              </motion.div>

              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl font-sans font-black tracking-tighter leading-[0.9] text-slate-900 dark:text-white"
                >
                  Support
                  <br />
                  <span className="text-gradient italic font-serif font-light underline decoration-blue-500/30">
                    Help
                  </span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs font-medium"
                >
                  Get help with your clinic operations.
                </motion.p>
              </div>
            </div>

            {/* Vertical Stats Stack */}
            <div className="space-y-6 w-full flex-1 flex flex-col justify-center py-10 relative">
              {[
                {
                  label: "All Tickets",
                  value: stats.total,
                  icon: Ticket,
                  color: "blue",
                  delay: 0.3,
                },
                {
                  label: "Waiting",
                  value: stats.pending,
                  icon: Clock,
                  color: "amber",
                  delay: 0.4,
                },
                {
                  label: "Done",
                  value: stats.resolved,
                  icon: CheckCircle2,
                  color: "emerald",
                  delay: 0.5,
                },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: stat.delay }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className={`p-4 rounded-2xl border glass-card group transition-all duration-500`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl transition-colors duration-500 ${stat.color === "blue"
                          ? "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white"
                          : stat.color === "amber"
                            ? "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white"
                            : "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white"
                          }`}
                      >
                        <stat.icon size={18} strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                        {stat.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-3xl font-black tracking-tighter dark:text-white text-slate-900">
                    {stat.value.toString().padStart(2, "0")}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/5">
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  System Status
                </span>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase">
                    Live
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(criticalServices.length > 0 ? criticalServices : [])
                  .slice(0, 4)
                  .map((service, i) => (
                    <motion.div
                      key={service.service_slug}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className={`p-4 rounded-3xl border transition-all hover:border-emerald-500/30 group ${isDark ? "bg-white/[0.03] border-white/5" : "bg-slate-50 border-slate-200"}`}
                    >
                      <span className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500 truncate block mb-2">
                        {service.service_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full shadow-[0_0_8px] shadow-current ${service.current_status === "operational"
                            ? "text-emerald-500 bg-emerald-500"
                            : service.current_status === "degraded"
                              ? "text-amber-500 bg-amber-500"
                              : "text-rose-500 bg-rose-500"
                            }`}
                        />
                        <span className="text-[11px] font-black font-mono uppercase tracking-tighter">
                          {service.current_status.split("_")[0]}
                        </span>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="p-8 lg:p-12 flex flex-col gap-8">


              {/* Integrated Status Monitor */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`shrink-0 rounded-[32px] border p-1 transition-all group shadow-sm ${isDark ? "bg-[#0A0A0A]/50 border-white/5" : "bg-white/50 border-slate-200"}`}
              >
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
                  <div className="flex items-center gap-1 p-1">
                    <div
                      className={`flex items-center gap-3 px-6 py-3 rounded-[28px] glass transition-all ${statusTone(overallStatus)}`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse shadow-[0_0_10px] shadow-current" />
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        {overallStatus === "operational"
                          ? "All systems normal"
                          : overallStatus.replace("_", " ")}
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-4 border-l border-white/10 ml-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter shrink-0">
                        System Health:
                      </span>
                      <div className="flex gap-1.5">
                        {criticalServices.slice(0, 5).map((s) => (
                          <div
                            key={s.service_slug}
                            title={`${s.service_name}: ${s.current_status}`}
                            className={`w-1.5 h-4 rounded-full ${statusTone(s.current_status).split(" ")[1]}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`w-6 h-6 rounded-full border-2 ${isDark ? "border-slate-900 bg-slate-800" : "border-white bg-slate-100"} flex items-center justify-center`}
                        >
                          <div className="w-1 h-1 rounded-full bg-slate-500" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">
                      Updated 14s ago
                    </span>
                  </div>
                </div>
              </motion.div>

              <div className="shrink-0">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl"
                >
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shrink-0">
                        <Phone size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-sans font-black tracking-tight leading-none mb-1">
                          Update Ready
                        </h3>
                        <p className="text-slate-400 text-xs font-medium">
                          New tools are ready. Check what changed.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button className="px-5 py-2.5 rounded-xl bg-white text-slate-950 font-black text-[10px] uppercase tracking-widest">
                        What's New
                      </button>
                      <button className="px-5 py-2.5 rounded-xl border border-white/20 font-black text-[10px] uppercase tracking-widest text-white">
                        Changelog
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`shrink-0 rounded-3xl border p-8 transition-all shadow-lg ${isDark ? "bg-[#0A0A0A]/80 border-white/5" : "bg-white border-slate-200"}`}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}
                  >
                    <Plus size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-xl font-sans font-black tracking-tight dark:text-white text-slate-900 uppercase">
                      New Request
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Create a help ticket
                    </p>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="What's the issue?"
                        className={`w-full px-5 py-3.5 rounded-2xl border text-sm font-bold outline-none transition-all ${isDark ? "bg-white/[0.03] border-white/5 text-white" : "bg-slate-50 border-slate-100"}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">
                        Details
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell us more about the problem..."
                        className={`w-full min-h-[160px] px-5 py-4 rounded-2xl border text-sm font-medium outline-none transition-all resize-none ${isDark ? "bg-white/[0.03] border-white/5 text-white" : "bg-slate-50 border-slate-100"}`}
                      />
                    </div>
                  </div>

                  <div className="w-full lg:w-[280px] flex flex-col gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">
                        Options
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="relative group">
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className={`w-full px-5 py-3.5 rounded-xl border text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer ${isDark ? "bg-white/[0.03] border-white/5 text-slate-300" : "bg-slate-50 border-slate-100"}`}
                          >
                            <option value="" disabled>
                              Category
                            </option>
                            {CATEGORY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronRight
                            size={14}
                            className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none"
                          />
                        </div>

                        <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-500/5 border border-white/5 overflow-x-auto custom-scrollbar">
                          {["low", "medium", "high", "urgent"].map((p) => (
                            <button
                              key={p}
                              onClick={() => setPriority(p)}
                              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${priority === p
                                ? p === "urgent"
                                  ? "bg-rose-500 text-white shadow-lg"
                                  : "bg-blue-600 text-white shadow-lg"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">
                        Add Photos
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                      />
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`min-h-[140px] rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group ${isDark ? "bg-white/[0.02] border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5" : "bg-slate-50 border-slate-200 hover:border-blue-500/50 hover:bg-white"}`}
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-500/5 group-hover:bg-blue-500/10 group-hover:text-blue-500 flex items-center justify-center transition-all">
                          <Upload size={20} strokeWidth={2.5} />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                            Upload Data
                          </p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                            Images / PDF (max 10mb)
                          </p>
                        </div>
                      </motion.div>

                      <AnimatePresence>
                        {files.length > 0 && (
                          <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                            {files.map((file, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`flex items-center justify-between p-3 rounded-2xl border ${isDark ? "bg-white/[0.03] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                    <Upload size={12} />
                                  </div>
                                  <span className="text-[9px] font-bold truncate text-slate-500 uppercase tracking-tight">
                                    {file.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() => removeFile(idx)}
                                  className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors text-slate-400"
                                >
                                  <X size={12} />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={handleSubmitTicket}
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl bg-slate-900 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-auto"
                    >
                      <span>{isSubmitting ? "Sending..." : "Send Request"}</span>
                      {!isSubmitting && <ArrowRight size={14} />}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* === KNOWLEDGE BASE === */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`shrink-0 rounded-3xl border p-8 transition-all shadow-md ${isDark ? "bg-[#0A0A0A]/50 border-white/5" : "bg-white border-slate-200"}`}
              >
                <div className="flex items-center justify-between gap-6 mb-8 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}
                    >
                      <HelpCircle size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-lg font-sans font-black tracking-tight dark:text-white text-slate-900 uppercase">
                        Help Articles
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Frequently asked questions
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all min-w-[240px] group ${isDark ? "bg-white/[0.03] border-white/5 focus-within:border-indigo-500/30" : "bg-slate-100 border-slate-200 focus-within:bg-white"}`}
                  >
                    <Search size={14} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search help..."
                      className="bg-transparent border-none outline-none text-[10px] w-full font-black uppercase tracking-widest placeholder:text-slate-500"
                      value={kbSearch}
                      onChange={(e) => setKbSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredKbItems.map((item, idx) => (
                    <motion.div
                      key={`${item.q}-${idx}`}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className={`rounded-3xl border p-6 transition-all group ${isDark ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-indigo-500/30" : "bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-xl hover:border-indigo-500/30"}`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <Ticket size={14} />
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-2">
                        {item.category.replace("_", " ")}
                      </div>
                      <h4 className="text-xs font-black mb-3 dark:text-slate-100 text-slate-800 leading-tight uppercase tracking-tight">
                        {item.q}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        {item.a}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {filteredKbItems.length === 0 && (
                  <div className="text-center py-6 rounded-2xl border border-dashed border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      No help articles found
                    </p>
                  </div>
                )}
              </motion.div>

              {/* === TICKET ARCHIVE === */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex-1 rounded-3xl border overflow-hidden flex flex-col transition-all shadow-lg mb-8 ${isDark ? "bg-[#0A0A0A]/50 border-white/5" : "bg-white border-slate-200"}`}
              >
                <div
                  className={`flex items-center justify-between p-8 border-b flex-wrap gap-6 ${isDark ? "border-white/5" : "border-slate-100"}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}
                    >
                      <MessageSquare size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-lg font-sans font-black tracking-tight dark:text-white text-slate-900 uppercase">
                        Recent Tickets
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        View your tickets
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap justify-end">
                    {isGlobalViewer && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-500/5 border border-white/5">
                          <button
                            onClick={() => setViewScope("branch")}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewScope === "branch" ? "bg-white text-slate-900 shadow-xl" : "text-slate-500"}`}
                          >
                            Local
                          </button>
                          <button
                            onClick={() => setViewScope("global")}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewScope === "global" ? "bg-white text-slate-900 shadow-xl" : "text-slate-500"}`}
                          >
                            Network
                          </button>
                        </div>

                        {viewScope === "branch" && (
                          <div className="relative group">
                            <select
                              value={selectedBranchId}
                              onChange={(e) =>
                                setSelectedBranchId(Number(e.target.value) || "all")
                              }
                              className={`px-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer pr-12 transition-all ${isDark ? "bg-white/[0.03] border-white/5 text-slate-300" : "bg-slate-50 border-slate-100"}`}
                            >
                              <option value="all">Every Branch</option>
                              {branches.map((branch) => (
                                <option
                                  key={branch.branch_id}
                                  value={branch.branch_id}
                                >
                                  {branch.branch_name}
                                </option>
                              ))}
                            </select>
                            <ChevronRight
                              size={14}
                              className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all min-w-[220px] group ${isDark ? "bg-white/[0.03] border-white/5 focus-within:border-blue-500/30" : "bg-slate-100 border-slate-200 focus-within:bg-white"}`}
                    >
                      <Search size={14} className="text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search tickets..."
                        className="bg-transparent border-none outline-none text-[10px] w-full font-black uppercase tracking-widest placeholder:text-slate-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>

                    <div className="relative group">
                      <select
                        value={ticketCategoryFilter}
                        onChange={(e) => setTicketCategoryFilter(e.target.value)}
                        className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer pr-10 transition-all ${isDark ? "bg-white/[0.03] border-white/5 text-slate-300" : "bg-slate-50 border-slate-100"}`}
                      >
                        <option value="all">Every Category</option>
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronRight
                        size={14}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[500px]">
                  <div className="divide-y dark:divide-white/5 divide-slate-100">
                    {filteredTickets.map((ticket, i) => (
                      <motion.div
                        key={ticket.issue_id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() =>
                          ticket.issue_id && handleFetchDetails(ticket.issue_id)
                        }
                        className="flex flex-col sm:flex-row sm:items-center px-10 py-8 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all group cursor-pointer relative"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />

                        <div className="w-24 shrink-0 mb-4 sm:mb-0">
                          <div className="font-mono text-[11px] font-black tracking-tighter text-blue-500/40 group-hover:text-blue-500 transition-colors">
                            REG-{ticket.issue_id?.toString().padStart(4, "0")}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-all uppercase tracking-tight">
                              {ticket.subject || "Undefined Payload"}
                            </h4>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${ticket.priority === "urgent"
                                  ? "bg-rose-500 text-white shadow-lg"
                                  : ticket.priority === "high"
                                    ? "bg-amber-500 text-white"
                                    : "bg-slate-500/10 text-slate-500"
                                  }`}
                              >
                                {ticket.priority}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border border-blue-500/10">
                                {ticket.category?.replace("_", " ")}
                              </span>
                              {ticket.branch_name && (
                                <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 italic">
                                  @{ticket.branch_name}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 font-medium line-clamp-1 max-w-2xl group-hover:text-slate-500 transition-colors">
                            {ticket.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-6 mt-6 sm:mt-0 shrink-0">
                          <div
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${ticket.status === "completed"
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                              : ticket.status === "responded"
                                ? "bg-blue-500/10 border-blue-500 text-blue-500"
                                : "bg-amber-500/10 border-amber-500 text-amber-500"
                              }`}
                          >
                            {ticket.status}
                          </div>
                          <div className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-300 group-hover:translate-x-2 group-hover:text-blue-500 transition-all">
                            <ArrowRight size={18} />
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {filteredTickets.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-40 opacity-20">
                        <Ticket size={80} strokeWidth={1} />
                        <p className="text-xs font-black uppercase tracking-[0.4em] mt-6">
                          Void: No active logs
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-8 border-t flex items-center justify-between shrink-0 bg-slate-500/5">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Total Tickets: {filteredTickets.length}
                  </div>
                  <button
                    onClick={fetchData}
                    className="px-6 py-2 rounded-xl border border-slate-200/50 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                  >
                    Refresh
                  </button>
                </div>
              </motion.div>
            </div>
          </main>

          <div className="fixed z-[60] bottom-6 right-6 flex flex-col gap-3">
            <a
              href="tel:+919876543210"
              className="w-14 h-14 rounded-full bg-rose-600 text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
              title="Call Support"
            >
              <Phone size={22} />
            </a>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noreferrer"
              className="w-14 h-14 rounded-full bg-emerald-600 text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
              title="WhatsApp Assistant"
            >
              <MessageSquare size={22} />
            </a>
          </div>
        </div>


        <AnimatePresence>
          {selectedTicket && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedTicket(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className={`w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden ${isDark ? "bg-[#111315] border border-white/10" : "bg-white border border-slate-200"}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8 pb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                      {selectedTicket.subject}
                      <span className="text-slate-400 font-mono text-xl font-normal">
                        #{selectedTicket.id || selectedTicket.issue_id}
                      </span>
                    </h2>
                    <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-widest">
                      Reported on{" "}
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 pt-4 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div
                      className={`p-6 rounded-3xl ${isDark ? "bg-white/5" : "bg-slate-50"} space-y-2`}
                    >
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Status
                      </label>
                      <div>
                        <span
                          className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${selectedTicket.status === "completed"
                            ? "bg-emerald-500/20 text-emerald-500"
                            : selectedTicket.status === "in_progress"
                              ? "bg-blue-500/20 text-blue-500"
                              : "bg-amber-500/20 text-amber-500"
                            }`}
                        >
                          {selectedTicket.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`p-6 rounded-3xl ${isDark ? "bg-white/5" : "bg-slate-50"} space-y-2`}
                    >
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Category
                      </label>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                        {selectedTicket.category}
                      </div>
                    </div>
                    <div
                      className={`p-6 rounded-3xl ${isDark ? "bg-white/5" : "bg-slate-50"} space-y-2`}
                    >
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Priority
                      </label>
                      <div
                        className={`text-xs font-bold uppercase ${selectedTicket.priority === "urgent"
                          ? "text-rose-500"
                          : selectedTicket.priority === "high"
                            ? "text-amber-500"
                            : "text-slate-500"
                          }`}
                      >
                        {selectedTicket.priority}
                      </div>
                    </div>
                    <div
                      className={`p-6 rounded-3xl ${isDark ? "bg-white/5" : "bg-slate-50"} space-y-2`}
                    >
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Reporter
                      </label>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                        {selectedTicket.reported_by_name || "Staff Member"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Detailed Description
                    </label>
                    <div
                      className={`p-6 rounded-3xl border ${isDark ? "bg-white/[0.01] border-white/5" : "bg-white border-slate-100 shadow-sm"} text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap`}
                    >
                      {selectedTicket.description}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <MessageSquare size={16} />
                        <label className="text-[10px] font-bold uppercase tracking-widest">
                          System Resolution
                        </label>
                      </div>
                      {isGlobalViewer && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Update Status:
                          </span>
                          <select
                            value={respondingStatus}
                            onChange={(e) => setRespondingStatus(e.target.value)}
                            className={`text-[10px] font-bold uppercase px-3 py-1 rounded-lg border outline-none ${isDark ? "bg-[#1A1D21] border-white/10" : "bg-slate-50 border-slate-200"}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="Responded">Responded</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {isGlobalViewer ? (
                      <div className="space-y-4">
                        <textarea
                          value={adminResponse}
                          onChange={(e) => setAdminResponse(e.target.value)}
                          placeholder="Provide a resolution or update..."
                          className={`w-full p-6 rounded-3xl border min-h-[120px] text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-emerald-500/20 ${isDark ? "bg-[#1A1D21] border-white/10 focus:border-emerald-500/50" : "bg-slate-50 border-slate-200 focus:border-emerald-500/50"}`}
                        />
                        <button
                          onClick={handleRespond}
                          className="w-full py-4 rounded-2xl bg-emerald-600 text-white text-sm font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
                        >
                          Save Resolution <CheckCircle2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`p-6 rounded-3xl ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"} text-sm font-bold leading-relaxed text-emerald-600 dark:text-emerald-400 italic`}
                      >
                        {selectedTicket.admin_response ||
                          "Awaiting response from administrator..."}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pb-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Contextual Attachments (Screenshots)
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {selectedTicket.attachments?.map((path, i) => (
                        <div
                          key={i}
                          className={`w-40 h-52 rounded-2xl overflow-hidden border ${isDark ? "border-white/10" : "border-slate-200"}`}
                        >
                          <img
                            src={`${FILE_BASE_URL}/${path}`}
                            alt="Attachment"
                            className="w-full h-full object-cover"
                            onClick={() =>
                              window.open(`${FILE_BASE_URL}/${path}`)
                            }
                          />
                        </div>
                      ))}
                      {(!selectedTicket.attachments ||
                        selectedTicket.attachments.length === 0) && (
                          <p className="text-[10px] font-bold text-slate-400 uppercase italic opacity-60">
                            No attachments provided
                          </p>
                        )}
                    </div>
                  </div>

                  {selectedTicket.system_metadata && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Diagnostics Data (Auto-Collected)
                      </label>
                      <div
                        className={`p-4 rounded-3xl grid grid-cols-2 md:grid-cols-4 gap-4 ${isDark ? "bg-white/[0.02]" : "bg-slate-50"}`}
                      >
                        {Object.entries(selectedTicket.system_metadata).map(
                          ([key, val]) => (
                            <div key={key} className="space-y-1">
                              <span className="text-[8px] font-bold uppercase text-slate-400">
                                {key.replace("_", " ")}
                              </span>
                              <p className="text-[10px] font-mono font-bold truncate">
                                {String(val)}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <DailyIntelligence
          isOpen={showIntelligence}
          onClose={() => setShowIntelligence(false)}
        />
        <NotesDrawer isOpen={showNotes} onClose={() => setShowNotes(false)} />
        <ChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
        />
      </div>

    </div>
  );
};

export default Support;
