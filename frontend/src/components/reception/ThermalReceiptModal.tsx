import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer } from "lucide-react";

interface TestRecord {
    uid: string;
    patient_name: string;
    test_name: string;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_status: 'Paid' | 'Partial' | 'Unpaid';
    test_status: 'Completed' | 'Pending' | 'Cancelled';
}

interface ThermalReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: TestRecord | null;
}

const ThermalReceiptModal = ({ isOpen, onClose, data }: ThermalReceiptModalProps) => {
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!data) return null;

    const handlePrint = () => {
        const printContent = receiptRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Receipt - ${data.uid}</title>
                        <style>
                            @page {
                                size: 80mm auto;
                                margin: 0;
                            }
                            body {
                                margin: 0;
                                padding: 5mm;
                                width: 70mm;
                                font-family: 'Courier New', Courier, monospace;
                                font-size: 10pt;
                                color: #000;
                            }
                            .receipt-container {
                                width: 100%;
                            }
                            .text-center { text-align: center; }
                            .text-right { text-align: right; }
                            .font-bold { font-weight: bold; }
                            .border-top { border-top: 1px dashed #000; margin: 4mm 0; }
                            .flex-between { display: flex; justify-content: space-between; gap: 4px; }
                            .uppercase { text-transform: uppercase; }
                            .box { border: 1.5px solid #000; padding: 2mm; margin: 4mm 0; text-align: center; font-weight: bold; }
                            .line { border-top: 1px dashed #000; width: 100%; margin: 2mm 0; }
                            .double-line { border-top: 2px solid #000; margin: 1mm 0; }
                            .mt-4 { margin-top: 4mm; }
                            .header-title { font-size: 11pt; font-weight: 900; margin-bottom: 2mm; }
                            .header-address { font-size: 9pt; margin-bottom: 1mm; }
                        </style>
                    </head>
                    <body>
                        ${printContent.innerHTML}
                        <script>
                            window.onload = function() {
                                window.print();
                                window.onafterprint = function() { window.close(); };
                            };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-slate-100 dark:bg-[#1a1c1e] w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[95vh]"
                    >
                        {/* Modal Header */}
                        <div className="p-8 flex flex-col items-center gap-4">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-xl text-sm font-black tracking-widest uppercase hover:scale-105 transition-all shadow-xl"
                            >
                                <Printer size={18} strokeWidth={3} />
                                PRINT RECEIPT
                            </button>
                            <p className="text-[11px] font-bold text-slate-400">
                                Use browser print dialog (Ctrl+P) • Select 80mm Thermal Printer
                            </p>
                        </div>

                        {/* Receipt Container */}
                        <div className="flex-1 overflow-y-auto px-8 pb-10 flex justify-center">
                            <div
                                ref={receiptRef}
                                className="bg-white text-black p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-[320px] font-mono leading-tight select-none"
                                style={{ fontFamily: "'Courier New', Courier, monospace" }}
                            >
                                <div className="text-center">
                                    <div className="font-black text-[15px] uppercase tracking-tighter mb-1 leading-tight">MANIPAL NEURO DIAGNOSTICS CENTRE</div>
                                    <div className="text-[10px] font-bold opacity-80 mb-0.5">Swami Vivika Nand Road, Aadampur Chowk,</div>
                                    <div className="text-[10px] font-bold opacity-80 mb-1">Bhagalpur</div>
                                    <div className="text-[10px] font-black tracking-tighter">Ph: +91-8002910021</div>
                                </div>

                                <div className="border-t border-dashed border-black my-4 w-full" />

                                <div className="space-y-1 text-[11px] font-black">
                                    <div className="flex justify-between items-end">
                                        <span className="opacity-80">RCPT #:</span>
                                        <span className="text-[12px]">{data.uid}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="opacity-80">DATE:</span>
                                        <span>{new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                    </div>
                                    <div className="flex justify-between items-start uppercase">
                                        <span className="opacity-80">PATIENT:</span>
                                        <span className="text-right ml-4 max-w-[150px]">{data.patient_name}</span>
                                    </div>
                                </div>

                                <div className="mt-6 font-black text-[11px] flex justify-between">
                                    <span>ITEM</span>
                                    <span>AMT</span>
                                </div>

                                <div className="border-t border-dashed border-black my-2 w-full" />

                                <div className="space-y-1.5 text-[11px] font-black">
                                    {data.test_name.split(', ').map((test, i) => (
                                        <div key={i} className="flex justify-between">
                                            <span className="uppercase">{test}</span>
                                            {i === 0 ? <span>{data.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span> : <span>0.00</span>}
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-dashed border-black my-4 w-full" />

                                <div className="space-y-2 text-[11px] font-black">
                                    <div className="flex justify-between">
                                        <span className="opacity-80">SUBTOTAL:</span>
                                        <span>{data.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    <div className="border-t-2 border-black pt-1 mt-1">
                                        <div className="flex justify-between text-[12px]">
                                            <span>TOTAL:</span>
                                            <span>{data.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between mt-2 pt-1">
                                        <span className="opacity-80">PAID:</span>
                                        <span>{data.paid_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="opacity-80">BALANCE DUE:</span>
                                        <span>{data.due_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <div className="border border-[1.5px] border-black p-1.5 my-6 text-center font-black text-[12px] uppercase tracking-widest">
                                    STATUS: {data.payment_status}
                                </div>

                                <div className="border-t border-dashed border-black my-4 w-full" />

                                <div className="text-center font-black tracking-tighter">
                                    <div className="text-[10px] mb-1">THANK YOU FOR VISITING</div>
                                    <div className="text-[10px] italic opacity-60">System Generated Receipt</div>
                                </div>
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all text-slate-400 hover:text-rose-500"
                        >
                            <X size={24} />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ThermalReceiptModal;
