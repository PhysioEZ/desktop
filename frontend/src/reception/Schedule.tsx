import { useState, useEffect, useCallback } from 'react';
import { 
    format, startOfWeek, endOfWeek, eachDayOfInterval, 
    parseISO, addWeeks, subWeeks, isToday, parse
} from 'date-fns';
import { 
    ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
    Clock, X, Loader2, GripVertical, Info, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';
import { 
    DndContext, 
    useDraggable, 
    useDroppable, 
    type DragEndEvent,
    useSensor,
    useSensors,
    PointerSensor
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import ReceptionLayout from '../components/Layout/ReceptionLayout';
import { API_BASE_URL } from '../config';
import { useAuthStore } from '../store/useAuthStore';

// --- Types ---
interface Appointment {
    registration_id: string;
    patient_name: string;
    appointment_date: string; // YYYY-MM-DD
    appointment_time: string; // HH:MM:SS
    status: string;
    patient_uid: string | null;
}

interface Slot {
    time: string; // HH:MM
    label: string; // hh:mm AM/PM
    isBooked: boolean;
}

// --- Components ---

// Draggable Appointment Card
const DraggableAppointment = ({ appointment, onClick }: { appointment: Appointment; onClick: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `appointment-${appointment.registration_id}`,
        data: { appointment }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 1000 : 1
    };

    const getStatusColors = (status: string, date: string) => {
        const s = status.toLowerCase();
        if (s === 'consulted' || s === 'completed') return 'bg-emerald-500 shadow-emerald-500/20';
        if (s === 'pending') {
            const appDate = parseISO(date);
            const today = new Date();
            today.setHours(0,0,0,0);
            if (appDate < today) return 'bg-rose-500 shadow-rose-500/20';
            return 'bg-amber-500 shadow-amber-500/20';
        }
        return 'bg-blue-500 shadow-blue-500/20';
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`group relative flex flex-col gap-1 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-teal-500 dark:hover:border-teal-500 transition-all cursor-grab active:cursor-grabbing mb-1 overflow-hidden select-none`}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
        >
            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${getStatusColors(appointment.status, appointment.appointment_date)}`} />
            
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-slate-800 dark:text-slate-100 truncate leading-tight tracking-tight">
                        {appointment.patient_name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        {appointment.patient_uid || 'ID: ' + appointment.registration_id}
                    </p>
                </div>
                <div {...listeners} className="p-1 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0">
                    <GripVertical size={14} />
                </div>
            </div>
        </div>
    );
};

// Droppable Time Slot Cell
const DroppableSlot = ({ id, day, time, children }: { id: string; day: Date; time: string; children: React.ReactNode }) => {
    const { isOver, setNodeRef } = useDroppable({
        id,
        data: { day, time }
    });

    const isTodaySlot = isToday(day);

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[80px] p-1.5 border-b border-r border-slate-100 dark:border-slate-800/50 transition-colors ${
                isOver ? 'bg-teal-50 dark:bg-teal-900/20 ring-2 ring-inset ring-teal-500/50' : isTodaySlot ? 'bg-teal-50/10' : ''
            }`}
        >
            {children}
        </div>
    );
};

const Schedule = () => {
    const { user } = useAuthStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Sensors for DND
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const weekStartDate = startOfWeek(currentDate);
    const weekStartStr = format(weekStartDate, 'yyyy-MM-dd');
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStartDate, end: weekEnd });

    const timeSlots = Array.from({ length: 20 }, (_, i) => {
        const hour = Math.floor(i / 2) + 9;
        const minute = (i % 2) * 30;
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const label = format(parse(time, 'HH:mm', new Date()), 'hh:mm a');
        return { time, label };
    });

    const fetchSchedule = useCallback(async () => {
        if (!user?.branch_id) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/reception/schedule.php?action=fetch&week_start=${weekStartStr}&branch_id=${user.branch_id}&employee_id=${user.employee_id}`);
            const data = await res.json();
            if (data.success) {
                setAppointments(data.appointments);
            }
        } catch (e) {
            console.error(e);
            showToast('Failed to load schedule', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [user?.branch_id, user?.employee_id, weekStartStr]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const appointment = active.data.current?.appointment as Appointment;
        const { day, time } = over.data.current as { day: Date; time: string };

        const newDate = format(day, 'yyyy-MM-dd');
        const newTime = time;

        if (appointment.appointment_date === newDate && appointment.appointment_time.startsWith(newTime)) return;

        // Perform Update
        setIsUpdating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/reception/schedule.php?action=reschedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    registration_id: appointment.registration_id,
                    new_date: newDate,
                    new_time: newTime,
                    branch_id: user?.branch_id,
                    employee_id: user?.employee_id
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Rescheduled ${appointment.patient_name} to ${format(day, 'MMM d')} at ${format(parse(time, 'HH:mm', new Date()), 'hh:mm a')}`, 'success');
                fetchSchedule();
            } else {
                showToast(data.message || 'Rescheduling failed', 'error');
            }
        } catch (e) {
            console.error(e);
            showToast('Server error during reschedule', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const navigateWeek = (direction: 'next' | 'prev' | 'today') => {
        if (direction === 'next') setCurrentDate(addWeeks(currentDate, 1));
        else if (direction === 'prev') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(new Date());
    };

    const handleAppointmentClick = (app: Appointment) => {
        setActiveAppointment(app);
        setShowRescheduleModal(true);
    };

    if (isLoading && !appointments.length) {
        return (
            <ReceptionLayout>
                <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
                </div>
            </ReceptionLayout>
        );
    }

    return (
        <ReceptionLayout>
            <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
                {/* Header Section */}
                <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-teal-600" />
                                Weekly Schedule
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">Manage and reschedule appointments</p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Navigation */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => navigateWeek('prev')}
                                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-all"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => navigateWeek('today')}
                                    className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                                >
                                    This Week
                                </button>
                                <button
                                    onClick={() => navigateWeek('next')}
                                    className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-all"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            <button
                                onClick={() => fetchSchedule()}
                                disabled={isLoading}
                                className="p-3 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:text-teal-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                title="Reload Schedule"
                            >
                                <RefreshCw size={18} className={`${isLoading ? 'animate-spin' : ''}`} />
                            </button>

                            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block" />

                            <div className="hidden lg:flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-black leading-none">Viewing Range</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        {format(weekStartDate, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Calendar Body */}
                <div className="flex-1 overflow-auto relative p-4">
                    <div className="min-w-[900px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <DndContext 
                            sensors={sensors}
                            onDragEnd={handleDragEnd}
                        >
                            <div className="grid grid-cols-[80px_repeat(7,1fr)]">
                                {/* Header Row */}
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-b border-r border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center sticky top-0 z-30">
                                    <Clock size={16} className="text-slate-400 mb-1" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase">GMT+5:30</span>
                                </div>
                                {days.map((day) => (
                                    <div 
                                        key={day.toString()} 
                                        className={`p-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 sticky top-0 z-30 ${
                                            isToday(day) ? 'ring-2 ring-inset ring-teal-500/20' : ''
                                        }`}
                                    >
                                        <span className={`text-[11px] font-black uppercase ${isToday(day) ? 'text-teal-600' : 'text-slate-400'}`}>
                                            {format(day, 'EEE')}
                                        </span>
                                        <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-lg font-black transition-all ${
                                            isToday(day) 
                                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 ring-4 ring-teal-500/10 scale-105' 
                                            : 'text-slate-800 dark:text-slate-200'
                                        }`}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>
                                ))}

                                {/* Grid Rows */}
                                {timeSlots.map(({ time, label }) => (
                                    <div key={time} className="contents group/row">
                                        {/* Time Label */}
                                        <div className="p-3 flex flex-col items-center justify-center border-b border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 group-hover/row:bg-slate-50 dark:group-hover/row:bg-slate-700/30 transition-colors">
                                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{label}</span>
                                        </div>

                                        {/* Day Cells */}
                                        {days.map((day) => {
                                            const dayStr = format(day, 'yyyy-MM-dd');
                                            const slotApps = appointments.filter(a => 
                                                a.appointment_date === dayStr && 
                                                a.appointment_time.startsWith(time)
                                            );

                                            return (
                                                <DroppableSlot 
                                                    key={`${dayStr}-${time}`} 
                                                    id={`${dayStr}-${time}`}
                                                    day={day}
                                                    time={time}
                                                >
                                                    {slotApps.map((app) => (
                                                        <DraggableAppointment 
                                                            key={app.registration_id} 
                                                            appointment={app} 
                                                            onClick={() => handleAppointmentClick(app)}
                                                        />
                                                    ))}
                                                </DroppableSlot>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </DndContext>
                    </div>
                </div>

                {/* Updating Overlay */}
                <AnimatePresence>
                    {isUpdating && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-[2px] z-50 flex items-center justify-center pointer-events-none"
                        >
                            <div className="bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 animate-bounce">
                                <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Updating...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toasts */}
                <AnimatePresence>
                    {toast && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60]"
                        >
                            <div className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${
                                toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' :
                                toast.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white' :
                                'bg-teal-600/90 border-teal-500 text-white'
                            }`}>
                                {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                <span className="text-sm font-bold tracking-tight">{toast.message}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Reschedule Modal */}
            <AnimatePresence>
                {showRescheduleModal && activeAppointment && (
                    <RescheduleModal 
                        appointment={activeAppointment} 
                        onClose={() => setShowRescheduleModal(false)}
                        onSuccess={() => {
                            setShowRescheduleModal(false);
                            fetchSchedule();
                        }}
                        showToast={showToast}
                    />
                )}
            </AnimatePresence>
        </ReceptionLayout>
    );
};

// --- Reschedule Modal Component ---
const RescheduleModal = ({ appointment, onClose, onSuccess, showToast }: { 
    appointment: Appointment; 
    onClose: () => void; 
    onSuccess: () => void;
    showToast: (m: string, t: 'success' | 'error') => void;
}) => {
    const { user } = useAuthStore();
    const [selectedDate, setSelectedDate] = useState(appointment.appointment_date);
    const [selectedSlot, setSelectedSlot] = useState(appointment.appointment_time.slice(0, 5));
    const [slots, setSlots] = useState<Slot[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSlots = async () => {
            if (!user?.branch_id) return;
            setIsLoadingSlots(true);
            try {
                const res = await fetch(`${API_BASE_URL}/reception/schedule.php?action=slots&date=${selectedDate}&branch_id=${user.branch_id}`);
                const data = await res.json();
                if (data.success) {
                    setSlots(data.slots);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoadingSlots(false);
            }
        };
        fetchSlots();
    }, [selectedDate, user?.branch_id]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/reception/schedule.php?action=reschedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    registration_id: appointment.registration_id,
                    new_date: selectedDate,
                    new_time: selectedSlot,
                    branch_id: user?.branch_id,
                    employee_id: user?.employee_id
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Rescheduled successfully!`, 'success');
                onSuccess();
            } else {
                showToast(data.message || 'Saving failed', 'error');
            }
        } catch (e) {
            console.error(e);
            showToast('Server error', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-teal-600 px-8 py-6 text-white relative flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-widest">Reschedule</h3>
                        <p className="text-xs text-teal-100 font-medium">Point-of-care scheduling</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <X size={20} />
                    </button>
                    <div className="absolute -bottom-6 left-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl shadow-lg flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-600 flex items-center justify-center font-black">
                            {appointment.patient_name.charAt(0)}
                        </div>
                        <div className="pr-4">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate max-w-[150px]">{appointment.patient_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{appointment.patient_uid}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 pt-12 overflow-y-auto">
                    <div className="flex flex-col gap-10">
                        {/* Date Picker - Centered & Premium */}
                        <div className="max-w-sm mx-auto w-full space-y-4 text-center">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                <CalendarIcon size={14} className="text-teal-600" />
                                01. Select Date
                            </label>
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setSelectedSlot('');
                                }}
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] text-slate-800 dark:text-slate-100 font-black text-lg text-center focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-pointer"
                            />
                            {selectedDate && (
                                <p className="text-[11px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-widest">
                                    {format(parseISO(selectedDate), 'EEEE, MMMM do, yyyy')}
                                </p>
                            )}
                        </div>

                        {/* Slot Picker - Full width horizontal flow */}
                        <div className="space-y-6">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Clock size={14} className="text-teal-600" />
                                02. Choose Available Slot
                            </label>
                            
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 border-2 border-slate-100/50 dark:border-slate-700/50 rounded-[2.5rem] p-8">
                                {isLoadingSlots ? (
                                    <div className="h-48 flex flex-col items-center justify-center gap-4">
                                        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feching slots...</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                        {slots.map((slot) => (
                                            <button
                                                key={slot.time}
                                                disabled={slot.isBooked && slot.time !== appointment.appointment_time.slice(0, 5)}
                                                onClick={() => setSelectedSlot(slot.time)}
                                                className={`relative p-5 rounded-[1.5rem] text-[15px] font-black transition-all flex flex-col items-center justify-center gap-1 group/slot ${
                                                    selectedSlot === slot.time
                                                    ? 'bg-teal-600 text-white shadow-2xl shadow-teal-500/40 scale-105 z-10'
                                                    : slot.isBooked && slot.time !== appointment.appointment_time.slice(0, 5)
                                                    ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-300 dark:text-slate-600 cursor-not-allowed border-none'
                                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-slate-100 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10'
                                                }`}
                                            >
                                                {selectedSlot === slot.time && (
                                                    <motion.div 
                                                        layoutId="activeSlot"
                                                        className="absolute inset-0 bg-teal-600 rounded-[1.5rem] -z-10"
                                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    />
                                                )}
                                                <span className="leading-none">{slot.label.split(' ')[0]}</span>
                                                <span className={`text-[9px] font-bold uppercase tracking-wider ${selectedSlot === slot.time ? 'text-teal-100' : 'text-slate-400'}`}>
                                                    {slot.label.split(' ')[1]}
                                                </span>
                                                
                                                {slot.isBooked && slot.time !== appointment.appointment_time.slice(0, 5) && (
                                                    <div className="mt-1 flex items-center gap-1 text-[8px] font-black text-rose-500 uppercase tracking-tighter">
                                                        <span className="w-1 h-1 bg-rose-500 rounded-full animate-pulse" />
                                                        Booked
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <button 
                        onClick={onClose}
                        className="px-8 py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Cancel Action
                    </button>
                    <button
                        disabled={!selectedDate || !selectedSlot || isSaving}
                        onClick={handleSave}
                        className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-10 py-5 rounded-[1.5rem] shadow-2xl shadow-teal-500/30 flex items-center gap-4 transition-all active:scale-95 group/save"
                    >
                        {isSaving ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <CheckCircle2 size={20} className="group-hover/save:scale-110 transition-transform" />
                        )}
                        <span className="font-black text-[13px] uppercase tracking-[0.1em]">Confirm Reschedule</span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Schedule;
