import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Edit2 } from "lucide-react";

export const InlineDatePicker = ({
  value,
  onChange,
  onClose,
  showActions = true,
}: any) => {
  const [currDate, setCurrDate] = useState(
    value ? new Date(value) : new Date(),
  );
  const [selected, setSelected] = useState(
    value ? new Date(value) : new Date(),
  );

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setCurrDate(d);
      setSelected(d);
    }
  }, [value]);

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
    const offsetDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000,
    );
    setSelected(offsetDate);
    if (!showActions) {
      onChange(offsetDate.toISOString().split("T")[0]);
    }
  };

  const confirm = () => {
    onChange(selected.toISOString().split("T")[0]);
    if (onClose) onClose();
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

  return (
    <div className="bg-[#ece6f0] dark:bg-[#1e1e1e] w-[320px] rounded-[28px] overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-4 pb-3 border-b border-[#79747e]/10">
        <p className="text-[#49454f] dark:text-[#cac4d0] text-xs font-medium uppercase tracking-wide">
          Select date
        </p>
        <div className="flex justify-between items-center mt-1">
          <h2 className="text-3xl font-normal text-[#1d1b20] dark:text-[#e6e1e5]">
            {selected.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </h2>
          <button className="text-[#49454f] dark:text-[#cac4d0] p-1 hover:bg-[#1d1b20]/10 rounded-full transition-colors">
            <Edit2 size={18} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        {/* Controls */}
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-1 text-[#49454f] dark:text-[#cac4d0] font-bold text-sm cursor-pointer hover:bg-[#1d1b20]/10 px-2 py-1 rounded-full transition-colors">
            {months[currDate.getMonth()]} {currDate.getFullYear()}{" "}
            <span className="text-[10px]">▼</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() =>
                setCurrDate(
                  new Date(currDate.getFullYear(), currDate.getMonth() - 1, 1),
                )
              }
              className="w-8 h-8 flex items-center justify-center hover:bg-[#1d1b20]/10 rounded-full text-[#49454f] dark:text-[#cac4d0]"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() =>
                setCurrDate(
                  new Date(currDate.getFullYear(), currDate.getMonth() + 1, 1),
                )
              }
              className="w-8 h-8 flex items-center justify-center hover:bg-[#1d1b20]/10 rounded-full text-[#49454f] dark:text-[#cac4d0]"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center mb-2">
          {weekDays.map((d, i) => (
            <span
              key={`${d}-${i}`}
              className="text-xs font-medium text-[#49454f] dark:text-[#cac4d0] w-8 h-8 flex items-center justify-center"
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
                  onClick={() => handleDateClick(d)}
                  className={`w-9 h-9 text-sm rounded-full flex items-center justify-center transition-colors ${
                    selected.toDateString() === d.toDateString()
                      ? "bg-[#6750a4] dark:bg-[#d0bcff] text-white dark:text-[#381e72]"
                      : d.toDateString() === new Date().toDateString()
                        ? "border border-[#6750a4] text-[#6750a4] dark:border-[#d0bcff] dark:text-[#d0bcff]"
                        : "text-[#1d1b20] dark:text-[#e6e1e5] hover:bg-[#1d1b20]/10 dark:hover:bg-[#e6e1e5]/10"
                  }`}
                >
                  {d.getDate()}
                </button>
              ) : (
                <div className="w-9 h-9"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex justify-end gap-2 p-3 pt-0 mt-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full transition-colors"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
};

export const DatePicker = ({ value, onChange, onClose }: any) => {
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
        className="shadow-2xl rounded-[28px] overflow-hidden"
      >
        <InlineDatePicker
          value={value}
          onChange={onChange}
          onClose={onClose}
          showActions={true}
        />
      </motion.div>
    </motion.div>
  );
};

export const TimePicker = ({ value, onChange, onClose, slots }: any) => {
  const [selected, setSelected] = useState(value || "");

  const confirm = () => {
    onChange(selected);
    onClose();
  };

  const selectedLabel =
    slots?.find((s: any) => s.value === selected)?.label || "--:--";

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
        className="bg-[#ece6f0] dark:bg-[#2b2930] w-[340px] rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="bg-[#ece6f0] dark:bg-[#2b2930] px-6 pt-6 pb-4 border-b border-[#79747e]/10 pt-8 shrink-0">
          <p className="text-[#49454f] dark:text-[#cac4d0] text-xs font-medium uppercase tracking-wide mb-1">
            Select time
          </p>
          <div className="flex justify-center items-center bg-[#eaddff] dark:bg-[#4f378b] rounded-xl py-4 px-8 w-fit mx-auto mb-2">
            <span className="text-5xl font-normal text-[#21005d] dark:text-[#eaddff] tracking-tight">
              {selectedLabel.replace(/ (AM|PM)/, "")}
            </span>
            <div className="flex flex-col ml-3 gap-1">
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${selectedLabel.includes("AM") ? "bg-[#21005d] text-[#eaddff]" : "text-[#21005d] border border-[#21005d]/20"}`}
              >
                AM
              </span>
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded ${selectedLabel.includes("PM") ? "bg-[#21005d] text-[#eaddff]" : "text-[#21005d] border border-[#21005d]/20"}`}
              >
                PM
              </span>
            </div>
          </div>
        </div>

        {/* Body (Grid) */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-3 gap-2">
            {slots?.map((slot: any) => (
              <button
                key={slot.value}
                disabled={slot.booked}
                onClick={() => setSelected(slot.value)}
                className={`py-2 px-1 text-sm rounded-lg border transition-all ${
                  selected === slot.value
                    ? "bg-[#6750a4] dark:bg-[#d0bcff] text-white dark:text-[#381e72] border-[#6750a4] dark:border-[#d0bcff]"
                    : slot.booked
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed decoration-slate-400 line-through decoration-1"
                      : "bg-transparent border-[#79747e] text-[#49454f] dark:text-[#cac4d0] hover:bg-[#6750a4]/10"
                }`}
              >
                {slot.label.split(" ")[0]}{" "}
                <span className="text-[10px]">{slot.label.split(" ")[1]}</span>
              </button>
            ))}
          </div>
          {(!slots || slots.length === 0) && (
            <p className="text-center text-slate-400 py-8">
              No slots available for this date.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 pt-2 shrink-0 bg-[#ece6f0] dark:bg-[#2b2930]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className="px-4 py-2 text-sm font-bold text-[#6750a4] dark:text-[#d0bcff] hover:bg-[#6750a4]/10 rounded-full transition-colors"
          >
            OK
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
