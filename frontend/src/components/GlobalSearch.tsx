import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, LayoutGrid, Phone, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../store/useThemeStore";

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
  onSearch: () => void;
  isLoading?: boolean;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSearch,
  isLoading = false,
}) => {
  const { isDark } = useThemeStore();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleSelect = (p: SearchResult) => {
    setSearchQuery("");
    onClose();
    if (p.category === "Patient" || p.category === "Test") {
      navigate(`/reception/patients?id=${p.target_id}`);
    } else if (p.category === "Registration") {
      navigate(`/reception/registration?id=${p.target_id}`);
    } else if (p.category === "Inquiry") {
      navigate(`/reception/inquiry?id=${p.target_id}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[8px] z-[10015] cursor-default"
          />

          {/* Search Results Centered Modal */}
          <motion.div
            id="search-modal-container"
            initial={{ opacity: 0, y: -20, x: "-50%", scale: 0.95 }}
            animate={{ opacity: 1, y: "-50%", x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: -20, x: "-50%", scale: 0.95 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed top-1/2 left-1/2 p-0 rounded-[40px] shadow-[0_64px_120px_-30px_rgba(0,0,0,0.5)] border overflow-hidden z-[10020] w-[680px] max-w-[95vw] ${
              isDark
                ? "bg-[#1A1C1A]/95 border-white/10 backdrop-blur-3xl ring-1 ring-white/5"
                : "bg-white/95 border-gray-200 shadow-2xl backdrop-blur-3xl"
            }`}
          >
            {/* Modal Search Input Header */}
            <div className="p-6 border-b dark:border-white/5 border-gray-100">
              <div className="flex items-center px-6 py-4 rounded-[28px] bg-black/5 dark:bg-white/5 border border-transparent focus-within:border-emerald-500/30 transition-all">
                <Search size={22} className="opacity-30 mr-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearch();
                  }}
                  className={`bg-transparent border-none outline-none text-xl w-full placeholder:opacity-20 font-medium ${
                    isDark ? "text-white" : "text-black"
                  }`}
                />
                <div className="flex items-center gap-2 ml-4">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all"
                    >
                      <X size={20} className="opacity-40" />
                    </button>
                  )}
                  <button
                    onClick={onSearch}
                    disabled={isLoading || !searchQuery.trim()}
                    className={`px-6 py-2 rounded-2xl font-bold text-sm transition-all shadow-sm ${
                      isDark
                        ? "bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-20"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400"
                    }`}
                  >
                    {isLoading ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
              {!searchQuery ? (
                <div className="p-10 space-y-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 flex items-center justify-center text-emerald-500 relative group">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-[24px] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                      <LayoutGrid size={32} className="relative" />
                    </div>
                    <div>
                      <h3
                        className={`text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}
                      >
                        Universal Search
                      </h3>
                      <p className="text-base opacity-40 font-medium tracking-tight">
                        Navigate to any patient, lead, or record instantly.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      {
                        label: "Patients",
                        desc: "Access full medical history",
                        icon: "PT",
                        color: "emerald",
                      },
                      {
                        label: "Contacts",
                        desc: "Manage phone & mobile info",
                        icon: "CH",
                        color: "blue",
                      },
                      {
                        label: "Records",
                        desc: "Lab & test diagnostic IDs",
                        icon: "RX",
                        color: "purple",
                      },
                      {
                        label: "Inquiries",
                        desc: "Lead follow-ups & funnel",
                        icon: "IQ",
                        color: "orange",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`p-6 rounded-[32px] border transition-all duration-300 group/card cursor-default ${
                          isDark
                            ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.07] hover:border-white/10"
                            : "bg-gray-50/50 border-gray-100 hover:bg-white hover:shadow-2xl hover:shadow-black/[0.04] hover:border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black tracking-tighter transition-transform duration-500 group-hover/card:scale-110 group-hover/card:rotate-3 ${
                              item.color === "emerald"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : item.color === "blue"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : item.color === "purple"
                                    ? "bg-purple-500/10 text-purple-500"
                                    : "bg-orange-500/10 text-orange-500"
                            }`}
                          >
                            {item.icon}
                          </div>
                          <div>
                            <div
                              className={`font-bold text-sm uppercase tracking-widest opacity-80 mb-0.5 ${isDark ? "text-white" : "text-black"}`}
                            >
                              {item.label}
                            </div>
                            <div className="text-xs opacity-40 font-medium">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t dark:border-white/5 border-gray-100">
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest opacity-20">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded border border-current">
                          ↑↓
                        </span>
                        <span>Navigate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded border border-current">
                          Enter
                        </span>
                        <span>Select</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded border border-current">
                          ESC
                        </span>
                        <span>Close</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  <div className="px-8 py-6 mb-2">
                    <span className="text-xs font-black uppercase tracking-[0.3em] opacity-20">
                      Search Results
                    </span>
                  </div>
                  <div className="space-y-1.5 px-2 pb-10">
                    {searchResults.map((p, idx) => (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        key={`${p.category}-${p.id}-${idx}`}
                        onClick={() => handleSelect(p)}
                        className={`p-5 rounded-[28px] cursor-pointer transition-all flex items-center justify-between group ${
                          isDark
                            ? "hover:bg-white/[0.05]"
                            : "hover:bg-gray-50 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <div
                            className={`w-14 h-14 rounded-[20px] shadow-inner flex items-center justify-center font-bold text-xl relative ${
                              p.category === "Patient"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : p.category === "Registration"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : p.category === "Test"
                                    ? "bg-purple-500/10 text-purple-500"
                                    : "bg-orange-500/10 text-orange-500"
                            }`}
                          >
                            {p.name.charAt(0)}
                            <div
                              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 ${isDark ? "border-[#1A1C1A]" : "border-white"} flex items-center justify-center text-[8px] font-black uppercase ${
                                p.category === "Patient"
                                  ? "bg-emerald-500 text-white"
                                  : p.category === "Registration"
                                    ? "bg-blue-500 text-white"
                                    : p.category === "Test"
                                      ? "bg-purple-500 text-white"
                                      : "bg-orange-500 text-white"
                              }`}
                            >
                              {p.category.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <p
                                className={`font-bold text-lg tracking-tight leading-none ${isDark ? "text-white" : "text-black"}`}
                              >
                                {p.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm opacity-40 font-medium">
                              <div className="flex items-center gap-1.5">
                                <Phone size={12} className="opacity-50" />
                                <span>{p.phone}</span>
                              </div>
                              {p.uid && p.uid !== "N/A" && (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1 h-1 rounded-full bg-current opacity-30" />
                                  <span>{p.uid}</span>
                                </div>
                              )}
                              {p.age && p.age !== "N/A" && (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1 h-1 rounded-full bg-current opacity-30" />
                                  <span>{p.age}y</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <ArrowUpRight size={20} strokeWidth={2.5} />
                        </div>
                      </motion.div>
                    ))}
                    {searchResults.length === 0 && (
                      <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-gray-500/5 rounded-[40px] flex items-center justify-center mx-auto mb-6 transform rotate-12">
                          <Search size={40} className="opacity-10" />
                        </div>
                        <p className="text-lg font-bold opacity-20 uppercase tracking-[0.2em]">
                          No direct matches
                        </p>
                        <p className="text-sm opacity-40 font-medium mt-1">
                          Try searching by name, phone or ID
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;
