import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Phone,
  Clock,
  CheckCircle2,
  Wallet,
  Zap,
  RefreshCw,
} from "lucide-react";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    selectedPatient,
    isDetailsModalOpen,
    closePatientDetails,
    patientDetails,
    isLoadingDetails,
    billingViewMode,
    fetchPatientDetails,
  } = usePatientStore();
  const { isDark } = useThemeStore();

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

  // Filter and Calculate Scoped Data
  const scopedData = useMemo(() => {
    if (!patientDetails) return null;

    if (billingViewMode === "test") {
      const tests = patientDetails.tests || [];
      const totalBilled = tests.reduce(
        (sum, t) => sum + parseNum(t.total_amount),
        0,
      );
      const payments = (patientDetails.payments || []).filter(
        (p) => p.type === "test",
      );
      const totalPaid = payments.reduce(
        (sum, p) => sum + parseNum(p.amount),
        0,
      );
      const totalDiscount = tests.reduce(
        (sum, t) => sum + parseNum(t.discount),
        0,
      );
      return {
        totalBilled,
        totalPaid,
        dueAmount: totalBilled - totalPaid - totalDiscount,
        payments,
        title: "Test Billing Summary",
        subtitle: `${tests.length} recorded tests`,
      };
    } else {
      const totalBilled = parseNum(patientDetails.total_amount);
      const payments = (patientDetails.payments || []).filter(
        (p) => !p.type || p.type === "treatment",
      );
      const totalPaid = payments.reduce(
        (sum, p) => sum + parseNum(p.amount),
        0,
      );
      const totalDiscount = parseNum(patientDetails.discount_amount);
      return {
        totalBilled,
        totalPaid,
        dueAmount: totalBilled - totalPaid - totalDiscount,
        payments,
        title: "Treatment Billing Summary",
        subtitle: "Primary treatment plan",
      };
    }
  }, [patientDetails, billingViewMode]);

  const data: any = { ...selectedPatient, ...patientDetails };
  const currentScoped = scopedData || {
    totalBilled: 0,
    totalPaid: 0,
    dueAmount: 0,
    payments: [],
    title: "Summary",
    subtitle: "Loading data...",
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (selectedPatient?.patient_id) {
        // Registered patient
        await fetchPatientDetails(selectedPatient.patient_id, selectedPatient.patient_name, selectedPatient.patient_phone || selectedPatient.phone_number);
      } else if (selectedPatient?.patient_name && (selectedPatient?.patient_phone || selectedPatient?.phone_number)) {
        // Walk-in patient (fetch by name and phone)
        await fetchPatientDetails(null, selectedPatient.patient_name, selectedPatient.patient_phone || selectedPatient.phone_number);
      }
    } catch (error) {
      console.error("Error refreshing patient details:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    if (!onExport || !scopedData) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; background: #fff; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          .brand { font-size: 18px; font-weight: 900; letter-spacing: -0.02em; color: ${billingViewMode === "test" ? "#8b5cf6" : "#10b981"}; text-transform: uppercase; }
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
          
          .col-date { width: 20%; text-align: left; }
          .col-test { width: 25%; text-align: left; }
          .col-method { width: 15%; text-align: left; }
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
          <div class="brand">PhysioEZ / Ledger / ${billingViewMode.toUpperCase()}</div>
          <div class="report-info">
            <h1 class="report-title">${data.patient_name}</h1>
            <p class="report-meta">ID: #${data.patient_id} • Generated on ${format(new Date(), "dd MMM yyyy")}</p>
          </div>
        </div>

        <div class="subscriber-card">
          <div class="stat-item">
            <div class="stat-label">Total Billed</div>
            <div class="stat-value">${fmt(currentScoped.totalBilled)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Total Paid</div>
            <div class="stat-value highlight">${fmt(currentScoped.totalPaid)}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Outstanding Due</div>
            <div class="stat-value ${currentScoped.dueAmount > 0 ? "danger" : ""}">${fmt(currentScoped.dueAmount)}</div>
          </div>
          ${
            billingViewMode !== "test"
              ? `
          <div class="stat-item">
            <div class="stat-label">Wallet Balance</div>
            <div class="stat-value ${parseNum(data.effective_balance) < 0 ? "danger" : ""}">${fmt(data.effective_balance || 0)}</div>
          </div>`
              : ""
          }
        </div>
        
        <h3 style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin: 40px 0 16px 4px;">${billingViewMode === "test" ? "Test Payments" : "Treatment Payments"}</h3>
        <table>
          <thead>
            <tr>
              <th class="col-date">Date & Time</th>
              <th class="col-test">${billingViewMode === "test" ? "Test Name" : "Service"}</th>
              <th class="col-method">Payment Method</th>
              <th class="col-amount">Amount</th>
              <th class="col-status">Status</th>
            </tr>
          </thead>
          <tbody>
            ${(currentScoped.payments || [])
              .map(
                (p: any) => `
              <tr>
                <td class="col-date">
                  ${format(new Date(p.payment_date || p.created_at), "dd MMM yyyy, hh:mm a")}
                </td>
                <td class="col-test">
                  <span style="font-weight: 700; color: #0f172a;">${p.test_name || p.remarks || "Service"}</span>
                </td>
                <td class="col-method">
                  <span class="mode">${p.payment_method || "Cash"}</span>
                </td>
                <td class="col-amount amount">${fmt(p.amount)}</td>
                <td class="col-status"><div class="success-badge">● SUCCESSFUL</div></td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="footer">
          End of Ledger • ${billingViewMode.toUpperCase()} records only
        </div>
      </body>
      </html>
    `;

    const htmlBlob = new Blob([htmlContent], { type: "text/html" });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    const fileName = `ledger_${billingViewMode}_${data.patient_name.replace(/\s+/g, "_").toLowerCase()}`;

    onExport(htmlUrl, fileName + ".html");
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
            className={`fixed inset-y-0 right-0 w-full max-w-[800px] shadow-[0_0_100px_rgba(0,0,0,0.5)] z-[1000] flex flex-col ${isDark ? "bg-[#0A0A0A] border-l border-white/5" : "bg-white border-l border-gray-200"}`}
          >
            {/* Header Area */}
            <div
              className={`px-8 pt-10 pb-6 shrink-0 ${isDark ? "bg-gradient-to-b from-white/[0.02] to-transparent" : "bg-[#FAFAFA]"}`}
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2
                    className={`text-2xl font-black uppercase tracking-tight leading-none ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {data.patient_name}
                  </h2>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-[12px] font-black uppercase tracking-[0.3em] opacity-30">
                      Patient ID • #{data.patient_id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${billingViewMode === "test" ? "bg-purple-500 text-white" : "bg-emerald-500 text-white"}`}
                    >
                      {billingViewMode}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-white/40" : "bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-slate-600"} ${isRefreshing ? "opacity-50 cursor-not-allowed" : ""}`}
                    title="Refresh details"
                  >
                    <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
                  </button>
                  <button
                    onClick={closePatientDetails}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-white/40" : "bg-white shadow-sm border border-slate-200 text-slate-400 hover:text-slate-600"}`}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Patient Core Card */}
              <div
                className={`p-6 rounded-[32px] border relative overflow-hidden transition-all ${isDark ? "bg-[#111] border-white/5 shadow-2xl" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/40"}`}
              >
                <div className="grid grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-6">
                    <div>
                      <h3
                        className={`text-lg font-black tracking-tight mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {data.patient_name}
                      </h3>
                      <div className="flex gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}
                        >
                          {data.status || data.patient_status || "ACTIVE"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? "bg-white/5 text-white/40" : "bg-slate-50 text-slate-400"}`}
                      >
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black opacity-30 mb-0.5 uppercase tracking-widest">
                          Phone
                        </p>
                        <p
                          className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {data.patient_phone || data.phone_number || "NA"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 text-right">
                    <div>
                      <p
                        className={`text-base font-black ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        Dr.{" "}
                        {data.assigned_doctor?.split(" ").pop() ||
                          "Not Assigned"}
                      </p>
                      <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">
                        Primary Consultant
                      </p>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                      <div className="text-right">
                        <p className="text-[10px] font-black opacity-30 mb-0.5 uppercase tracking-widest">
                          Member Since
                        </p>
                        <p
                          className={`text-xs font-black ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {format(
                            new Date(data.created_at || new Date()),
                            "dd MMMM yyyy",
                          )}
                        </p>
                      </div>
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isDark ? "bg-white/5 text-white/40" : "bg-slate-50 text-slate-400"}`}
                      >
                        <Clock size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-10 space-y-8">
              {/* Financial Grid */}
              <section>
                <div className="flex flex-col gap-2 mb-6 px-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-[12px] font-black uppercase tracking-[0.4em] ${billingViewMode === "test" ? "text-purple-500" : "text-emerald-500"}`}
                    >
                      {currentScoped.title}
                    </h4>
                    {billingViewMode === "test" && (
                      <span
                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${data.patient_id ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"}`}
                      >
                        {data.patient_id
                          ? "REGISTERED PATIENT"
                          : "WALK-IN / STANDALONE"}
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-1">
                    {currentScoped.subtitle}
                  </p>
                </div>

                <div
                  className={`p-8 rounded-[40px] border transition-all relative overflow-hidden ${isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/30"}`}
                >
                  {/* Decorative background gradients */}
                  <div
                    className={`absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-[0.03] pointer-events-none ${billingViewMode === "test" ? "bg-purple-500" : "bg-emerald-500"}`}
                  />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 blur-[80px] opacity-[0.02] pointer-events-none" />

                  <div className="grid grid-cols-4 gap-6 relative z-10">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={10} className="opacity-40" />
                        <span className="text-[8px] font-black opacity-40 uppercase tracking-[0.2em]">
                          Total Billed
                        </span>
                      </div>
                      <p
                        className={`text-xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {fmt(currentScoped.totalBilled)}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={10} className="text-emerald-500" />
                        <span className="text-[8px] font-black opacity-40 uppercase tracking-[0.2em] text-emerald-500">
                          Total Paid
                        </span>
                      </div>
                      <p className="text-xl font-black text-emerald-500">
                        {fmt(currentScoped.totalPaid)}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={10} className="text-orange-500" />
                        <span className="text-[8px] font-black opacity-40 uppercase tracking-[0.2em] text-orange-500">
                          Balance Due
                        </span>
                      </div>
                      <p
                        className={`text-xl font-black ${currentScoped.dueAmount > 0 ? "text-orange-500" : "text-slate-300"}`}
                      >
                        {fmt(currentScoped.dueAmount)}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap size={10} className="text-blue-500" />
                        <span className="text-[8px] font-black opacity-40 uppercase tracking-[0.2em] text-blue-500">
                          Paid Today
                        </span>
                      </div>
                      <p className="text-xl font-black text-blue-500">
                        {fmt(data.has_payment_today)}
                      </p>
                    </div>

                    {billingViewMode !== "test" && (
                      <div
                        className={`col-span-4 mt-4 pt-8 border-t ${isDark ? "border-white/5" : "border-slate-50"} flex items-center justify-between`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${parseNum(data.effective_balance) < 0 ? "bg-red-500 shadow-red-500/20 text-white" : "bg-emerald-500 shadow-emerald-500/20 text-white"}`}
                          >
                            <Wallet size={20} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p
                              className={`text-[10px] font-black uppercase tracking-[0.2em] ${parseNum(data.effective_balance) < 0 ? "text-red-500" : "text-emerald-600"}`}
                            >
                              Wallet Balance
                            </p>
                            <p className="text-[8px] font-bold opacity-30 uppercase tracking-widest mt-1">
                              Combined Credit / Outstanding
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-2xl font-black ${parseNum(data.effective_balance) < 0 ? "text-red-500" : "text-emerald-600"}`}
                        >
                          {fmt(data.effective_balance || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Individual Test Records Section */}
              {billingViewMode === "test" &&
                patientDetails?.tests &&
                patientDetails.tests.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-6 px-1">
                      <h4 className="text-[12px] font-black uppercase tracking-[0.4em] opacity-30">
                        Assigned Test Records
                      </h4>
                      <div
                        className={`h-px flex-1 mx-6 opacity-5 ${isDark ? "bg-white" : "bg-black"}`}
                      />
                    </div>

                    <div className="grid gap-3">
                      {patientDetails.tests.map((t: any) => (
                        <div
                          key={t.test_id}
                          className={`p-5 rounded-[28px] border flex items-center justify-between transition-all ${isDark ? "bg-white/[0.03] border-white/5" : "bg-slate-50 border-slate-100"}`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-600"}`}
                            >
                              <Zap size={18} />
                            </div>
                            <div>
                              <p
                                className={`text-sm font-black uppercase tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                              >
                                {t.test_name}
                              </p>
                              <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                                {format(
                                  new Date(t.created_at),
                                  "dd MMM yyyy • hh:mm a",
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}
                            >
                              {fmt(t.total_amount)}
                            </p>
                            <p
                              className={`text-[9px] font-black uppercase tracking-widest ${t.payment_status === "paid" ? "text-emerald-500" : "text-orange-500"}`}
                            >
                              {t.payment_status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              {/* History Section */}
              <section>
                <div className="flex items-center justify-between mb-8 px-1">
                  <h4 className="text-[12px] font-black uppercase tracking-[0.4em] opacity-30">
                    Mode Transactions
                  </h4>
                  <div
                    className={`h-px flex-1 mx-6 opacity-5 ${isDark ? "bg-white" : "bg-black"}`}
                  />
                  {currentScoped.payments && (
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500"}`}
                    >
                      {currentScoped.payments.length} Records
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {isLoadingDetails ? (
                    [1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-24 rounded-[32px] animate-pulse ${isDark ? "bg-white/5" : "bg-slate-100"}`}
                      />
                    ))
                  ) : currentScoped.payments.length === 0 ? (
                    <div
                      className={`p-16 text-center border-2 border-dashed rounded-[40px] ${isDark ? "border-white/5" : "border-slate-100"}`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? "bg-white/5 text-white/20" : "bg-slate-50 text-slate-300"}`}
                      >
                        <Clock size={24} />
                      </div>
                      <p className="text-[12px] font-black uppercase tracking-[0.3em] opacity-20">
                        No {billingViewMode} transactions found
                      </p>
                    </div>
                  ) : (
                    currentScoped.payments.map((p: any) => (
                      <motion.div
                        key={p.payment_id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-6 rounded-[32px] flex items-center gap-6 group border transition-all ${isDark ? "bg-[#111] border-white/5 hover:bg-[#161616]" : "bg-white border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50"}`}
                      >
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6 ${billingViewMode === "test" ? "bg-purple-500/10 text-purple-600" : "bg-emerald-500/10 text-emerald-600"}`}
                        >
                          <FileText size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5
                            className={`font-black text-base uppercase tracking-wide truncate ${isDark ? "text-white" : "text-slate-950"}`}
                          >
                            {p.payment_method || "Payment Source"}
                          </h5>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">
                              {format(
                                new Date(p.payment_date || p.created_at),
                                "dd MMM yyyy • hh:mm a",
                              )}
                            </p>
                          </div>
                          {p.test_name && (
                            <div className="mt-2 flex items-center gap-2">
                              <Zap size={10} className="text-purple-500" />
                              <p className="text-[11px] font-black text-purple-500/80 uppercase tracking-tight truncate">
                                {p.test_name}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-xl font-black leading-none ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {fmt(p.amount)}
                          </p>
                          <div className="flex items-center justify-end gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-500 mt-2">
                            <CheckCircle2 size={10} strokeWidth={3} /> Success
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
              className={`p-8 border-t shrink-0 ${isDark ? "bg-black border-white/5" : "bg-white border-slate-100"}`}
            >
              <button
                onClick={handleExport}
                className={`w-full h-12 rounded-[18px] text-white font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all active:scale-[0.98] ${billingViewMode === "test" ? "bg-purple-600 hover:bg-purple-500" : "bg-emerald-600 hover:bg-emerald-500"}`}
              >
                <FileText size={18} />
                Generate {billingViewMode} Ledger
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BillingDrawer;
