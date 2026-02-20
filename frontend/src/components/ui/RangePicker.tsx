import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, RotateCcw } from "lucide-react";
import {
  format,
  isSameDay,
  isAfter,
  isBefore,
  addMonths,
  subMonths,
} from "date-fns";

interface RangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onChange: (start: string, end: string) => void;
  onClose: () => void;
}

const RangePicker = ({
  startDate,
  endDate,
  onChange,
  onClose,
}: RangePickerProps) => {
  const [currDate, setCurrDate] = useState(new Date());
  const [tempStart, setTempStart] = useState<Date | null>(
    startDate ? new Date(startDate) : null,
  );
  const [tempEnd, setTempEnd] = useState<Date | null>(
    endDate ? new Date(endDate) : null,
  );

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
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(date);
      setTempEnd(null);
    } else {
      if (isBefore(date, tempStart)) {
        setTempStart(date);
        setTempEnd(null);
      } else {
        setTempEnd(date);
      }
    }
  };

  const confirm = () => {
    if (tempStart && tempEnd) {
      onChange(format(tempStart, "yyyy-MM-dd"), format(tempEnd, "yyyy-MM-dd"));
      onClose();
    }
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

  const isInRange = (date: Date) => {
    if (!tempStart || !tempEnd) return false;
    return isAfter(date, tempStart) && isBefore(date, tempEnd);
  };

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
        className="bg-[#f3edf7] dark:bg-[#2b2930] w-[400px] rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="px-6 pt-6 pb-4 border-b border-[#79747e]/10">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[#49454f] dark:text-[#cac4d0] text-[10px] font-black uppercase tracking-[0.2em]">
              Select Date Range
            </p>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center gap-4 bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-black/5 dark:border-white/5">
            <div className="flex-1 text-center">
              <p className="text-[8px] font-black uppercase opacity-40 mb-1">
                Start Date
              </p>
              <p className="font-bold text-sm">
                {tempStart ? format(tempStart, "dd MMM yyyy") : "Select..."}
              </p>
            </div>
            <div className="w-px h-8 bg-black/10 dark:bg-white/10" />
            <div className="flex-1 text-center">
              <p className="text-[8px] font-black uppercase opacity-40 mb-1">
                End Date
              </p>
              <p className="font-bold text-sm">
                {tempEnd ? format(tempEnd, "dd MMM yyyy") : "Select..."}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="font-black text-sm uppercase tracking-widest opacity-60">
              {months[currDate.getMonth()]} {currDate.getFullYear()}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrDate(subMonths(currDate, 1))}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrDate(addMonths(currDate, 1))}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center mb-2">
            {weekDays.map((d, i) => (
              <span key={i} className="text-[10px] font-black opacity-30">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {getDays().map((d, i) => {
              if (!d) return <div key={i} />;
              const isStart = tempStart && isSameDay(d, tempStart);
              const isEnd = tempEnd && isSameDay(d, tempEnd);
              const isBetween = isInRange(d);

              return (
                <button
                  key={i}
                  onClick={() => handleDateClick(d)}
                  className={`h-10 text-xs font-bold transition-all relative
                    ${isStart ? "bg-emerald-500 text-white rounded-l-xl z-10" : ""}
                    ${isEnd ? "bg-emerald-500 text-white rounded-r-xl z-10" : ""}
                    ${isBetween ? "bg-emerald-500/10 text-emerald-600" : ""}
                    ${!isStart && !isEnd && !isBetween ? "hover:bg-black/5 dark:hover:bg-white/5 rounded-xl" : ""}
                  `}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 pt-2 border-t border-black/5 dark:border-white/5">
          <button
            onClick={() => {
              setTempStart(null);
              setTempEnd(null);
            }}
            className="px-4 py-2 text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 flex items-center gap-2"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={confirm}
            disabled={!tempStart || !tempEnd}
            className="ml-auto px-8 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 disabled:opacity-20 disabled:grayscale transition-all hover:scale-105 active:scale-95"
          >
            Apply Range
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RangePicker;
