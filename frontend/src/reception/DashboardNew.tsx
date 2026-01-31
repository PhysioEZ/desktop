import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Users, ClipboardList, TestTube2, Wallet, Calendar,
    AlertCircle, Search, Bell, LogOut,
    Plus, PhoneCall,
    Menu, FlaskConical, Beaker, Hourglass, Activity,
    ChevronDown, RefreshCw, MessageCircle
} from 'lucide-react';

/* --- DUMMY DATA MATCHING EXACT SPECS --- */
const dummyData = {
    user_name: 'Saniyas Parween',
    branch_overview: 'Here\'s your daily branch overview',
    registration: { today_total: 0, month_total: 3, pending: 2, consulted: 4, approval_pending: 2 },
    inquiry: { total_today: 0, quick: 0, test: 0 },
    patients: { today_attendance: 0, total_ever: 20, active: 0, inactive: 20, paid_today: 0 },
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
    const [isDark] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const navLinks = [
        { icon: Calendar, label: 'Schedule', path: '/reception/schedule' },
        { icon: PhoneCall, label: 'Inquiries', path: '/reception/inquiry' },
        { icon: ClipboardList, label: 'Registration', path: '/reception/registration' },
        { icon: Users, label: 'Patients', path: '/reception/patients' },
        { icon: Wallet, label: 'Billing', path: '/reception/billing' },
        { icon: Activity, label: 'Attendance', path: '/reception/attendance' },
        { icon: TestTube2, label: 'Lab Tests', path: '/reception/tests' },
    ];

    const actionButtons = [
        { label: 'Registration', icon: Plus, bg: 'bg-[#0C200E]', text: 'text-white' },
        { label: 'Book Test', icon: FlaskConical, bg: 'bg-[#0C200E]', text: 'text-white' },
        { label: 'Inquiry', icon: PhoneCall, bg: 'bg-[#0C200E]', text: 'text-white' },
        { label: 'Test Inquiry', icon: Beaker, bg: 'bg-[#0C200E]', text: 'text-white' },
    ];

    return (
        <div className={`min-h-screen flex font-sans ${isDark ? 'bg-[#0C0D0C] text-[#E0E2E0]' : 'bg-[#FAFAFA] text-[#1A1A1A]'}`}>
            
            {/* 1. SIDEBAR */}
            <aside className={`flex flex-col h-screen sticky top-0 transition-all duration-300 z-50 ${isDark ? 'bg-[#121412] border-r border-[#2A2D2A]' : 'bg-white border-r border-gray-100'} ${isSidebarOpen ? 'w-[260px]' : 'w-[80px]'}`}>
                <div className="h-20 flex items-center px-6 gap-4">
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors">
                        <Menu size={20} />
                    </button>
                    {isSidebarOpen && (
                        <div className="font-bold text-lg flex items-center gap-2">
                             <div className="w-6 h-6 bg-[#0C200E] text-white flex items-center justify-center rounded text-xs select-none">PE</div>
                             <span>PhysioEZ</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {navLinks.map((link) => (
                        <button key={link.label} onClick={() => navigate(link.path)} className={`flex items-center gap-4 p-3.5 rounded-xl w-full transition-all group relative hover:bg-gray-50 dark:hover:bg-[#1A1C1A] text-gray-500 dark:text-gray-400 hover:text-[#0C200E] dark:hover:text-[#E0E2E0]`}>
                            <link.icon size={20} className="shrink-0" strokeWidth={1.5} />
                            {isSidebarOpen && <span className="text-sm font-medium">{link.label}</span>}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-[#2A2D2A] space-y-2">
                     <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors">
                         <LogOut size={20} strokeWidth={1.5} />
                         {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
                     </button>
                     <div className={`p-3 rounded-xl flex items-center gap-3 ${isDark ? 'bg-[#1A1C1A]' : 'bg-gray-50'}`}>
                        <div className="w-8 h-8 rounded-full bg-[#0C200E] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none">{dummyData.user_name.charAt(0)}</div>
                        {isSidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold truncate">{dummyData.user_name}</div>
                                <div className="text-[10px] uppercase font-bold opacity-50 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online</div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* 2. MAIN CONTENT */}
            <main className="flex-1 h-screen overflow-y-auto">
                <div className="p-6 lg:p-10 max-w-[1920px] mx-auto space-y-10">

                    {/* HEADER SECTION (Search, Refresh, Notif) */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
                        <div>
                            <h1 className="text-5xl lg:text-7xl font-normal tracking-tight mb-2 selection:bg-[#CCEBC4]" style={{ fontFamily: 'serif' }}>
                                Hello, <span className="italic text-[#0C6E1C] dark:text-[#CCEBC4]">{dummyData.user_name}</span>
                            </h1>
                            <p className="opacity-60 text-lg">{dummyData.branch_overview}</p>
                        </div>

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

                    {/* DASHBOARD GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                        
                        {/* 1. REGISTRATION (Dark Card) - Span 5 */}
                        <div className={`col-span-1 lg:col-span-5 p-8 rounded-[32px] relative overflow-hidden group min-h-[300px] flex flex-col justify-between ${isDark ? 'bg-[#CCEBC4] text-[#0C200E]' : 'bg-[#0C200E] text-[#CCEBC4]'}`}>
                            <div className="flex justify-between items-start z-10">
                                <div className="flex items-center gap-2 mb-2 opacity-80">
                                    <ClipboardList size={18} />
                                    <span className="text-xs font-bold uppercase tracking-widest">Registration</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-bold leading-none">{dummyData.registration.month_total}</div>
                                    <div className="text-[10px] uppercase font-bold opacity-60 mt-1">This Month</div>
                                </div>
                            </div>
                            
                            <div className="z-10">
                                <div className="text-7xl font-serif leading-none mb-1">{dummyData.registration.today_total}</div>
                                <div className="text-sm font-bold opacity-60 ml-1">Today</div>
                            </div>

                            <div className="space-y-4 z-10">
                                <div className="flex gap-2 flex-wrap">
                                    <span className="bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 backdrop-blur-md">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Pending: {dummyData.registration.pending}
                                    </span>
                                    <span className="bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 backdrop-blur-md">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Consulted: {dummyData.registration.consulted}
                                    </span>
                                    <span className="bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 backdrop-blur-md">
                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Appeals: {dummyData.registration.approval_pending}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs font-bold">
                                     <div className="flex items-center gap-2"><PhoneCall size={14} /> INQUIRIES</div>
                                     <div className="flex gap-4 opacity-80">
                                         <span>Total: {dummyData.inquiry.total_today}</span>
                                         <span>Quick: {dummyData.inquiry.quick}</span>
                                         <span>Test: {dummyData.inquiry.test}</span>
                                     </div>
                                </div>
                            </div>

                            <ClipboardList className="absolute -right-4 top-10 w-96 h-96 opacity-[0.03] rotate-12 pointer-events-none" />
                        </div>

                        {/* 2. PATIENTS CARD - Span 4 */}
                        <div className={`col-span-1 lg:col-span-4 p-8 rounded-[32px] flex flex-col justify-between min-h-[300px] relative overflow-hidden ${isDark ? 'bg-[#121412] border border-[#2A2D2A]' : 'bg-[#E8F5E9] text-[#05210A]'}`}>
                             <div className="flex justify-between items-start z-10">
                                 <div className="flex items-center gap-2 opacity-80">
                                     <Users size={18} />
                                     <span className="text-xs font-bold uppercase tracking-widest">Patients</span>
                                 </div>
                                 <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-black/5 dark:bg-white/5">Total: {dummyData.patients.total_ever}</span>
                             </div>

                             <div className="text-center z-10">
                                 <div className="text-6xl font-serif leading-none">{dummyData.patients.today_attendance}</div>
                                 <div className="text-xs font-bold uppercase tracking-widest opacity-60 mt-2">Attended Today</div>
                             </div>

                             <div className="grid grid-cols-2 gap-4 z-10">
                                 <div className="bg-white/60 dark:bg-white/5 p-4 rounded-2xl text-center backdrop-blur-sm">
                                     <div className="text-xl font-bold">{dummyData.patients.active}</div>
                                     <div className="text-[10px] font-bold uppercase opacity-50">Active</div>
                                 </div>
                                 <div className="text-center p-4 opacity-60">
                                     <div className="text-xl font-bold">{dummyData.patients.inactive}</div>
                                     <div className="text-[10px] font-bold uppercase opacity-50">Inactive</div>
                                 </div>
                             </div>
                             
                             <Users className="absolute -left-10 -bottom-10 w-64 h-64 opacity-[0.03] rotate-[-12deg] pointer-events-none" />
                        </div>

                         {/* 3. LAB TESTS CARD - Span 3 */}
                        <div className={`col-span-1 lg:col-span-3 p-8 rounded-[32px] flex flex-col justify-between min-h-[300px] ${isDark ? 'bg-[#121412] border border-[#2A2D2A]' : 'bg-white border border-gray-100'}`}>
                             <div className="flex justify-between items-start">
                                 <div className="flex items-center gap-2 text-[#B3261E] dark:text-[#FFB4AB]">
                                     <TestTube2 size={18} />
                                     <span className="text-xs font-bold uppercase tracking-widest">Lab</span>
                                 </div>
                                 <span className="text-5xl font-serif leading-none">{dummyData.tests.today_total}</span>
                             </div>

                             <div className="flex justify-between text-center py-4">
                                 <div className="space-y-1">
                                     <div className="text-xl font-bold text-yellow-600">{dummyData.tests.approval_pending}</div>
                                     <div className="text-[9px] font-bold uppercase opacity-40">Approval</div>
                                 </div>
                                 <div className="space-y-1">
                                     <div className="text-xl font-bold text-orange-600">{dummyData.tests.pending}</div>
                                     <div className="text-[9px] font-bold uppercase opacity-40">Pending</div>
                                 </div>
                                 <div className="space-y-1">
                                     <div className="text-xl font-bold text-green-600">{dummyData.tests.completed}</div>
                                     <div className="text-[9px] font-bold uppercase opacity-40">Done</div>
                                 </div>
                             </div>

                             <div className="pt-4 border-t border-gray-100 dark:border-[#2A2D2A] flex justify-between items-end">
                                 <div>
                                     <div className="text-[10px] font-bold uppercase opacity-40 mb-1">Revenue</div>
                                     <div className="text-lg font-mono font-bold">{fmt(dummyData.tests.revenue_today)}</div>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-[10px] font-bold uppercase opacity-40 mb-1">Month Total</div>
                                     <div className="text-lg font-bold">{dummyData.tests.total_month}</div>
                                 </div>
                             </div>
                        </div>

                    </div>

                    {/* ROW 2: COLLECTIONS & GRAPH */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                         {/* 4. COLLECTIONS - Span 4 */}
                        <div className={`col-span-1 lg:col-span-4 p-8 rounded-[32px] flex flex-col justify-between min-h-[220px] ${isDark ? 'bg-[#121412] border border-[#2A2D2A]' : 'bg-[#1A1C1A] text-[#E0E2E0]'}`}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Total Collected Today</span>
                                <div className="p-2 bg-white/10 rounded-full"><ChevronDown size={14} /></div>
                            </div>
                            <div className="text-6xl font-mono font-bold text-[#CCEBC4]">{fmt(dummyData.collections.today_total)}</div>
                            <div className="space-y-2 pt-4 border-t border-white/10 text-sm">
                                <div className="flex justify-between"><span className="opacity-60">Registration</span><span className="font-mono font-bold">{fmt(dummyData.collections.reg_amount)}</span></div>
                                <div className="flex justify-between"><span className="opacity-60">Treatment</span><span className="font-mono font-bold">{fmt(dummyData.collections.treatment_amount)}</span></div>
                                <div className="flex justify-between"><span className="opacity-60">Lab Tests</span><span className="font-mono font-bold">{fmt(dummyData.collections.test_amount)}</span></div>
                            </div>
                        </div>

                         {/* 5. NEW RECENT ACTIVITY CARD (Bar Chart) - Span 8 */}
                        <div className={`col-span-1 lg:col-span-8 p-8 rounded-[32px] ${isDark ? 'bg-[#121412] border border-[#2A2D2A]' : 'bg-white border border-gray-100'}`}>
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-2">
                                    <Activity size={18} />
                                    <h3 className="font-bold">Recent Activity</h3>
                                </div>
                                <span className="bg-green-100 text-green-800 text-[10px] font-bold uppercase px-2 py-1 rounded">Live</span>
                            </div>

                            <div className="flex items-end justify-between h-[150px] gap-4">
                                {dummyData.weekly.map((d, i) => (
                                    <div key={i} className="flex-1 flex flex-col gap-3 h-full justify-end group">
                                         <div className="w-full bg-gray-50 dark:bg-[#1A1C1A] rounded-2xl relative overflow-hidden h-full flex items-end">
                                             <motion.div 
                                                initial={{ height: 0 }}
                                                animate={{ height: d.total > 0 ? '60%' : '5px' }}
                                                className={`w-full ${d.total > 0 ? 'bg-[#0C200E] dark:bg-[#CCEBC4]' : 'bg-transparent'}`}
                                             />
                                             {d.total > 0 && <div className="absolute w-full text-center bottom-2 text-[10px] font-bold text-white mix-blend-difference">{fmt(d.total)}</div>}
                                         </div>
                                         <div className="text-center text-[10px] font-bold uppercase opacity-30">{d.day}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ROW 3: SCHEDULE & DUES */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
                        
                         {/* 6. SCHEDULE - Span 8 */}
                        <div className={`col-span-1 lg:col-span-8 p-8 rounded-[32px] ${isDark ? 'bg-[#121412] border border-[#2A2D2A]' : 'bg-white border border-gray-100'}`}>
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="font-bold text-lg">Today's Schedule</h3>
                                <span className="px-3 py-1 rounded-full bg-[#E8F5E9] text-[#0C200E] text-xs font-bold">Jan 28</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dummyData.schedule.map((apt) => (
                                    <div key={apt.id} className="p-4 rounded-2xl border border-gray-100 dark:border-[#2A2D2A] hover:border-[#0C200E] transition-colors group">
                                         <div className="flex items-center gap-4 mb-3">
                                             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${['Sumit', 'Ravi'].includes(apt.patient_name) ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                 {apt.patient_name.charAt(0)}
                                             </div>
                                             <div>
                                                 <div className="font-bold">{apt.patient_name}</div>
                                                 <div className="text-xs opacity-50">{apt.type}</div>
                                             </div>
                                             <div className="ml-auto text-xs font-bold opacity-40">{apt.appointment_time}</div>
                                         </div>
                                         <div className="flex gap-2 pl-14">
                                             {apt.approval_status === 'pending' && <span className="text-[10px] font-bold uppercase bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Waiting</span>}
                                             {apt.status === 'Pending' && <span className="text-[10px] font-bold uppercase bg-[#FFDAD6] text-[#410002] px-2 py-1 rounded">Pending</span>}
                                             {apt.status === 'Consulted' && <span className="text-[10px] font-bold uppercase bg-green-100 text-green-800 px-2 py-1 rounded">Consulted</span>}
                                         </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                         {/* 7. DUES ALERT - Span 4 */}
                        <div className={`col-span-1 lg:col-span-4 p-8 rounded-[32px] flex flex-col justify-center text-center relative overflow-hidden ${isDark ? 'bg-[#210E0E]' : 'bg-[#FFF8F6] border border-red-100'}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFDAD6] rounded-bl-full opacity-50 pointer-events-none"></div>

                            <div className="flex justify-center items-center gap-2 mb-2 relative z-10 text-[#B3261E] dark:text-[#FFB4AB]">
                                <AlertCircle size={20} />
                                <h3 className="font-bold">Dues Alert</h3>
                            </div>

                            <div className="text-6xl font-mono font-bold text-[#B3261E] dark:text-[#FFB4AB] relative z-10 mb-2">{fmt(dummyData.collections.today_dues)}</div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-60 mb-6 dark:text-[#FFDAD6]">Total Pending</div>

                            <div className="flex justify-between px-4 pb-2 relative z-10">
                                <div className="text-right">
                                    <div className="text-xs font-bold dark:text-[#FFDAD6]">Patient Dues</div>
                                    <div className="text-red-600 dark:text-[#FFB4AB] font-bold">{fmt(0)}</div>
                                </div>
                                <div className="text-left border-l border-red-200 pl-4">
                                     <div className="text-xs font-bold dark:text-[#FFDAD6]">Test Dues</div>
                                     <div className="text-red-600 dark:text-[#FFB4AB] font-bold">{fmt(0)}</div>
                                </div>
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
                 <button className="w-16 h-16 bg-[#CCEBC4] text-[#0C200E] rounded-[24px] shadow-2xl shadow-green-900/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                     <Plus size={32} />
                 </button>
            </div>

        </div>
    );
}
