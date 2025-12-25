import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

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
        const duration = 2000; // 2 seconds
        const intervalTime = 20; 
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
            if (user?.role === 'admin' || user?.role === 'superadmin') {
               // FUTURE: navigate('/admin/dashboard');
               navigate('/reception/dashboard'); // For now, we only have reception dashboard
            } else {
               navigate('/reception/dashboard');
            }
        }, duration + 200);

        return () => {
            clearInterval(timer);
            clearTimeout(redirectTimer);
        };
    }, [navigate, user]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl p-8 md:p-12 text-center animate-fadeIn">
                
                {/* Logo Section */}
                {/* Using a generic placeholder div for now since we might not have the image assets locally yet */}
                <div className="h-24 mx-auto mb-8 flex items-center justify-center">
                    <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 text-4xl shadow-lg">
                        <i className="fa-solid fa-hospital-user"></i>
                    </div>
                </div>

                {/* Welcome Text */}
                <div className="space-y-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                        Welcome, <span className="text-teal-600">{user.name}</span>
                    </h1>
                    
                    <div className="h-px w-24 bg-gray-200 mx-auto my-6"></div>

                    <h2 className="text-xl font-medium text-gray-600">
                        {/* We could map branch_id to name later, for now generic or just the greeting */}
                        Let's get started.
                    </h2>
                    
                    <p className="text-gray-500 max-w-lg mx-auto">
                        Setting up your dashboard...
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="max-w-md mx-auto mt-10">
                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2 invisible">
                        <span>Loading...</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-teal-500 h-full rounded-full transition-all duration-75 ease-out" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default WelcomeScreen;
