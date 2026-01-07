import { useState, useEffect, useRef } from 'react';
import { 
    Search, ChevronLeft, ChevronRight, 
    Phone, Stethoscope, 
    CheckCircle2, Eye, Printer,
    Bell, Moon, Sun, LogOut, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { usePatientStore } from '../store/usePatientStore';
import { API_BASE_URL, authFetch } from '../config';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/ui/CustomSelect';
import PatientDetailsModal from '../components/patients/PatientDetailsModal';
import AttendanceModal from '../components/patients/modals/AttendanceModal';
import TokenPreviewModal from '../components/patients/modals/TokenPreviewModal';
import { toast } from 'sonner';

const Patients = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    
    // Store State
    const { 
        patients, isLoading, pagination, filters, metaData,
        setFilters, setPage, fetchPatients, fetchMetaData,
        openPatientDetails
    } = usePatientStore();

    // Local UI State
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifPopup, setShowNotifPopup] = useState(false);
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [isDark, setIsDark] = useState(false);

    // Modals State
    const [attendanceModal, setAttendanceModal] = useState<{ open: boolean, patient: any | null }>({ open: false, patient: null });
    const [tokenModal, setTokenModal] = useState<{ open: boolean, patientId: number | null }>({ open: false, patientId: null });

    const searchRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLButtonElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        if (user?.branch_id) fetchMetaData(user.branch_id);
    }, [user?.branch_id]);

    // Fetch Patients on Filter/Page Change
    useEffect(() => {
        if (user?.branch_id) {
            const timer = setTimeout(() => fetchPatients(user.branch_id), 300);
            return () => clearTimeout(timer);
        }
    }, [pagination.page, filters, user?.branch_id]);

    // Theme & Click Outside Effects
    useEffect(() => {
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (saved === 'dark' || (!saved && prefersDark)) { document.documentElement.classList.add('dark'); setIsDark(true); }
        else { document.documentElement.classList.remove('dark'); setIsDark(false); }
    }, []);

    const toggleTheme = () => {
        if (isDark) { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); setIsDark(false); }
        else { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); setIsDark(true); }
    };

    const handleClickOutside = (e: MouseEvent) => {
        if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchResults(false);
        if (notifRef.current && !notifRef.current.contains(e.target as Node) && !(e.target as Element).closest('#notif-popup')) setShowNotifPopup(false);
        if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfilePopup(false);
    };
    useEffect(() => { document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside); }, []);

    // Notifications
    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await authFetch(`${API_BASE_URL}/reception/notifications.php?employee_id=${user?.employee_id || ''}`);
                const data = await res.json();
                if (data.success || data.status === 'success') { setNotifications(data.notifications || []); setUnreadCount(data.unread_count || 0); }
            } catch (err) { console.error(err); }
        };
        if(user?.employee_id) { fetchNotifs(); const inv = setInterval(fetchNotifs, 30000); return () => clearInterval(inv); }
    }, [user?.employee_id]);

    // Global Search Debounce
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!user?.branch_id || globalSearchQuery.length < 2) { setSearchResults([]); setShowSearchResults(false); return; }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await authFetch(`${API_BASE_URL}/reception/search_patients.php?branch_id=${user.branch_id}&q=${encodeURIComponent(globalSearchQuery)}`);
                const data = await res.json();
                if (data.success) { setSearchResults(data.patients || []); setShowSearchResults(true); }
            } catch (err) { console.error(err); }
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [globalSearchQuery, user?.branch_id]);


    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-[#ccebc4]/30 text-[#006e1c] dark:text-[#88d99d] border-[#ccebc4] dark:border-[#0c3b10]';
            case 'completed': return 'bg-[#f2f6fa]/50 text-[#00639b] dark:text-[#a8c7fa] border-[#cce5ff] dark:border-[#0842a0]';
            case 'inactive': return 'bg-[#e0e2ec]/30 text-[#43474e] dark:text-[#c4c7c5] border-[#e0e2ec] dark:border-[#43474e]';
            default: return 'bg-[#e0e2ec]/30 text-[#43474e] dark:text-[#c4c7c5] border-[#e0e2ec] dark:border-[#43474e]';
        }
    };

    const handleMarkAttendance = async (e: React.MouseEvent, patient: any) => {
        e.stopPropagation();
        
        const cost = parseFloat(patient.cost_per_day || '0');
        const balance = parseFloat(patient.effective_balance || '0');

        // Logic: If Balance is sufficient OR cost is 0, Auto Mark.
        if (balance >= cost || cost === 0) {
             const loadingToast = toast.loading('Marking attendance...');
             try {
                const res = await authFetch(`${API_BASE_URL}/reception/add_attendance.php`, {
                    method: 'POST',
                    body: JSON.stringify({
                        patient_id: patient.patient_id,
                        payment_amount: '0',
                        mode: '',
                        remarks: 'Auto: Debited from Balance',
                        status: 'present'
                    })
                });
                const data = await res.json();
                if(data.success || data.status === 'success') {
                    toast.success('Attendance marked successfully');
                    fetchPatients(user!.branch_id);
                } else {
                    toast.error(data.message || 'Failed to mark attendance');
                }
             } catch (err) {
                 toast.error('Error marking attendance');
             } finally {
                 toast.dismiss(loadingToast);
             }
        } else {
            // Insufficient Balance -> Open Modal
            setAttendanceModal({ open: true, patient });
        }
    };

    const handlePrintToken = (e: React.MouseEvent, patientId: number) => {
        e.stopPropagation();
        setTokenModal({ open: true, patientId });
    };

    // Shared Header
    const Header = () => (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#fdfcff]/90 dark:bg-[#111315]/90 backdrop-blur-md px-4 md:px-8 py-3 flex items-center justify-between border-b border-[#e0e2ec] dark:border-[#43474e] transition-colors duration-300 h-16">
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/reception/dashboard')}>
                     <div className="w-10 h-10 rounded-xl bg-[#ccebc4] flex items-center justify-center text-[#0c200e] font-bold shadow-sm">PS</div>
                     <h1 className="text-2xl text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight hidden md:block" style={{ fontFamily: 'serif' }}>ProSpine</h1>
                 </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
                <div ref={searchRef} className="hidden md:flex items-center relative z-50">
                    <div className="flex items-center bg-[#e0e2ec] dark:bg-[#43474e] rounded-full px-4 py-2 w-64 lg:w-96 transition-colors duration-300">
                        <Search size={18} className="text-[#43474e] dark:text-[#c4c7c5] mr-2" />
                        <input type="text" value={globalSearchQuery} onChange={(e) => setGlobalSearchQuery(e.target.value)} placeholder="Search patients..." className="bg-transparent border-none outline-none text-sm w-full text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#43474e] dark:placeholder:text-[#8e918f]" />
                    </div>
                    <AnimatePresence>
                        {showSearchResults && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-[#fdfcff] rounded-[20px] shadow-xl border border-[#e0e2ec] overflow-hidden max-h-[400px] overflow-y-auto">
                                {searchResults.map((p) => (
                                    <div key={p.patient_id} onClick={() => { setGlobalSearchQuery(''); setShowSearchResults(false); openPatientDetails(p); }} className="p-3 hover:bg-[#e0e2ec] cursor-pointer border-b border-[#e0e2ec] last:border-0">
                                        <p className="font-bold text-[#1a1c1e]">{p.patient_name}</p>
                                        <p className="text-xs text-[#43474e]">{p.phone_number}</p>
                                    </div>
                                ))}
                                {searchResults.length === 0 && <div className="p-4 text-center text-[#43474e]">No patients found</div>}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button onClick={toggleTheme} className="p-2.5 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors">
                    <Moon size={20} className="block dark:hidden" />
                    <Sun size={20} className="hidden dark:block" />
                </button>

                <div className="relative">
                    <button ref={notifRef} onClick={() => { setShowNotifPopup(!showNotifPopup); setShowProfilePopup(false); }} className="p-2.5 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors relative">
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#b3261e] rounded-full"></span>}
                    </button>
                     <AnimatePresence>
                        {showNotifPopup && (
                            <motion.div id="notif-popup" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute top-full right-0 mt-2 w-80 bg-[#fdfcff] dark:bg-[#111315] rounded-[20px] shadow-xl border border-[#e0e2ec] dark:border-[#43474e] z-[60] overflow-hidden transition-colors">
                                <div className="p-4 border-b border-[#e0e2ec] dark:border-[#43474e] font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">Notifications</div>
                                <div className="max-h-60 overflow-y-auto">
                                    {notifications.map(n => (
                                        <div key={n.notification_id} className={`p-3 border-b border-[#e0e2ec] dark:border-[#43474e] hover:bg-[#e0e2ec]/50 ${n.is_read === 0 ? 'bg-[#ccebc4]/20' : ''}`}>
                                            <p className="text-sm text-[#1a1c1e] dark:text-[#e3e2e6]">{n.message}</p>
                                            <p className="text-[10px] text-[#43474e] dark:text-[#c4c7c5] mt-1">{n.time_ago}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="relative" ref={profileRef}>
                    <div onClick={() => { setShowProfilePopup(!showProfilePopup); setShowNotifPopup(false); }} className="w-10 h-10 bg-[#ccebc4] dark:bg-[#0c3b10] rounded-full flex items-center justify-center text-[#0c200e] dark:text-[#ccebc4] font-bold border border-[#74777f] dark:border-[#8e918f] ml-1 overflow-hidden cursor-pointer hover:ring-2 ring-[#ccebc4] transition-colors">
                         {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <AnimatePresence>
                        {showProfilePopup && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute top-full right-0 mt-2 w-56 bg-[#fdfcff] dark:bg-[#111315] rounded-[20px] shadow-xl border border-[#e0e2ec] dark:border-[#43474e] z-[60] overflow-hidden p-2 transition-colors">
                                 <button onClick={() => navigate('/reception/profile')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] text-sm font-medium transition-colors"><Search size={18} /> Profile</button>
                                 <button onClick={() => { logout(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#ffdad6] dark:hover:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] text-sm font-medium mt-1 transition-colors"><LogOut size={18} /> Logout</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );

    const NavChips = () => (
        <div className="fixed top-16 left-0 right-0 z-40 bg-[#fdfcff]/90 dark:bg-[#111315]/90 backdrop-blur-md border-b border-[#e0e2ec] dark:border-[#43474e] h-14 flex items-center">
            <div className="flex gap-3 overflow-x-auto px-6 scrollbar-hide w-full h-full items-center">
                {[
                    { label: 'Dashboard', path: '/reception/dashboard' },
                    { label: 'Schedule', path: '/reception/schedule' },
                    { label: 'Inquiry', path: '/reception/inquiry' },
                    { label: 'Registration', path: '/reception/registration' },
                    { label: 'Patients', path: '/reception/patients' },
                    { label: 'Billing', path: '/reception/billing' },
                    { label: 'Attendance', path: '/reception/attendance' },
                    { label: 'Tests', path: '/reception/tests' },
                    { label: 'Feedback', path: '/reception/feedback' },
                    { label: 'Reports', path: '/reception/reports' },
                    { label: 'Expenses', path: '/reception/expenses' },
                    { label: 'Support', path: '/reception/support' }
                ].map((nav) => (
                    <button key={nav.label} onClick={() => { if (nav.label !== 'Patients') navigate(nav.path); }} className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${nav.label === 'Patients' ? 'bg-[#1a1c1e] text-white dark:bg-[#e3e2e6] dark:text-[#1a1c1e] shadow-md' : 'bg-[#f2f6fa] dark:bg-[#1a1c1e] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] border border-[#74777f] dark:border-[#8e918f] text-[#43474e] dark:text-[#c4c7c5]'}`}>{nav.label}</button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fdfcff] dark:bg-[#111315] text-[#1a1c1e] dark:text-[#e3e2e6] font-sans transition-colors duration-300 pb-20">
            <Header />
            <NavChips />
            
            <div className="max-w-[1600px] mx-auto p-6 pt-36">
                {/* Title & Actions */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight mb-1" style={{ fontFamily: 'serif' }}>Patients</h1>
                        <p className="text-base text-[#43474e] dark:text-[#c4c7c5] font-medium">Manage patient records and treatment plans</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-[#f0f4f9] dark:bg-[#1e2022] rounded-[24px] p-2 mb-8 flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-[20px] shadow-sm px-4 py-3 flex items-center gap-3 border border-transparent focus-within:border-[#006e1c] dark:focus-within:border-[#88d99d] transition-all">
                        <Search className="text-[#43474e] dark:text-[#c4c7c5]" size={20} />
                        <input type="text" placeholder="Search by name, phone or ID..." value={filters.search} onChange={(e) => setFilters({ search: e.target.value })} className="bg-transparent border-none outline-none text-base w-full text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#43474e] dark:placeholder:text-[#8e918f] font-medium" />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                         <CustomSelect 
                            value={filters.status} 
                            onChange={(v) => setFilters({ status: v })} 
                            options={[{label:'All Status', value:''}, ...metaData.statuses.map(s => ({label:s, value:s}))]} 
                            placeholder="Status" 
                            className="min-w-[150px] !rounded-[20px] !py-4 !border-none !bg-[#fdfcff] dark:!bg-[#1a1c1e] !shadow-sm !font-bold" 
                         />
                         <CustomSelect 
                            value={filters.doctor} 
                            onChange={(v) => setFilters({ doctor: v })} 
                            options={[{label:'All Doctors', value:''}, ...metaData.doctors.map(d => ({label:d, value:d}))]} 
                            placeholder="Doctor" 
                            className="min-w-[160px] !rounded-[20px] !py-4 !border-none !bg-[#fdfcff] dark:!bg-[#1a1c1e] !shadow-sm !font-bold" 
                         />
                    </div>
                </div>

                {/* Patient Grid */}
                {isLoading ? (
                     <div className="flex flex-col items-center justify-center py-20">
                         <Loader2 className="animate-spin text-[#006e1c] mb-4" size={48} />
                         <p className="text-base font-bold text-[#43474e] dark:text-[#c4c7c5]">Loading patients...</p>
                     </div>
                ) : patients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-60">
                         <div className="w-20 h-20 bg-[#e0e2ec] dark:bg-[#43474e] rounded-full flex items-center justify-center mb-6 text-[#1a1c1e] dark:text-[#e3e2e6]"><Search size={32} /></div>
                         <h3 className="text-xl font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">No patients found</h3>
                         <p className="text-[#43474e] dark:text-[#c4c7c5] mt-2">Try adjusting your filters or search query</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {patients.map((patient, idx) => {
                            const totalDays = patient.treatment_days || 1;
                            const progress = Math.min(100, (patient.attendance_count / totalDays) * 100);
                            const dueAmount = parseFloat(patient.due_amount || '0');
                            const isPresent = patient.today_attendance === 'present';

                            return (
                                <motion.div 
                                    key={patient.patient_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                                    onClick={() => openPatientDetails(patient)}
                                    className="group bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-[24px] border border-[#e0e2ec] dark:border-[#43474e] p-5 hover:shadow-xl hover:border-[#ccebc4] dark:hover:border-[#005313] transition-all relative overflow-hidden cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 p-4">
                                         <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(patient.patient_status)}`}>
                                             {patient.patient_status}
                                         </div>
                                    </div>

                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-14 h-14 rounded-[18px] bg-[#ccebc4] dark:bg-[#0c3b10] flex items-center justify-center text-[#002105] dark:text-[#ccebc4] font-black text-xl shadow-inner border border-[#ccebc4] dark:border-[#0c3b10] overflow-hidden">
                                            {patient.patient_photo_path ? <img src={`/admin/${patient.patient_photo_path}`} className="w-full h-full object-cover" alt="" /> : (patient.patient_name?.charAt(0) || '?')}
                                        </div>
                                        <div className="pt-0.5">
                                            <h3 className="font-bold text-lg text-[#1a1c1e] dark:text-[#e3e2e6] leading-tight line-clamp-1">{patient.patient_name}</h3>
                                            <p className="text-xs text-[#43474e] dark:text-[#c4c7c5] font-medium mt-1 flex items-center gap-1"><Phone size={10} /> {patient.patient_phone}</p>
                                            <span className="inline-block mt-2 px-2 py-0.5 bg-[#f0f4f9] dark:bg-[#30333b] rounded-md text-[10px] font-bold text-[#43474e] dark:text-[#c4c7c5]">#{patient.patient_uid || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Medical Info */}
                                    <div className="space-y-3 mb-4">
                                        <div className="p-3 bg-[#f2f6fa] dark:bg-[#111315] rounded-[16px] text-xs">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Stethoscope size={14} className="text-[#006e1c] dark:text-[#88d99d]" />
                                                <span className="font-bold text-[#1a1c1e] dark:text-[#e3e2e6]">{patient.service_type || '-'}</span>
                                            </div>
                                            <p className="text-[#43474e] dark:text-[#c4c7c5] truncate pl-5">{patient.treatment_type} • {patient.assigned_doctor}</p>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="p-3 border border-[#e0e2ec] dark:border-[#43474e] rounded-[16px]">
                                            <div className="flex justify-between text-[10px] font-bold text-[#74777f] dark:text-[#8e918f] mb-1.5">
                                                <span>Attendance</span>
                                                <span className="text-[#1a1c1e] dark:text-[#e3e2e6]">{patient.attendance_count}/{patient.treatment_days}</span>
                                            </div>
                                            <div className="h-2 w-full bg-[#e0e2ec] dark:bg-[#43474e] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#006e1c] dark:bg-[#88d99d] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex items-center justify-between pt-3 border-t border-[#e0e2ec] dark:border-[#43474e]">
                                        <div>
                                             <p className={`text-xs font-black ${dueAmount > 0 ? 'text-[#ba1a1a] dark:text-[#ffb4ab]' : 'text-[#006e1c] dark:text-[#88d99d]'}`}>
                                                 {dueAmount > 0 ? `Due: ₹${dueAmount}` : 'Paid'}
                                             </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => handlePrintToken(e, patient.patient_id)}
                                                className="p-1.5 text-[#43474e] dark:text-[#c4c7c5] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full transition-colors" 
                                                title="Print Token"
                                            >
                                                <Printer size={18} />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); openPatientDetails(patient); }}
                                                className="p-1.5 text-[#43474e] dark:text-[#c4c7c5] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full transition-colors" 
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleMarkAttendance(e, patient)}
                                                className={`p-1.5 rounded-full transition-colors ${
                                                    isPresent 
                                                        ? 'text-[#006e1c] bg-[#ccebc4] dark:bg-[#0c3b10] cursor-default'
                                                        : 'text-[#43474e] hover:text-[#00639b] hover:bg-[#cce5ff] dark:hover:bg-[#0842a0]'
                                                }`}
                                                disabled={isPresent}
                                                title={isPresent ? "Already Present" : "Mark Attendance"}
                                            >
                                                <CheckCircle2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
                
                {/* Pagination (Floating) */}
                {!isLoading && patients.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1c1e] dark:bg-[#e3e2e6] text-white dark:text-[#1a1c1e] px-4 py-2 rounded-full shadow-2xl z-30 flex items-center gap-4">
                        <button 
                            onClick={() => setPage(Math.max(1, pagination.page - 1))}
                            disabled={pagination.page === 1}
                            className="p-1 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-xs font-bold tracking-widest">{pagination.page} / {pagination.total_pages}</span>
                        <button 
                            onClick={() => setPage(Math.min(pagination.total_pages, pagination.page + 1))}
                            disabled={pagination.page === pagination.total_pages}
                            className="p-1 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <PatientDetailsModal />
             <AttendanceModal 
                isOpen={attendanceModal.open} 
                onClose={() => setAttendanceModal({ open: false, patient: null })}
                patient={attendanceModal.patient} 
                onSuccess={() => fetchPatients(user!.branch_id)} 
            />
            <TokenPreviewModal
                isOpen={tokenModal.open}
                onClose={() => setTokenModal({ open: false, patientId: null })}
                patientId={tokenModal.patientId}
            />

        </div>
    );
};

export default Patients;
