import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, IndianRupee, Printer, User, Power, FilePlus, 
    Edit, CreditCard, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { usePatientStore } from '../../store/usePatientStore';
import { format } from 'date-fns';
import { API_BASE_URL, authFetch } from '../../config';
import PayDuesModal from './modals/PayDuesModal';
import AddTestModal from './modals/AddTestModal';
import EditPlanModal from './modals/EditPlanModal';
import ChangePlanModal from './modals/ChangePlanModal';
import { toast } from 'sonner'; 

// Utility for Collapsible Section
const Section = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-[#f2f6fa] dark:bg-[#111315] rounded-xl border border-[#cce5ff] dark:border-[#0842a0] overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 bg-[#eef3f8] dark:bg-[#1e2022] hover:bg-[#e0e2ec] dark:hover:bg-[#2a2c2e] transition-colors"
            >
                <h4 className="font-bold text-[#1a1c1e] dark:text-[#e3e2e6] uppercase tracking-wide text-xs">{title}</h4>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 border-t border-[#cce5ff] dark:border-[#0842a0]">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const PatientDetailsModal = () => {
    const { 
        selectedPatient, 
        isDetailsModalOpen, 
        closePatientDetails, 
        patientDetails, 
        isLoadingDetails,
        fetchPatientDetails 
    } = usePatientStore();

    // Modal States
    const [modals, setModals] = useState({
        payDues: false,
        addTest: false,
        editPlan: false,
        changePlan: false
    });

    const toggleModal = (key: keyof typeof modals, state: boolean) => {
        setModals(prev => ({ ...prev, [key]: state }));
    };

    const handleRefresh = () => {
        if(selectedPatient) fetchPatientDetails(selectedPatient.patient_id);
    };

    const handleToggleStatus = async () => {
        if (!selectedPatient) return;
        if (!confirm('Are you sure you want to toggle this patient\'s status?')) return;
        
        try {
            const res = await authFetch(`${API_BASE_URL}/reception/toggle_patient_status.php`, {
                method: 'POST',
                body: JSON.stringify({ patient_id: selectedPatient.patient_id })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Status updated successfully');
                handleRefresh();
            } else {
                toast.error(data.message || 'Failed to update status');
            }
        } catch (e) {
            toast.error('Error updating status');
        }
    };

    // Combine selectedPatient (list view) with patientDetails (detailed view)
    // patientDetails might be loading, so fallback to selectedPatient where possible
    const data = { ...selectedPatient, ...patientDetails };

    if (!isDetailsModalOpen || !selectedPatient) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={closePatientDetails}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-6xl bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-700 to-teal-900 dark:from-black dark:to-teal-900 p-6 pt-8 pb-16 relative shrink-0">
                         <button 
                            onClick={closePatientDetails}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="flex items-end gap-6 relative z-10 translate-y-8">
                             <div className="w-24 h-24 rounded-[24px] bg-white dark:bg-[#1a1c1e] p-1.5 shadow-xl shrink-0">
                                <div className="w-full h-full rounded-[20px] bg-[#ccebc4] dark:bg-[#0c3b10] flex items-center justify-center text-3xl font-black text-[#002105] dark:text-[#ccebc4] overflow-hidden">
                                     {data.patient_photo_path ? (
                                        <img src={`/admin/${data.patient_photo_path}`} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        data.patient_name?.charAt(0) || 'P'
                                    )}
                                </div>
                            </div>
                            <div className="mb-2 text-white">
                                <h2 className="text-3xl font-bold tracking-tight">{data.patient_name}</h2>
                                <p className="text-teal-100 font-medium flex items-center gap-3 mt-1">
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm">#{data.patient_uid}</span>
                                    <span>{data.patient_phone}</span>
                                    <span>•</span>
                                    <span>{data.patient_age} Yrs / {data.patient_gender}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${data.patient_status === 'active' ? 'bg-[#ccebc4] text-[#002105]' : 'bg-red-200 text-red-900'}`}>
                                        {data.patient_status}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar Actions */}
                    <div className="px-6 pt-12 pb-4 border-b border-[#e0e2ec] dark:border-[#43474e] flex gap-2 flex-wrap items-center bg-[#fdfcff] dark:bg-[#1a1c1e]">
                         <button onClick={() => window.open(`../patients_bill.php?patient_id=${data.patient_id}`, '_blank')} className="btn-action">
                            <Printer size={16} /> Print Bill
                         </button>
                         <button onClick={() => window.open(`../patients_profile.php?patient_id=${data.patient_id}`, '_blank')} className="btn-action">
                            <User size={16} /> Profile
                         </button>
                         <button onClick={handleToggleStatus} className="btn-action text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400">
                            <Power size={16} /> Toggle Status
                         </button>
                         <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
                         <button onClick={() => toggleModal('payDues', true)} className="btn-action text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
                            <IndianRupee size={16} /> Pay Dues
                         </button>
                         <button onClick={() => toggleModal('addTest', true)} className="btn-action">
                            <FilePlus size={16} /> Add Test
                         </button>
                         <button onClick={() => toggleModal('changePlan', true)} className="btn-action text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">
                            <CreditCard size={16} /> Change Plan
                         </button>
                          <button onClick={() => toggleModal('editPlan', true)} className="btn-action">
                            <Edit size={16} /> Edit Plan
                         </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#1a1c1e]">
                        {isLoadingDetails ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="animate-spin text-teal-600" size={32} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column: Personal & Medical */}
                                <div className="space-y-6">
                                     <Section title="Medical Profile">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="label">Assigned Doctor</p>
                                                <p className="value">{data.assigned_doctor || '-'}</p>
                                            </div>
                                             <div>
                                                <p className="label">Service Type</p>
                                                <p className="value">{data.service_type || '-'}</p>
                                            </div>
                                             <div className="col-span-2">
                                                <p className="label">Chief Complaint</p>
                                                <p className="value">{data.patient_condition || '-'}</p>
                                            </div>
                                             <div className="col-span-2">
                                                <p className="label">Referred By</p>
                                                <p className="value">{data.referral_source || (data as any).reffered_by || '-'}</p>
                                            </div>
                                        </div>
                                     </Section>

                                     <Section title="Remarks & Notes">
                                         <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg">
                                             <p className="text-sm text-gray-700 dark:text-gray-300 italic min-h-[60px]">
                                                 {data.remarks || 'No remarks recorded.'}
                                             </p>
                                         </div>
                                     </Section>
                                </div>

                                {/* Right Column: Financial & Treatment */}
                                <div className="space-y-6">
                                     {/* Financial Snapshot Card */}
                                     <div className="bg-gradient-to-br from-[#f8fdff] to-[#e6f4ff] dark:from-[#001d32] dark:to-[#001323] p-5 rounded-[20px] border border-[#cce5ff] dark:border-[#0842a0] shadow-sm">
                                         <div className="flex justify-between items-start mb-4">
                                             <div>
                                                 <h3 className="font-bold text-[#00639b] dark:text-[#a8c7fa] flex items-center gap-2">
                                                     <IndianRupee size={18} /> Financial Snapshot
                                                 </h3>
                                                 <p className="text-xs text-[#00639b]/70 dark:text-[#a8c7fa]/70 mt-1">Current Plan: <span className="font-bold capitalize">{data.treatment_type}</span></p>
                                             </div>
                                             <div className="text-right">
                                                 <p className="text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase">Effective Balance</p>
                                                 <p className={`text-2xl font-black ${(data.effective_balance || 0) < 0 ? 'text-[#ba1a1a] dark:text-[#ffb4ab]' : 'text-[#006e1c] dark:text-[#88d99d]'}`}>
                                                     ₹{parseFloat(String(data.effective_balance || '0')).toLocaleString()}
                                                 </p>
                                             </div>
                                         </div>

                                         <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-[#cce5ff]/50 dark:border-[#0842a0]/50">
                                              <div>
                                                  <p className="label">Cost Per Day</p>
                                                  <p className="value">₹{parseFloat(String(data.cost_per_day || '0')).toLocaleString()}</p>
                                              </div>
                                              <div>
                                                  <p className="label">Total Paid</p>
                                                  <p className="value text-[#006e1c] dark:text-[#88d99d]">₹{data.payments?.reduce((acc:number, p:any) => acc + parseFloat(String(p.amount)), 0).toLocaleString() || '0'}</p>
                                              </div>
                                              <div>
                                                  <p className="label">Start Date</p>
                                                  <p className="value">{data.start_date ? format(new Date(data.start_date), 'dd MMM yyyy') : '-'}</p>
                                              </div>
                                              {parseFloat(String(data.due_amount || '0')) > 0 && (
                                                  <div>
                                                      <p className="label text-[#ba1a1a]">Outstanding Due</p>
                                                      <p className="value text-[#ba1a1a] dark:text-[#ffb4ab]">₹{parseFloat(String(data.due_amount || '0')).toLocaleString()}</p>
                                                  </div>
                                              )}
                                         </div>
                                     </div>

                                     <Section title="Attendance Progress">
                                         <div className="space-y-4">
                                              <div className="flex justify-between text-sm">
                                                  <span className="font-bold">Progress</span>
                                                  <span>{data.attendance_count} / {data.treatment_days} Days</span>
                                              </div>
                                              <div className="h-3 w-full bg-[#dfe3e7] dark:bg-[#43474e] rounded-full overflow-hidden">
                                                  <div 
                                                      className="h-full bg-teal-600 rounded-full transition-all duration-500" 
                                                      style={{ width: `${Math.min(100, ((data.attendance_count || 0) / (data.treatment_days || 1)) * 100)}%` }} 
                                                  />
                                              </div>
                                              <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                                                  Last Visit: {data.last_visit ? format(new Date(data.last_visit), 'dd MMM yyyy') : 'No visits yet'}
                                              </div>
                                         </div>
                                     </Section>

                                     <Section title="Archived History" defaultOpen={false}>
                                         <div className="space-y-3">
                                             {data.history?.map((h: any, i: number) => (
                                                 <div key={i} className="p-3 bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                                                     <div className="flex justify-between font-bold mb-1">
                                                         <span className="capitalize">{h.treatment_type}</span>
                                                         <span>{h.start_date}</span>
                                                     </div>
                                                     <div className="flex justify-between text-xs text-gray-500">
                                                         <span>{h.treatment_days} Days</span>
                                                         <span>Cost: ₹{h.package_cost || h.treatment_cost_per_day}</span>
                                                     </div>
                                                 </div>
                                             ))}
                                             {!data.history?.length && <p className="text-center text-gray-500 text-sm">No history available.</p>}
                                         </div>
                                     </Section>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
            
            {/* Sub Modals */}
             <PayDuesModal 
                isOpen={modals.payDues} 
                onClose={() => toggleModal('payDues', false)} 
                patientId={selectedPatient.patient_id} 
                currentDue={parseFloat(String(data.due_amount || '0'))}
                onSuccess={handleRefresh}
            />
            <AddTestModal 
                isOpen={modals.addTest} 
                onClose={() => toggleModal('addTest', false)} 
                patient={data as any}
                onSuccess={handleRefresh}
            />
            <EditPlanModal
                isOpen={modals.editPlan}
                onClose={() => toggleModal('editPlan', false)}
                patient={data as any} // Must pass details
                onSuccess={handleRefresh}
            />
            <ChangePlanModal
                isOpen={modals.changePlan}
                onClose={() => toggleModal('changePlan', false)}
                patient={data as any}
                onSuccess={handleRefresh}
            />

        </AnimatePresence>
    );
};

// Styles for labels/values
const labelStyle = "text-xs font-bold text-[#43474e] dark:text-[#c4c7c5] uppercase tracking-wider mb-0.5";
const valueStyle = "font-semibold text-[#1a1c1e] dark:text-[#e3e2e6]";

// Helper components to inject styles without global CSS
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    .label { ${labelStyle} }
    .value { ${valueStyle} }
    .btn-action { 
        padding: 0.5rem 0.75rem; 
        border-radius: 0.5rem; 
        font-size: 0.875rem; 
        font-weight: 600; 
        display: flex; 
        align-items: center; 
        gap: 0.5rem; 
        background-color: #f0f4f9; 
        color: #1a1c1e;
        transition: all;
    }
    .dark .btn-action {
        background-color: #1e2022;
        color: #e3e2e6;
    }
    .btn-action:hover { background-color: #e0e2ec; }
    .dark .btn-action:hover { background-color: #2a2c2e; }
`;
document.head.appendChild(styleSheet);

export default PatientDetailsModal;
