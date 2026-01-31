import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Plus, Activity, Zap, CreditCard, Calendar, ChevronDown, Check,
    Clock, Box, Layout, ArrowLeft, Loader2, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { authFetch, API_BASE_URL } from '../config';

/* --- Types --- */

type FieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'heading';

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
    buttonLabel: string;
    icon: string;
    themeColor: string;
    fields: FormField[];
    pricing: {
        enabled: boolean;
        model: 'multi-plan' | 'fixed-rate';
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

const AVAILABLE_ICONS = [
    { name: 'Activity', icon: Activity },
    { name: 'Zap', icon: Zap },
    { name: 'Clock', icon: Clock },
    { name: 'Box', icon: Box },
    { name: 'Calendar', icon: Calendar },
    { name: 'CreditCard', icon: CreditCard },
    { name: 'Plus', icon: Plus },
    { name: 'UserPlus', icon: UserPlus }
];

const IconComponent = ({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => {
    const Icon = AVAILABLE_ICONS.find(i => i.name === name)?.icon || Activity;
    return <Icon size={size} className={className} />;
};

const RegistrationSimulator = () => {
    const navigate = useNavigate();
    const [tracks, setTracks] = useState<ServiceTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrack, setSelectedTrack] = useState<ServiceTrack | null>(null);
    const [previewSelectedPlanId, setPreviewSelectedPlanId] = useState<string>('');
    const [previewFormValues, setPreviewFormValues] = useState<Record<string, any>>({});
    const [simulationVisible, setSimulationVisible] = useState(false);

    // Simulation Operational State
    const [simRate, setSimRate] = useState<number>(0);
    const [simDays, setSimDays] = useState<number>(1);
    const [simStartDate, setSimStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [simDiscount, setSimDiscount] = useState<number>(0);
    const [simAdvance, setSimAdvance] = useState<number>(0);
    const [simPaymentDist, setSimPaymentDist] = useState<Record<string, number>>({});
    const [simAuthorizedBy, setSimAuthorizedBy] = useState<string>('');
    const [simSelectedSlot, setSimSelectedSlot] = useState<string>('');

    // Fetch tracks
    const fetchTracks = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authFetch(`${API_BASE_URL}/admin/services`);
            const data = await response.json();
            if (data.status === 'success') {
                setTracks(data.data);
            }
        } catch (err) {
            console.error('Fetch tracks failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTracks();
    }, [fetchTracks]);

    // Handle Plan Selection
    useEffect(() => {
        if (selectedTrack && previewSelectedPlanId) {
            const plan = selectedTrack.pricing.plans.find(p => p.id === previewSelectedPlanId);
            if (plan) {
                setSimRate(plan.rate);
                setSimDays(plan.days);
            }
        }
    }, [previewSelectedPlanId, selectedTrack]);

    // Derived Billing Math
    const billing = useMemo(() => {
        const subtotal = simRate * simDays;
        const discountAmount = (subtotal * simDiscount) / 100;
        const effectiveAmount = subtotal - discountAmount;
        const pendingBalance = effectiveAmount - simAdvance;
        
        // Split reconciliation
        const totalDistributed = Object.values(simPaymentDist).reduce((sum, val) => sum + val, 0);
        const reconciliationError = Math.abs(totalDistributed - simAdvance) > 0.01;

        return {
            subtotal,
            discountAmount,
            effectiveAmount,
            pendingBalance,
            totalDistributed,
            reconciliationError
        };
    }, [simRate, simDays, simDiscount, simAdvance, simPaymentDist]);

    // Calculcate End Date
    const simEndDate = useMemo(() => {
        const date = new Date(simStartDate);
        date.setDate(date.getDate() + (simDays > 0 ? simDays - 1 : 0));
        return date.toISOString().split('T')[0];
    }, [simStartDate, simDays]);

    const openSimulation = (track: ServiceTrack) => {
        setSelectedTrack(track);
        const firstPlan = track.pricing?.plans?.[0];
        setPreviewSelectedPlanId(firstPlan?.id || '');
        setSimRate(firstPlan?.rate || 0);
        setSimDays(firstPlan?.days || 1);
        setSimDiscount(0);
        setSimAdvance(0);
        setSimPaymentDist({});
        setSimAuthorizedBy('');
        setSimSelectedSlot('');
        setPreviewFormValues({});
        setSimulationVisible(true);
    };

    const closeSimulation = () => {
        setSimulationVisible(false);
        setSelectedTrack(null);
    };

    const handleDistChange = (method: string, value: string) => {
        const num = parseFloat(value) || 0;
        setSimPaymentDist(prev => ({ ...prev, [method]: num }));
    };

    return (
        <div className="min-h-screen bg-[#F8F9FF] dark:bg-[#0F1117] text-[#1C1B1F] dark:text-[#E6E1E5] font-sans">
            {/* Header */}
            <header className="px-10 py-6 bg-white/80 dark:bg-black/20 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/admin/services')} className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-[#6366f1] transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Registration Simulator</h1>
                        <p className="text-[10px] font-black text-[#6366f1] uppercase tracking-[0.2em] mt-1.5 px-2 py-0.5 bg-[#6366f1]/10 rounded-full inline-block">Testing Sandbox</p>
                    </div>
                </div>
            </header>

            <main className="p-10 max-w-7xl mx-auto">
                <div className="mb-12">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">Active Blueprints</h2>
                    <p className="text-sm text-gray-400 font-medium font-bold uppercase tracking-widest text-[10px]">Registry: Deployed Service Templates</p>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-10 h-10 text-[#6366f1] animate-spin" />
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Synchronizing Simulator...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tracks.map((track) => (
                            <motion.div
                                key={track.id}
                                whileHover={{ y: -5 }}
                                onClick={() => openSimulation(track)}
                                className="bg-white dark:bg-[#1C1B22] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm hover:shadow-2xl transition-all group overflow-hidden relative cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] group-hover:opacity-10 transition-opacity" style={{ color: track.themeColor }}>
                                    <IconComponent name={track.icon} size={128} className="-mr-8 -mt-8 rotate-12" />
                                </div>

                                <div className="relative z-10 flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-500" style={{ backgroundColor: `${track.themeColor}15`, color: track.themeColor }}>
                                        <IconComponent name={track.icon} size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">{track.name}</h3>
                                        <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">Operational Blueprint</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest opacity-60">
                                        <span>Form Complexity</span>
                                        <span className="text-gray-900 dark:text-white">{track.fields.length} Nodes</span>
                                    </div>
                                    <div className="w-full h-1 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${Math.min(track.fields.length * 15, 100)}%` }}></div>
                                    </div>
                                </div>

                                <button 
                                    className="w-full h-14 rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 text-white"
                                    style={{ backgroundColor: track.themeColor, boxShadow: `0 15px 25px -5px ${track.themeColor}33` }}
                                >
                                    <Zap size={16} />
                                    {track.buttonLabel || 'Initialize Simulation'}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* FULL SCREEN SIMULATOR MODAL */}
            <AnimatePresence>
                {simulationVisible && selectedTrack && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={closeSimulation}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                        />
                        
                        <motion.div 
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-6xl bg-[#F8F9FC] dark:bg-[#0F1117] rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col h-[90vh]">
                                {/* Simulator Header - MATCHING IMAGE 1 */}
                                <div className="px-10 py-6 bg-white dark:bg-[#1A1C24] border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-teal-500/20" style={{ backgroundColor: selectedTrack.themeColor }}>
                                            <IconComponent name="UserPlus" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Convert to {selectedTrack.name} Patient</h4>
                                            <p className="text-[11px] font-bold text-gray-500 mt-1">Patient: <span className="text-[#6366f1]">test</span></p>
                                        </div>
                                    </div>
                                    <button onClick={closeSimulation} className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-400">
                                        <Plus size={28} className="rotate-45" />
                                    </button>
                                </div>

                                {/* Simulator Content */}
                                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                    <div className="max-w-5xl mx-auto space-y-12 pb-12">
                                        
                                        {/* Status Bar */}
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                                <Check size={14} />
                                            </div>
                                            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Simulation Mode: This patient is already registered for testing purposes.</p>
                                        </div>

                                        {/* TREATMENT PLAN SECTION */}
                                        <div className="space-y-6">
                                            <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Treatment Plan</h5>
                                            <div className="flex flex-wrap gap-5">
                                                {(selectedTrack.pricing.plans || []).map((plan) => {
                                                    const isSelected = previewSelectedPlanId === plan.id;
                                                    return (
                                                        <div 
                                                            key={plan.id}
                                                            onClick={() => setPreviewSelectedPlanId(plan.id)}
                                                            className={`flex-1 min-w-[280px] p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col items-start ${isSelected ? 'shadow-2xl' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-black/20 hover:border-gray-200'} relative group overflow-hidden`}
                                                            style={{ 
                                                                borderColor: isSelected ? selectedTrack.themeColor : 'transparent',
                                                                backgroundColor: isSelected ? `${selectedTrack.themeColor}05` : undefined
                                                            }}
                                                        >
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${isSelected ? 'bg-white shadow-xl' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`} style={{ color: isSelected ? selectedTrack.themeColor : 'inherit' }}>
                                                                <IconComponent name={plan.icon} size={24} />
                                                            </div>
                                                            <span className="text-sm font-black text-gray-900 dark:text-white mb-1.5 uppercase leading-none tracking-tight">{plan.name}</span>
                                                            <p className="text-[10px] font-bold text-gray-400 leading-tight mb-8">{plan.subtitle}</p>
                                                            {isSelected && (
                                                                <div className="absolute top-8 right-8 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                                                                    <Check size={14} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* MAIN OPERATIONAL GRID */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                            
                                            {/* LEFT: SCHEDULE CONFIGURATION */}
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-3">
                                                    <Calendar size={18} className="text-indigo-500" />
                                                    <h5 className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em]">Schedule Configuration</h5>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="relative">
                                                        <label className="absolute -top-2 left-4 px-2 bg-white dark:bg-[#0F1117] text-[8px] font-black text-gray-400 uppercase tracking-widest z-10">Rate / Day</label>
                                                        <div className="relative group">
                                                             <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</div>
                                                             <input 
                                                                type="number"
                                                                value={simRate}
                                                                onChange={(e) => setSimRate(parseFloat(e.target.value) || 0)}
                                                                className="w-full h-15 pl-9 pr-6 bg-white dark:bg-black/20 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-xs font-black outline-none focus:border-indigo-500/50 transition-all" 
                                                             />
                                                        </div>
                                                    </div>
                                                    <div className="relative">
                                                        <label className="absolute -top-2 left-4 px-2 bg-white dark:bg-[#0F1117] text-[8px] font-black text-gray-400 uppercase tracking-widest z-10">Total Days</label>
                                                        <div className="relative group">
                                                             <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">#</div>
                                                             <input 
                                                                type="number"
                                                                value={simDays}
                                                                onChange={(e) => setSimDays(parseInt(e.target.value) || 0)}
                                                                className="w-full h-15 pl-9 pr-6 bg-white dark:bg-black/20 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-xs font-black outline-none focus:border-indigo-500/50 transition-all" 
                                                             />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="relative">
                                                        <label className="absolute -top-2 left-4 px-2 bg-white dark:bg-[#0F1117] text-[8px] font-black text-gray-400 uppercase tracking-widest z-10">Start From</label>
                                                        <input 
                                                            type="date"
                                                            value={simStartDate}
                                                            onChange={(e) => setSimStartDate(e.target.value)}
                                                            className="w-full h-15 px-6 bg-white dark:bg-black/20 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-xs font-black outline-none focus:border-indigo-500/50 transition-all" 
                                                        />
                                                    </div>
                                                    <div className="relative opacity-60">
                                                        <label className="absolute -top-2 left-4 px-2 bg-white dark:bg-[#0F1117] text-[8px] font-black text-gray-400 uppercase tracking-widest z-10">End Date</label>
                                                        <input 
                                                            type="date"
                                                            readOnly
                                                            value={simEndDate}
                                                            className="w-full h-15 px-6 bg-gray-50 dark:bg-black/40 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-xs font-black outline-none cursor-not-allowed" 
                                                        />
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    <label className="absolute -top-2 left-4 px-2 bg-white dark:bg-[#0F1117] text-[8px] font-black text-gray-400 uppercase tracking-widest z-10">Available Time Slot</label>
                                                    <select 
                                                        value={simSelectedSlot}
                                                        onChange={(e) => setSimSelectedSlot(e.target.value)}
                                                        className="w-full h-15 px-6 bg-white dark:bg-black/20 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-xs font-black outline-none focus:border-indigo-500/50 transition-all appearance-none"
                                                    >
                                                        <option value="">Choose a slot</option>
                                                        <option value="9am">09:00 AM - 10:00 AM</option>
                                                        <option value="11am">11:00 AM - 12:00 PM</option>
                                                        <option value="4pm">04:00 PM - 05:00 PM</option>
                                                    </select>
                                                    <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                                </div>
                                            </div>

                                            {/* RIGHT: BILLING SUMMARY */}
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-3">
                                                    <CreditCard size={18} className="text-teal-500" />
                                                    <h5 className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em]">Billing Summary</h5>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="relative">
                                                        <label className="absolute -top-2 left-4 px-2 bg-[#F8F9FC] dark:bg-[#0F1117] text-[8px] font-black text-gray-400 uppercase tracking-widest z-10">Calculated Subtotal</label>
                                                        <div className="w-full h-15 flex items-center px-6 bg-gray-100/50 dark:bg-white/5 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-xs font-black">
                                                            ₹ {billing.subtotal.toFixed(2)}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-6">
                                                        <div className="relative">
                                                            <label className="absolute -top-2 left-4 px-2 bg-[#F8F9FC] dark:bg-[#0F1117] text-[8px] font-black text-gray-400 uppercase tracking-widest z-10">Discount %</label>
                                                            <div className="relative">
                                                                <input 
                                                                    type="number"
                                                                    value={simDiscount}
                                                                    onChange={(e) => setSimDiscount(Math.min(parseFloat(e.target.value) || 0, 100))}
                                                                    className="w-full h-15 px-6 bg-white dark:bg-black/20 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-xs font-black outline-none focus:border-indigo-500/50" 
                                                                />
                                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 font-black text-xs">%</div>
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <label className="absolute -top-2 left-4 px-2 bg-[#F8F9FC] dark:bg-[#0F1117] text-[8px] font-black text-[#6366f1] uppercase tracking-widest z-10">Advance Paid</label>
                                                            <div className="relative">
                                                                <input 
                                                                    type="number"
                                                                    value={simAdvance}
                                                                    onChange={(e) => setSimAdvance(parseFloat(e.target.value) || 0)}
                                                                    className="w-full h-15 px-6 bg-white dark:bg-black/20 rounded-2xl border-2 border-[#6366f1]/30 text-xs font-black outline-none focus:border-indigo-500 shadow-xl shadow-indigo-500/5" 
                                                                />
                                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 font-bold text-xs opacity-0">₹</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={`relative transition-all duration-500 ${simDiscount > 0 ? 'opacity-100 translate-y-0' : 'opacity-30 -translate-y-2 pointer-events-none'}`}>
                                                        <label className="absolute -top-2 left-4 px-2 bg-[#F8F9FC] dark:bg-[#0F1117] text-[8px] font-black text-gray-400 uppercase tracking-widest z-10">Authorized Discount By</label>
                                                        <select 
                                                            value={simAuthorizedBy}
                                                            onChange={(e) => setSimAuthorizedBy(e.target.value)}
                                                            className="w-full h-15 px-6 bg-white dark:bg-black/20 rounded-2xl border-2 border-gray-100 dark:border-gray-800 text-xs font-black outline-none"
                                                        >
                                                            <option value="">Not Required</option>
                                                            <option value="admin">System Administrator</option>
                                                            <option value="clinic_head">Clinic Head</option>
                                                        </select>
                                                        <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                                    </div>

                                                    {/* EFFECTIVE BANNER - MATCHING IMAGE 1 */}
                                                    <div className="p-8 rounded-[2.5rem] bg-white dark:bg-[#1A1C24] border border-indigo-100 dark:border-indigo-900 shadow-xl space-y-4">
                                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                                            <span>Effective Amount</span>
                                                            <span className="text-gray-900 dark:text-white">₹ {billing.effectiveAmount.toFixed(2)}</span>
                                                        </div>
                                                        <div className="h-px bg-gray-50 dark:bg-gray-800" />
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <p className="text-[12px] font-black text-gray-900 dark:text-white uppercase leading-none mb-1">Pending Balance</p>
                                                                <p className="text-[10px] font-medium text-gray-400 italic">Amount to be collected later</p>
                                                            </div>
                                                            <span className="text-4xl font-black tracking-tighter text-red-600">₹{billing.pendingBalance.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* PAYMENT DISTRIBUTION SECTION */}
                                        <div className="space-y-6">
                                            <h5 className="text-[10px] font-black text-[#6366f1] uppercase tracking-[0.2em]">Payment Distribution</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                <div className="p-8 rounded-[3rem] bg-white dark:bg-black/20 border border-gray-100 dark:border-gray-800 space-y-6">
                                                    {['Cash', 'UPI - HDFC', 'Cheque', 'Internet Banking', 'Other'].map((method) => (
                                                        <div key={method} className="flex items-center justify-between group">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${simPaymentDist[method] > 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 dark:border-gray-800 group-hover:border-indigo-500'}`}>
                                                                    {simPaymentDist[method] > 0 && <Check size={14} />}
                                                                </div>
                                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors uppercase tracking-widest">{method}</span>
                                                            </div>
                                                            <div className="relative">
                                                                <input 
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                    value={simPaymentDist[method] || ''}
                                                                    onChange={(e) => handleDistChange(method, e.target.value)}
                                                                    className="w-32 h-10 px-4 bg-gray-50 dark:bg-black/30 rounded-xl border border-gray-100 dark:border-gray-800 text-xs font-black text-right outline-none focus:border-indigo-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="pt-6 mt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Split Reconciliation</span>
                                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black ${billing.reconciliationError ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            ₹{billing.totalDistributed.toFixed(2)} / ₹{simAdvance.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col justify-center space-y-4 opacity-50">
                                                    <div className="p-6 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2.5rem] text-center">
                                                        <Activity className="mx-auto mb-4 text-gray-300" size={32} />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Transaction Monitoring Ready</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CUSTOM BLUEPRINT FIELDS SECTION */}
                                        <div className="space-y-8 pt-12 border-t border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-3">
                                                <Layout size={18} className="text-gray-400" />
                                                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Additional Clinical Requirements</h5>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
                                                {(selectedTrack.fields || []).map((field) => (
                                                    <div key={field.id} className={`${field.type === 'heading' || field.colSpan === 2 ? 'col-span-1 md:col-span-2' : 'col-span-1'} space-y-4`}>
                                                        {field.type === 'heading' ? (
                                                            <div className="pt-8 pb-3 border-b-2 border-gray-100 dark:border-gray-800">
                                                                <h5 className="text-[13px] font-black text-gray-900 dark:text-white uppercase tracking-[0.3em]">{field.label}</h5>
                                                            </div>
                                                        ) : field.type === 'checkbox' ? (
                                                            <div 
                                                                onClick={() => setPreviewFormValues({...previewFormValues, [field.id]: !previewFormValues[field.id]})}
                                                                className={`flex items-center justify-between p-7 rounded-[2rem] border-2 transition-all cursor-pointer group ${previewFormValues[field.id] ? 'bg-white dark:bg-black/40 border-indigo-500/30 shadow-xl' : 'bg-white dark:bg-black/20 border-gray-100 dark:border-gray-800 hover:border-gray-200'}`}
                                                            >
                                                                <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white uppercase tracking-wider">{field.label}</span>
                                                                <div className={`w-12 h-7 rounded-full relative p-1.5 transition-all ${previewFormValues[field.id] ? 'bg-indigo-600 shadow-lg' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all transform ${previewFormValues[field.id] ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <label className="absolute -top-2 left-4 px-2 bg-[#F8F9FC] dark:bg-[#0F1117] text-[9px] font-black text-gray-400 uppercase tracking-widest z-10">
                                                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                                                </label>
                                                                <div className="relative">
                                                                    {field.type === 'select' ? (
                                                                        <select 
                                                                            value={previewFormValues[field.id] || ''}
                                                                            onChange={(e) => setPreviewFormValues({...previewFormValues, [field.id]: e.target.value})}
                                                                            className="w-full h-15 px-6 bg-white dark:bg-black/20 rounded-[1.5rem] border-2 border-gray-100 dark:border-gray-800 text-[11px] font-black outline-none transition-all appearance-none focus:border-indigo-500/50 shadow-sm"
                                                                        >
                                                                            <option value="" disabled>{field.placeholder || `Choose ${field.label}...`}</option>
                                                                            {(field.options || []).map(opt => (
                                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                            ))}
                                                                        </select>
                                                                    ) : field.type === 'date' ? (
                                                                        <input 
                                                                            type="date"
                                                                            value={previewFormValues[field.id] || ''}
                                                                            onChange={(e) => setPreviewFormValues({...previewFormValues, [field.id]: e.target.value})}
                                                                            className="w-full h-15 px-6 bg-white dark:bg-black/20 rounded-[1.5rem] border-2 border-gray-100 dark:border-gray-800 text-[11px] font-black outline-none transition-all focus:border-indigo-500/50 shadow-sm"
                                                                        />
                                                                    ) : (
                                                                        <input 
                                                                            type={field.type === 'number' ? 'number' : 'text'}
                                                                            value={previewFormValues[field.id] || ''}
                                                                            placeholder={field.placeholder || `Input ${field.label}...`}
                                                                            onChange={(e) => setPreviewFormValues({...previewFormValues, [field.id]: e.target.value})}
                                                                            className="w-full h-15 px-6 bg-white dark:bg-black/20 rounded-[1.5rem] border-2 border-gray-100 dark:border-gray-800 text-[11px] font-black outline-none transition-all focus:border-indigo-500/50 shadow-sm placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                                                        />
                                                                    )}
                                                                    {field.type === 'select' && <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* FINAL ACTION FOOTER */}
                                        <div className="pt-12 flex items-center justify-end gap-6">
                                            <button onClick={closeSimulation} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-600 transition-colors">
                                                Dismiss Simulator
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (billing.reconciliationError) {
                                                        alert('Split reconciliation mismatch!\nPlease ensure payment distribution matches the Advance Paid amount.');
                                                        return;
                                                    }
                                                    alert(`Simulation Blueprint Deployed!\n\nPatient "test" converted to ${selectedTrack.name} successfully.`);
                                                    closeSimulation();
                                                }}
                                                className={`h-16 px-14 rounded-[1.75rem] text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center gap-4 ${billing.reconciliationError ? 'bg-gray-400 opacity-50 cursor-not-allowed' : 'hover:scale-[1.03] active:scale-95'}`}
                                                style={{ 
                                                    backgroundColor: billing.reconciliationError ? undefined : selectedTrack.themeColor, 
                                                    boxShadow: billing.reconciliationError ? 'none' : `0 20px 40px -10px ${selectedTrack.themeColor}55` 
                                                }}
                                            >
                                                <UserPlus size={20} />
                                                {selectedTrack.buttonLabel || 'Deploy Conversion'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RegistrationSimulator;
