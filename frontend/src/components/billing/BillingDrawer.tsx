import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Phone, Clock, CheckCircle2, Wallet } from "lucide-react";
import { usePatientStore } from "../../store/usePatientStore";
import { format } from "date-fns";
import { useThemeStore } from "../../store/useThemeStore";

interface BillingDrawerProps {
  onExport?: (
    url: string,
    fileName: string,
    downloadUrl?: string,
    downloadFileName?: string,
  ) => void;
}

const BillingDrawer: React.FC<BillingDrawerProps> = ({ onExport }) => {
  const {
    selectedPatient,
    isDetailsModalOpen,
    closePatientDetails,
    patientDetails,
    isLoadingDetails,
  } = usePatientStore();
  const { isDark } = useThemeStore();

  const data: any = { ...selectedPatient, ...patientDetails };

  const parseNum = (val: any) => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    return parseFloat(String(val).replace(/[^\d.-]/g, "")) || 0;
  };

  const fmt = (val: number | string | undefined) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(parseNum(val));
  };

  const dueAmount =
    parseNum(data.total_amount) -
    parseNum(data.total_paid || data.advance_payment || 0);

  const handleExport = () => {
    if (!onExport) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; background: #fff; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          .brand { font-size: 18px; font-weight: 900; letter-spacing: -0.02em; color: #10b981; text-transform: uppercase; }
          .report-info { text-align: right; }
          .report-title { font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.04em; color: #0f172a; }
          .report-meta { font-size: 10px; font-weight: 800; opacity: 0.4; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.1em; }
          
          .subscriber-card { 
            background: #f8fafc; 
            border-radius: 16px; 
            padding: 16px 24px; 
            margin-bottom: 30px; 
            display: flex; 
            align-items: center;
            justify-content: space-between;
            gap: 40px;
          }
          .stat-item { flex: 1; }
          .stat-label { font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
          .stat-value { font-size: 14px; font-weight: 800; color: #0f172a; white-space: nowrap; }
          .stat-value.highlight { color: #10b981; }
          .stat-value.danger { color: #ef4444; }

          table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
          th { padding: 14px 16px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; border-bottom: 2px solid #f1f5f9; background: #fafafa; }
          td { padding: 14px 16px; font-size: 11px; font-weight: 600; color: #334155; border-bottom: 1px solid #f1f5f9; word-break: break-word; }
          
          .col-date { width: 25%; text-align: left; }
          .col-mode { width: 20%; text-align: left; }
          .col-notes { width: 15%; text-align: left; color: #64748b; }
          .col-amount { width: 20%; text-align: right; }
          .col-status { width: 20%; text-align: center; }

          .mode { font-size: 9px; font-weight: 800; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; }
          .amount { font-weight: 800; font-family: 'JetBrains Mono', monospace; }
          .success-badge { color: #059669; font-size: 9px; font-weight: 900; display: inline-flex; align-items: center; gap: 4px; justify-content: center; width: 100%; }
          
          .footer { margin-top: 60px; font-size: 9px; font-weight: 700; opacity: 0.3; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">PhysioEZ / Ledger</div>
          <div class="report-info">
            <h1 class="report-title">${data.patient_name}</h1>
            <p class="report-meta">ID: #${data.patient_id} • Generated on ${format(new Date(), "dd MMM yyyy")}</p>
          </div>
        </div>

        <div class="subscriber-card">
          <div class="stat-item">
            <div class="stat-label">Total Billed</div>
            <div class="stat-value">${fmt(data.total_amount)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Total Paid</div>
            <div class="stat-value highlight">${fmt(data.total_paid || data.advance_payment)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Outstanding Due</div>
            <div class="stat-value ${dueAmount > 0 ? "danger" : ""}">${fmt(dueAmount)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Wallet Balance</div>
            <div class="stat-value ${parseNum(data.effective_balance) < 0 ? "danger" : ""}">${fmt(data.effective_balance || 0)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Status</div>
            <div class="stat-value" style="text-transform: capitalize;">${data.status || data.patient_status || "Active"}</div>
          </div>
        </div>
        
        <h3 style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin: 40px 0 16px 4px;">Payment History</h3>
        <table>
          <thead>
            <tr>
              <th class="col-date">Date & Time</th>
              <th class="col-mode">Mode</th>
              <th class="col-notes">Notes</th>
              <th class="col-amount">Amount</th>
              <th class="col-status">Status</th>
            </tr>
          </thead>
          <tbody>
            ${(data.payments || [])
              .map(
                (p: any) => `
              <tr>
                <td class="col-date">${format(new Date(p.payment_date || p.created_at), "dd MMM yyyy, hh:mm a")}</td>
                <td class="col-mode"><span class="mode">${p.payment_method || "Payment"}</span></td>
                <td class="col-notes">${p.notes || "--"}</td>
                <td class="col-amount amount">${fmt(p.amount)}</td>
                <td class="col-status"><div class="success-badge">● SUCCESSFUL</div></td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="footer">
          End of Ledger • Computer Generated Document
        </div>
      </body>
      </html>
    `;

    const csvHeaders = ["Date", "Type", "Method/Notes", "Amount", "Status"];
    const csvRows = (data.payments || []).map((p: any) => [
      format(new Date(p.payment_date || p.created_at), "yyyy-MM-dd HH:mm"),
      "Payment",
      p.payment_method || p.notes || "Payment Received",
      p.amount,
      "Successful",
    ]);

    const csvContent = [
      [`Patient Report: ${data.patient_name} (#${data.patient_id})`],
      [`Generated on: ${format(new Date(), "dd MMM yyyy HH:mm")}`],
      [""],
      ["Summary"],
      ["Field", "Value"],
      ["Total Billed", parseNum(data.total_amount)],
      ["Total Paid", parseNum(data.total_paid || data.advance_payment)],
      ["Outstanding Due", dueAmount],
      ["Wallet Balance", parseNum(data.effective_balance || 0)],
      [""],
      ["Transaction History"],
      csvHeaders,
      ...csvRows,
    ]
      .map((e) => e.join(","))
      .join("\n");

    const htmlBlob = new Blob([htmlContent], { type: "text/html" });
    const htmlUrl = URL.createObjectURL(htmlBlob);

    const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const csvUrl = URL.createObjectURL(csvBlob);

    const fileName = `report_${data.patient_name.replace(/\s+/g, "_").toLowerCase()}_${format(new Date(), "yyyyMMdd")}`;

    onExport(htmlUrl, fileName + ".html", csvUrl, fileName + ".csv");
  };

  return (
    <AnimatePresence>
      {isDetailsModalOpen && selectedPatient && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePatientDetails}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[990]"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`fixed inset-y-0 right-0 w-full max-w-[700px] shadow-[0_0_100px_rgba(0,0,0,0.5)] z-[1000] flex flex-col ${isDark ? "bg-[#0A0A0A] border-l border-white/5" : "bg-[#f8fafc] border-l border-gray-200"}`}
          >
            {/* Header Area */}
            <div
              className={`px-8 pt-10 pb-6 shrink-0 ${isDark ? "bg-gradient-to-b from-white/[0.02] to-transparent" : "bg-white"}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2
                    className={`text-3xl font-black uppercase tracking-tight leading-none ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {data.patient_name}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-2">
                    Patient ID • #{data.patient_id}
                  </p>
                </div>
                <button
                  onClick={closePatientDetails}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-white/40" : "bg-slate-100 hover:bg-slate-200 text-slate-400"}`}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Patient Core Card */}
              <div
                className={`p-6 rounded-[32px] border relative overflow-hidden transition-all ${isDark ? "bg-[#111] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"}`}
              >
                <div className="flex justify-between items-start relative z-10 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`text-xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {data.patient_name}
                      </h3>
                      <div
                        className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}
                      >
                        {data.status || data.patient_status || "ACTIVE"}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`text-[9px] font-bold ${isDark ? "text-white/60" : "text-slate-500"}`}
                      >
                        {data.patient_age || data.age || "?"}Y •{" "}
                        {data.patient_gender || data.gender || "M"}
                      </span>
                      <div
                        className={`w-1 h-1 rounded-full opacity-20 ${isDark ? "bg-white" : "bg-black"}`}
                      />
                      <span
                        className={`text-[9px] font-bold ${isDark ? "text-white/60" : "text-slate-500"}`}
                      >
                        {data.service_type || "Physio"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      Dr.{" "}
                      {data.assigned_doctor?.split(" ").pop() || "Not Assigned"}
                    </p>
                    <p className="text-[8px] font-bold opacity-20 mt-0.5 uppercase">
                      Consultant
                    </p>
                  </div>
                </div>

                <div
                  className={`h-px w-full opacity-5 mb-6 ${isDark ? "bg-white" : "bg-black"}`}
                />

                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? "bg-white/5 text-white/40" : "bg-slate-50 text-slate-400"}`}
                    >
                      <Phone size={14} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black opacity-30 mb-0.5">
                        Phone
                      </p>
                      <p
                        className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {data.patient_phone || data.phone_number || "NA"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? "bg-white/5 text-white/40" : "bg-slate-50 text-slate-400"}`}
                    >
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black opacity-30 mb-0.5">
                        Joined
                      </p>
                      <p
                        className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {format(
                          new Date(data.created_at || new Date()),
                          "dd MMM yy",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-8 space-y-8">
              {/* Financial Grid */}
              <section>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30">
                    Financial Summary
                  </h4>
                </div>

                <div
                  className={`px-6 py-4 rounded-[32px] border ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-100 shadow-sm"}`}
                >
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                    <div className="flex items-center justify-between border-b border-current opacity-[0.05] pb-2 col-span-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                        Billed
                      </span>
                      <span
                        className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {fmt(data.total_amount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest text-emerald-500">
                        Paid
                      </span>
                      <span className="text-xs font-black text-emerald-500">
                        {fmt(data.total_paid || data.advance_payment)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest text-red-500">
                        Due
                      </span>
                      <span
                        className={`text-xs font-black ${dueAmount > 0 ? "text-red-500" : "opacity-30"}`}
                      >
                        {fmt(dueAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest text-teal-500">
                        Today
                      </span>
                      <span className="text-xs font-black text-teal-500">
                        {fmt(data.has_payment_today)}
                      </span>
                    </div>

                    <div
                      className={`col-span-2 mt-2 pt-4 border-t ${isDark ? "border-white/5" : "border-slate-50"} flex items-center justify-between`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${parseNum(data.effective_balance) < 0 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}
                        >
                          <Wallet size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                          Wallet Balance
                        </span>
                      </div>
                      <span
                        className={`text-lg font-black ${parseNum(data.effective_balance) < 0 ? "text-red-500" : "text-emerald-600"}`}
                      >
                        {fmt(data.effective_balance || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* History Section */}
              <section>
                <div className="flex items-center justify-between mb-6 px-1">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30">
                    Transactions
                  </h4>
                  <div
                    className={`h-px flex-1 mx-4 opacity-5 ${isDark ? "bg-white" : "bg-black"}`}
                  />
                  {data.payments && (
                    <span
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${isDark ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500"}`}
                    >
                      {data.payments.length} Records
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {isLoadingDetails ? (
                    [1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-20 rounded-[24px] animate-pulse ${isDark ? "bg-white/5" : "bg-slate-100"}`}
                      />
                    ))
                  ) : !data.payments || data.payments.length === 0 ? (
                    <div
                      className={`p-10 text-center border-2 border-dashed rounded-[28px] ${isDark ? "border-white/5" : "border-slate-100"}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${isDark ? "bg-white/5 text-white/20" : "bg-slate-50 text-slate-300"}`}
                      >
                        <Clock size={20} />
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-20">
                        No Transaction History
                      </p>
                    </div>
                  ) : (
                    data.payments.map((p: any) => (
                      <motion.div
                        key={p.payment_id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={`p-4 rounded-[24px] flex items-center gap-4 group border transition-all ${isDark ? "bg-[#111] border-white/5 hover:bg-[#161616]" : "bg-white border-slate-100 hover:shadow-xl hover:shadow-slate-200/50"}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}
                        >
                          <FileText size={16} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5
                            className={`font-black text-sm uppercase tracking-wide truncate ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {p.payment_method || "Payment"}
                          </h5>
                          <p className="text-[8px] font-bold opacity-30 mt-0.5 uppercase tracking-widest leading-none">
                            {format(
                              new Date(p.payment_date || p.created_at),
                              "dd MMM yyyy • hh:mm a",
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-base font-black leading-none ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {fmt(p.amount)}
                          </p>
                          <div className="flex items-center justify-end gap-1 text-[7px] font-black uppercase tracking-widest text-emerald-500 mt-1">
                            <CheckCircle2 size={7} /> Successful
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Print/Export Footer */}
            <div
              className={`p-6 border-t shrink-0 ${isDark ? "bg-black border-white/5" : "bg-white border-slate-100"}`}
            >
              <button
                onClick={handleExport}
                className="w-full h-12 rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all hover:bg-emerald-400 active:scale-[0.98]"
              >
                <FileText size={14} />
                Generate Ledger Report
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BillingDrawer;
