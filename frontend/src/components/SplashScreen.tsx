import * as React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Info } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#fef7ff] dark:bg-[#141218] overflow-hidden font-sans">
      
      {/* MD3 Ambient Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#006a6a]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#6750a4]/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        
        {/* Animated Brand Symbol */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.34, 1.56, 0.64, 1] // MD3 Spring-like ease
          }}
          className="mb-12"
        >
          <div className="relative w-32 h-32 flex items-center justify-center">
             {/* Dynamic Glow Rings */}
             <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
               transition={{ duration: 4, repeat: Infinity }}
               className="absolute inset-0 bg-[#006a6a] rounded-[32px] blur-3xl"
             />
             
             {/* Icon Container */}
             <div className="relative w-24 h-24 rounded-[32px] bg-[#006a6a] text-white flex items-center justify-center shadow-2xl shadow-[#006a6a]/30">
                <ShieldCheck size={56} strokeWidth={1.5} />
             </div>
          </div>
        </motion.div>

        {/* Typography */}
        <div className="text-center">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl font-bold tracking-tight text-[#1c1b1f] dark:text-[#e6e1e5]"
          >
            Physio<span className="text-[#006a6a]">EZ</span>
          </motion.h1>
          
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-[1px] w-12 bg-[#006a6a]/30 mx-auto my-6"
          />

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-xs font-bold text-[#49454f] dark:text-[#cac4d0] tracking-[0.4em] uppercase"
          >
            Intelligence in Motion
          </motion.p>
        </div>

        {/* MD3 Linear Progress Indicator */}
        <div className="mt-16 w-64 h-1 bg-[#006a6a]/10 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-[#006a6a] rounded-full"
          />
        </div>
      </div>

      {/* Footer / Meta */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-12 flex flex-col items-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#eaddff]/20 border border-[#eaddff]/30 text-[10px] font-bold text-[#49454f] dark:text-[#cac4d0] uppercase tracking-widest">
          <Info size={12} /> System Initializing
        </div>
        
        <div className="text-center">
          <p className="text-[11px] font-bold text-[#49454f] dark:text-[#cac4d0] opacity-50 uppercase tracking-tighter">
            Architected by Sumit Srivastava
          </p>
        </div>
      </motion.div>
      
    </div>
  );
};

export default SplashScreen;
