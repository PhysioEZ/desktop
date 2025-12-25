import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';

interface Option {
    value: string;
    label: string;
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
                top: rect.bottom + 6,
                left: rect.left,
                width: rect.width
            });
        }
        setIsOpen(!isOpen);
    };

    // Handle Click Outside & Scroll
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

        const handleScroll = (e: Event) => {
            // allow scrolling inside the menu itself
            if (menuRef.current && menuRef.current.contains(e.target as Node)) {
                return;
            }
            // close if scrolling happening outside (e.g. main page scroll moves trigger)
            setIsOpen(false);
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true); // capture phase to detect any scroll
            window.addEventListener('resize', () => setIsOpen(false));
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', () => setIsOpen(false));
        };
    }, [isOpen]);

    // Find current label
    const selectedLabel = options.find(o => o.value === value)?.label || '';

    // M3 Styles
    const baseTriggerClass = `
        w-full px-4 py-3 text-left
        bg-[#e0e2ec] dark:bg-[#43474e] 
        border-b-2 
        ${error ? 'border-[#b3261e] dark:border-[#ffb4ab]' : isOpen ? 'border-[#006e1c] dark:border-[#88d99d]' : 'border-[#74777f] dark:border-[#8e918f]'}
        rounded-t-lg 
        text-[#1a1c1e] dark:text-[#e3e2e6] 
        text-base 
        focus:outline-none 
        hover:bg-[#dadae2] dark:hover:bg-[#50545c]
        transition-colors
        flex items-center justify-between
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
    `;

    return (
        <div className="w-full relative">
            {label && (
                <label className="block text-xs font-medium text-[#43474e] dark:text-[#c4c7c5] mb-1 px-1">
                    {label}
                </label>
            )}
            
            <button
                ref={triggerRef}
                onClick={toggleOpen}
                type="button"
                className={baseTriggerClass}
            >
                <span className={!value ? 'text-[#43474e] dark:text-[#8e918f]' : ''}>
                    {value ? selectedLabel : placeholder}
                </span>
                <ChevronDown 
                    size={20} 
                    className={`text-[#43474e] dark:text-[#c4c7c5] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {error && (
                <div className="flex items-center gap-1 mt-1 px-1 text-xs text-[#b3261e] dark:text-[#ffb4ab]">
                    <AlertCircle size={12} />
                    <span>{error}</span>
                </div>
            )}

            {/* Portal Menu */}
            {isOpen && createPortal(
                <AnimatePresence>
                    <motion.div
                        ref={menuRef}
                        id={`select-menu-${label?.replace(/\s/g, '') || 'dropdown'}`}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.1 }}
                        className="fixed z-[99999] bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-lg shadow-xl border border-[#e0e2ec] dark:border-[#43474e] overflow-hidden flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar"
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full text-left px-4 py-3 text-sm font-medium flex items-center justify-between 
                                        transition-colors
                                        ${value === option.value 
                                            ? 'bg-[#ccebc4]/30 text-[#006e1c] dark:text-[#88d99d]' 
                                            : 'text-[#1a1c1e] dark:text-[#e3e2e6] hover:bg-[#e0e2ec] dark:hover:bg-[#43474e]'}
                                    `}
                                >
                                    {option.label}
                                    {value === option.value && <Check size={16} className="text-[#006e1c] dark:text-[#88d99d]" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-[#43474e] dark:text-[#8e918f] italic text-center">
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
