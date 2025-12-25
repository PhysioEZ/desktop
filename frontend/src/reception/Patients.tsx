import { useState, useEffect } from 'react';
import { 
    Search, ChevronLeft, ChevronRight, 
    User, Phone, Stethoscope, 
    CheckCircle2, Printer, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import ReceptionLayout from '../components/Layout/ReceptionLayout';
import { useAuthStore } from '../store/useAuthStore';
import { API_BASE_URL } from '../config';

interface Patient {
    patient_id: number;
    patient_uid: string;
    patient_name: string;
    patient_phone: string;
    patient_photo_path: string;
    assigned_doctor: string;
    service_type: string;
    treatment_type: string;
    due_amount: string;
    effective_balance: number;
    treatment_days: number;
    attendance_count: number;
    patient_status: string;
    today_attendance: string | null;
    has_token_today: boolean;
}

const Patients = () => {
    const { user } = useAuthStore();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [doctorFilter, setDoctorFilter] = useState('');
    
    // Dropdown Options
    const [doctors, setDoctors] = useState<string[]>([]);
    const [statuses, setStatuses] = useState<string[]>([]);

    const fetchPatients = async () => {
        if (!user?.branch_id) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/reception/patients.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'fetch',
                    branch_id: user.branch_id,
                    page,
                    search,
                    status: statusFilter,
                    doctor: doctorFilter
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                setPatients(result.data);
                setTotalPages(result.pagination.total_pages);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFilters = async () => {
        if (!user?.branch_id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/reception/patients.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'fetch_filters',
                    branch_id: user.branch_id
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                setDoctors(result.data.doctors || []);
                setStatuses(result.data.statuses || []);
            }
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    };

    useEffect(() => {
        if (user?.branch_id) {
            fetchFilters();
        }
    }, [user?.branch_id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPatients();
        }, 300);
        return () => clearTimeout(timer);
    }, [page, search, statusFilter, doctorFilter, user?.branch_id]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'completed': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'inactive': return 'bg-slate-50 text-slate-500 border-slate-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <ReceptionLayout>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Patients</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Manage patient records and treatment plans</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 shadow-sm">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search patients..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 dark:text-white"
                        />
                    </div>
                    
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                    >
                        <option value="">All Status</option>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select 
                        value={doctorFilter}
                        onChange={(e) => setDoctorFilter(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                    >
                        <option value="">All Doctors</option>
                        {doctors.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 dark:border-slate-800">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Patient</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Treatment Details</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Financials</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-slate-400">Loading...</td>
                                    </tr>
                                ) : patients.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-slate-400">No patients found.</td>
                                    </tr>
                                ) : (
                                    patients.map((patient) => {
                                        const totalDays = patient.treatment_days || 1;
                                        const progress = Math.min(100, (patient.attendance_count / totalDays) * 100);
                                        const dueAmount = parseFloat(patient.due_amount || '0');

                                        return (
                                            <motion.tr 
                                                key={patient.patient_id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                            {patient.patient_photo_path ? (
                                                                <img src={`/admin/${patient.patient_photo_path}`} className="w-full h-full object-cover rounded-2xl" alt="" />
                                                            ) : (
                                                                <User size={20} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{patient.patient_name}</span>
                                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold">#{patient.patient_uid}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-slate-400">
                                                                <Phone size={10} />
                                                                <span className="text-[10px] font-medium">{patient.patient_phone}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                            <Stethoscope size={12} className="text-teal-500" />
                                                            {patient.service_type || '-'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium pl-5 uppercase tracking-wide">
                                                            {patient.treatment_type} • {patient.assigned_doctor}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="w-32">
                                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                                            <span>Attendance</span>
                                                            <span>{patient.attendance_count}/{patient.treatment_days}</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="space-y-1">
                                                        <p className={`text-xs font-black ${dueAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                            {dueAmount > 0 ? `Due: ₹${dueAmount}` : 'Paid'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                            Bal: ₹{patient.effective_balance?.toFixed(0)}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(patient.patient_status)}`}>
                                                        {patient.patient_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-xl transition-all" title="View Details">
                                                            <Eye size={16} />
                                                        </button>
                                                        <button 
                                                            className={`p-2 rounded-xl transition-all ${
                                                                patient.today_attendance === 'present' 
                                                                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 cursor-default'
                                                                    : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                            }`}
                                                            title="Mark Attendance"
                                                            disabled={patient.today_attendance === 'present'}
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                        <button 
                                                            className={`p-2 rounded-xl transition-all ${
                                                                patient.has_token_today
                                                                    ? 'text-purple-400 opacity-50 cursor-not-allowed'
                                                                    : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                                            }`}
                                                            title="Print Token"
                                                            disabled={patient.has_token_today}
                                                        >
                                                            <Printer size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ReceptionLayout>
    );
};

export default Patients;
