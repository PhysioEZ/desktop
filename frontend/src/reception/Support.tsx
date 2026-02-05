import { useState, useRef, useCallback, useEffect } from 'react';
import {
    Search,
    RefreshCw,
    Bell,
    Ticket,
    Clock,
    CheckCircle2,
    HelpCircle,
    Plus,
    Upload,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    Filter,
    ArrowRight,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, authFetch } from '../config';
import { toast } from 'sonner';
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import Sidebar from '../components/Sidebar';

interface SupportTicket {
    id: number;
    ticket_no: string;
    subject: string;
    description: string;
    status: 'Pending' | 'In Progress' | 'Resolved' | 'Responded';
    created_at: string;
    priority: 'Low' | 'Medium' | 'High';
    release_schedule?: string;
    release_date?: string;
    admin_response?: string;
    attachments?: string[];
}

const Support = () => {
    const { user } = useAuthStore();
    const { isDark } = useThemeStore();

    // State
    const [stats] = useState({
        total: 16,
        pending: 0,
        resolved: 15
    });
    const [tickets] = useState<SupportTicket[]>([
        {
            id: 1,
            ticket_no: '#16',
            subject: 'Feature Request: Export Billing to PDF',
            description: 'There should be an option to write custom notes in billing...',
            status: 'In Progress',
            created_at: 'Jan 23, 2026 at 05:52 AM',
            priority: 'Medium',
            release_schedule: 'Next Release',
            release_date: 'Not scheduled yet',
            admin_response: 'Will be added in next update'
        },
        {
            id: 2,
            ticket_no: '#15',
            subject: 'Dashboard Loading Slow',
            description: 'The dashboard takes too long to load patient data...',
            status: 'Resolved',
            created_at: 'Jan 20, 2026 at 11:30 AM',
            priority: 'High'
        },
        {
            id: 3,
            ticket_no: '#14',
            subject: 'Profile Picture Not Updating',
            description: 'When I change my profile picture, it does not reflect immediately...',
            status: 'Responded',
            created_at: 'Jan 15, 2026 at 02:15 PM',
            priority: 'Low'
        }
    ]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    // New Ticket Form State
    const [description, setDescription] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Header Logic (Notifications)
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifPopup, setShowNotifPopup] = useState(false);
    const notifRef = useRef<HTMLButtonElement>(null);

    const fetchNotifs = useCallback(async () => {
        try {
            const res = await authFetch(
                `${API_BASE_URL}/reception/notifications?employee_id=${user?.employee_id || ""}`,
            );
            const data = await res.json();
            if (data.success || data.status === "success") {
                setUnreadCount(data.unread_count || 0);
            }
        } catch (err) {
            console.error(err);
        }
    }, [user?.employee_id]);

    useEffect(() => {
        if (user?.employee_id) {
            fetchNotifs();
            const inv = setInterval(fetchNotifs, 30000);
            return () => clearInterval(inv);
        }
    }, [fetchNotifs, user?.employee_id]);

    const handleSubmitTicket = () => {
        if (!description.trim()) {
            toast.error("Please describe your issue");
            return;
        }
        setIsSubmitting(true);
        setTimeout(() => {
            toast.success("Ticket submitted successfully!");
            setDescription('');
            setFiles([]);
            setIsSubmitting(false);
        }, 1500);
    };

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? "bg-[#050505] text-slate-200" : "bg-[#FAFAFA] text-slate-900"}`}>

            <Sidebar />

            {/* === LEFT PANEL (STATS) === */}
            <div className={`hidden xl:flex w-[450px] flex-col justify-between p-10 border-r relative shrink-0 transition-colors duration-300 z-50 ${isDark ? "bg-[#0A0A0A] border-[#151515]" : "bg-white border-gray-200"}`}>

                <div className="space-y-12 z-10">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-emerald-500 ${isDark ? "bg-[#1C1C1C]" : "bg-emerald-50"}`}>
                            <HelpCircle size={22} />
                        </div>
                        <span className="font-medium tracking-[0.2em] text-[12px] uppercase text-slate-500">PhysioEZ Core</span>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-6xl font-serif font-normal tracking-tight leading-tight text-slate-900 dark:text-slate-100">
                            Support <br />
                            <span className={`italic ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Center</span>
                        </h1>
                        <p className="text-slate-500 text-base leading-relaxed max-w-xs">
                            Get help, track issues and explore what's new in PhysioEZ.
                        </p>
                    </div>
                </div>

                {/* Vertical Stats Stack */}
                <div className="space-y-8 w-full flex-1 flex flex-col justify-center py-6">

                    {/* Stat 1: Total Tickets */}
                    <div className={`p-8 rounded-[32px] border transition-all duration-300 ${isDark ? "bg-[#121212] border-white/5" : "bg-white border-emerald-100 shadow-sm"}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 opacity-60">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                    <Ticket size={20} strokeWidth={2} />
                                </div>
                                <span className="text-sm font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">Total Tickets</span>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-[#1C1C1C] text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                                <Ticket size={14} />
                            </div>
                        </div>
                        <div className={`text-5xl font-medium tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                            {stats.total}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Stat 2: Pending */}
                        <div className={`p-8 rounded-[32px] border flex flex-col gap-2 ${isDark ? "bg-[#1A1810] border-amber-900/20" : "bg-white border-amber-100 shadow-sm"}`}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-3 opacity-60">
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                        <Clock size={20} strokeWidth={2} />
                                    </div>
                                    <span className="text-sm font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending</span>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-500`}>
                                    <Clock size={14} />
                                </div>
                            </div>
                            <div className="text-4xl font-medium tracking-tight text-amber-600 dark:text-amber-400">
                                {stats.pending}
                            </div>
                        </div>

                        {/* Stat 3: Resolved */}
                        <div className={`p-8 rounded-[32px] border flex flex-col gap-2 ${isDark ? "bg-[#101A12] border-emerald-900/20" : "bg-white border-emerald-100 shadow-sm"}`}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-3 opacity-60">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                        <CheckCircle2 size={20} strokeWidth={2} />
                                    </div>
                                    <span className="text-sm font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Resolved</span>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500`}>
                                    <CheckCircle2 size={14} />
                                </div>
                            </div>
                            <div className="text-4xl font-medium tracking-tight text-emerald-600 dark:text-emerald-400">
                                {stats.resolved}
                            </div>
                        </div>
                    </div>

                </div>

                <div className="absolute top-1/2 left-0 w-full h-full bg-gradient-to-t from-emerald-500/[0.02] to-transparent pointer-events-none" />
            </div>

            {/* === MAIN CONTENT (Right Panel) === */}
            <main className="flex-1 h-screen overflow-y-auto custom-scrollbar relative">
                <div className="p-8 lg:p-12 flex flex-col gap-8">
                    {/* Global Header */}
                    <div className={`flex justify-between items-end shrink-0 sticky top-0 z-[60] py-4 -mt-4 transition-colors ${isDark ? "bg-[#050505]/80" : "bg-[#FAFAFA]/80"} backdrop-blur-md`}>
                        <div>
                            <h2 className="text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-100">Help & Support</h2>
                            <p className="text-slate-500 text-base mt-1">Submit tickets and track resolution status</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setLoading(true)} className={`w-12 h-12 border rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-[#121212] border-white/5 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"} ${loading ? "animate-spin" : ""}`}>
                                <RefreshCw size={20} className="text-slate-500" />
                            </button>
                            <div className="relative">
                                <button ref={notifRef} onClick={() => setShowNotifPopup(!showNotifPopup)} className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all hover:scale-105 ${isDark ? "bg-[#121212] border-white/5 hover:bg-white/10" : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"} relative text-slate-500`}>
                                    <Bell size={20} strokeWidth={2} />
                                    {unreadCount > 0 && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Updates Banner */}
                    <div className="shrink-0">
                        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white shadow-xl shadow-blue-500/20">
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-white/30 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight">What's New in PhysioEZ</h3>
                                        <p className="text-blue-100 text-sm mt-1 opacity-80">Check out the latest updates and improved features in V2.1</p>
                                    </div>
                                </div>
                                <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/20 backdrop-blur-sm text-sm font-medium">
                                    View Updates <ArrowRight size={18} />
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
                        </div>
                    </div>

                    {/* New Ticket Section */}
                    <div className={`shrink-0 rounded-[40px] border p-8 transition-colors ${isDark ? "bg-[#0A0A0A] border-white/5" : "bg-white border-slate-200/60 shadow-sm"}`}>
                        <div className="flex items-center gap-3 mb-8">
                            <div className={`p-2.5 rounded-xl ${isDark ? "bg-emerald-500/10 text-emerald-500" : "bg-emerald-50 text-emerald-600"}`}>
                                <Plus size={20} />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight">Create New Ticket</h3>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-10">
                            <div className="flex-1 space-y-4">
                                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 px-1">Issue Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the issue you are facing in detail..."
                                    className={`w-full h-40 p-6 rounded-3xl border text-base font-medium outline-none transition-all resize-none ${isDark ? "bg-[#121212] border-white/5 focus:border-blue-500/30" : "bg-slate-50 border-slate-100 focus:bg-white focus:shadow-sm focus:border-blue-500/30"}`}
                                />
                            </div>

                            <div className="w-full lg:w-80 flex flex-col gap-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 px-1">Attachments</label>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        multiple
                                    />
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`h-40 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group ${isDark ? "bg-[#121212] border-white/5 hover:border-blue-500/30" : "bg-slate-50 border-slate-200 hover:border-blue-500/30"}`}
                                    >
                                        <div className="p-3 rounded-full bg-slate-500/5 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-all">
                                            <Upload size={24} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-400">Click to upload files</p>
                                        <p className="text-[9px] font-medium text-slate-500 uppercase">Max 10MB per file</p>
                                    </div>

                                    {/* File Preview List */}
                                    <AnimatePresence>
                                        {files.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="space-y-2 mt-2"
                                            >
                                                {files.map((file, idx) => (
                                                    <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${isDark ? "bg-white/5 border-white/5" : "bg-white border-slate-100 shadow-sm"}`}>
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                                                                <Upload size={14} />
                                                            </div>
                                                            <span className="text-sm font-medium truncate text-slate-500">{file.name}</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeFile(idx);
                                                            }}
                                                            className="p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors text-slate-400"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button
                                    onClick={handleSubmitTicket}
                                    disabled={isSubmitting}
                                    className="w-full py-5 rounded-[24px] bg-blue-600 text-white text-lg font-medium tracking-wide hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <RefreshCw size={22} className="animate-spin" />
                                    ) : (
                                        <>Submit Ticket <ArrowRight size={22} /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Tickets List */}
                    <div className={`flex-1 rounded-[40px] border overflow-hidden flex flex-col transition-colors ${isDark ? "bg-[#0A0A0A] border-white/5" : "bg-white border-slate-200/60 shadow-sm"}`}>
                        <div className={`flex items-center justify-between p-8 border-b ${isDark ? "border-white/5" : "border-slate-100"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${isDark ? "bg-blue-500/10 text-blue-500" : "bg-blue-50 text-blue-600"}`}>
                                    <MessageSquare size={20} />
                                </div>
                                <h3 className="text-xl font-medium tracking-tight">Recent Tickets</h3>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${isDark ? "bg-[#121212] border-white/5 focus-within:border-blue-500/30" : "bg-slate-50 border-slate-100 focus-within:bg-white shadow-inner"}`}>
                                    <Search size={16} className="opacity-30" />
                                    <input
                                        type="text"
                                        placeholder="Search tickets..."
                                        className="bg-transparent border-none outline-none text-xs w-48 font-medium"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <button className={`p-2.5 rounded-xl border ${isDark ? "bg-[#121212] border-white/5" : "bg-white border-slate-200"}`}>
                                    <Filter size={18} className="text-slate-500" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="divide-y dark:divide-white/5 divide-slate-100">
                                {tickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => setSelectedTicket(ticket)}
                                        className="flex items-center px-8 py-6 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all group cursor-pointer"
                                    >
                                        <div className="w-[10%] font-mono text-xs opacity-40 font-bold uppercase tracking-widest">
                                            {ticket.ticket_no}
                                        </div>
                                        <div className="flex-1 pr-6">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors uppercase tracking-tight">{ticket.subject}</h4>
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-tighter ${ticket.priority === 'High' ? 'bg-rose-500/10 text-rose-500' :
                                                    ticket.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                                                        'bg-slate-500/10 text-slate-500'
                                                    }`}>
                                                    {ticket.priority} Priority
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-1 font-medium">{ticket.description}</p>
                                        </div>
                                        <div className="w-[20%] text-left">
                                            <div className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{ticket.created_at}</div>
                                        </div>
                                        <div className="w-[15%] flex justify-center">
                                            <span className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 ${ticket.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                ticket.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                                    ticket.status === 'Responded' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'Resolved' ? 'bg-emerald-500' :
                                                    ticket.status === 'In Progress' ? 'bg-blue-500' :
                                                        ticket.status === 'Responded' ? 'bg-purple-500' :
                                                            'bg-amber-500'
                                                    }`} />
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <div className="w-[8%] text-right">
                                            <div className="p-2.5 rounded-xl group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 flex justify-end">
                                                <ChevronRight size={20} className="text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={`px-10 py-6 border-t flex items-center justify-between shrink-0 ${isDark ? "border-white/5" : "border-slate-100"}`}>
                            <div className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                                Showing {tickets.length} support requests
                            </div>
                            <div className="flex items-center gap-3">
                                <button disabled className={`px-4 py-2 rounded-xl border text-xs font-medium uppercase tracking-widest transition-all opacity-30 cursor-not-allowed ${isDark ? "border-white/10" : "border-slate-200 shadow-sm"}`}>
                                    View Archived
                                </button>
                                <div className="flex items-center gap-2">
                                    <button disabled className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all opacity-30 cursor-not-allowed ${isDark ? "border-white/10" : "border-slate-200 shadow-sm"}`}>
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button disabled className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all opacity-30 cursor-not-allowed ${isDark ? "border-white/10" : "border-slate-200 shadow-sm"}`}>
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Ticket Details Modal */}
            <AnimatePresence>
                {selectedTicket && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedTicket(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className={`w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden ${isDark ? "bg-[#111315] border border-white/10" : "bg-white border border-slate-200"}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-8 pb-4 flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                        Issue Details
                                        <span className="text-slate-400 font-mono text-xl font-normal">#{selectedTicket.ticket_no.replace('#', '')}</span>
                                    </h2>
                                    <p className="text-base font-medium text-slate-500 mt-2">Reported on {selectedTicket.created_at}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedTicket(null)}
                                    className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 pt-4 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {/* Top Info Boxes */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className={`p-6 rounded-3xl ${isDark ? "bg-white/5" : "bg-slate-50"} space-y-2`}>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Status</label>
                                        <div>
                                            <span className={`px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-widest ${selectedTicket.status === 'In Progress' ? "bg-blue-500/20 text-blue-500" :
                                                selectedTicket.status === 'Resolved' ? "bg-emerald-500/20 text-emerald-500" :
                                                    "bg-amber-500/20 text-amber-500"
                                                }`}>
                                                {selectedTicket.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`p-6 rounded-3xl ${isDark ? "bg-white/5" : "bg-slate-50"} space-y-2`}>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Release Schedule</label>
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {selectedTicket.release_schedule || 'Not scheduled'}
                                        </div>
                                    </div>
                                    <div className={`p-6 rounded-3xl ${isDark ? "bg-white/5" : "bg-slate-50"} space-y-2`}>
                                        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Release Date</label>
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {selectedTicket.release_date || 'Not scheduled yet'}
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Description</label>
                                    <div className={`p-6 rounded-3xl border ${isDark ? "bg-white/[0.01] border-white/5" : "bg-white border-slate-100 shadow-sm"} text-base font-normal leading-relaxed text-slate-600 dark:text-slate-400`}>
                                        {selectedTicket.description}
                                    </div>
                                </div>

                                {/* Admin Response */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <MessageSquare size={16} />
                                        <label className="text-xs font-semibold uppercase tracking-widest">Admin Response</label>
                                    </div>
                                    <div className={`p-6 rounded-3xl ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"} text-base font-medium leading-relaxed text-emerald-600 dark:text-emerald-400`}>
                                        {selectedTicket.admin_response || 'Awating response from administrator...'}
                                    </div>
                                </div>

                                {/* Attachments */}
                                <div className="space-y-3 pb-4">
                                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Attachments</label>
                                    <div className="flex flex-wrap gap-4">
                                        <div className={`w-32 h-40 rounded-2xl border-2 border-dashed flex items-center justify-center p-2 group cursor-pointer ${isDark ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}>
                                            <div className="w-full h-full rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                                                <Upload size={20} className="text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Support;
