import { useState, useCallback, useEffect } from 'react';
import { 
    Zap, Search, RefreshCw, Sun, Moon, User, 
    BarChart3, Activity, Users, TestTube2, CreditCard, 
    ArrowUpRight, ArrowDownRight, Clock, ChevronRight,
    AlertCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { apiGet } from '../utils/api';
import GlobalSearch from '../components/GlobalSearch';
import KeyboardShortcuts from '../components/KeyboardShortcuts';
import type { ShortcutItem } from '../components/KeyboardShortcuts';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showGlobalModal, setShowGlobalModal] = useState(false);
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [searchResults] = useState([]); // Placeholder
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiGet('/admin/dashboard');
            if (response.status === 'success') {
                setDashboardData(response.data);
            } else {
                setError(response.message || 'Failed to fetch dashboard data');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const toggleTheme = useCallback(() => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const shortcuts: ShortcutItem[] = [
        { keys: ['Alt', '/'], description: 'Toggle Keyboard Shortcuts', group: 'General', action: () => setShowShortcuts(p => !p) },
        { keys: ['Alt', 'S'], description: 'Open Global Search', group: 'General', action: () => setShowGlobalModal(true) },
        { keys: ['Alt', 'W'], description: 'Toggle Dark Mode', group: 'General', action: toggleTheme },
        { keys: ['Alt', 'L'], description: 'Logout', group: 'General', action: () => setShowLogoutConfirm(true) },
        { keys: ['Alt', 'R'], description: 'Refresh Data', group: 'General', action: fetchDashboardData },
    ];

    const navigationItems = [
        { label: 'Admin Hub', path: '/admin/dashboard', active: true },
        { label: 'Service Tracks', path: '/admin/services', active: false },
        { label: 'Users', path: '/admin/users', active: false },
        { label: 'Referrals', path: '/admin/referrals', active: false },
        { label: 'Settings', path: '/admin/settings', active: false },
    ];

    const kpis = [
        { 
            label: "Today's Revenue", 
            value: `₹${dashboardData?.metrics?.today_revenue?.toLocaleString() || '0'}`, 
            change: "+12.5%", 
            positive: true,
            icon: CreditCard,
            color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
            borderColor: "border-emerald-100 dark:border-emerald-500/20"
        },
        { 
            label: "New Registrations", 
            value: dashboardData?.metrics?.today_registrations || '0', 
            change: "Today", 
            positive: true,
            icon: Users,
            color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
            borderColor: "border-blue-100 dark:border-blue-500/20"
        },
        { 
            label: "Today's Tests", 
            value: dashboardData?.metrics?.today_tests || '0', 
            change: "Live", 
            positive: true,
            icon: TestTube2,
            color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10",
            borderColor: "border-orange-100 dark:border-orange-500/20"
        },
        { 
            label: "Monthly Revenue", 
            value: `₹${((dashboardData?.metrics?.month_revenue || 0) / 100000).toFixed(1)}L`, 
            change: "Current Month", 
            positive: true,
            icon: BarChart3,
            color: "text-purple-600 bg-purple-50 dark:bg-purple-500/10",
            borderColor: "border-purple-100 dark:border-purple-500/20"
        }
    ];

    const getActivityIcon = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('create') || t.includes('add')) return Zap;
        if (t.includes('update') || t.includes('edit')) return RefreshCw;
        if (t.includes('delete') || t.includes('remove')) return Activity;
        return Clock;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F8F9FF] dark:bg-[#0F1117] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="text-primary-600 animate-spin" />
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 animate-pulse uppercase tracking-[0.2em]">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F8F9FF] dark:bg-[#0F1117] flex items-center justify-center">
                <div className="max-w-md w-full p-8 bg-white dark:bg-[#1C1B22] rounded-[2.5rem] border border-red-100 dark:border-red-900/30 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
                        <AlertCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Sync Error</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">{error}</p>
                    <button 
                        onClick={fetchDashboardData}
                        className="h-12 w-full rounded-2xl bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-600/30 hover:shadow-primary-600/40 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} />
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FF] dark:bg-[#0F1117] text-[#1C1B1F] dark:text-[#E6E1E5] transition-colors duration-300">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-[#1C1B22]/80 backdrop-blur-xl z-40 border-b border-gray-100 dark:border-gray-800">
                <div className="h-full px-6 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                                <Zap className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase">PhysioEZ</h1>
                                <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 tracking-[0.2em] uppercase">Admin Panel</p>
                            </div>
                        </div>

                        <nav className="hidden lg:flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                            {navigationItems.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => navigate(item.path)}
                                    className={`
                                        px-5 py-2 rounded-xl text-xs font-bold transition-all
                                        ${item.active 
                                            ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'}
                                    `}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <button onClick={() => setShowGlobalModal(true)} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all rounded-xl hover:bg-white dark:hover:bg-gray-700">
                                <Search size={18} />
                            </button>
                            <button onClick={fetchDashboardData} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all rounded-xl hover:bg-white dark:hover:bg-gray-700">
                                <RefreshCw size={18} />
                            </button>
                            <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all rounded-xl hover:bg-white dark:hover:bg-gray-700">
                                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        </div>

                        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                            <div className="relative">
                                <button className="flex items-center gap-3 p-1 pr-3 bg-gray-50 dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-all">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs uppercase">
                                        {user?.name?.charAt(0) || <User size={16} />}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 hidden sm:block">{user?.name}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20 px-6 max-w-[1600px] mx-auto">
                <div className="mb-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Welcome Back, <span className="text-primary-600 dark:text-primary-400">{user?.name}</span>
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium flex items-center gap-2">
                            <Clock size={16} />
                            Here's what's happening at your center today.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {kpis.map((kpi, idx) => (
                        <motion.div 
                            key={kpi.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-6 rounded-[2rem] border ${kpi.borderColor} dark:bg-[#1a1c1e] bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${kpi.color}`}>
                                    <kpi.icon size={24} />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${kpi.positive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-red-600 bg-red-50 dark:bg-red-500/10'}`}>
                                    {kpi.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {kpi.change}
                                </div>
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{kpi.label}</span>
                            <div className="text-3xl font-black text-gray-900 dark:text-white mt-1">{kpi.value}</div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Recent System Activity</h3>
                            <button className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
                                View Full Records <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="bg-white dark:bg-[#1a1c1e] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                {dashboardData?.activity?.map((activity: any, idx: number) => {
                                    const ActionIcon = getActivityIcon(activity.action_type);
                                    return (
                                        <div key={idx} className="p-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                                    <ActionIcon size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-white lowercase first-letter:uppercase">
                                                        {activity.username} <span className="font-medium text-gray-500 dark:text-gray-400">{activity.action_type}</span> {activity.target_table} #{activity.target_id}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-0.5">{new Date(activity.log_timestamp).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-black uppercase text-gray-500">
                                                Audit
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!dashboardData?.activity || dashboardData.activity.length === 0) && (
                                    <div className="p-12 text-center text-gray-400 font-medium italic">
                                        No recent activity recorded.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white px-2">Quick Actions</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <button onClick={() => navigate('/admin/services')} className="p-6 rounded-[2rem] bg-gradient-to-br from-primary-600 to-indigo-700 text-white shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40 hover:-translate-y-1 transition-all text-left">
                                <Activity size={32} className="mb-4 opacity-80" />
                                <div className="text-lg font-black leading-tight">Manage Service Tracks</div>
                                <div className="text-sm font-medium opacity-70 mt-1">Configure departments, plans & logic</div>
                            </button>
                            <button className="p-6 rounded-[2rem] bg-white dark:bg-[#1a1c1e] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
                                <Users size={32} className="mb-4 text-primary-600 group-hover:scale-110 transition-transform" />
                                <div className="text-lg font-black text-gray-900 dark:text-white leading-tight">Staff Management</div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Manage employees and permissions</div>
                            </button>
                            <button className="p-6 rounded-[2rem] bg-white dark:bg-[#1a1c1e] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
                                <BarChart3 size={32} className="mb-4 text-purple-600 group-hover:scale-110 transition-transform" />
                                <div className="text-lg font-black text-gray-900 dark:text-white leading-tight">Financial Reports</div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Detailed revenue and expense analysis</div>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <GlobalSearch 
                isOpen={showGlobalModal} 
                onClose={() => setShowGlobalModal(false)} 
                searchQuery={globalSearchQuery}
                setSearchQuery={setGlobalSearchQuery}
                searchResults={searchResults}
            />
            <KeyboardShortcuts 
                isOpen={showShortcuts} 
                onClose={() => setShowShortcuts(false)} 
                onToggle={() => setShowShortcuts(!showShortcuts)}
                shortcuts={shortcuts} 
            />

            <AnimatePresence>
                {showLogoutConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowLogoutConfirm(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-sm rounded-[28px] shadow-2xl relative z-10 p-8 text-center border border-[#e0e2ec] dark:border-[#43474e]">
                            <div className="w-16 h-16 rounded-full bg-[#ffdad6] dark:bg-[#93000a] text-[#410002] dark:text-[#ffdad6] mx-auto flex items-center justify-center mb-6"><BarChart3 size={32} /></div>
                            <h3 className="text-xl font-black text-[#1a1c1e] dark:text-[#e3e2e6] mb-2">Logout</h3>
                            <p className="text-sm font-medium text-[#43474e] dark:text-[#c4c7c5] mb-8">Are you sure you want to log out?</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 bg-[#e0e2ec] dark:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6] rounded-full text-xs font-bold">Cancel</button>
                                <button onClick={() => { logout(); navigate('/login'); }} className="flex-1 py-2.5 bg-[#ba1a1a] text-white rounded-full text-xs font-bold shadow-md">Logout</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
