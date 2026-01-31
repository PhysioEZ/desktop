import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    LayoutGrid, Calendar, Phone, Users, 
    Banknote, TestTube2, Plus, 
    Hourglass, ChevronRight, ArrowUpRight,
    FileText, MessageSquare, LifeBuoy, PieChart, Activity,
    Search, Bell, RefreshCw, Sun, Moon
} from 'lucide-react';

/* --- DUMMY DATA --- */
const dummyData = {
    user_name: 'Saniyas Parween',
    user_role: 'Receptionist',
    registration: { 
        today_total: 0, 
        month_total: 4, 
        pending: 2, 
        consulted: 5, 
        approval_pending: 2 
    },
    inquiry: { 
        total_today: 0, 
        quick: 0, 
        test: 0 
    },
    patients: { 
        today_attendance: 4, 
        active: 12, 
        inactive: 10, 
        total_patients: 22,
        paid_amount: 53960,
        practice_health: 94 
    },
    tests: { 
        today_total: 1, 
        approval_pending: 1, // Sandclock
        pending: 0,          // Clock
        completed: 0,        // Check
        revenue_today: 0, 
        total_month: 6,
        active_count: 1
    },
    collections: { 
        today_total: 5360, 
        reg_amount: 800, 
        treatment_amount: 53968, 
        test_amount: 1800, 
        today_dues: 0 
    },
    dues: {
        total: 0,
        patient_dues: 0,
        test_dues: 0
    },
    activity: {
        week_total: 68160.01
    },
    schedule: [
        { id: 1, patient_name: 'Sumit Sharma', time: '09:00 AM', status: 'Pending', type: 'Consultation', subtext: 'WAITING APPROVAL', avatar: 'S', color: 'bg-amber-600' },
        { id: 2, patient_name: 'Sagar', time: '09:30 AM', status: 'Consulted', type: 'Follow-up', subtext: 'APPROVED', avatar: 'S', color: 'bg-green-600' },
        { id: 3, patient_name: 'Ravi', time: '10:00 AM', status: 'Pending', type: 'Therapy', subtext: 'WAITING APPROVAL', avatar: 'R', color: 'bg-amber-600' },
        { id: 4, patient_name: 'Poonam Kumari', time: '02:30 PM', status: 'Consulted', type: 'Therapy', subtext: 'APPROVED', avatar: 'P', color: 'bg-green-600' },
    ],
    pending_approvals_count: 5,
    notification_count: 4
};

const fmt = (num: number) => `₹${num.toLocaleString('en-IN')}`;

export default function DashboardNew() {
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(true);

    const navLinks = [
        { icon: LayoutGrid, label: 'Dashboard', desc: 'Overview & Stats', path: '/reception/dashboard', active: true },
        { icon: Calendar, label: 'Schedule', desc: 'Appmts & Queue', path: '/reception/schedule' },
        { icon: Phone, label: 'Inquiry', desc: 'New Leads', path: '/reception/inquiry' },
        { icon: Users, label: 'Registration', desc: 'New Patient', path: '/reception/registration' }, 
        { icon: Users, label: 'Patients', desc: 'All Records', path: '/reception/patients' },
        { icon: Banknote, label: 'Billing', desc: 'Invoices & Dues', path: '/reception/billing' },
        { icon: Users, label: 'Attendance', desc: 'Daily Track', path: '/reception/attendance' },
        { icon: TestTube2, label: 'Tests', desc: 'Lab Orders', path: '/reception/tests' },
        { icon: MessageSquare, label: 'Feedback', desc: 'Patient Reviews', path: '/reception/feedback' },
        { icon: FileText, label: 'Reports', desc: 'Analytics', path: '/reception/reports' },
        { icon: PieChart, label: 'Expenses', desc: 'Clinic Exp', path: '/reception/expenses' },
        { icon: LifeBuoy, label: 'Support', desc: 'Help & Docs', path: '/reception/support' },
    ];

    const quickActions = [
        { label: 'Registration', icon: Plus, path: '/reception/registration', color: 'bg-[#4ADE80] text-black hover:bg-[#22c55e]' },
        { label: 'Book Test', icon: TestTube2, path: '/reception/tests', color: 'bg-[#3B82F6] text-white hover:bg-[#2563EB]' },
        { label: 'Inquiry', icon: Phone, path: '/reception/inquiry', color: 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]' },
        { label: 'Test Inquiry', icon: TestTube2, path: '/reception/inquiry', color: 'bg-[#F97316] text-white hover:bg-[#EA580C]' },
    ];

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? 'bg-[#050505] text-[#E2E8F0]' : 'bg-[#F2F4F7] text-[#1E293B]'}`}>
            
            {/* === SIDEBAR (COLLAPSED) === */}
            <div className={`w-20 hidden md:flex flex-col items-center py-8 border-r z-[60] shrink-0 gap-6 transition-colors duration-300 ${isDark ? 'bg-[#0A0A0A] border-[#151515]' : 'bg-white border-gray-200 shadow-xl'}`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ADE80] to-[#22c55e] flex items-center justify-center text-black shadow-[0_0_20px_rgba(74,222,128,0.3)]">
                    <span className="font-extrabold text-sm">PE</span>
                </div>

                <div className="flex-1 w-full flex flex-col items-center gap-4 pt-4">
                    {navLinks.map((link) => (
                        <div key={link.label} className="group relative flex items-center justify-center w-full px-4">
                            <button 
                                onClick={() => navigate(link.path)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                    link.active 
                                        ? (isDark ? 'bg-[#1C1C1C] text-[#4ADE80] ring-1 ring-[#4ADE80]/30' : 'bg-gray-100 text-[#16a34a] ring-1 ring-[#16a34a]/30') 
                                        : (isDark ? 'text-gray-500 hover:text-white hover:bg-[#1C1C1C]' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50')
                                }`}
                            >
                                <link.icon size={18} strokeWidth={2} />
                            </button>
                            
                            {/* Hover Tooltip */}
                            <div className={`absolute left-14 top-1/2 -translate-y-1/2 rounded-lg p-3 w-32 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity ml-2 z-[60] border ${isDark ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200'}`}>
                                <div className="text-xs font-bold text-white mb-0.5">{link.label}</div>
                                <div className={`text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{link.desc}</div>
                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 border-l border-b rotate-45 ${isDark ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200'}`}></div>
                            </div>

                            {link.active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#4ADE80] rounded-r-full" />}
                        </div>
                    ))}
                </div>

                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isDark ? 'bg-[#1C1C1C] text-gray-500 hover:text-white' : 'bg-gray-100 text-gray-400 hover:text-black'}`}>
                   <Users size={18} />
                </div>
            </div>
            <div className={`hidden xl:flex w-[400px] flex-col justify-between p-10 border-r relative shrink-0 transition-colors duration-300 ${isDark ? 'border-[#151515]' : 'bg-white border-gray-200'}`}>
                {/* Brand & Greeting */}
                <div className="space-y-10 z-10">   
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded flex items-center justify-center text-[#4ADE80] ${isDark ? 'bg-[#1C1C1C]' : 'bg-green-50'}`}><LayoutGrid size={18} /></div>
                        <span className="font-bold tracking-widest text-xs uppercase text-gray-500">PhysioEZ Core</span>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-6xl font-medium tracking-tighter leading-[1.1]">
                            Hello,<br/>
                            <span className={isDark ? "text-[#4ADE80]" : "text-[#16a34a]"}>Saniyas<br/>Parween</span>
                        </h1>
                        <p className="text-gray-500 text-lg">Here's your daily branch overview.</p>
                    </div>
                </div>

                {/* --- REGISTRATION CARD & KPI --- */}
                <div className="space-y-4 z-10 w-full">
                    {/* Big Registration Card */}
                    <div className={`p-6 rounded-[24px] border transition-colors ${isDark ? 'bg-[#0F0F10] border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'}`}>
                         <div className="flex justify-between items-start mb-4">
                             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Registration</span>
                             <div className={`p-1.5 rounded-lg text-[#4ADE80] ${isDark ? 'bg-white/5' : 'bg-green-100 text-[#16a34a]'}`}><Users size={14} /></div>
                         </div>
                         <div className={`text-5xl font-medium tracking-tight mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{dummyData.registration.today_total}<span className="text-base ml-1 text-gray-500 font-normal">Today</span></div>
                         <div className="flex flex-wrap gap-2">
                             <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/20">Done: {dummyData.registration.consulted}</span>
                             <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">Wait: {dummyData.registration.pending}</span>
                         </div>
                    </div>

                    {/* Small KPI Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`p-4 rounded-[20px] border flex flex-col justify-between h-24 transition-colors ${isDark ? 'bg-[#0F0F10] border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] uppercase font-bold text-gray-500">Inquiries</span>
                                <Phone size={12} className="text-purple-500"/>
                            </div>
                            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dummyData.inquiry.total_today}</div>
                        </div>

                        <div className={`p-4 rounded-[20px] border flex flex-col justify-between h-24 transition-colors ${isDark ? 'bg-[#0F0F10] border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] uppercase font-bold text-gray-500">Tests</span>
                                <TestTube2 size={12} className="text-blue-500"/>
                            </div>
                            <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dummyData.tests.today_total}</div>
                        </div>

                         <div className={`p-4 rounded-[20px] border col-span-2 flex items-center justify-between transition-colors ${isDark ? 'bg-[#0F0F10] border-[#1A1A1A]' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500"><Banknote size={16} /></div>
                                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Collections</span>
                            </div>
                            <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>₹{dummyData.collections.today_total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Decoration */}
                <div className="absolute top-1/2 left-0 w-full h-full bg-gradient-to-t from-green-900/10 to-transparent pointer-events-none" />
            </div>

            {/* === RIGHT PANEL (OPERATIONAL GRID) === */}
            <div className="flex-1 flex flex-col h-full relative">
                
                {/* Header / Nav */}
                {/* Header / Nav */}
                {/* Header / Nav */}
                <header className={`sticky top-0 z-40 backdrop-blur border-b transition-colors duration-300 ${isDark ? 'bg-[#050505]/95 border-[#151515]' : 'bg-[#F2F4F7]/95 border-gray-200'}`}>
                    {/* Row 1: Logo, Search, Actions */}
                    <div className={`px-8 py-4 flex justify-between items-center border-b ${isDark ? 'border-[#151515]' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                            <div className={`w-1 h-6 rounded-full ${isDark ? 'bg-[#4ADE80]' : 'bg-[#16a34a]'}`} />
                            <h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Insight Stack</h2>
                        </div>
                        
                        {/* Search Bar */}
                        <div className={`hidden md:flex items-center px-4 py-2 rounded-full border w-96 transition-colors ${isDark ? 'border-[#1A1A1A] bg-[#0F0F10]' : 'border-gray-300 bg-white'}`}>
                            <Search size={14} className="text-gray-500 mr-2" />
                            <input type="text" placeholder="Search patients..." className={`bg-transparent border-none outline-none text-xs w-full placeholder:text-gray-600 font-bold ${isDark ? 'text-white' : 'text-gray-900'}`} />
                        </div>

                        {/* 5 Icons */}
                        <div className="flex items-center gap-2">
                            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-500/10 text-gray-400"><RefreshCw size={16} /></button>
                            <button onClick={() => setIsDark(!isDark)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-500/10 text-gray-400 transition-colors">
                                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                            </button>
                            <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-500/10 text-gray-400 relative">
                                <Bell size={16} />
                                {dummyData.notification_count > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                            </button>
                            <button className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-500/10 relative ${isDark ? 'text-[#4ADE80]' : 'text-[#16a34a]'}`}>
                                <Hourglass size={16} />
                                {dummyData.pending_approvals_count > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">{dummyData.pending_approvals_count}</span>}
                            </button>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10 ml-2">
                                {dummyData.user_name.charAt(0)}
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Nav Pills REMOVED */}
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="space-y-6 max-w-[1400px] mx-auto">
                        
                        {/* 1. HERO - QUICK ACTIONS */}
                        {/* 1. HERO - QUICK ACTIONS */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {quickActions.map((action) => (
                                <button key={action.label} className={`h-24 rounded-[24px] flex flex-col items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 ${action.color} border border-white/5 shadow-lg`}>
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                        <action.icon size={16} className="text-current" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* 2. MIDDLE ROW: COLLECTIONS & LABS & PRACTICE HEALTH (REDESIGNED) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* COLLECTIONS CARD */}
                            <motion.div whileHover={{ y: -4 }} className={`p-6 rounded-[32px] border relative overflow-hidden group flex flex-col justify-between transition-colors ${isDark ? 'bg-[#0F0F10] border-[#1A1A1A]' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                         <div className="flex items-center gap-3">
                                             <div className={`p-2 rounded-xl ${isDark ? 'bg-green-500/10 text-green-500' : 'bg-green-50 text-green-600'}`}><Banknote size={20}/></div>
                                             <span className={`font-bold text-xs uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Collections</span>
                                         </div>
                                         <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${isDark ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-green-50 text-green-600 border border-green-200'}`}>TODAY</div>
                                    </div>
                                    
                                    <div className="mb-6 relative z-10">
                                        <div className={`text-5xl font-medium tracking-tighter mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(dummyData.collections.today_total)}</div>
                                        <div className="text-xs text-gray-400 font-bold">Total Revenue</div>
                                    </div>

                                    {/* Visual Bar */}
                                    <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-200/10 mb-6 w-full">
                                         <div className="bg-blue-500 w-[15%]"/>
                                         <div className="bg-green-500 w-[70%]"/>
                                         <div className="bg-purple-500 w-[15%]"/>
                                    </div>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className={isDark ? "text-gray-500" : "text-gray-400"}>Registration</span>
                                        <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{fmt(dummyData.collections.reg_amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className={isDark ? "text-gray-500" : "text-gray-400"}>Treatment</span>
                                        <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{fmt(dummyData.collections.treatment_amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className={isDark ? "text-gray-500" : "text-gray-400"}>Lab Tests</span>
                                        <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{fmt(dummyData.collections.test_amount)}</span>
                                    </div>
                                    <div className="pt-3 border-t border-dashed border-gray-700/50 flex justify-between items-center text-xs">
                                        <span className="text-red-500 font-bold flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/> Dues Pending</span>
                                        <span className="font-bold text-red-500">{fmt(dummyData.collections.today_dues)}</span>
                                    </div>
                                </div>
                                {/* Subtle Glow */}
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl pointer-events-none transition-opacity ${isDark ? 'opacity-100' : 'opacity-0'}`}/>
                            </motion.div>

                            {/* LAB OPERATIONS CARD */}
                            <motion.div whileHover={{ y: -4 }} className={`p-6 rounded-[32px] border relative overflow-hidden group flex flex-col justify-between transition-colors ${isDark ? 'bg-[#0F0F10] border-[#1A1A1A]' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isDark ? 'bg-orange-500/10 text-orange-500' : 'bg-orange-50 text-orange-600'}`}><TestTube2 size={20}/></div>
                                        <span className={`font-bold text-xs uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Lab Ops</span>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-3xl font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{dummyData.tests.active_count}</div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase mt-1">Active</div>
                                    </div>
                                </div>

                                {/* Pipeline */}
                                <div className="space-y-3 my-2">
                                    <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#151515] border-[#222]' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500"/>
                                            <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Approval</span>
                                        </div>
                                        <span className="text-sm font-bold text-amber-500">{dummyData.tests.approval_pending}</span>
                                    </div>
                                    <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#151515] border-[#222]' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"/>
                                            <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Processing</span>
                                        </div>
                                        <span className="text-sm font-bold text-blue-500">{dummyData.tests.pending}</span>
                                    </div>
                                    <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#151515] border-[#222]' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"/>
                                            <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Completed</span>
                                        </div>
                                        <span className="text-sm font-bold text-green-500">{dummyData.tests.completed}</span>
                                    </div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-700/50 flex justify-between items-end">
                                     <div>
                                         <div className="text-[10px] font-bold text-gray-500 uppercase">Revenue</div>
                                         <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(dummyData.tests.revenue_today)}</div>
                                     </div>
                                     <div className="text-right">
                                         <div className="text-[10px] font-bold text-gray-500 uppercase">Month</div>
                                         <div className="text-sm font-bold text-[#4ADE80]">{dummyData.tests.total_month}</div>
                                     </div>
                                </div>
                            </motion.div>

                            {/* PATIENT FLOW CARD */}
                             <motion.div whileHover={{ y: -4 }} className={`p-6 rounded-[32px] border relative overflow-hidden group flex flex-col justify-between transition-colors ${isDark ? 'bg-[#0F0F10] border-[#1A1A1A]' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-500/10 text-blue-500' : 'bg-blue-50 text-blue-600'}`}><Users size={20}/></div>
                                        <span className={`font-bold text-xs uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Patient Flow</span>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-bold ${isDark ? 'bg-blue-500/10 text-blue-500' : 'bg-blue-50 text-blue-600'}`}>TODAY</div>
                                </div>
                                
                                <div className="text-center py-6 relative">
                                    {/* Circular Decor */}
                                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-dashed opacity-20 ${isDark ? 'border-blue-500' : 'border-blue-300'}`}/>
                                    
                                    <div className={`text-6xl font-bold tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>{dummyData.patients.today_attendance}</div>
                                    <div className="text-xs text-blue-500 font-bold uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/> Attended
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                     <div className={`p-3 rounded-2xl border text-center ${isDark ? 'bg-[#151515] border-[#222]' : 'bg-gray-50 border-gray-100'}`}>
                                         <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dummyData.patients.active}</div>
                                         <div className="text-[9px] uppercase font-bold text-gray-500">Active</div>
                                     </div>
                                     <div className={`p-3 rounded-2xl border text-center ${isDark ? 'bg-[#151515] border-[#222]' : 'bg-gray-50 border-gray-100'}`}>
                                         <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dummyData.patients.inactive}</div>
                                         <div className="text-[9px] uppercase font-bold text-gray-500">Inactive</div>
                                     </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-dashed border-gray-700/50 flex justify-between items-center text-[10px] font-bold text-gray-500">
                                    <span>Total: <span className={isDark ? "text-white" : "text-gray-900"}>{dummyData.patients.total_patients}</span></span>
                                    <span>Paid: <span className={isDark ? "text-white" : "text-gray-900"}>{fmt(dummyData.patients.paid_amount)}</span></span>
                                </div>
                            </motion.div>

                        </div>

                        {/* 3. LOWER SECTION */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            
                            {/* SCHEDULE LIST */}
                            <div className={`xl:col-span-1 rounded-[40px] border flex flex-col h-[400px] ${isDark ? 'bg-[#0F0F10] border-[#1A1A1A]' : 'bg-white border-gray-200'}`}>
                                <div className="p-8 border-b border-white/5 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg text-white uppercase tracking-tight">Schedule</h3>
                                        <span className="text-xs text-gray-500 font-bold">Today, Jan 31</span>
                                    </div>
                                    <ArrowUpRight size={20} className="text-gray-600"/>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                    {dummyData.schedule.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#222] flex items-center justify-center font-bold text-xs text-gray-400">
                                                {item.avatar}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white">{item.patient_name}</span>
                                                    <span className="text-[10px] font-bold text-gray-600">{item.time}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[9px] font-bold text-[#4ADE80] uppercase`}>{item.status}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-600"/>
                                                    <span className="text-[9px] font-bold text-gray-500 uppercase">{item.subtext}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6">
                                    <button onClick={() => navigate('/reception/schedule')} className="w-full py-4 rounded-2xl bg-[#151515] border border-[#222] hover:bg-[#222] text-xs font-bold text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2 group">
                                        View Full Schedule <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform"/>
                                    </button>
                                </div>
                            </div>

                            {/* RECENT ACTIVITY */}
                            <div className={`xl:col-span-1 rounded-[40px] border p-8 relative overflow-hidden flex flex-col justify-between ${isDark ? 'bg-[#0F0F10] border-[#1A1A1A]' : 'bg-white border-gray-200'}`}>
                                <div className="flex justify-between items-start z-10">
                                    <div className="flex items-center gap-2">
                                        <Activity size={18} className="text-white"/>
                                        <h3 className="font-bold text-sm text-white">Recent Activity</h3>
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#333] text-gray-400 text-[10px] font-bold uppercase">Live</span>
                                </div>

                                {/* Graph */}
                                <div className="flex items-end justify-between h-32 gap-4 mt-6 z-10 px-4">
                                        <div className="flex flex-col items-center gap-2 flex-1 group">
                                            <div className="w-full bg-[#333] rounded-t-sm h-full relative overflow-hidden flex items-end">
                                                <div className="w-full bg-[#1A1A1A]" style={{ height: '30%' }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600">THU</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2 flex-1 group">
                                            <div className="w-full bg-[#333] rounded-t-sm h-full relative overflow-hidden flex items-end">
                                                <div className="w-full bg-[#4ADE80]" style={{ height: '80%' }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-white">FRI</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2 flex-1 group">
                                            <div className="w-full bg-[#333] rounded-t-sm h-full relative overflow-hidden flex items-end">
                                                <div className="w-full bg-[#1A1A1A]" style={{ height: '40%' }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-600">SAT</span>
                                        </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-[#1A1A1A] flex justify-between items-center">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Total This Week</span>
                                    <span className="text-xl font-bold text-white">₹68,160.01</span>
                                </div>
                            </div>
                        
                            {/* DUES ALERT */}
                             <div className={`xl:col-span-1 rounded-[40px] p-8 flex flex-col justify-between border ${isDark ? 'bg-[#1a0505] text-red-100 border-red-900/30' : 'bg-red-50 border-red-200'}`}>
                                 <div className="flex items-center gap-2 text-red-600 mb-4">
                                     <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"/>
                                     <h3 className="font-bold text-sm uppercase tracking-widest">Dues Alert</h3>
                                 </div>
                                 
                                 <div className="text-center my-4">
                                     <div className="text-6xl font-bold text-red-600 tracking-tighter">{fmt(dummyData.dues.total)}</div>
                                     <div className="text-xs text-gray-500 font-bold mt-2">Today's Pending Dues</div>
                                 </div>

                                 <div className="space-y-2 mb-6">
                                     <div className="flex justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                                         <span className="text-xs font-bold text-gray-600">Patient Dues</span>
                                         <span className="text-xs font-bold text-red-600">{fmt(dummyData.dues.patient_dues)}</span>
                                     </div>
                                     <div className="flex justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                                         <span className="text-xs font-bold text-gray-600">Test Dues</span>
                                         <span className="text-xs font-bold text-red-600">{fmt(dummyData.dues.test_dues)}</span>
                                     </div>
                                 </div>

                                 <button className="w-full py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2">
                                     View All Pending Dues <ArrowUpRight size={14}/>
                                 </button>
                             </div>

                        </div>

                    </div>
                </div>

                {/* FAB - FLOATING ACTION BUTTON */}
                <button 
                    onClick={() => navigate('/reception/registration')}
                    className="absolute bottom-10 right-10 w-14 h-14 bg-[#4ADE80] rounded-[20px] shadow-[0_0_30px_rgba(74,222,128,0.4)] flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all z-50"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>

            </div>
        </div>
    );
}
