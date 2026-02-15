import { useState, useEffect } from "react";
import { X, Printer, Loader2, FileText } from "lucide-react";
import { API_BASE_URL, authFetch } from "../../../config";
import { printToken, printA4Token } from "../../../utils/printToken";
import { toast } from "sonner";

interface TokenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number | null;
}

const TokenPreviewModal = ({
  isOpen,
  onClose,
  patientId,
}: TokenPreviewModalProps) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPreview();
    }
  }, [isOpen, patientId]);

  const fetchPreview = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/tokens?action=get_data&patient_id=${patientId}`,
      );
      const json = await res.json();
      if (json.status === "success" || json.success) {
        setData(json.data);
      } else {
        setError(json.message || "Failed to load token data");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndPrint = async (mode: "thermal" | "a4") => {
    setPrinting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/tokens`, {
        method: "POST",
        body: JSON.stringify({ action: "generate", patient_id: patientId }),
      });
      const json = await res.json();

      if (json.status === "success" || json.success) {
        const printData = json.data || data;
        if (mode === "thermal") {
          printToken(printData);
        } else {
          printA4Token(printData);
        }
        toast.success(`Token generated & sent to ${mode} printer`);
        onClose();
      } else {
        toast.error(json.message || "Failed to generate token");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPrinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-[#111315] w-full max-w-md rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="p-8 pb-4 flex justify-between items-center text-center">
          <div className="flex-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
              Token Print
            </h3>
            <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Select Print Format
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center py-10">
              <Loader2
                className="animate-spin text-emerald-500 mb-4"
                size={40}
              />
              <p className="text-sm font-bold text-slate-500">
                Preparing token data...
              </p>
            </div>
          ) : error ? (
            <div className="text-red-500 font-bold text-center py-10">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-8">
              {/* Token Preview Card */}
              <div className="bg-white border-2 border-dashed border-slate-300 p-6 rounded-[4px] relative overflow-hidden shadow-sm mx-auto max-w-[300px] text-black font-mono text-xs">
                <div className="text-center mb-4">
                  <h1 className="font-black text-xl uppercase tracking-wider mb-1">
                    {(data.clinic_name || "PROSPINE").toUpperCase()}
                  </h1>
                  <p className="text-[10px] uppercase font-bold">
                    {data.branch_address?.toUpperCase()}
                  </p>
                  <p className="text-[10px] uppercase font-bold mb-2">
                    Ph: {data.branch_phone}
                  </p>
                  <div className="border-t-2 border-black border-dashed my-2"></div>
                  <div className="flex justify-between font-bold">
                    <span>TOKEN #:</span>
                    <span>{data.token_number || "--"}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>DATE:</span>
                    <span>
                      {new Date().toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>PATIENT:</span>
                    <span>{data.patient_name}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>DOCTOR:</span>
                    <span>{data.assigned_doctor || "NOT ASSIGNED"}</span>
                  </div>
                  <div className="border-t-2 border-black border-dashed my-2"></div>
                </div>

                <div className="text-center my-6">
                  <p className="text-xs font-bold uppercase mb-2">
                    YOUR TOKEN NUMBER
                  </p>
                  <p className="text-6xl font-black block leading-none">
                    {data.token_number
                      ? String(data.token_number).padStart(2, "0")
                      : "00"}
                  </p>
                </div>

                <div className="border-t-2 border-black border-dashed my-2"></div>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>TREATMENT:</span>
                    <span>
                      {data.attendance_progress?.replace("/", " / ") || "1 / 1"}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>AMT PAID:</span>
                    <span>
                      ₹
                      {parseFloat(data.paid_today || "0").toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>DUES:</span>
                    <span>
                      ₹
                      {parseFloat(data.due_amount || "0").toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>PKG DUES:</span>
                    <span>
                      ₹
                      {parseFloat(data.pkg_dues || "0").toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>WALLET BAL:</span>
                    <span>
                      ₹
                      {parseFloat(data.effective_balance || "0").toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                </div>
                <div className="border-t-2 border-black border-dashed my-2"></div>

                <div className="text-center mt-4">
                  <p className="font-bold text-xs mb-1">
                    PLEASE WAIT FOR YOUR TURN
                  </p>
                  <p className="text-[9px]">System Generated Token</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handleGenerateAndPrint("thermal")}
                    disabled={printing || data?.has_token_today}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest text-[11px]"
                  >
                    {printing ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Printer size={18} />
                    )}
                    {data?.has_token_today
                      ? "Token Already Printed"
                      : 'Print Thermal Slip (3")'}
                  </button>

                  <button
                    onClick={() => handleGenerateAndPrint("a4")}
                    disabled={printing || data?.has_token_today}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest text-[11px]"
                  >
                    {printing ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <FileText size={18} />
                    )}
                    Print A4 Statement
                  </button>
                </div>
                {data?.has_token_today && (
                  <p className="text-[10px] text-center text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest bg-amber-500/10 py-2 rounded-lg">
                    Re-printing is currently restricted
                  </p>
                )}
                <p className="text-[10px] text-center text-slate-400 font-medium px-4 leading-relaxed">
                  Thermal slips are best for quick tokens. A4 Statements provide
                  a formal receipt for insurance or records.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
export default TokenPreviewModal;
