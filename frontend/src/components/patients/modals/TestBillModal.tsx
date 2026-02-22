import { useState, useEffect } from "react";
import { X, Printer, Loader2, FileText } from "lucide-react";
import { API_BASE_URL, authFetch } from "../../../config";
import { toast } from "sonner";
import { printA4TestBill, printTestBill } from "../../../utils/printToken";

interface TestBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId: number | null;
}

const TestBillModal = ({ isOpen, onClose, testId }: TestBillModalProps) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && testId) {
      fetchPreview();
    }
  }, [isOpen, testId]);

  const fetchPreview = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/tests`, {
        method: "POST",
        body: JSON.stringify({ action: "get_bill", test_id: testId }),
      });
      const json = await res.json();
      if (json.status === "success" || json.success) {
        setData(json.data);
      } else {
        setError(json.message || "Failed to load bill data");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (mode: "thermal" | "a4") => {
    if (!data) return;

    if (mode === "thermal") {
      printTestBill(data);
    } else {
      toast.info("Preparing A4 test bill...");
      printA4TestBill({
        ...data,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-[#111315] w-full max-w-md rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 pb-4 flex justify-between items-center text-center shrink-0">
          <div className="flex-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
              TEST BILL
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

        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center py-10">
              <Loader2
                className="animate-spin text-emerald-500 mb-4"
                size={40}
              />
              <p className="text-sm font-bold text-slate-500">
                Preparing Bill data...
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
                  <h1 className="font-black text-xl uppercase tracking-wider mb-2 mt-2">
                    {(data.clinic_name || "PROSPINE").toUpperCase()}
                  </h1>
                  <p className="text-[10px] uppercase font-bold mb-2">
                    {(
                      data.branch_address || "SWAMI VIVIKA NAND ROAD"
                    ).toUpperCase()}
                  </p>
                  <p className="text-[10px] uppercase font-bold mb-1">
                    PH: {data.branch_phone || "+91-8002910021"}
                  </p>

                  <div className="border-t-[3px] border-dashed border-black my-2"></div>

                  <div className="flex justify-between font-bold text-[11px] mb-1">
                    <span>RCPT #:</span>
                    <span>{data.uid || "--"}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[11px] mb-1">
                    <span>DATE:</span>
                    <span className="uppercase">{data.date}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[11px] text-left mb-1">
                    <span>PATIENT:</span>
                    <span className="text-right ml-2 line-clamp-1 truncate w-32">
                      {data.patient_name}
                    </span>
                  </div>

                  <div className="border-t-[1.5px] border-solid border-black my-2 mb-3"></div>

                  <div className="flex justify-between font-bold text-[11px] mb-2 mt-1">
                    <span>ITEM</span>
                    <span>AMT</span>
                  </div>

                  <div className="border-t-[3px] border-dashed border-black my-2 mt-3"></div>

                  <div className="space-y-1 my-1 opacity-90">
                    {data.items?.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between font-bold text-[11px] mb-1"
                      >
                        <span className="uppercase pr-2">{item.name}</span>
                        <span className="shrink-0 text-right">
                          {Number(item.amount || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))}
                    {(!data.items || data.items.length === 0) &&
                      data.test_name
                        .split(", ")
                        .map((test: string, i: number) => (
                          <div
                            key={i}
                            className="flex justify-between font-bold text-[11px] mb-1"
                          >
                            <span className="uppercase pr-2">{test}</span>
                            {i === 0 ? (
                              <span className="shrink-0 text-right">
                                {Number(data.total_amount).toLocaleString(
                                  "en-IN",
                                  {
                                    minimumFractionDigits: 2,
                                  },
                                )}
                              </span>
                            ) : (
                              <span className="shrink-0 text-right">0.00</span>
                            )}
                          </div>
                        ))}
                  </div>

                  <div className="border-t-[3px] border-dashed border-black my-2"></div>

                  <div className="flex justify-between font-bold text-[11px] mt-1 mb-1">
                    <span>SUBTOTAL:</span>
                    <span>
                      {parseFloat(data.total_amount || "0").toLocaleString(
                        "en-IN",
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>

                  {parseFloat(data.discount || "0") > 0 && (
                    <div className="flex justify-between font-bold text-[11px] mb-1">
                      <span>DISCOUNT:</span>
                      <span>
                        {parseFloat(data.discount || "0").toLocaleString(
                          "en-IN",
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-[11px] mb-2">
                    <span>TOTAL:</span>
                    <span>
                      {(
                        parseFloat(data.total_amount || "0") -
                        parseFloat(data.discount || "0")
                      ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-[11px] mb-1 mt-3">
                    <span>PAID:</span>
                    <span>
                      {parseFloat(data.paid_amount || "0").toLocaleString(
                        "en-IN",
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-[11px] mb-2">
                    <span>BALANCE DUE:</span>
                    <span>
                      {parseFloat(data.due_amount || "0").toLocaleString(
                        "en-IN",
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>

                  <div className="border-t-[3px] border-dashed border-black my-2 mt-4"></div>

                  <div className="text-center my-3 font-bold text-[13px] uppercase tracking-widest px-2 pb-1">
                    STATUS: {data.payment_status}
                  </div>

                  <div className="border-t-[3px] border-dashed border-black my-2 mb-4"></div>

                  <div className="text-center mt-3">
                    <p className="font-bold text-[10px] mb-1 tracking-wider uppercase">
                      THANK YOU FOR VISITING
                    </p>
                    <p className="text-[9px] mt-2">System Generated Receipt</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 shrink-0">
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => handlePrint("thermal")}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-[11px]"
                  >
                    <Printer size={18} />
                    Print Thermal Slip (3")
                  </button>

                  <button
                    onClick={() => handlePrint("a4")}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] uppercase tracking-widest text-[11px]"
                  >
                    <FileText size={18} />
                    Print A4 Statement
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
export default TestBillModal;
