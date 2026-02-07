import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ChevronDown, Check } from "lucide-react";
import { authFetch, API_BASE_URL } from "../../config";

// Reusing StatusDropdown Logic for Custom Payment Select
// This mirrors the UI of the StatusDropdown but for generic options
const PaymentMethodSelect = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const toggleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const close = () => setIsOpen(false);
    if (isOpen) {
      window.addEventListener("click", close);
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close);
    }
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={toggleOpen}
        className="w-full relative px-4 py-3 bg-[#fdfcff] dark:bg-[#1a1c1e] text-left border border-[#74777f] dark:border-[#8e918f] rounded-[16px] text-sm font-medium text-[#1a1c1e] dark:text-[#e3e2e6] focus:outline-none focus:ring-2 focus:ring-[#006e1c] flex items-center justify-between"
      >
        <span>{value || "Select Method"}</span>
        <ChevronDown
          size={18}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed z-[999999] bg-[#f3edf7] dark:bg-[#2b2930] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col p-2 border border-[#eaddff] dark:border-[#49454f]"
              style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
              }}
            >
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`
                                    w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-all mb-1 last:mb-0 flex items-center justify-between
                                    ${
                                      value === opt
                                        ? "bg-[#3b82f6] text-white shadow-sm"
                                        : "text-[#1d1b20] dark:text-[#e6e1e5] hover:bg-[#e8def8] dark:hover:bg-[#4a4458]"
                                    }
                                `}
                >
                  {opt}
                  {value === opt && <Check size={14} />}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};

interface UpdatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: any;
  onSuccess: () => void;
  paymentMethods: string[];
}

const UpdatePaymentModal = ({
  isOpen,
  onClose,
  registration,
  onSuccess,
  paymentMethods,
}: UpdatePaymentModalProps) => {
  const [amount, setAmount] = useState(registration?.consultation_amount || "");
  const [method, setMethod] = useState(registration?.payment_method || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (registration) {
      setAmount(registration.consultation_amount);
      setMethod(registration.payment_method);
    }
  }, [registration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/reception/registration?action=update_details`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registration_id: registration.registration_id,
            consultation_amount: amount,
            payment_method: method,
          }),
        },
      );
      const result = await response.json();
      if (result.status === "success") {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-sm rounded-[28px] shadow-2xl overflow-hidden relative z-10 border border-[#e0e2ec] dark:border-[#43474e]"
        >
          <div className="px-6 py-5 border-b border-[#e0e2ec] dark:border-[#43474e] flex justify-between items-center bg-[#f2f6fa] dark:bg-[#111315]">
            <h3 className="text-lg font-black text-[#1a1c1e] dark:text-[#e3e2e6]">
              Fix Payment
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#ffdad6] text-[#43474e] hover:text-[#ba1a1a] rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="text-[11px] font-black text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-widest block mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1a1c1e] dark:text-[#e3e2e6] font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-[#fdfcff] dark:bg-[#1a1c1e] border border-[#74777f] dark:border-[#8e918f] rounded-[16px] text-lg font-bold text-[#1a1c1e] dark:text-[#e3e2e6] focus:ring-2 focus:ring-[#006e1c] outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-widest block mb-2">
                Payment Method
              </label>
              <PaymentMethodSelect
                value={method}
                onChange={setMethod}
                options={paymentMethods}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#006e1c] text-white rounded-[16px] text-sm font-bold shadow-lg hover:bg-[#005313] disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <CheckCircle2 size={18} />
                </motion.div>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Update & Auto-Approve
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpdatePaymentModal;
