import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PatientResult {
    patient_id: number;
    patient_name: string;
    patient_uid: string | null;
    age: string;
    gender: string;
    phone_number: string;
    status: string;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: PatientResult[];
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ 
    isOpen, 
    onClose, 
    searchQuery, 
    setSearchQuery, 
    searchResults
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setSelectedIndex(0); // Reset selection
        }
    }, [isOpen]);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchResults]);

    // Scroll selected item into view
    useEffect(() => {
        const selectedEl = document.getElementById(`search-result-${selectedIndex}`);
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const handleSelect = (patient: PatientResult) => {
        navigate('/reception/patients?id=' + patient.patient_id);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (searchResults.length > 0 && searchResults[selectedIndex]) {
                handleSelect(searchResults[selectedIndex]);
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10015] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="bg-[#fdfcff] dark:bg-[#111315] w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
                    >
                        {/* Search Input Header */}
                        <div className="flex items-center gap-4 px-6 py-5 border-b border-[#e0e2ec] dark:border-[#43474e]">
                            <Search size={24} className="text-[#43474e] dark:text-[#c4c7c5]" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search patients by name, phone, or ID..."
                                className="flex-1 bg-transparent border-none outline-none text-xl font-medium text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#74777f]"
                            />
                            <button onClick={onClose} className="p-2 hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] rounded-full transition-colors">
                                <span className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] border border-[#74777f] rounded px-1.5 py-0.5">ESC</span>
                            </button>
                        </div>

                        {/* Results Body */}
                        <div className="overflow-y-auto p-2">
                            {searchResults.length > 0 ? (
                                <div className="space-y-1">
                                    {searchResults.map((patient, index) => (
                                        <div 
                                            key={patient.patient_id}
                                            id={`search-result-${index}`}
                                            onClick={() => handleSelect(patient)}
                                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                                                index === selectedIndex 
                                                ? 'bg-[#e8def8] dark:bg-[#4a4458]' 
                                                : 'hover:bg-[#e8eaed] dark:hover:bg-[#30333b]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                                                    index === selectedIndex 
                                                    ? 'bg-[#6750a4] text-white dark:bg-[#d0bcff] dark:text-[#381e72]'
                                                    : 'bg-[#eaddff] dark:bg-[#4f378b] text-[#21005d] dark:text-[#eaddff]'
                                                }`}>
                                                    {patient.patient_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className={`text-base font-bold transition-colors ${
                                                        index === selectedIndex 
                                                        ? 'text-[#1d192b] dark:text-[#e8def8]' 
                                                        : 'text-[#1a1c1e] dark:text-[#e3e2e6] group-hover:text-[#006e1c] dark:group-hover:text-[#88d99d]'
                                                    }`}>
                                                        {patient.patient_name}
                                                    </h3>
                                                    <p className="text-xs text-[#43474e] dark:text-[#c4c7c5]">
                                                        {patient.gender}, {patient.age} • {patient.phone_number}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
                                                    index === selectedIndex 
                                                    ? 'bg-[#d0bcff] text-[#381e72] dark:bg-[#e8def8] dark:text-[#1d192b]'
                                                    : 'bg-[#e0e2ec] dark:bg-[#43474e] text-[#1a1c1e] dark:text-[#e3e2e6]'
                                                }`}>
                                                    ID: {patient.patient_uid || patient.patient_id}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-[#74777f] dark:text-[#8e918f]">
                                    {searchQuery ? (
                                        <p>No results found for "{searchQuery}"</p>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                            <Search size={48} strokeWidth={1} />
                                            <p>Type to search...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Footer */}
                        <div className="bg-[#f0f0f0] dark:bg-[#1a1c1e] px-6 py-3 border-t border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center text-xs text-[#43474e] dark:text-[#c4c7c5]">
                            <div className="flex gap-4">
                                <span><span className="font-bold">↑↓</span> to navigate</span>
                                <span><span className="font-bold">↵</span> to select</span>
                            </div>
                            <div>
                                PhysioEZ Search
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default GlobalSearch;
