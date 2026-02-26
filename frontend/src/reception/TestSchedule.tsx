import { useState, useEffect, useCallback } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, authFetch } from "../config";
import { useDashboardStore, useThemeStore, useAuthStore } from "../store";
import ChatModal from "../components/Chat/ChatModal";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addWeeks,
    subWeeks,
    isToday,
    isBefore,
    startOfDay,
} from "date-fns";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    GripVertical,
    FlaskConical,
} from "lucide-react";
import ActionFAB, { type FABAction } from "../components/ActionFAB";
import KeyboardShortcuts, {
    type ShortcutItem,
} from "../components/KeyboardShortcuts";
import Sidebar from "../components/Sidebar";
import NotesDrawer from "../components/NotesDrawer";
import DailyIntelligence from "../components/DailyIntelligence";
import PageHeader from "../components/PageHeader";
import {
    DndContext,
    useDraggable,
    useDroppable,
    type DragEndEvent,
    useSensor,
    useSensors,
    PointerSensor,
    MouseSensor,
    TouchSensor,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// --- Types ---
interface TestRecord {
    test_id: number;
    test_uid: string;
    patient_name: string;
    assigned_test_date: string; // YYYY-MM-DD
    status: string;
    payment_status: string;
    test_name: string;
    total_amount: number;
}

const cardVariants = {
    initial: { scale: 1, y: 0 },
    hover: {
        scale: 1.02,
        y: -5,
        boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        transition: { type: "spring", stiffness: 300, damping: 25 },
    },
    tap: { scale: 0.98 },
} as any;

// --- DND Components ---
const DraggableTest = ({
    test,
    onClick,
}: {
    test: TestRecord;
    onClick: () => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: `test-${test.test_id}`,
            data: { test },
        });

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 2000 : 1,
        touchAction: "none",
    };

    const getStatusColors = (status: string) => {
        const s = status.toLowerCase();
        if (s === "completed")
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        if (s === "pending")
            return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        if (s === "in-progress")
            return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
    };

    const statusColor = getStatusColors(test.status);

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            variants={cardVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`group relative flex flex-col gap-1 p-3 rounded-[20px] shadow-sm transition-all cursor-grab active:cursor-grabbing mb-1 select-none border-l-4 ${statusColor} ${isDragging ? "opacity-30 scale-95" : "bg-white dark:bg-[#1A1C1A] border-gray-100 dark:border-white/5"}`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate tracking-tight text-[#1a1c1e] dark:text-white leading-tight">
                        {test.patient_name}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 truncate mb-1">
                        {test.test_name}
                    </p>
                    <div className="flex items-center gap-2">
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">
                            {test.test_uid}
                        </p>
                    </div>
                </div>
                <div
                    {...listeners}
                    className="p-1 opacity-20 group-hover:opacity-100 transition-opacity shrink-0"
                >
                    <GripVertical size={14} />
                </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${statusColor}`}>
                    <div
                        className={`w-1.5 h-1.5 rounded-full ${test.status === "completed" ? "bg-emerald-500" : test.status === "pending" ? "bg-amber-500" : "bg-indigo-500"}`}
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80">
                        {test.status}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

const DroppableSlot = ({
    id,
    day,
    children,
}: {
    id: string;
    day: Date;
    children: React.ReactNode;
}) => {
    const { isOver, setNodeRef } = useDroppable({ id, data: { day } });
    const isTodaySlot = isToday(day);
    const { isDark } = useThemeStore();

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[150px] p-4 border-b border-r transition-all duration-300 relative ${isOver
                ? "bg-emerald-500/10 dark:bg-emerald-500/20 ring-2 ring-emerald-500/20 ring-inset"
                : isTodaySlot
                    ? "bg-emerald-50/20 dark:bg-emerald-500/[0.03]"
                    : "bg-transparent"
                } ${isDark ? "border-white/5" : "border-gray-50/50"}`}
        >
            <div className="flex flex-col gap-1.5 h-full">{children}</div>
        </div>
    );
};

// --- Main Component ---
const TestSchedule = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { isDark } = useThemeStore();
    const {
        testSchedule,
        setTestSchedule,
        testScheduleWeekStart,
        setTestScheduleWeekStart,
    } = useDashboardStore();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(!testSchedule);
    const [isUpdating, setIsUpdating] = useState(false);

    // States
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showIntelligence, setShowIntelligence] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [refreshCooldown, setRefreshCooldown] = useState(0);

    // Date Logic
    const weekStartDate = startOfWeek(currentDate);
    const weekStartStr = format(weekStartDate, "yyyy-MM-dd");
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStartDate, end: weekEnd });

    const fetchSchedule = useCallback(
        async (force = false) => {
            if (!user?.branch_id) return;

            if (
                !force &&
                testSchedule &&
                testScheduleWeekStart === weekStartStr
            ) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const res = await authFetch(
                    `${API_BASE_URL}/reception/tests?action=fetch_schedule&week_start=${weekStartStr}&branch_id=${user.branch_id}`,
                    {
                        method: "POST",
                        body: JSON.stringify({ action: "fetch_schedule", week_start: weekStartStr, branch_id: user.branch_id })
                    }
                );
                const data = await res.json();
                if (data.success) {
                    setTestSchedule(data.tests);
                    setTestScheduleWeekStart(weekStartStr);
                }
            } catch (e) {
                toast.error("Failed to load test schedule");
            } finally {
                setIsLoading(false);
            }
        },
        [
            user?.branch_id,
            weekStartStr,
            testSchedule,
            testScheduleWeekStart,
        ]
    );

    useEffect(() => {
        fetchSchedule(true);
    }, [weekStartStr]);

    const handleRefresh = async () => {
        if (refreshCooldown > 0) return;
        const promise = fetchSchedule(true);
        toast.promise(promise, {
            loading: "Refreshing test schedule...",
            success: "Schedule up to date",
            error: "Failed to refresh",
        });
        setRefreshCooldown(30);
    };

    useEffect(() => {
        if (refreshCooldown > 0) {
            const timer = setInterval(() => setRefreshCooldown((p) => p - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [refreshCooldown]);

    useEffect(() => {
        const fetchOptions = async () => {
            if (!useDashboardStore.getState().formOptions && user?.branch_id) {
                try {
                    const res = await authFetch(
                        `${API_BASE_URL}/reception/form_options?branch_id=${user.branch_id}`
                    );
                    const data = await res.json();
                    if (data.status === "success" || data.success) {
                        useDashboardStore.getState().setFormOptions(data.data);
                    }
                } catch (e) {
                    console.error("Failed to load form options", e);
                }
            }
        };
        fetchOptions();
    }, [user?.branch_id]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        const test = active.data.current?.test as TestRecord;
        const { day } = over.data.current as { day: Date };

        // --- Restriction: Only Today and Further Dates ---
        if (isBefore(startOfDay(day), startOfDay(new Date()))) {
            toast.error("Cannot reschedule to a past date");
            return;
        }

        const newDate = format(day, "yyyy-MM-dd");

        if (test.assigned_test_date === newDate) return;

        setIsUpdating(true);
        try {
            const res = await authFetch(
                `${API_BASE_URL}/reception/tests`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "update_metadata",
                        test_id: test.test_id,
                        assigned_test_date: newDate,
                        branch_id: user?.branch_id,
                    }),
                },
            );
            const data = await res.json();
            if (data.success) {
                toast.success(`Test rescheduled to ${format(day, "MMM d")}`);
                fetchSchedule(true);
            } else {
                toast.error(data.message || "Rescheduling failed");
            }
        } catch (e) {
            toast.error("Error during reschedule");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleFABAction = (action: FABAction) => {
        navigate("/reception/dashboard", { state: { openModal: action } });
    };

    const shortcuts: ShortcutItem[] = [
        {
            keys: ["Alt", "/"],
            description: "Keyboard Shortcuts",
            group: "General",
            action: () => setShowShortcuts((p) => !p),
        },
        {
            keys: ["Alt", "ArrowLeft"],
            description: "Previous Week",
            group: "Schedule",
            action: () => setCurrentDate((d) => subWeeks(d, 1)),
        },
        {
            keys: ["Alt", "ArrowRight"],
            description: "Next Week",
            group: "Schedule",
            action: () => setCurrentDate((d) => addWeeks(d, 1)),
        },
        {
            keys: ["Alt", "T"],
            description: "Go to Today",
            group: "Schedule",
            action: () => setCurrentDate(new Date()),
        },
    ];

    return (
        <div className="flex h-screen bg-[#FDFDFC] dark:bg-[#0E110E] overflow-hidden selection:bg-emerald-500/30">
            <Sidebar
                onShowChat={() => setShowChatModal(true)}
                onShowShortcuts={() => setShowShortcuts(true)}
            />

            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                <PageHeader
                    title="Test Schedule"
                    icon={FlaskConical}
                    onRefresh={handleRefresh}
                    isLoading={isLoading}
                    refreshCooldown={refreshCooldown}
                    onShowIntelligence={() => setShowIntelligence(true)}
                    onShowNotes={() => setShowNotes(true)}
                >
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-1 rounded-2xl border border-gray-100 dark:border-white/5">
                            <button
                                onClick={() => setCurrentDate((d) => subWeeks(d, 1))}
                                className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-emerald-500"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/60">
                                {format(weekStartDate, "MMM d")} - {format(weekEnd, "MMM d")}
                            </div>
                            <button
                                onClick={() => setCurrentDate((d) => addWeeks(d, 1))}
                                className="p-1.5 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-emerald-500"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isDark ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-white text-emerald-600 hover:bg-emerald-50 border border-emerald-100"}`}
                        >
                            Today
                        </button>
                    </div>
                </PageHeader>

                <div className="flex-1 flex overflow-hidden">
                    <motion.aside
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={`hidden xl:flex w-[380px] flex-col p-6 border-r relative shrink-0 transition-colors duration-300 z-50 ${isDark ? "bg-[#0A0A0A] border-white/5 shadow-2xl shadow-black/50" : "bg-white border-gray-100"}`}
                    >
                        <div className="space-y-4 mb-8">
                            <h1 className="text-4xl font-serif font-light tracking-tight leading-[1.1] text-[#1a1c1e] dark:text-[#e3e2e6]">
                                Testing{" "}
                                <span className={`italic font-bold ${isDark ? "text-[#4ADE80]" : "text-[#16a34a]"}`}>
                                    Flow
                                </span>
                            </h1>
                            <p className="text-gray-500 text-base">
                                {format(new Date(), "EEEE, do MMMM")}
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="space-y-6">
                                <div className={`p-5 rounded-[28px] border ${isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-gray-100"}`}>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Daily Summary</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-2xl font-black">{(testSchedule || []).filter(t => isToday(new Date(t.assigned_test_date))).length}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Tests Today</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-amber-500">{(testSchedule || []).filter(t => isToday(new Date(t.assigned_test_date)) && t.status === 'pending').length}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Pending</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.aside>

                    <main className="flex-1 overflow-hidden flex flex-col p-4 sm:p-8">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Weekly Schedule</h2>
                            </div>
                        </div>

                        <div className="flex-1 bg-white dark:bg-[#141619] rounded-[40px] shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col">
                            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-white/5">
                                {days.map((day) => {
                                    const isTodayDay = isToday(day);
                                    return (
                                        <div
                                            key={day.toString()}
                                            className={`p-6 text-center border-r border-gray-100 dark:border-white/5 last:border-r-0 flex flex-col items-center justify-center gap-2 transition-all duration-500 ${isTodayDay ? "bg-emerald-50/60 dark:bg-emerald-500/10" : "bg-white dark:bg-white/[0.01]"}`}
                                        >
                                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isTodayDay ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400"}`}>
                                                {format(day, "EEEE")}
                                            </p>
                                            <div className="relative mt-1">
                                                {isTodayDay && (
                                                    <motion.div
                                                        layoutId="today-glow"
                                                        className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-30 animate-pulse"
                                                    />
                                                )}
                                                <div className={`relative w-11 h-11 flex items-center justify-center rounded-full text-base font-black transition-all duration-500 ${isTodayDay ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/10" : "text-slate-900 dark:text-white"}`}>
                                                    {format(day, "d")}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <DndContext sensors={useSensors(useSensor(PointerSensor), useSensor(MouseSensor), useSensor(TouchSensor))} onDragEnd={handleDragEnd}>
                                    <div className="grid grid-cols-7 h-full">
                                        {days.map((day) => {
                                            const dayStr = format(day, "yyyy-MM-dd");
                                            const testsForDay = (testSchedule || []).filter(
                                                (t) => t.assigned_test_date === dayStr
                                            );

                                            return (
                                                <DroppableSlot key={day.toString()} id={dayStr} day={day}>
                                                    {testsForDay.map((test) => (
                                                        <DraggableTest
                                                            key={test.test_id}
                                                            test={test}
                                                            onClick={() => navigate(`/reception/tests`, { state: { highlightTest: test.test_uid } })}
                                                        />
                                                    ))}
                                                    {testsForDay.length === 0 && (
                                                        <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity">
                                                            <FlaskConical size={40} strokeWidth={1} />
                                                        </div>
                                                    )}
                                                </DroppableSlot>
                                            );
                                        })}
                                    </div>
                                </DndContext>
                            </div>
                        </div>
                    </main>
                </div>

                <AnimatePresence>
                    {isUpdating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[1000] bg-black/20 backdrop-blur-sm flex items-center justify-center"
                        >
                            <div className="bg-white dark:bg-[#1A1C1A] p-6 rounded-[32px] shadow-2xl flex items-center gap-4 border border-white/5">
                                <Loader2 size={24} className="animate-spin text-emerald-500" />
                                <p className="text-sm font-black uppercase tracking-widest">Rescheduling Test...</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <DailyIntelligence isOpen={showIntelligence} onClose={() => setShowIntelligence(false)} />
                <NotesDrawer isOpen={showNotes} onClose={() => setShowNotes(false)} />
                {showChatModal && <ChatModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />}
                <KeyboardShortcuts shortcuts={shortcuts} isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} onToggle={() => setShowShortcuts(!showShortcuts)} />

                <ActionFAB onAction={handleFABAction} />
            </div>
        </div>
    );
};

export default TestSchedule;
