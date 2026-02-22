import React, { useState, useEffect, useMemo, useRef } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PaymentMethod {
  method_code: string;
  method_name: string;
}

interface SplitPaymentInputProps {
  paymentMethods: PaymentMethod[];
  totalDue: number;
  onPaymentChange: (payments: { method: string; amount: number }[]) => void;
  isDark?: boolean;
}

const SplitPaymentInput: React.FC<SplitPaymentInputProps> = ({
  paymentMethods,
  totalDue: totalDueProp,
  onPaymentChange,
  isDark = false,
}) => {
  // Normalize to number — MySQL can return numeric columns as strings
  const totalDue = Number(totalDueProp) || 0;

  const [totalAmount, setTotalAmount] = useState<string>(
    totalDue > 0 ? String(totalDue) : "",
  );
  const [selectedMethods, setSelectedMethods] = useState<
    Record<string, number>
  >({});
  const [isOpen, setIsOpen] = useState(false);

  const parsedTotal = useMemo(
    () => parseFloat(totalAmount) || 0,
    [totalAmount],
  );

  // Keep a stable ref to the latest onPaymentChange so we never need it
  // in the dependency array (avoiding infinite loops from inline arrow functions)
  const onPaymentChangeRef = useRef(onPaymentChange);
  useEffect(() => {
    onPaymentChangeRef.current = onPaymentChange;
  });

  // Sync with parent only when selectedMethods actually changes
  useEffect(() => {
    const payments = Object.entries(selectedMethods)
      .filter(([_, amount]) => amount > 0)
      .map(([method, amount]) => ({ method, amount }));
    onPaymentChangeRef.current(payments);
  }, [selectedMethods]);

  // When totalDue changes externally (e.g., different item opened), reset
  // useEffect(() => {
  //     setTotalAmount(totalDue > 0 ? String(totalDue) : "");
  //     setSelectedMethods({});
  // }, [totalDue]);

  const totalAllocated = useMemo(
    () => Object.values(selectedMethods).reduce((sum, val) => sum + val, 0),
    [selectedMethods],
  );

  const remaining = Math.max(0, parsedTotal - totalAllocated);
  const isOverAllocated = totalAllocated > parsedTotal + 0.01;
  const isFullyAllocated =
    Math.abs(totalAllocated - parsedTotal) < 0.01 && parsedTotal > 0;

  // Keep parsedTotal in a ref so toggleMethod's functional updater can access the latest value
  const parsedTotalRef = useRef(parsedTotal);
  parsedTotalRef.current = parsedTotal;

  const toggleMethod = (methodCode: string) => {
    setSelectedMethods((prev) => {
      const newMap = { ...prev };
      if (methodCode in newMap) {
        delete newMap[methodCode];
      } else {
        // Compute remaining from prev (latest state) + current parsedTotal
        const currentTotal =
          parsedTotalRef.current > 0 ? parsedTotalRef.current : totalDue;
        const alreadyAllocated = Object.values(newMap).reduce(
          (s, v) => s + v,
          0,
        );
        const autoAmount = Math.max(0, currentTotal - alreadyAllocated);
        newMap[methodCode] = autoAmount;
      }
      return newMap;
    });
  };

  const handleAmountChange = (methodCode: string, value: string) => {
    const val = parseFloat(value) || 0;
    setSelectedMethods((prev) => {
      const newMap = { ...prev, [methodCode]: val };
      const currentTotal =
        parsedTotalRef.current > 0 ? parsedTotalRef.current : totalDue;
      const otherKeys = Object.keys(newMap).filter((k) => k !== methodCode);

      if (otherKeys.length > 0) {
        // Remaining balance goes to the other methods, split equally
        const remaining = Math.max(0, currentTotal - val);
        const share = Math.round((remaining / otherKeys.length) * 100) / 100;
        // Assign share to all others; give any rounding penny to the last one
        let distributed = 0;
        otherKeys.forEach((k, i) => {
          if (i === otherKeys.length - 1) {
            // Last one gets whatever is left to avoid rounding drift
            newMap[k] = Math.max(
              0,
              Math.round((remaining - distributed) * 100) / 100,
            );
          } else {
            newMap[k] = share;
            distributed += share;
          }
        });
      }
      return newMap;
    });
  };

  const handleTotalChange = (value: string) => {
    const newTotal = parseFloat(value) || 0;
    setTotalAmount(value);
    setSelectedMethods((prev) => {
      const keys = Object.keys(prev);
      if (keys.length === 0) return prev;
      if (keys.length === 1) return { [keys[0]]: newTotal };
      // Scale all methods proportionally to the new total
      const oldTotal = Object.values(prev).reduce((s, v) => s + v, 0);
      if (oldTotal === 0) {
        // No amounts yet — distribute equally
        const share = Math.round((newTotal / keys.length) * 100) / 100;
        const newMap: Record<string, number> = {};
        keys.forEach((k, i) => {
          newMap[k] =
            i === keys.length - 1
              ? Math.max(
                  0,
                  Math.round((newTotal - share * (keys.length - 1)) * 100) /
                    100,
                )
              : share;
        });
        return newMap;
      }
      // Proportional scaling
      let distributed = 0;
      const newMap: Record<string, number> = {};
      keys.forEach((k, i) => {
        if (i === keys.length - 1) {
          newMap[k] = Math.max(
            0,
            Math.round((newTotal - distributed) * 100) / 100,
          );
        } else {
          const scaled =
            Math.round((prev[k] / oldTotal) * newTotal * 100) / 100;
          newMap[k] = scaled;
          distributed += scaled;
        }
      });
      return newMap;
    });
  };

  const selectedCount = Object.keys(selectedMethods).length;

  return (
    <div
      className={`w-full rounded-2xl border overflow-hidden shadow-sm ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"}`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isDark ? "hover:bg-slate-700/30" : "hover:bg-slate-50"}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Add Payment <span className="text-rose-500">*</span>
          </h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            ENTER AMOUNT &amp; SPLIT ACROSS METHODS
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <span className="px-3 py-1 bg-teal-600 text-white text-[10px] font-black rounded-full uppercase">
              {selectedCount} method{selectedCount > 1 ? "s" : ""}
            </span>
          )}
          {isOpen ? (
            <ChevronUp size={18} className="text-slate-400" />
          ) : (
            <ChevronDown size={18} className="text-slate-400" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className={`px-4 pb-4 space-y-4 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}
            >
              {/* Total Amount Input */}
              <div className="pt-4">
                <label
                  className={`block text-[10px] font-black uppercase tracking-[0.15em] mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Total Amount to Pay
                </label>
                <div className="relative">
                  <span
                    className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black ${isDark ? "text-teal-400" : "text-teal-600"}`}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => handleTotalChange(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder={`Max ₹${totalDue?.toFixed(2)}`}
                    className={`w-full pl-10 pr-4 py-3.5 rounded-xl text-xl font-black border-2 transition-all outline-none ${
                      isDark
                        ? "bg-slate-900/70 border-teal-500/40 text-white focus:border-teal-400 placeholder:text-slate-600"
                        : "bg-teal-50/60 border-teal-200 text-slate-900 focus:border-teal-400 placeholder:text-slate-400"
                    }`}
                  />
                  {parsedTotal > totalDue && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500 uppercase tracking-wider">
                      Exceeds due
                    </span>
                  )}
                  {parsedTotal === totalDue && totalDue > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-teal-500 uppercase tracking-wider">
                      Full due
                    </span>
                  )}
                </div>
                {totalDue > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1.5 px-1">
                    Outstanding balance:{" "}
                    <span className="font-bold text-rose-400">
                      ₹{totalDue.toFixed(2)}
                    </span>
                  </p>
                )}
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label
                  className={`block text-[10px] font-black uppercase tracking-[0.15em] mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Payment Method{parsedTotal > 0 ? " (split if needed)" : ""}
                </label>
                {paymentMethods.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    No payment methods available
                  </p>
                ) : (
                  paymentMethods.map((m) => {
                    const isSelected = m.method_code in selectedMethods;
                    return (
                      <div
                        key={m.method_code}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          isSelected
                            ? isDark
                              ? "bg-teal-500/10 border-teal-500/30"
                              : "bg-teal-50 border-teal-200 shadow-sm"
                            : isDark
                              ? "bg-slate-800/40 border-slate-700/50 hover:border-slate-600"
                              : "bg-slate-50 border-transparent hover:border-slate-200"
                        }`}
                      >
                        {/* Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleMethod(m.method_code)}
                          className={`shrink-0 transition-colors ${isSelected ? "text-teal-600 dark:text-teal-400" : "text-slate-300 dark:text-slate-600"}`}
                        >
                          {isSelected ? (
                            <CheckCircle2
                              size={22}
                              fill="currentColor"
                              stroke="white"
                              strokeWidth={1}
                            />
                          ) : (
                            <Circle size={22} />
                          )}
                        </button>

                        {/* Label */}
                        <span
                          className={`text-sm font-bold flex-1 ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
                        >
                          {m.method_name}
                        </span>

                        {/* Amount Input */}
                        {isSelected && (
                          <div className="relative w-32">
                            <span
                              className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${isDark ? "text-teal-400" : "text-teal-600"}`}
                            >
                              ₹
                            </span>
                            <input
                              type="number"
                              value={selectedMethods[m.method_code]}
                              onChange={(e) =>
                                handleAmountChange(
                                  m.method_code,
                                  e.target.value,
                                )
                              }
                              className={`w-full pl-7 pr-2 py-2 rounded-lg text-right text-sm font-black border outline-none transition-all ${
                                isDark
                                  ? "bg-slate-900 border-teal-500/40 text-white focus:border-teal-400"
                                  : "bg-white border-teal-200 text-slate-800 focus:border-teal-400"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Allocation Summary Footer */}
              {parsedTotal > 0 && selectedCount > 0 && (
                <div
                  className={`pt-3 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                      Allocated
                    </span>
                    <span
                      className={`text-base font-black ${isFullyAllocated ? "text-teal-500" : isOverAllocated ? "text-rose-500" : "text-amber-500"}`}
                    >
                      ₹{totalAllocated.toFixed(2)}
                      <span className="text-slate-400 font-semibold text-xs ml-1">
                        / ₹{parsedTotal.toFixed(2)}
                      </span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-slate-100"}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isFullyAllocated ? "bg-teal-500" : isOverAllocated ? "bg-rose-500" : "bg-amber-400"}`}
                      style={{
                        width: `${Math.min(100, parsedTotal > 0 ? (totalAllocated / parsedTotal) * 100 : 0)}%`,
                      }}
                    />
                  </div>

                  {!isFullyAllocated && !isOverAllocated && remaining > 0 && (
                    <p className="text-[10px] font-bold text-amber-500 mt-1.5 text-right">
                      ₹{remaining.toFixed(2)} remaining to allocate
                    </p>
                  )}
                  {isOverAllocated && (
                    <p className="text-[10px] font-bold text-rose-500 mt-1.5 text-right">
                      Over by ₹{(totalAllocated - parsedTotal).toFixed(2)}
                    </p>
                  )}
                  {isFullyAllocated && (
                    <p className="text-[10px] font-bold text-teal-500 mt-1.5 text-right">
                      ✓ Fully allocated
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplitPaymentInput;
