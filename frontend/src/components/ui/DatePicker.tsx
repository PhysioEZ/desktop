import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay } from "date-fns";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
  minDate?: string;
  variant?: "standard" | "premium";
}

type ViewMode = "calendar" | "year" | "edit";

const DatePicker = ({ value, onChange, onClose, minDate, variant = "standard" }: DatePickerProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currMonth, setCurrMonth] = useState(
    value ? startOfMonth(new Date(value)) : startOfMonth(new Date()),
  );
  const [selected, setSelected] = useState(
    value ? new Date(value) : new Date(),
  );
  const [editValue, setEditValue] = useState(value || "");
  const yearRef = useRef<HTMLDivElement>(null);

  const isDateDisabled = (date: Date) => {
    if (!minDate) return false;
    const min = startOfDay(new Date(minDate));
    const d = startOfDay(date);
    return isBefore(d, min);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currMonth),
    end: endOfMonth(currMonth),
  });

  // Calculate padding days for the start of the week
  const firstDayOfWeek = startOfMonth(currMonth).getDay();
  const paddingDays = Array.from({ length: firstDayOfWeek }).map((_) => null);

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    setSelected(date);
  };

  const confirm = () => {
    let dateToSave = selected;
    if (viewMode === "edit") {
      const parsed = new Date(editValue);
      if (!isNaN(parsed.getTime())) {
        if (isDateDisabled(parsed)) return;
        dateToSave = parsed;
      }
    }
    const y = dateToSave.getFullYear();
    const m = String(dateToSave.getMonth() + 1).padStart(2, "0");
    const d = String(dateToSave.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    onClose();
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const years = Array.from({ length: 2100 - 2021 + 1 }, (_, i) => 2021 + i);

  useEffect(() => {
    if (viewMode === "year" && yearRef.current) {
      const selectedYear = currMonth.getFullYear();
      const element = document.querySelector(`[data-year="${selectedYear}"]`);
      if (element) {
        element.scrollIntoView({ block: "center", behavior: "auto" });
      }
    }
  }, [viewMode, currMonth]);

  const isPremium = variant === "premium";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10005] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`${isPremium
          ? "bg-white dark:bg-slate-900 shadow-emerald-500/10"
          : "bg-[#f3edf7] dark:bg-[#2b2930]"
          } w-full max-w-[380px] rounded-[40px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] flex flex-col border border-white/20 dark:border-slate-800`}
      >
        {/* Modern Header */}
        <div className={`p-8 relative overflow-hidden ${isPremium ? "bg-emerald-600 dark:bg-emerald-500/10" : "bg-[#6750a4] dark:bg-[#d0bcff]/10"}`}>
          {/* Decorative Gradient Overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

          <div className="relative z-10">
            <p className={`text-[11px] font-black uppercase tracking-[0.3em] mb-2 opacity-80 ${isPremium ? "text-emerald-50 dark:text-emerald-400" : "text-white dark:text-[#cac4d0]"}`}>
              Select Date
            </p>
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <h2 className={`text-4xl font-serif font-medium leading-none tracking-tight ${isPremium ? "text-white" : "text-white dark:text-[#e6e1e5]"}`}>
                  {format(selected, "dd")}
                </h2>
                <p className={`text-sm font-bold opacity-90 ${isPremium ? "text-emerald-100 dark:text-emerald-400/80" : "text-white/80 dark:text-[#d0bcff]"}`}>
                  {format(selected, "EEEE, MMMM yyyy")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "edit" ? "calendar" : "edit")}
                className={`p-3 rounded-2xl transition-all ${isPremium ? "bg-white/20 text-white hover:bg-white/30" : "bg-white/10 text-white hover:bg-white/20"} backdrop-blur-sm`}
              >
                {viewMode === "edit" ? <CalendarIcon size={20} /> : <Edit2 size={20} />}
              </button>
            </div>
          </div>
        </div>

        <div className="relative min-h-[360px] p-6">
          <AnimatePresence mode="wait">
            {viewMode === "calendar" ? (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Month/Year Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewMode("year")}
                    className="flex items-center gap-2 group px-4 py-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {format(currMonth, "MMMM yyyy")}
                    </span>
                    <ChevronRight size={16} className="text-slate-400 group-hover:rotate-90 transition-transform" />
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrMonth(subMonths(currMonth, 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrMonth(addMonths(currMonth, 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-1">
                  {weekDays.map((d) => (
                    <span key={d} className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest py-2">
                      {d}
                    </span>
                  ))}
                  {paddingDays.map((_, i) => (
                    <div key={`pad-${i}`} className="w-10 h-10" />
                  ))}
                  {days.map((date) => {
                    const disabled = isDateDisabled(date);
                    const isSelected = isSameDay(date, selected);
                    const isToday = isSameDay(date, new Date());

                    return (
                      <div key={date.toString()} className="flex justify-center items-center">
                        <button
                          type="button"
                          onClick={() => handleDateClick(date)}
                          disabled={disabled}
                          className={`
                            relative w-11 h-11 text-sm font-bold rounded-2xl flex items-center justify-center transition-all duration-300
                            ${disabled
                              ? "opacity-20 cursor-not-allowed"
                              : isSelected
                                ? isPremium
                                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-110 z-10"
                                  : "bg-[#6750a4] text-white shadow-lg shadow-[#6750a4]/40 scale-110 z-10"
                                : isToday
                                  ? isPremium
                                    ? "text-emerald-500 border-2 border-emerald-500/30"
                                    : "text-[#6750a4] border-2 border-[#6750a4]/30"
                                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105"
                            }
                          `}
                        >
                          {format(date, "d")}
                          {isToday && !isSelected && (
                            <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isPremium ? "bg-emerald-500" : "bg-[#6750a4]"}`} />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : viewMode === "year" ? (
              <motion.div
                key="year"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 overflow-y-auto custom-scrollbar p-6 grid grid-cols-3 gap-3"
                ref={yearRef}
              >
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    data-year={y}
                    onClick={() => {
                      setCurrMonth(new Date(y, currMonth.getMonth(), 1));
                      setViewMode("calendar");
                    }}
                    className={`py-4 rounded-3xl text-sm font-bold transition-all ${y === currMonth.getFullYear()
                      ? isPremium
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                        : "bg-[#6750a4] text-white shadow-lg shadow-[#6750a4]/25"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                  >
                    {y}
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center h-full space-y-6 pt-4"
              >
                <div className="w-full space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Input Date Manually
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={editValue}
                      min={minDate}
                      onChange={(e) => setEditValue(e.target.value)}
                      className={`w-full bg-slate-50 dark:bg-slate-800/50 border-2 ${isPremium ? "focus:border-emerald-500" : "focus:border-[#6750a4]"} p-4 text-lg font-bold outline-none rounded-3xl transition-all`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter text-center">
                    Format: Month / Day / Year
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="p-8 pt-0 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-3xl transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            className={`flex-1 px-4 py-4 text-xs font-black uppercase tracking-widest text-white rounded-3xl transition-all active:scale-95 shadow-lg ${isPremium
              ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25"
              : "bg-[#6750a4] hover:bg-[#5a4691] shadow-[#6750a4]/25"
              }`}
          >
            Apply Date
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DatePicker;
