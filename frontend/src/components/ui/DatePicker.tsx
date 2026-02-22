import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Calendar as CalendarIcon,
} from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
  minDate?: string;
}

type ViewMode = "calendar" | "year" | "edit";

const DatePicker = ({ value, onChange, onClose, minDate }: DatePickerProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currDate, setCurrDate] = useState(
    value ? new Date(value) : new Date(),
  );
  const [selected, setSelected] = useState(
    value ? new Date(value) : new Date(),
  );
  const [editValue, setEditValue] = useState(value || "");
  const yearRef = useRef<HTMLDivElement>(null);

  const isDateDisabled = (date: Date) => {
    if (!minDate) return false;
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < min;
  };

  // Year focus is handled by array ordering (2021 starts at top)

  const getDays = () => {
    const y = currDate.getFullYear(),
      m = currDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = new Date(y, m, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(y, m, i));
    return days;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    setSelected(localDate);
  };

  const confirm = () => {
    let dateToSave = selected;
    if (viewMode === "edit") {
      const parsed = new Date(editValue);
      if (!isNaN(parsed.getTime())) {
        if (isDateDisabled(parsed)) {
          // You might want to show a toast here, but for now we just don't confirm
          return;
        }
        dateToSave = parsed;
      }
    }
    const y = dateToSave.getFullYear();
    const m = String(dateToSave.getMonth() + 1).padStart(2, "0");
    const d = String(dateToSave.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    onClose();
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  // Strictly start from 2021 as requested
  const years = Array.from({ length: 2100 - 2021 + 1 }, (_, i) => 2021 + i);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10005] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#f3edf7] dark:bg-[#2b2930] w-[360px] rounded-[32px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.2)] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#79747e]/10">
          <p className="text-[#49454f] dark:text-[#cac4d0] text-[10px] font-black uppercase tracking-[0.2em] mb-1">
            Select date
          </p>
          <div className="flex justify-between items-center">
            <h2 className="text-[32px] font-normal text-[#1d1b20] dark:text-[#e6e1e5] leading-tight capitalize">
              {viewMode === "edit" ? (
                <input
                  type="date"
                  value={editValue}
                  min={minDate}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="bg-transparent border-none outline-none text-[28px] font-normal w-full"
                />
              ) : (
                `${selected.toLocaleDateString("en-US", { weekday: "short" })}, ${selected.toLocaleDateString("en-US", { month: "short" })} ${selected.getDate()}`
              )}
            </h2>
            <button
              type="button"
              onClick={() =>
                setViewMode(viewMode === "edit" ? "calendar" : "edit")
              }
              className="text-[#49454f] dark:text-[#cac4d0] p-2 hover:bg-[#1d1b20]/5 rounded-full transition-colors shrink-0"
            >
              {viewMode === "edit" ? (
                <CalendarIcon size={20} />
              ) : (
                <Edit2 size={20} />
              )}
            </button>
          </div>
        </div>

        <div className="relative min-h-[340px]">
          <AnimatePresence mode="wait">
            {viewMode === "calendar" ? (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-3 pt-4"
              >
                <div className="flex items-center justify-between px-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setViewMode("year")}
                    className="flex items-center gap-1.5 text-[#49454f] dark:text-[#cac4d0] font-black text-sm hover:bg-[#1d1b20]/5 px-3 py-1.5 rounded-full transition-colors uppercase tracking-wider"
                  >
                    {months[currDate.getMonth()]} {currDate.getFullYear()}{" "}
                    <span className="text-[10px] opacity-70">▼</span>
                  </button>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrDate(
                          new Date(
                            currDate.getFullYear(),
                            currDate.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                      className="w-10 h-10 flex items-center justify-center hover:bg-[#1d1b20]/5 rounded-full text-[#49454f] dark:text-[#cac4d0] transition-colors"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrDate(
                          new Date(
                            currDate.getFullYear(),
                            currDate.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                      className="w-10 h-10 flex items-center justify-center hover:bg-[#1d1b20]/5 rounded-full text-[#49454f] dark:text-[#cac4d0] transition-colors"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 text-center mb-1">
                  {weekDays.map((d, i) => (
                    <span
                      key={`${d}-${i}`}
                      className="text-[11px] font-black text-[#49454f] dark:text-[#cac4d0] w-10 h-10 flex items-center justify-center opacity-70 tracking-tighter"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {getDays().map((d, i) => (
                    <div key={i} className="flex justify-center">
                      {d ? (
                        <button
                          type="button"
                          onClick={() => handleDateClick(d)}
                          disabled={isDateDisabled(d)}
                          className={`w-10 h-10 text-sm font-bold rounded-full flex items-center justify-center transition-all ${isDateDisabled(d)
                              ? "opacity-20 cursor-not-allowed"
                              : selected.toDateString() === d.toDateString()
                                ? "bg-[#6750a4] dark:bg-[#d0bcff] text-white dark:text-[#381e72] shadow-md"
                                : d.toDateString() === new Date().toDateString()
                                  ? "border border-[#6750a4] text-[#6750a4] dark:border-[#d0bcff] dark:text-[#d0bcff]"
                                  : "text-[#49454f] dark:text-[#cac4d0] hover:bg-[#1d1b20]/5 dark:hover:bg-[#e6e1e5]/5"
                            }`}
                        >
                          {d.getDate()}
                        </button>
                      ) : (
                        <div className="w-10 h-10"></div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : viewMode === "year" ? (
              <motion.div
                key="year"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 overflow-y-auto custom-scrollbar p-4"
                ref={yearRef}
              >
                <div className="grid grid-cols-3 gap-2">
                  {years.map((y) => (
                    <button
                      key={y}
                      type="button"
                      data-year={y}
                      data-selected={y === currDate.getFullYear()}
                      onClick={() => {
                        setCurrDate(new Date(y, currDate.getMonth(), 1));
                        setViewMode("calendar");
                      }}
                      className={`py-3 rounded-2xl text-base font-bold transition-all ${y === currDate.getFullYear()
                          ? "bg-[#6750a4] dark:bg-[#d0bcff] text-white dark:text-[#381e72]"
                          : "text-[#49454f] dark:text-[#e6e1e5] hover:bg-[#1d1b20]/5"
                        }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-8"
              >
                <div className="space-y-4">
                  <p className="text-sm font-bold text-[#49454f] dark:text-[#cac4d0]">
                    Enter date manually
                  </p>
                  <input
                    type="date"
                    value={editValue}
                    min={minDate}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full bg-white/50 dark:bg-black/20 border-b-2 border-[#6750a4] p-3 text-lg font-bold outline-none rounded-t-lg"
                  />
                  <p className="text-xs text-[#49454f]/60">
                    Format: DD/MM/YYYY
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-6 pt-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-black uppercase tracking-widest text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/5 rounded-full transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            className="px-6 py-2.5 text-sm font-black uppercase tracking-widest text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/5 rounded-full transition-colors active:scale-95"
          >
            OK
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DatePicker;
