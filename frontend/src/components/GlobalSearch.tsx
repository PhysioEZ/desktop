import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  id: number;
  name: string;
  phone: string;
  uid: string | null;
  category: "Patient" | "Registration" | "Test" | "Inquiry";
  status: string;
  target_id: number;
  gender: string;
  age: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  searchResults,
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
    const selectedEl = document.getElementById(
      `search-result-${selectedIndex}`,
    );
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const handleSelect = (result: SearchResult) => {
    if (result.category === "Patient" || result.category === "Test") {
      navigate(`/reception/patients?id=${result.target_id}`);
    } else if (result.category === "Registration") {
      navigate(`/reception/registration?id=${result.target_id}`);
    } else if (result.category === "Inquiry") {
      navigate(`/reception/inquiry?id=${result.target_id}`);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchResults.length > 0 && searchResults[selectedIndex]) {
        handleSelect(searchResults[selectedIndex]);
      }
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Patient":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "Registration":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Test":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "Inquiry":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[10015] bg-black/60 backdrop-blur-md flex items-start justify-center pt-[15vh] p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="bg-[#fdfcff] dark:bg-[#111315] w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[70vh] border border-[#e0e2ec] dark:border-[#43474e]"
          >
            {/* Search Input Header */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-[#e0e2ec] dark:border-[#43474e]">
              <Search
                size={24}
                className="text-[#43474e] dark:text-[#c4c7c5]"
              />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by name, phone, UID or category..."
                className="flex-1 bg-transparent border-none outline-none text-xl font-medium text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#74777f]"
              />
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg">
                  ESC to Close
                </span>
              </div>
            </div>

            {/* Results Body */}
            <div className="overflow-y-auto p-4 custom-scrollbar">
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.category}-${result.id}-${index}`}
                      id={`search-result-${index}`}
                      onClick={() => handleSelect(result)}
                      className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                        index === selectedIndex
                          ? "bg-[#e8def8] dark:bg-[#4a4458] translate-x-1 shadow-md"
                          : "hover:bg-[#e8eaed] dark:hover:bg-[#30333b]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${
                            index === selectedIndex
                              ? "bg-[#6750a4] text-white dark:bg-[#d0bcff] dark:text-[#381e72]"
                              : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {result.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3
                              className={`text-base font-bold transition-colors ${
                                index === selectedIndex
                                  ? "text-[#1d192b] dark:text-[#e8def8]"
                                  : "text-[#1a1c1e] dark:text-[#e3e2e6]"
                              }`}
                            >
                              {result.name}
                            </h3>
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getCategoryColor(result.category)}`}
                            >
                              {result.category}
                            </span>
                          </div>
                          <p className="text-xs text-[#43474e] dark:text-[#c4c7c5] font-medium opacity-80">
                            {result.gender !== "N/A"
                              ? `${result.gender}, ${result.age}`
                              : "Inquiry Context"}{" "}
                            • {result.phone}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg transition-colors ${
                            index === selectedIndex
                              ? "bg-[#d0bcff]/20 text-[#381e72] dark:bg-[#e8def8]/20 dark:text-[#e8def8]"
                              : "bg-slate-100 dark:bg-white/5 text-slate-400"
                          }`}
                        >
                          {result.uid && result.uid !== "N/A"
                            ? result.uid
                            : `#${result.id}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-[#74777f] dark:text-[#8e918f]">
                  {searchQuery ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-2">
                        <Search
                          size={32}
                          strokeWidth={1.5}
                          className="opacity-20"
                        />
                      </div>
                      <p className="text-lg font-medium opacity-50">
                        No results found for "{searchQuery}"
                      </p>
                      <p className="text-sm opacity-30 mt-1">
                        Try searching with a different name or phone number
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Search size={64} strokeWidth={1} />
                      <div className="space-y-1">
                        <p className="text-xl font-bold">
                          Unified Global Search
                        </p>
                        <p className="text-sm font-medium">
                          Search Patients, Registration, Tests & Inquiry
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-[#f0f0f0] dark:bg-[#1a1c1e] px-6 py-3 border-t border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center text-xs text-[#43474e] dark:text-[#c4c7c5]">
              <div className="flex gap-4">
                <span>
                  <span className="font-bold">↑↓</span> to navigate
                </span>
                <span>
                  <span className="font-bold">↵</span> to select
                </span>
              </div>
              <div>PhysioEZ Search</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;
