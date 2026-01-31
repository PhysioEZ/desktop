import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Users, ClipboardList, TestTube2, Wallet, Calendar,
    AlertCircle, Search, Bell, LogOut,
    Plus, PhoneCall,
    Menu, FlaskConical, Beaker, Hourglass, Activity,
    ChevronDown, RefreshCw, MessageCircle, ArrowUpRight,
    LayoutGrid, Phone, Banknote, FileText, MessageSquare, LifeBuoy, PieChart, Sun, Moon
} from 'lucide-react';

/* --- DUMMY DATA MATCHING EXACT SPECS --- */
const dummyData = {
    user_name: 'Saniyas Parween',
    branch_overview: 'Here\'s your daily branch overview',
    registration: { today_total: 0, month_total: 3, pending: 2, consulted: 4, approval_pending: 2 },
    inquiry: { total_today: 0, quick: 0, test: 0 },
    patients: { today_attendance: 0, total_ever: 20, active: 0, inactive: 20, paid_today: 0, practice_health: 94, total_patients: 22, paid_amount: 53960 },
    tests: { today_total: 0, pending: 0, completed: 0, approval_pending: 0, revenue_today: 0, total_month: 5 },
    collections: { today_total: 0, reg_amount: 0, treatment_amount: 0, test_amount: 0, today_dues: 0, patient_dues: 0, test_dues: 0 },
    schedule: [
        { id: 1, patient_name: 'Sumit', appointment_time: '09:00 AM', status: 'Pending', type: 'Consultation', approval_status: 'pending' },
        { id: 2, patient_name: 'Ravi', appointment_time: '09:30 AM', status: 'Pending', type: 'Consultation', approval_status: 'pending' },
        { id: 3, patient_name: 'Sandeep suman', appointment_time: '10:00 AM', status: 'Consulted', type: 'Follow-up', approval_status: 'approved' },
        { id: 4, patient_name: 'Ponam kumari', appointment_time: '14:30 PM', status: 'Consulted', type: 'Therapy', approval_status: 'approved' },
    ],
    weekly: [
        { day: 'Mon', total: 0 }, { day: 'Tue', total: 0 }, { day: 'Wed', total: 0 },
        { day: 'Thu', total: 0 }, { day: 'Fri', total: 2750 }, { day: 'Sat', total: 0 }, { day: 'Sun', total: 0 }
    ],
    pending_approvals_count: 3
};

const fmt = (num: number) => `₹${num.toLocaleString('en-IN')}`;

export default function DashboardNew() {
    const navigate = useNavigate();
    const [isDark, setIsDark] = useState(false);

    // Navigation Links from DashboardNew2 (Image 2 Sidebar)
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

    const actionButtons = [
        { label: 'Registration', icon: Plus, bg: 'bg-[#0C200E]', text: 'text-white' },
        { label: 'Book Test', icon: FlaskConical, bg: 'bg-[#0C200E]', text: 'text-white' },
        { label: 'Inquiry', icon: PhoneCall, bg: 'bg-[#0C200E]', text: 'text-white' },
        { label: 'Test Inquiry', icon: Beaker, bg: 'bg-[#0C200E]', text: 'text-white' },
    ];

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDark ? 'bg-[#050505] text-[#E2E8F0]' : 'bg-[#FAFAFA] text-[#1A1A1A]'}`}>
            
            {/* === SIDEBAR (COLLAPSED) FROM IMAGE 2 === */}
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

            {/* === LEFT PANEL FROM IMAGE 2 === */}
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

            {/* === MAIN CONTENT (RIGHT PANEL - ORIGINAL IMAGE 1 CONTENT) === */}
            <main className="flex-1 h-screen overflow-y-auto">
                <div className="p-6 lg:p-10 max-w-[1920px] mx-auto space-y-10">

                    {/* HEADER SECTION (Search, Refresh, Notif) - Moved from Original, Removing Greeting */}
                    <div className="flex justify-between items-center bg-transparent backdrop-blur-sm sticky top-0 z-40 py-2">
                        <h2 className="text-xl font-bold opacity-0">Dashboard</h2> {/* spacer */}

                        <div className="flex items-center gap-3">
                             {/* Global Search */}
                             <div className={`flex items-center px-4 py-3 rounded-2xl border w-full xl:w-80 transition-shadow focus-within:ring-2 ring-[#0C200E]/20 ${isDark ? 'bg-[#121412] border-[#2A2D2A]' : 'bg-white border-gray-200'}`}>
                                 <Search size={18} className="opacity-40" />
                                 <input className="bg-transparent border-none outline-none px-3 text-sm w-full" placeholder="Search patients, tests..." />
                                 <div className="text-[10px] font-bold opacity-40 border px-1.5 rounded">/</div>
                             </div>

                             {/* Utilities */}
                             <button className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-colors hover:bg-gray-50 dark:hover:bg-[#1A1C1A] ${isDark ? 'border-[#2A2D2A] bg-[#121412]' : 'border-gray-200 bg-white'}`}>
                                 <RefreshCw size={20} strokeWidth={1.5} />
                             </button>
                             
                             <button className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-colors hover:bg-gray-50 dark:hover:bg-[#1A1C1A] relative ${isDark ? 'border-[#2A2D2A] bg-[#121412]' : 'border-gray-200 bg-white'}`}>
                                 <Bell size={20} strokeWidth={1.5} />
                                 <span className="absolute top-3 right-3 w-2 h-2 bg-[#B3261E] rounded-full ring-2 ring-white dark:ring-[#121412]"></span>
                             </button>
                             
                             <button className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-colors hover:bg-gray-50 dark:hover:bg-[#1A1C1A] relative animate-pulse ${isDark ? 'border-[#2A2D2A] bg-[#121412] text-[#FFB4AB]' : 'border-gray-200 bg-white text-[#B3261E]'}`}>
                                 <Hourglass size={20} strokeWidth={1.5} />
                                 <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#B3261E] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#121412]">{dummyData.pending_approvals_count}</span>
                             </button>
                        </div>
                    </div>

                    {/* NEW BUTTON UI (Black Pills) */}
                    <div className="flex flex-wrap gap-4">
                        {actionButtons.map(btn => (
                            <button key={btn.label} className={`flex items-center gap-3 pl-4 pr-6 py-3.5 rounded-full shadow-lg shadow-black/5 hover:shadow-black/10 hover:-translate-y-0.5 active:translate-y-0 transition-all ${btn.bg} ${btn.text}`}>
                                <btn.icon size={18} />
                                <span className="font-bold text-sm tracking-wide">{btn.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* FLAT STATS ROW */}
                    <div className={`rounded-3xl border ${isDark ? 'bg-[#121412]/50 border-[#2A2D2A]' : 'bg-white border-gray-200'} overflow-hidden shadow-sm`}>
                        <div className={`grid grid-cols-1 xl:grid-cols-4 divide-y xl:divide-y-0 xl:divide-x ${isDark ? 'divide-[#2A2D2A]' : 'divide-gray-100'}`}>
                            
                            {/* 1. REGISTRATION */}
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-3 opacity-60">
                                    <ClipboardList size={20} strokeWidth={1.5}/>
                                    <span className="text-xs font-bold uppercase tracking-widest">Registration</span>
                                </div>
                                
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-serif leading-none text-[#0C6E1C] dark:text-[#CCEBC4]">{dummyData.registration.today_total}</span>
                                        <span className="text-sm font-bold opacity-60">Today</span>
                                    </div>
                                    <div className="text-xs font-bold opacity-40 mt-1">Month Total: {dummyData.registration.month_total}</div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="opacity-60 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"/> Pending</span>
                                        <span className="font-bold">{dummyData.registration.pending}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="opacity-60 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"/> Consulted</span>
                                        <span className="font-bold">{dummyData.registration.consulted}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="opacity-60 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/> Appeals</span>
                                        <span className="font-bold">{dummyData.registration.approval_pending}</span>
                                    </div>
                                </div>

                                <div className={`pt-4 border-t border-dashed ${isDark ? 'border-[#2A2D2A]' : 'border-gray-200'}`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-xs font-bold opacity-60">
                                            <PhoneCall size={14}/> Inquiries Today
                                        </div>
                                        <span className="font-bold">{dummyData.inquiry.total_today}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. PATIENTS */}
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-3 opacity-60">
                                    <Users size={20} strokeWidth={1.5}/>
                                    <span className="text-xs font-bold uppercase tracking-widest">Census</span>
                                </div>

                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-serif leading-none">{dummyData.patients.today_attendance}</span>
                                        <span className="text-sm font-bold opacity-60">Attended</span>
                                    </div>
                                    <div className="text-xs font-bold opacity-40 mt-1">Total Patients: {dummyData.patients.total_ever}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#1A1C1A]' : 'bg-gray-50'}`}>
                                        <div className="text-2xl font-bold">{dummyData.patients.active}</div>
                                        <div className="text-[10px] uppercase font-bold opacity-50">Active</div>
                                    </div>
                                    <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#1A1C1A]' : 'bg-gray-50'}`}>
                                        <div className="text-2xl font-bold opacity-50">{dummyData.patients.inactive}</div>
                                        <div className="text-[10px] uppercase font-bold opacity-30">Inactive</div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. LAB OPERATIONS */}
                            <div className="p-8 space-y-6">
                                <div className="flex items-center gap-3 opacity-60">
                                    <TestTube2 size={20} strokeWidth={1.5}/>
                                    <span className="text-xs font-bold uppercase tracking-widest">Lab Ops</span>
                                </div>

                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-serif leading-none">{dummyData.tests.today_total}</span>
                                        <span className="text-sm font-bold opacity-60">Tests</span>
                                    </div>
                                    <div className="text-xs font-bold opacity-40 mt-1">Revenue: {fmt(dummyData.tests.revenue_today)}</div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className={`flex text-center divide-x ${isDark ? 'divide-[#2A2D2A]' : 'divide-gray-100'}`}>
                                        <div className="flex-1 px-2">
                                            <div className="text-lg font-bold text-yellow-600">{dummyData.tests.approval_pending}</div>
                                            <div className="text-[9px] uppercase font-bold opacity-40">Wait</div>
                                        </div>
                                        <div className="flex-1 px-2">
                                            <div className="text-lg font-bold text-blue-500">{dummyData.tests.pending}</div>
                                            <div className="text-[9px] uppercase font-bold opacity-40">Process</div>
                                        </div>
                                        <div className="flex-1 px-2">
                                            <div className="text-lg font-bold text-green-500">{dummyData.tests.completed}</div>
                                            <div className="text-[9px] uppercase font-bold opacity-40">Done</div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`pt-4 border-t border-dashed ${isDark ? 'border-[#2A2D2A]' : 'border-gray-200'}`}>
                                     <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold opacity-60">Month Total</span>
                                        <span className="font-bold text-[#0C200E] dark:text-[#CCEBC4]">{dummyData.tests.total_month}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 4. COLLECTIONS */}
                            <div className="p-8 space-y-6">
                                 <div className="flex items-center gap-3 opacity-60">
                                    <Wallet size={20} strokeWidth={1.5}/>
                                    <span className="text-xs font-bold uppercase tracking-widest">Collections</span>
                                </div>

                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-6xl font-serif leading-none text-[#0C200E] dark:text-[#CCEBC4]">{fmt(dummyData.collections.today_total)}</span>
                                    </div>
                                    <div className="text-xs font-bold opacity-40 mt-1">Today's Revenue</div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="opacity-60">Registration</span>
                                        <span className="font-mono font-bold">{fmt(dummyData.collections.reg_amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="opacity-60">Treatment</span>
                                        <span className="font-mono font-bold">{fmt(dummyData.collections.treatment_amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="opacity-60">Lab Tests</span>
                                        <span className="font-mono font-bold">{fmt(dummyData.collections.test_amount)}</span>
                                    </div>
                                </div>

                                <div className={`pt-4 border-t border-dashed ${isDark ? 'border-[#2A2D2A]' : 'border-gray-200'}`}>
                                    <div className="flex justify-between items-center text-red-500">
                                        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                            <AlertCircle size={14}/> Dues
                                        </span>
                                        <span className="font-bold">{fmt(dummyData.collections.today_dues)}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* BOTTOM ROW: GRAPHS & SCHEDULE */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-20">
                         {/* RECENT ACTIVITY */}
                        <div className={`col-span-1 xl:col-span-8 p-8 rounded-[32px] ${isDark ? 'bg-[#121412] border border-[#2A2D2A]' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <Activity size={20}/>
                                    <h3 className="font-bold text-lg">Recent Activity</h3>
                                </div>
                                <span className="bg-[#CCEBC4] text-[#0C200E] text-[10px] font-bold uppercase px-2 py-1 rounded">Live</span>
                            </div>

                            <div className="flex items-end justify-between h-[180px] gap-4">
                                {dummyData.weekly.map((d, i) => (
                                    <div key={i} className="flex-1 flex flex-col gap-3 h-full justify-end group">
                                         <div className={`w-full rounded-xl relative overflow-hidden h-full flex items-end ${isDark ? 'bg-[#1A1C1A]' : 'bg-gray-50'}`}>
                                             <motion.div 
                                                initial={{ height: 0 }}
                                                animate={{ height: d.total > 0 ? '60%' : '5px' }}
                                                className={`w-full ${d.total > 0 ? 'bg-[#0C200E] dark:bg-[#CCEBC4]' : 'bg-transparent'}`}
                                             />
                                             {d.total > 0 && <div className="absolute w-full text-center bottom-2 text-[10px] font-bold text-[#fcfcfc] dark:text-[#0C200E]">{fmt(d.total)}</div>}
                                         </div>
                                         <div className="text-center text-[10px] font-bold uppercase opacity-30">{d.day}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                         {/* TODAY'S SCHEDULE */}
                        <div className={`col-span-1 xl:col-span-4 p-8 rounded-[32px] ${isDark ? 'bg-[#121412] border border-[#2A2D2A]' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg">Schedule</h3>
                                <button onClick={() => navigate('/reception/schedule')} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <ArrowUpRight size={16}/>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {dummyData.schedule.map((apt) => (
                                    <div key={apt.id} className={`p-4 rounded-2xl border transition-colors group flex items-start gap-4 ${isDark ? 'border-[#2A2D2A] hover:border-[#CCEBC4]/50' : 'border-gray-100 hover:border-gray-300'}`}>
                                         <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${['Sumit', 'Ravi'].includes(apt.patient_name) ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'}`}>
                                             {apt.patient_name.charAt(0)}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                             <div className="flex justify-between items-start">
                                                 <div className="font-bold truncate">{apt.patient_name}</div>
                                                 <div className="text-xs font-bold opacity-40 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded">{apt.appointment_time}</div>
                                             </div>
                                             <div className="text-xs opacity-50 mt-0.5">{apt.type}</div>
                                             <div className="flex items-center gap-2 mt-2">
                                                 <span className={`w-1.5 h-1.5 rounded-full ${apt.status === 'Pending' ? 'bg-orange-500' : 'bg-green-500'}`}/>
                                                 <span className="text-[10px] uppercase font-bold opacity-60">{apt.status}</span>
                                             </div>
                                         </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
           
           {/* FAB ACTIONS */}
            <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
                 <button className="w-14 h-14 bg-white dark:bg-[#1A1C1A] text-gray-600 dark:text-gray-300 rounded-2xl shadow-xl flex items-center justify-center border border-gray-100 dark:border-[#2A2D2A] hover:bg-gray-50 transition-colors">
                     <MessageCircle size={24} />
                 </button>
                 <button className="w-16 h-16 bg-[#0C200E] text-[#CCEBC4] dark:bg-[#CCEBC4] dark:text-[#0C200E] rounded-[24px] shadow-2xl shadow-green-900/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                     <Plus size={32} />
                 </button>
            </div>

        </div>
    );
}