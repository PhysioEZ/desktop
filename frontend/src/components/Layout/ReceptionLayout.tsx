import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL } from '../../config';
import ChatModal from '../Chat/ChatModal';
import { 
  Gauge, 
  Search, 
  UserPlus, 
  CalendarDays, 
  Users, 
  FileText, 
  UserCheck, 
  TestTube2, 
  MessageSquare, 
  LineChart, 
  Banknote, 
  Headphones, 
  ChevronsLeft,
  ChevronsRight,
  Moon,
  Sun,
  MessageCircle,
  Bell,
  LogOut,
  User,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    notification_id: number;
    message: string;
    link_url: string | null;
    is_read: number;
    created_at: string;
    time_ago: string;
}

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [branchInfo, setBranchInfo] = useState<{name: string, logo: string} | null>(null);
    
    // Dark mode state - check localStorage and system preference
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    
    // Popup states
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [showNotificationPopup, setShowNotificationPopup] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);
    
    // Notifications from API
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Chat modal state
    const [showChatModal, setShowChatModal] = useState(false);

    // Apply dark mode to document
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfilePopup(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotificationPopup(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Branch Info
    useEffect(() => {
        if (user?.branch_id) {
            fetch(`${API_BASE_URL}/common/branch_info.php?branch_id=${user.branch_id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        setBranchInfo(data.data);
                    }
                })
                .catch(err => console.error("Failed to fetch branch info", err));
        }
    }, [user?.branch_id]);

    // Fetch Notifications from API
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/reception/notifications.php?employee_id=${user?.employee_id || ''}`);
                const data = await res.json();
                if (data.success || data.status === 'success') {
                    setNotifications(data.notifications || []);
                    setUnreadCount(data.unread_count || 0);
                }
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        };
        
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user?.employee_id]);

    const menuItems = [
        { path: '/reception/dashboard', icon: Gauge, label: 'Dashboard' },
        { path: '/reception/inquiry', icon: Search, label: 'Inquiry' },
        { path: '/reception/registration', icon: UserPlus, label: 'Registration' },
        { path: '/reception/schedule', icon: CalendarDays, label: 'Schedule' },
        { path: '/reception/patients', icon: Users, label: 'Patients' },
        { path: '/reception/billing', icon: FileText, label: 'Billing' },
        { path: '/reception/attendance', icon: UserCheck, label: 'Attendance' },
        { path: '/reception/tests', icon: TestTube2, label: 'Tests' },
        { path: '/reception/feedback', icon: MessageSquare, label: 'Feedback' },
        { path: '/reception/reports', icon: LineChart, label: 'Reports' },
        { path: '/reception/expenses', icon: Banknote, label: 'Expenses' },
        { path: '/reception/support', icon: Headphones, label: 'Support' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleTheme = () => setIsDark(!isDark);

    const toggleProfilePopup = () => {
        setShowProfilePopup(!showProfilePopup);
        setShowNotificationPopup(false);
    };

    const toggleNotificationPopup = () => {
        setShowNotificationPopup(!showNotificationPopup);
        setShowProfilePopup(false);
    };

    // User display info from auth store
    const displayName = user?.name || 'User';
    const userRole = user?.role || 'Receptionist';

    return (
        <motion.div 
            className="h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col z-50 shadow-sm"
            initial={false}
            animate={{ width: isCollapsed ? 80 : 280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Header: Logo & Collapse */}
            <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} mb-2`}>
                {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                         {branchInfo?.logo ? (
                            <img 
                                src={branchInfo.logo} 
                                alt="Logo" 
                                className="h-12 object-contain w-auto" 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }} 
                            />
                         ) : null}
                         <div className={`text-xl font-bold text-teal-600 dark:text-teal-400 tracking-tight ${branchInfo?.logo ? 'hidden' : 'block'}`}>
                             {branchInfo?.name || 'CareSync'}
                         </div>
                    </div>
                )}
                
                <button 
                    onClick={toggleSidebar} 
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                >
                    {isCollapsed ? <ChevronsRight size={24} /> : <ChevronsLeft size={24} />}
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar py-2">
                {menuItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            title={isCollapsed ? item.label : ''}
                            className={({ isActive: linkActive }) => `
                                flex items-center gap-4 py-3 rounded-xl transition-all duration-200 group relative
                                ${isCollapsed ? 'justify-center px-0' : 'px-4'}
                                ${linkActive 
                                    ? 'bg-teal-600 text-white shadow-md shadow-teal-200 dark:shadow-teal-900/50' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
                            `}
                        >
                            <item.icon 
                                size={20} 
                                className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white'}`} 
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            
                            {!isCollapsed && (
                                <span className={`font-medium whitespace-nowrap overflow-hidden text-[14px] ${isActive ? 'font-semibold' : ''}`}>
                                    {item.label}
                                </span>
                            )}
                        </NavLink>
                    );
                })}
            </div>

            {/* Footer Area */}
            <div className="p-4 mt-auto space-y-4 relative">
                
                {/* Branch Name Pill */}
                {!isCollapsed && (
                    <div className="bg-slate-100/80 dark:bg-slate-800 rounded-lg py-2.5 px-4 text-center">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block truncate">
                            {branchInfo?.name || 'Branch Office'}
                        </span>
                    </div>
                )}

                {/* Bottom Tools Row */}
                <div className={`flex items-center ${isCollapsed ? 'flex-col gap-6' : 'justify-between px-2'} pt-2 pb-4`}>
                    
                    {/* Dark Mode Toggle */}
                    <button 
                        onClick={toggleTheme}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {/* Chat */}
                    <button 
                        onClick={() => setShowChatModal(true)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" 
                        title="Chat"
                    >
                        <MessageCircle size={20} />
                    </button>

                    {/* Notifications */}
                    <div ref={notificationRef} className="relative">
                        <button 
                            onClick={toggleNotificationPopup}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Notifications"
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-slate-900">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notification Popup */}
                        <AnimatePresence>
                            {showNotificationPopup && (
                                <motion.div 
                                    className="absolute bottom-full left-0 mb-3 w-80 sm:w-96 max-h-[70vh] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[1001] overflow-hidden"
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                                        <button className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">
                                            Mark all read
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-80">
                                        {notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                                                    <Bell size={20} className="text-slate-400" />
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">No new notifications</p>
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div 
                                                    key={n.notification_id} 
                                                    className={`p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${n.is_read === 0 ? 'bg-slate-50 dark:bg-slate-700/30' : ''}`}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                                            <Info size={14} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2">{n.message}</p>
                                                            <p className="text-xs text-slate-400 mt-1">{n.time_ago}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-3 border-t border-slate-100 dark:border-slate-700 text-center">
                                        <button 
                                            onClick={() => { navigate('/reception/notifications'); setShowNotificationPopup(false); }}
                                            className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
                                        >
                                            View all notifications
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* User Profile */}
                    <div ref={profileRef} className="relative">
                        <button 
                            onClick={toggleProfilePopup}
                            className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm hover:shadow-md transition-shadow text-xs"
                        >
                            {displayName.charAt(0).toUpperCase()}
                        </button>
                         
                        {/* Profile Popup */}
                        <AnimatePresence>
                            {showProfilePopup && (
                                <motion.div 
                                    className="absolute bottom-full left-0 mb-3 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[1001] overflow-hidden"
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    {/* Header with user info */}
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-lg">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{displayName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{userRole}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Menu items */}
                                    <div className="p-2">
                                        <button 
                                            onClick={() => { navigate('/reception/profile'); setShowProfilePopup(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                        >
                                            <User size={16} className="text-slate-400" /> Profile
                                        </button>
                                        <button 
                                            onClick={() => { navigate('/reception/notifications'); setShowProfilePopup(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                        >
                                            <Bell size={16} className="text-slate-400" /> Notifications
                                        </button>
                                    </div>
                                    
                                    {/* Logout */}
                                    <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            
            {/* Chat Modal */}
            <ChatModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />
        </motion.div>
    );
};

// Search Bar Component with API integration
interface Patient {
    patient_id: number;
    patient_name: string;
    patient_uid: string | null;
    age: string;
    gender: string;
    phone_number: string;
    status: string;
}

const TopBar: React.FC = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search with debounce
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Don't search on empty query or on initial load
        if (!user?.branch_id || searchQuery.length < 2) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`${API_BASE_URL}/reception/search_patients.php?branch_id=${user.branch_id}&q=${encodeURIComponent(searchQuery)}`);
                const data = await res.json();
                if (data.success) {
                    setSearchResults(data.patients || []);
                    setShowResults(true);
                }
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery, user?.branch_id]);

    const handlePatientClick = (patientId: number) => {
        setShowResults(false);
        setSearchQuery('');
        navigate(`/reception/patients/${patientId}`);
    };

    return (
        <div className="h-14 flex items-center justify-between px-6 py-2 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div> 
            <div ref={searchRef} className="w-96 relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${showResults ? 'text-teal-600' : 'text-slate-400'} transition-colors`} size={18} />
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    placeholder="Search patients by name, ID, phone..." 
                    className="w-full pl-10 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-slate-400 font-medium text-slate-900 dark:text-white"
                />
                
                {/* Search Results Dropdown */}
                <AnimatePresence>
                    {showResults && (
                        <motion.div 
                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-hidden"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                        >
                            {searchResults.length === 0 ? (
                                <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                                    {searchQuery.length < 2 ? 'Type at least 2 characters to search...' : 'No patients found'}
                                </div>
                            ) : (
                                <div className="overflow-y-auto max-h-80">
                                    {searchResults.map((patient, idx) => (
                                        <motion.div
                                            key={patient.patient_id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => handlePatientClick(patient.patient_id)}
                                            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                                                    patient.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 
                                                    patient.status === 'inactive' ? 'bg-slate-100 dark:bg-slate-700 text-slate-500' :
                                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                }`}>
                                                    {patient.patient_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{patient.patient_name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                        {patient.patient_uid && <span className="font-mono">{patient.patient_uid}</span>}
                                                        <span>•</span>
                                                        <span>{patient.age}, {patient.gender}</span>
                                                        {patient.phone_number && <><span>•</span><span>{patient.phone_number}</span></>}
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                    patient.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 
                                                    patient.status === 'inactive' ? 'bg-slate-100 dark:bg-slate-700 text-slate-500' :
                                                    'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                }`}>
                                                    {patient.status?.toUpperCase() || 'N/A'}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                            {searchResults.length > 0 && (
                                <div className="p-2 border-t border-slate-100 dark:border-slate-700 text-center">
                                    <button 
                                        onClick={() => { navigate('/reception/patients'); setShowResults(false); }}
                                        className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
                                    >
                                        View all patients →
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

interface LayoutProps {
    children: React.ReactNode;
}

const ReceptionLayout: React.FC<LayoutProps> = ({ children }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved === 'true';
    });

    const toggleSidebar = () => {
        setIsSidebarCollapsed(prev => {
            const newState = !prev;
            localStorage.setItem('sidebarCollapsed', String(newState));
            return newState;
        });
    };

    return (
        <div className="flex bg-slate-50 dark:bg-slate-900 min-h-screen font-sans">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            
            <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-900">
                <TopBar />
                <main className="flex-1 overflow-x-hidden overflow-y-auto relative">
                     {children}
                </main>
            </div>
        </div>
    );
};

export default ReceptionLayout;
