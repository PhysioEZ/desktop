import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';

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
    placeholder = 'Select...', 
    label,
    className = '',
    error,
    disabled = false
}: CustomSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
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
                width: rect.width
            });
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isOpen && 
                triggerRef.current && 
                !triggerRef.current.contains(e.target as Node) && 
                menuRef.current && 
                !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', () => setIsOpen(false), true);
            window.addEventListener('resize', () => setIsOpen(false));
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', () => setIsOpen(false), true);
            window.removeEventListener('resize', () => setIsOpen(false));
        };
    }, [isOpen]);

    const selectedLabel = options.find(o => o.value === value)?.label || '';

    // M3 Outlined Border logic
    const baseTriggerClass = `
        relative w-full px-4 py-3 text-left
        bg-white dark:bg-[#1a1c1e]
        border
        ${error ? 'border-[#ba1a1a] dark:border-[#ffb4ab] ring-1 ring-[#ba1a1a]' : isOpen ? 'border-[#006a6a] dark:border-[#80d4d4] ring-1 ring-[#006a6a]' : 'border-[#79747e] dark:border-[#938f99]'}
        rounded-xl
        text-[#1c1b1f] dark:text-[#e6e1e5] 
        text-sm font-medium
        focus:outline-none 
        hover:border-[#1c1b1f] dark:hover:border-[#e6e1e5]
        transition-all
        flex items-center justify-between
        ${disabled ? 'opacity-38 cursor-not-allowed bg-transparent border-[#1c1b1f]/12' : 'cursor-pointer'}
        ${className}
    `;

    return (
        <div className="w-full relative group">
            {label && (
                <span className={`
                    absolute -top-2 left-3 px-1 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-[#1a1c1e] z-10 
                    ${error ? 'text-[#ba1a1a] dark:text-[#ffb4ab]' : isOpen ? 'text-[#006a6a] dark:text-[#80d4d4]' : 'text-[#49454f] dark:text-[#cac4d0]'}
                `}>
                    {label}
                </span>
            )}
            
            <button
                ref={triggerRef}
                onClick={toggleOpen}
                type="button"
                className={baseTriggerClass}
            >
                <span className={!value ? 'text-[#49454f] dark:text-[#cac4d0]' : ''}>
                    {value ? selectedLabel : placeholder}
                </span>
                <ChevronDown 
                    size={18} 
                    className={`text-[#49454f] dark:text-[#cac4d0] transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {error && (
                <div className="flex items-center gap-1 mt-1 px-1 text-[11px] font-medium text-[#ba1a1a] dark:text-[#ffb4ab]">
                    <AlertCircle size={12} />
                    <span>{error}</span>
                </div>
            )}

            {isOpen && createPortal(
                <AnimatePresence>
                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed z-[99999] bg-[#f7f2fa] dark:bg-[#2b2930] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col py-2 max-h-[300px] overflow-y-auto custom-scrollbar border border-transparent dark:border-[#49454f]"
                        style={{
                            top: coords.top,
                            left: coords.left,
                            width: coords.width
                        }}
                    >
                        {options.length > 0 ? (
                            options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={option.disabled}
                                    onClick={(e) => {
                                        if (option.disabled) return;
                                        e.stopPropagation();
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full text-left px-4 py-2.5 text-sm font-medium flex items-center justify-between 
                                        transition-colors
                                        ${option.disabled 
                                            ? 'opacity-38 cursor-not-allowed text-[#1c1b1f]/38' 
                                            : value === option.value 
                                                ? 'bg-[#006a6a]/12 text-[#006a6a] dark:text-[#80d4d4]' 
                                                : 'text-[#1c1b1f] dark:text-[#e6e1e5] hover:bg-[#1c1b1f]/8 dark:hover:bg-[#e6e1e5]/8'}
                                    `}
                                >
                                    {option.label}
                                    {value === option.value && <Check size={16} />}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-[#49454f] dark:text-[#cac4d0] italic text-center">
                                No options available
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default CustomSelect;
