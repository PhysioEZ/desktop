import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Sparkles, 
  User as UserIcon,
  LayoutDashboard
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const WelcomeScreen = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [progress, setProgress] = useState(0);

    // If no user, redirect to login
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    useEffect(() => {
        const duration = 2500; 
        const intervalTime = 30; 
        const increment = (intervalTime / duration) * 100;
        
        const timer = setInterval(() => {
            setProgress((prev) => {
                const next = prev + increment;
                if (next >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                return next;
            });
        }, intervalTime);

        // Redirect after completion
        const redirectTimer = setTimeout(() => {
            if (user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'developer') {
               navigate('/admin/dashboard');
            } else {
               navigate('/reception/dashboard');
            }
        }, duration + 500);

        return () => {
            clearInterval(timer);
            clearTimeout(redirectTimer);
        };
    }, [navigate, user]);

    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col bg-[#fef7ff] dark:bg-[#141218] overflow-hidden font-sans relative">
            
            {/* MD3 Ambient Background */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#006a6a]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#6750a4]/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-2xl"
                >
                    {/* Brand Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#006a6a]/10 border border-[#006a6a]/20 mb-12">
                        <ShieldCheck size={16} className="text-[#006a6a]" />
                        <span className="text-[10px] font-bold text-[#006a6a] uppercase tracking-widest">Authenticated Session</span>
                    </div>

                    {/* User Profile Section */}
                    <div className="mb-10 flex flex-col items-center">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                            className="relative mb-6"
                        >
                            <div className="w-32 h-32 rounded-[40px] p-1.5 bg-gradient-to-tr from-[#006a6a] to-[#6750a4] shadow-xl">
                                <div className="w-full h-full rounded-[36px] bg-white dark:bg-[#1d1b20] overflow-hidden flex items-center justify-center border-4 border-white dark:border-[#1d1b20]">
                                    {user.photo ? (
                                        <img 
                                            src={`${API_BASE_URL.replace('/api', '')}/${user.photo}`} 
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as any).src = "https://ui-avatars.com/api/?name=" + user.name + "&background=006a6a&color=fff";
                                            }}
                                        />
                                    ) : (
                                        <UserIcon size={48} className="text-[#49454f] dark:text-[#cac4d0]" />
                                    )}
                                </div>
                            </div>
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-[#006a6a] text-white flex items-center justify-center shadow-lg"
                            >
                                <Sparkles size={20} />
                            </motion.div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h1 className="text-4xl md:text-5xl font-bold text-[#1c1b1f] dark:text-[#e6e1e5] tracking-tight">
                                Welcome, <span className="text-[#006a6a]">{user.name.split(' ')[0]}</span>
                            </h1>
                            <p className="text-[#49454f] dark:text-[#cac4d0] mt-4 text-sm font-medium tracking-wide uppercase opacity-70">
                                Authorized as <span className="text-[#6750a4] font-bold">{user.role}</span>
                            </p>
                        </motion.div>
                    </div>

                    {/* Modern Loading Divider */}
                    <div className="flex items-center justify-center gap-4 my-10 px-12">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#cac4d0] dark:to-[#49454f]" />
                        <LayoutDashboard size={18} className="text-[#cac4d0] dark:text-[#49454f]" />
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#cac4d0] dark:to-[#49454f]" />
                    </div>

                    {/* Progress Loader (MD3 Style) */}
                    <div className="max-w-sm mx-auto space-y-4">
                        <p className="text-xs font-bold text-[#49454f] dark:text-[#cac4d0] uppercase tracking-widest">
                            Syncing Workspace Data
                        </p>
                        <div className="w-full h-1.5 bg-[#006a6a]/10 rounded-full overflow-hidden relative">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-[#006a6a] rounded-full"
                            />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-[#006a6a] uppercase tracking-tighter">
                            <span className="animate-pulse">Loading modules...</span>
                            <span>{Math.round(progress)}% Complete</span>
                        </div>
                    </div>

                </motion.div>
            </div>

            {/* Bottom Accent */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-30">
                 <div className="flex items-center gap-3 text-[#1c1b1f] dark:text-[#e6e1e5]">
                     <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Next Gen Medical Systems</span>
                 </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
