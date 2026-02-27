import React from "react";
import {
    Users,
    CheckCircle2,
    Banknote,
    Clock,
    AlertCircle,
    TrendingUp,
    Zap,
    ShieldAlert,
    Search,
    UserPlus,
    RefreshCcw,
    LogOut,
    Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { useThemeStore } from "../store/useThemeStore";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/PageHeader";
import DailyIntelligence from "../components/DailyIntelligence";
import NotesDrawer from "../components/NotesDrawer";

const ReceptionAnalytics: React.FC = () => {
    const { isDark } = useThemeStore();
    const [showIntelligence, setShowIntelligence] = React.useState(false);
    const [showNotes, setShowNotes] = React.useState(false);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className={`flex h-screen ${isDark ? "bg-[#0A0B0D] text-white" : "bg-slate-50 text-slate-900"}`}>
            <Sidebar />

            <main className="flex-1 overflow-y-auto px-8 py-8">
                <PageHeader
                    title="Reception Analytics"
                    subtitle="Operational real-time monitoring"
                    icon={Activity}
                    onShowIntelligence={() => setShowIntelligence(true)}
                    onShowNotes={() => setShowNotes(true)}
                />

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8 mt-8"
                >
                    {/* TOP SECTION: Operational Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <MetricCard
                            label="Checked-in Today"
                            value="24"
                            icon={<Users size={20} />}
                            color="emerald"
                        />
                        <MetricCard
                            label="Sessions Completed"
                            value="18"
                            icon={<CheckCircle2 size={20} />}
                            color="blue"
                        />
                        <MetricCard
                            label="Payments Collected"
                            value="₹14,250"
                            icon={<Banknote size={20} />}
                            color="indigo"
                        />
                        <MetricCard
                            label="Pending Payments"
                            value="₹3,400"
                            icon={<AlertCircle size={20} />}
                            color="orange"
                            isRisk
                        />
                        <MetricCard
                            label="No-show Patients"
                            value="2"
                            icon={<LogOut size={20} />}
                            color="rose"
                            isRisk
                        />
                    </div>

                    {/* MIDDLE SECTION: Appointment Load & Payment Risk */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: Appointment Load Analytics */}
                        <SectionCard title="Appointment Load Analysis" icon={<Clock size={18} className="text-blue-500" />}>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-2xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Peak Hour Today</p>
                                        <p className="text-xl font-black">11:00 AM - 1:00 PM</p>
                                    </div>
                                    <div className={`p-4 rounded-2xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Remaining Slots</p>
                                        <p className="text-xl font-black">8 Free</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Alerts & Warnings</h4>
                                    <AlertItem
                                        type="warning"
                                        message="Dr. Sharma is overbooked between 4PM - 5PM"
                                        icon={<Zap size={14} />}
                                    />
                                    <AlertItem
                                        type="error"
                                        message="Therapy Room 2 sessions running 15m late"
                                        icon={<Clock size={14} />}
                                    />
                                </div>
                            </div>
                        </SectionCard>

                        {/* Right: Payment Risk Panel */}
                        <SectionCard title="Payment Risk Monitoring" icon={<ShieldAlert size={18} className="text-rose-500" />}>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <RiskListItem
                                        name="Arjun Mehta"
                                        desc="High-value bill (₹4,500) unpaid"
                                        badge="Overdue"
                                        color="rose"
                                    />
                                    <RiskListItem
                                        name="Sita Ram"
                                        desc="Arriving today with ₹1,200 pending"
                                        badge="Due Today"
                                        color="orange"
                                    />
                                    <RiskListItem
                                        name="Rahul Singh"
                                        desc="Last 3 sessions unpaid"
                                        badge="Recurring"
                                        color="rose"
                                    />
                                </div>
                                <button className={`w-full py-3 rounded-xl border-2 border-dashed ${isDark ? "border-white/10 text-slate-500 hover:text-white" : "border-slate-200 text-slate-400 hover:text-slate-600"} text-[10px] font-black uppercase tracking-[0.2em] transition-all`}>
                                    View All Financial Risks
                                </button>
                            </div>
                        </SectionCard>
                    </div>

                    {/* BOTTOM SECTION: Patient Flow Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FlowCard
                            label="New Patients Today"
                            value="5"
                            sub="12% vs yesterday"
                            icon={<UserPlus size={18} />}
                            color="emerald"
                        />
                        <FlowCard
                            label="Follow-ups"
                            value="12"
                            sub="On track"
                            icon={<RefreshCcw size={18} />}
                            color="indigo"
                        />
                        <FlowCard
                            label="Inactive Callbacks"
                            value="8"
                            sub="Need attention"
                            icon={<Search size={18} />}
                            color="orange"
                        />
                        <FlowCard
                            label="Treatment Completing"
                            value="3"
                            sub="Next 48 hours"
                            icon={<TrendingUp size={18} />}
                            color="blue"
                        />
                    </div>
                </motion.div>
            </main>

            <DailyIntelligence
                isOpen={showIntelligence}
                onClose={() => setShowIntelligence(false)}
            />
            <NotesDrawer isOpen={showNotes} onClose={() => setShowNotes(false)} />
        </div>
    );
};

/* --- SUBCOMPONENTS --- */

const MetricCard = ({ label, value, icon, color, isRisk }: any) => {
    const { isDark } = useThemeStore();
    const colors: any = {
        emerald: "text-emerald-500 bg-emerald-500/10",
        blue: "text-blue-500 bg-blue-500/10",
        indigo: "text-indigo-500 bg-indigo-500/10",
        orange: "text-orange-500 bg-orange-500/10",
        rose: "text-rose-500 bg-rose-500/10",
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={`p-5 rounded-[32px] border transition-all ${isDark ? "bg-[#141619] border-white/5" : "bg-white border-slate-100 shadow-sm"} ${isRisk ? "ring-1 ring-orange-500/20" : ""}`}
        >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${colors[color]}`}>
                {icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <div className="flex items-end justify-between">
                <h3 className="text-2xl font-black tracking-tight">{value}</h3>
                {isRisk && (
                    <div className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-widest">
                        Risk
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const SectionCard = ({ title, icon, children }: any) => {
    const { isDark } = useThemeStore();
    return (
        <div className={`p-8 rounded-[40px] border ${isDark ? "bg-[#141619] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className="flex items-center gap-3 mb-8">
                <div className={`p-2 rounded-xl ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                    {icon}
                </div>
                <h3 className="text-lg font-black tracking-tight">{title}</h3>
            </div>
            {children}
        </div>
    );
};

const AlertItem = ({ type, message, icon }: any) => {
    const isError = type === "error";
    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl ${isError ? "bg-rose-500/10 text-rose-500" : "bg-orange-500/10 text-orange-500"}`}>
            {icon}
            <span className="text-[11px] font-bold">{message}</span>
        </div>
    );
};

const RiskListItem = ({ name, desc, badge, color }: any) => {
    const { isDark } = useThemeStore();
    return (
        <div className={`flex items-center justify-between p-4 rounded-2xl ${isDark ? "bg-white/5 border border-white/5" : "bg-slate-50 border border-slate-100"}`}>
            <div className="flex flex-col">
                <span className="text-xs font-black">{name}</span>
                <span className="text-[10px] font-bold text-slate-400">{desc}</span>
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${color === 'rose' ? 'bg-rose-500/10 text-rose-500' : 'bg-orange-500/10 text-orange-500'}`}>
                {badge}
            </div>
        </div>
    );
};

const FlowCard = ({ label, value, sub, icon, color }: any) => {
    const { isDark } = useThemeStore();
    const colors: any = {
        emerald: "text-emerald-500",
        indigo: "text-indigo-500",
        orange: "text-orange-500",
        blue: "text-blue-500",
    };

    return (
        <div className={`p-6 rounded-[32px] border ${isDark ? "bg-[#141619] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}>
            <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <div className={`${colors[color]} opacity-50`}>
                    {icon}
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black">{value}</span>
                <span className="text-[10px] font-bold text-slate-400">{sub}</span>
            </div>
        </div>
    );
};

export default ReceptionAnalytics;
