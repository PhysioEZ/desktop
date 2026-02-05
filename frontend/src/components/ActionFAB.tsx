import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  UserPlus,
  FlaskConical,
  PhoneCall,
  Beaker,
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

export type FABAction = "registration" | "test" | "inquiry" | "test_inquiry";

interface ActionFABProps {
  onAction: (action: FABAction) => void;
}

const ActionFAB: React.FC<ActionFABProps> = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isDark } = useThemeStore();

  const actions = [
    {
      label: "New Registration",
      icon: UserPlus,
      id: "registration" as FABAction,
      color: "bg-emerald-500",
    },
    {
      label: "Book Lab Test",
      icon: FlaskConical,
      id: "test" as FABAction,
      color: "bg-blue-500",
    },
    {
      label: "Quick Inquiry",
      icon: PhoneCall,
      id: "inquiry" as FABAction,
      color: "bg-purple-500",
    },
    {
      label: "Test Inquiry",
      icon: Beaker,
      id: "test_inquiry" as FABAction,
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="fixed bottom-8 right-8 flex flex-col gap-4 items-end z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as any }}
            className="flex flex-col gap-3 mb-4"
          >
            {actions.map((btn, idx) => (
              <motion.button
                key={btn.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  onAction(btn.id);
                  setIsOpen(false);
                }}
                className={`group flex items-center gap-4 pl-5 pr-7 py-4 rounded-[22px] shadow-2xl transition-all hover:scale-105 active:scale-95 whitespace-nowrap border border-white/10 ${
                  isDark
                    ? "bg-[#1A1C1A] text-white hover:bg-[#252825]"
                    : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${btn.color}`}
                >
                  <btn.icon size={20} />
                </div>
                <span className="font-bold text-sm tracking-tight opacity-80 group-hover:opacity-100">
                  {btn.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[24px] shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 z-50 group ${
          isOpen ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
        }`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {isOpen ? (
            <X size={32} strokeWidth={2.5} />
          ) : (
            <Plus size={32} strokeWidth={2.5} />
          )}
        </motion.div>

        {!isOpen && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-[24px] bg-emerald-500 -z-10"
          />
        )}
      </button>
    </div>
  );
};

export default ActionFAB;
