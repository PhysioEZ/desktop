import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, AlertCircle } from "lucide-react";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  label,
  className = "",
  error,
  disabled = false,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    align?: "top" | "bottom";
  }>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleOpen = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const menuHeight = 250; // max-h
        const spaceBelow = window.innerHeight - rect.bottom;
        const showAbove = spaceBelow < menuHeight && rect.top > menuHeight;

        setCoords({
          top: showAbove ? rect.top - 8 : rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          align: showAbove ? "bottom" : "top",
        });
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen]);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  // SaaS Standard Neutral Border
  const baseTriggerClass = `
        relative w-full px-4 py-3 text-left
        bg-white dark:bg-white/[0.03]
        border
        ${error ? "border-rose-500/50 ring-1 ring-rose-500/10" : isOpen ? "border-emerald-500 ring-1 ring-emerald-500/20" : "border-slate-100 dark:border-white/5"}
        rounded-xl
        text-slate-900 dark:text-slate-100 
        text-[13px] font-bold
        focus:outline-none 
        hover:border-slate-300 dark:hover:border-white/10
        transition-all
        flex items-center justify-between
        ${disabled ? "opacity-40 cursor-not-allowed bg-slate-50/50" : "cursor-pointer"}
        ${className}
    `;

  return (
    <div className="w-full relative group">
      {label && (
        <span
          className={`
                    absolute -top-2 left-3 px-1.5 text-[10px] font-black uppercase rounded-md tracking-widest bg-white dark:bg-[#0A0B0A] z-10 
                    ${error ? "text-rose-500" : isOpen ? "text-emerald-500" : "text-slate-400"}
                `}
        >
          {label}
        </span>
      )}

      <button
        ref={triggerRef}
        onClick={toggleOpen}
        type="button"
        className={baseTriggerClass}
      >
        <span className={!value ? "text-slate-400 dark:text-slate-500" : ""}>
          {value ? selectedLabel : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-500 transition-transform duration-300 ease-out ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {error && (
        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] font-bold text-rose-500">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}

      {isOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={menuRef}
              initial={{
                opacity: 0,
                scale: 0.98,
                y: coords.align === "top" ? -4 : 4,
              }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.98,
                y: coords.align === "top" ? -4 : 4,
              }}
              transition={{ duration: 0.15 }}
              className="fixed z-[99999] bg-white dark:bg-[#121415] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col py-2 max-h-[250px] overflow-y-auto custom-scrollbar border border-slate-100 dark:border-white/10"
              style={{
                top: coords.align === "top" ? coords.top : "auto",
                bottom:
                  coords.align === "bottom"
                    ? window.innerHeight - coords.top
                    : "auto",
                left: coords.left,
                width: coords.width,
              }}
            >
              {options.length > 0 ? (
                options.map((option, idx) => (
                  <button
                    key={`${option.value}-${idx}`}
                    type="button"
                    disabled={option.disabled}
                    onClick={(e) => {
                      if (option.disabled) return;
                      e.stopPropagation();
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`
                                        w-full text-left px-4 py-2.5 text-[13px] font-bold flex items-center justify-between 
                                        transition-colors
                                        ${
                                          option.disabled
                                            ? "opacity-30 cursor-not-allowed text-slate-400"
                                            : value === option.value
                                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                        }
                                    `}
                  >
                    {option.label}
                    {value === option.value && (
                      <Check size={16} className="text-emerald-500" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-[#49454f] dark:text-[#cac4d0] italic text-center">
                  No options available
                </div>
              )}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};

export default CustomSelect;
