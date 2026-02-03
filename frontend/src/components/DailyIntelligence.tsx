import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  CreditCard,
  UserMinus,
  Zap,
  FileText,
  RefreshCw,
  X,
  ChevronRight,
  Info,
  Phone,
  User,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { API_BASE_URL, authFetch } from "../config";

interface InsightData {
  id: string;
  type: "retention" | "billing" | "conversion" | "lab";
  priority: "high" | "medium" | "low";
  title: string;
  message: string;
  data: any[];
}

interface DailyIntelligenceProps {
  isOpen: boolean;
  onClose: () => void;
}

const DailyIntelligence: React.FC<DailyIntelligenceProps> = ({
  isOpen,
  onClose,
}) => {
  const { isDark } = useThemeStore();
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<InsightData | null>(
    null,
  );

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/daily_intelligence`,
      );
      const data = await res.json();
      if (data.status === "success") {
        setInsights(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch intelligence:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchInsights();
    }
  }, [isOpen, fetchInsights]);

  const getIcon = (type: string) => {
    switch (type) {
      case "retention":
        return <UserMinus className="text-amber-500" size={20} />;
      case "billing":
        return <CreditCard className="text-red-500" size={20} />;
      case "lab":
        return <FileText className="text-blue-500" size={20} />;
      case "conversion":
        return <Zap className="text-emerald-500" size={20} />;
      default:
        return <Sparkles className="text-purple-500" size={20} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-[95vw] max-w-[1600px] h-[90vh] overflow-hidden rounded-[32px] border shadow-2xl flex flex-col ${isDark ? "bg-[#121412] border-[#2A2D2A]" : "bg-white border-gray-100"}`}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-8 border-b dark:border-white/5 border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <TrendingUp size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2
                    className={`text-2xl font-black tracking-tight leading-none mb-1 ${isDark ? "text-white" : "text-[#1a1c1e]"}`}
                  >
                    Daily Intelligence
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                    Actionable Insights & System Alerts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchInsights}
                  disabled={isLoading}
                  className={`p-2 rounded-xl transition-all ${isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-50 text-gray-400"}`}
                >
                  <RefreshCw
                    size={20}
                    className={isLoading ? "animate-spin" : ""}
                  />
                </button>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-xl transition-all ${isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-50 text-gray-400"}`}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {/* Left Panel: Insights List - FIXED WIDTH */}
              <div className="w-[400px] shrink-0 border-r dark:border-white/5 border-gray-100 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-2">
                {isLoading && insights.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-40 gap-4">
                    <RefreshCw
                      size={32}
                      className="animate-spin text-indigo-500"
                    />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      Analyzing daily events...
                    </p>
                  </div>
                ) : insights.length > 0 ? (
                  <div className="flex flex-col gap-2 pb-4">
                    {insights.map((insight, idx) => (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedInsight(insight)}
                        className={`group w-full text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex items-center gap-4 ${
                          selectedInsight?.id === insight.id
                            ? isDark
                              ? "bg-white/[0.08] border-white/10 shadow-xl"
                              : "bg-white border-indigo-200 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/20"
                            : isDark
                              ? "bg-transparent border-transparent hover:bg-white/[0.03]"
                              : "bg-transparent border-transparent hover:bg-gray-50/80"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center ${
                            isDark
                              ? "bg-white/5"
                              : "bg-white border border-gray-100 shadow-sm"
                          }`}
                        >
                          {getIcon(insight.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`text-sm font-bold tracking-tight truncate ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {insight.title}
                            </h3>
                            <span
                              className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest border ${getPriorityColor(
                                insight.priority,
                              )}`}
                            >
                              {insight.priority}
                            </span>
                          </div>
                          <p
                            className={`text-xs truncate opacity-60 ${
                              isDark ? "text-white" : "text-gray-500"
                            }`}
                          >
                            {insight.message}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`text-[10px] font-bold ${isDark ? "text-white/40" : "text-gray-400"}`}
                          >
                            {insight.data.length}
                          </span>
                          <User size={12} className="opacity-20" />
                        </div>

                        {selectedInsight?.id === insight.id && (
                          <motion.div
                            layoutId="activeInsightIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full"
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-30 text-center">
                    <Sparkles size={48} className="mb-4 text-indigo-500" />
                    <p className="text-sm font-black uppercase tracking-widest mb-1">
                      No critical events
                    </p>
                    <p className="text-[10px] uppercase tracking-widest">
                      Dashboard clear
                    </p>
                  </div>
                )}
              </div>

              {/* Right Panel: Detail View */}
              <AnimatePresence mode="wait">
                {selectedInsight ? (
                  <motion.div
                    key={selectedInsight.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex-1 overflow-y-auto custom-scrollbar p-10 flex flex-col gap-8 ${isDark ? "bg-[#181A18]" : "bg-gray-50/30"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${getPriorityColor(selectedInsight.priority)} mb-2 inline-block`}
                        >
                          {selectedInsight.priority} Priority
                        </span>
                        <h3
                          className={`text-xl font-black tracking-tight ${isDark ? "text-white" : "text-[#1a1c1e]"}`}
                        >
                          {selectedInsight.title}
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedInsight(null)}
                        className={`p-2 rounded-xl transition-all ${isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-100 text-gray-400"}`}
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <p
                      className={`text-sm font-medium leading-relaxed opacity-60 ${isDark ? "text-white" : "text-gray-600"}`}
                    >
                      {selectedInsight.message}
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 opacity-40">
                        <Info size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                          Detailed Patient List
                        </span>
                      </div>

                      <div className="flex flex-col gap-3">
                        {selectedInsight.data.map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-4 rounded-2xl border flex items-center justify-between group ${isDark ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]" : "bg-white border-gray-100 hover:border-indigo-500/20 shadow-sm"}`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}
                              >
                                {item.name?.charAt(0) || <User size={16} />}
                              </div>
                              <div>
                                <h4
                                  className={`text-sm font-black tracking-tight ${isDark ? "text-white" : "text-[#1a1c1e]"}`}
                                >
                                  {item.name}
                                </h4>
                                <div className="flex items-center gap-2 opacity-40 mt-0.5">
                                  <Phone size={10} />
                                  <span className="text-[10px] font-bold">
                                    {item.phone || "--"}
                                  </span>
                                  {item.due && (
                                    <>
                                      <div className="w-1 h-1 rounded-full bg-current opacity-20" />
                                      <span className="text-[10px] font-black text-red-500">
                                        ₹{item.due} Due
                                      </span>
                                    </>
                                  )}
                                  {item.remaining !== undefined && (
                                    <>
                                      <div className="w-1 h-1 rounded-full bg-current opacity-20" />
                                      <span className="text-[10px] font-black text-amber-500">
                                        {item.remaining} Left
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isDark ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-indigo-600"}`}
                            >
                              <ArrowRight size={16} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t dark:border-white/5 border-gray-100">
                      <button className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2">
                        Batch Follow-up via WhatsApp <MessageSquare size={16} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div
                    className={`flex-1 flex flex-col items-center justify-center p-10 text-center opacity-20 ${isDark ? "bg-[#181A18]" : "bg-gray-50/10"}`}
                  >
                    <div className="w-16 h-16 rounded-[24px] border border-dashed border-current mb-4 flex items-center justify-center">
                      <TrendingUp size={32} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest">
                      Select an insight to view <br /> patient details & actions
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Background Accents */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DailyIntelligence;
