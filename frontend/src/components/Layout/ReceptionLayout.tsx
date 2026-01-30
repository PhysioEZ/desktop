import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Search, Moon, Sun, Bell, User, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL, authFetch } from '../../config';
import KeyboardShortcuts, { type ShortcutItem } from '../KeyboardShortcuts';
import GlobalSearch from '../GlobalSearch';
import LogoutConfirmation from '../LogoutConfirmation';

import ChatModal from '../Chat/ChatModal';

interface ReceptionLayoutProps {
    children: React.ReactNode;
    pageSpecificShortcuts?: ShortcutItem[];
}

const ReceptionLayout: React.FC<ReceptionLayoutProps> = ({ children, pageSpecificShortcuts = [] }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    
    // --- Global State ---
    const [isDark, setIsDark] = useState(false);
    
    // Global Search State
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);

    // Modals & Popups State
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [showNotifPopup, setShowNotifPopup] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);

    // Refs
    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLButtonElement>(null);

    // --- Theme Management ---
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

    // --- Global Search Logic ---
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (globalSearchQuery.trim().length >= 2) {
                try {
                    const res = await authFetch(`${API_BASE_URL}/reception/search_patients?q=${globalSearchQuery}&branch_id=${user?.branch_id}`);
                    const data = await res.json();
                    if (data.success) {
                        setGlobalSearchResults(data.patients);
                    }
                } catch (e) { console.error(e); }
            } else {
                setGlobalSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [globalSearchQuery, user?.branch_id]);

    // --- Shortcuts ---
    const globalShortcuts: ShortcutItem[] = [
        { keys: ['Alt', '1'], description: 'Dashboard', group: 'Navigation', action: () => navigate('/reception/dashboard') },
        { keys: ['Alt', '2'], description: 'Schedule', group: 'Navigation', action: () => navigate('/reception/schedule') },
        { keys: ['Alt', '3'], description: 'Inquiry', group: 'Navigation', action: () => navigate('/reception/inquiry') },
        { keys: ['Alt', '4'], description: 'Registration', group: 'Navigation', action: () => navigate('/reception/registration') },
        { keys: ['Alt', '5'], description: 'Patients', group: 'Navigation', action: () => navigate('/reception/patients') },
        { keys: ['Alt', 'S'], description: 'Global Search', group: 'General', action: () => setShowGlobalSearch(true) },
        { keys: ['Alt', '/'], description: 'Shortcuts', group: 'General', action: () => setShowShortcuts(prev => !prev) },
        { keys: ['Alt', 'L'], description: 'Logout', group: 'Actions', action: () => setShowLogoutConfirm(true) },
        { keys: ['Alt', 'W'], description: 'Toggle Theme', group: 'Actions', action: toggleTheme },
        { keys: ['Alt', 'N'], description: 'Notifications', group: 'Modals', action: () => setShowNotifPopup(prev => !prev) },
        { keys: ['Alt', 'P'], description: 'Profile', group: 'Modals', action: () => setShowProfilePopup(prev => !prev) },
    ];

    const allShortcuts = [...pageSpecificShortcuts, ...globalShortcuts];

    // --- Click Outside & escape Handlers ---
    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(e.target as Node) && !(e.target as Element).closest('#notif-popup')) setShowNotifPopup(false);
        if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfilePopup(false);
    }, []);

    useEffect(() => { 
        document.addEventListener('mousedown', handleClickOutside); 
        return () => document.removeEventListener('mousedown', handleClickOutside); 
    }, [handleClickOutside]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowProfilePopup(false);
                setShowNotifPopup(false);
                setShowGlobalSearch(false);
                setShowShortcuts(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- Navigation Links ---
    const navLinks = [
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
    ];

    return (
        <div className="min-h-screen bg-[#fdfcff] dark:bg-[#111315] text-[#1a1c1e] dark:text-[#e3e2e6] font-sans transition-colors duration-300 pb-20">
            {/* --- HEADER --- */}
            <header className="sticky top-0 z-40 bg-[#fdfcff]/80 dark:bg-[#111315]/80 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between border-b border-[#e0e2ec] dark:border-[#43474e] transition-colors duration-300">
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/reception/dashboard')}>
                         <div className="w-10 h-10 rounded-xl bg-[#ccebc4] flex items-center justify-center text-[#0c200e] font-bold">PS</div>
                         <h1 className="text-2xl text-[#1a1c1e] dark:text-[#e3e2e6] tracking-tight hidden md:block" style={{ fontFamily: 'serif' }}>PhysioEZ</h1>
                     </div>
                </div>

                {/* Global Search Trigger */}
                <div 
                    className="hidden md:flex flex-1 max-w-xl mx-8 relative group" 
                    onClick={() => setShowGlobalSearch(true)}
                >
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-[#43474e] dark:text-[#c4c7c5] group-hover:text-[#006e1c] dark:group-hover:text-[#88d99d] transition-colors" />
                    </div>
                    <input
                        type="text"
                        readOnly
                        className="block w-full pl-11 pr-4 py-2.5 bg-[#f2f6fa] dark:bg-[#1a1c1e] border-0 rounded-full text-sm text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#74777f] focus:ring-2 focus:ring-[#006e1c] dark:focus:ring-[#88d99d] cursor-text transition-all shadow-sm hover:shadow-md"
                        placeholder="Search patients... (Alt + S)"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center">
                        <kbd className="hidden sm:inline-flex items-center h-6 px-2 text-xs font-sans font-medium text-[#43474e] dark:text-[#c4c7c5] bg-white dark:bg-[#30333b] rounded-md border border-[#e0e2ec] dark:border-[#43474e] shadow-sm">
                            Alt + S
                        </kbd>
                    </div>
                </div>

                <div className="flex items-center gap-2 lg:gap-4">
                    <button onClick={toggleTheme} className="p-3 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full text-[#43474e] dark:text-[#c4c7c5] transition-colors">
                        <Moon size={22} className="block dark:hidden" />
                        <Sun size={22} className="hidden dark:block" />
                    </button>

                    <div className="relative">
                        <button ref={notifRef} onClick={() => { setShowNotifPopup(!showNotifPopup); setShowProfilePopup(false); }} className={`p-3 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full transition-colors relative ${showNotifPopup ? 'bg-[#e0e2ec] dark:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6]' : 'text-[#43474e] dark:text-[#c4c7c5]'}`}>
                            <Bell size={22} />
                        </button>
                        
                        {/* Notification Popup */}
                        <AnimatePresence>
                            {showNotifPopup && (
                                <motion.div 
                                    id="notif-popup"
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 mt-2 w-80 bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-2xl shadow-xl border border-[#e0e2ec] dark:border-[#43474e] z-[60] overflow-hidden"
                                >
                                    <div className="px-4 py-3 border-b border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center">
                                        <h3 className="font-bold text-sm text-[#1a1c1e] dark:text-[#e3e2e6]">Notifications</h3>
                                        <span className="text-[10px] bg-[#ccebc4] text-[#0c200e] px-2 py-0.5 rounded-full font-bold">0 New</span>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto p-4 text-center text-[#43474e] dark:text-[#c4c7c5]">
                                        <div className="flex flex-col items-center gap-2 opacity-50 py-4">
                                            <Bell size={32} />
                                            <p className="text-sm">No new notifications</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative" ref={profileRef}>
                        <div onClick={() => { setShowProfilePopup(!showProfilePopup); setShowNotifPopup(false); }} className={`w-10 h-10 bg-[#ccebc4] dark:bg-[#0c3b10] rounded-full flex items-center justify-center text-[#0c200e] dark:text-[#ccebc4] font-bold border border-[#74777f] dark:border-[#8e918f] ml-1 overflow-hidden cursor-pointer hover:ring-2 ring-[#ccebc4] transition-colors ${showProfilePopup ? 'ring-2 ring-[#ccebc4]' : ''}`}>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <AnimatePresence>
                            {showProfilePopup && (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute top-full right-0 mt-2 w-56 bg-[#fdfcff] dark:bg-[#111315] rounded-[20px] shadow-xl border border-[#e0e2ec] dark:border-[#43474e] z-[60] overflow-hidden p-2 transition-colors">
                                     <button onClick={() => navigate('/reception/profile')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] text-sm font-medium transition-colors"><User size={18} /> Profile</button>
                                     <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#ffdad6] dark:hover:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] text-sm font-medium mt-1 transition-colors"><LogOut size={18} /> Logout</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* --- NAVIGATION CHIPS --- */}
            <div className="flex gap-3 overflow-x-auto py-3 px-6 scrollbar-hide border-b border-[#e0e2ec] dark:border-[#43474e] bg-[#fdfcff] dark:bg-[#1a1c1e] transition-colors duration-300">
                {navLinks.map((nav) => (
                    <button 
                        key={nav.label} 
                        onClick={() => navigate(nav.path)} 
                        className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                            location.pathname.startsWith(nav.path)
                            ? 'bg-[#1a1c1e] text-white dark:bg-[#e3e2e6] dark:text-[#1a1c1e] shadow-md' 
                            : 'bg-[#f2f6fa] dark:bg-[#1a1c1e] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] border border-[#74777f] dark:border-[#8e918f] text-[#43474e] dark:text-[#c4c7c5]'
                        }`}
                    >
                        {nav.label}
                    </button>
                ))}
            </div>

            {/* --- MAIN CONTENT --- */}
            {children}

            {/* --- GLOBAL COMPONENTS --- */}
            <KeyboardShortcuts 
                shortcuts={allShortcuts} 
                isOpen={showShortcuts} 
                onClose={() => setShowShortcuts(false)} 
                onToggle={() => setShowShortcuts(prev => !prev)} 
            />
            <LogoutConfirmation 
                isOpen={showLogoutConfirm} 
                onClose={() => setShowLogoutConfirm(false)} 
                onConfirm={handleLogout} 
            />
            <ChatModal 
                isOpen={showChatModal} 
                onClose={() => setShowChatModal(false)} 
            />
            <GlobalSearch 
                isOpen={showGlobalSearch} 
                onClose={() => setShowGlobalSearch(false)}
                searchQuery={globalSearchQuery}
                setSearchQuery={setGlobalSearchQuery}
                searchResults={globalSearchResults}
            />
        </div>
    );
};

export default ReceptionLayout;
