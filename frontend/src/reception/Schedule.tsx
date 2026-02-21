import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, authFetch } from "../config";
import { useDashboardStore, useThemeStore, useAuthStore } from "../store";
import ChatModal from "../components/Chat/ChatModal";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ActionFAB from "../components/ActionFAB";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isToday,
  parse,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Loader2,
  GripVertical,
  AlertCircle,
  Info,
  Calendar,
  Check,
} from "lucide-react";
import { InlineDatePicker } from "../components/SharedPickers";
import KeyboardShortcuts, {
  type ShortcutItem,
} from "../components/KeyboardShortcuts";
import LogoutConfirmation from "../components/LogoutConfirmation";
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
  closestCenter,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// --- Types ---
interface Appointment {
  registration_id: string;
  patient_name: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM:SS
  status: string;
  approval_status?: string;
  patient_uid: string | null;
}

interface Slot {
  time: string; // HH:MM
  label: string; // hh:mm AM/PM
  isBooked: boolean;
}

// --- Animation ---
const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

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

const DraggableAppointment = ({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `appointment-${appointment.registration_id}`,
      data: { appointment },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 2000 : 1,
    touchAction: "none",
  };

  const isApprovalPending = appointment.approval_status === "pending";

  const getStatusColors = (status: string) => {
    if (isApprovalPending)
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";

    const s = status.toLowerCase();
    if (s === "consulted" || s === "completed")
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (s === "pending")
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
  };

  const statusColor = getStatusColors(appointment.status);

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
            {appointment.patient_name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">
              {appointment.patient_uid || `#${appointment.registration_id}`}
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
      {/* Status Pill */}
      <div className="flex items-center gap-1.5 mt-2">
        {isApprovalPending ? (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-500">
            <AlertCircle size={10} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-widest">
              Review Needed
            </span>
          </div>
        ) : (
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg ${statusColor}`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${appointment.status === "completed" ? "bg-emerald-500" : appointment.status === "pending" ? "bg-rose-500" : "bg-indigo-500"}`}
            />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">
              {appointment.status}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const DroppableSlot = ({
  id,
  day,
  time,
  children,
}: {
  id: string;
  day: Date;
  time: string;
  children: React.ReactNode;
}) => {
  const { isOver, setNodeRef } = useDroppable({ id, data: { day, time } });
  const isTodaySlot = isToday(day);
  const { isDark } = useThemeStore();

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[110px] p-2 border-b border-r transition-all duration-300 relative ${isOver
          ? "bg-emerald-500/10 dark:bg-emerald-500/20 ring-2 ring-emerald-500/20 ring-inset"
          : isTodaySlot
            ? "bg-slate-50/80 dark:bg-white/[0.02]"
            : "bg-transparent"
        } ${isDark ? "border-white/5" : "border-gray-50"}`}
    >
      <div className="flex flex-col gap-1.5 h-full">{children}</div>
    </div>
  );
};

// --- Main Component ---
const Schedule = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const {
    scheduleAppointments,
    setScheduleAppointments,
    scheduleWeekStart,
    setScheduleWeekStart,
    showGlobalSearch,
    setShowGlobalSearch,
  } = useDashboardStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(!scheduleAppointments);
  const [activeAppointment, setActiveAppointment] =
    useState<Appointment | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // States
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLButtonElement>(null);

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
  );

  // Date Logic
  const weekStartDate = startOfWeek(currentDate);
  const weekStartStr = format(weekStartDate, "yyyy-MM-dd");
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStartDate, end: weekEnd });
  const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = (i % 2) * 30;
    const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    const label = format(parse(time, "HH:mm", new Date()), "hh:mm a");
    return { time, label };
  });

  const handleRefresh = async () => {
    if (refreshCooldown > 0) return;

    const promise = fetchSchedule(true);
    toast.promise(promise, {
      loading: "Refreshing schedule...",
      success: "Schedule up to date",
      error: "Failed to refresh",
    });

    setRefreshCooldown(30);
  };

  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(
        () => setRefreshCooldown((prev) => prev - 1),
        1000,
      );
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  const handleClickOutside = (e: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
      if (!(e.target as Element).closest("#search-modal-container")) {
        setShowGlobalSearch(false);
      }
    }
    if (
      notifRef.current &&
      !notifRef.current.contains(e.target as Node) &&
      !(e.target as Element).closest("#notif-popup")
    ) {
      // notif state handled by PageHeader
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Schedule
  const fetchSchedule = useCallback(
    async (force = false) => {
      if (!user?.branch_id) return;

      // Check if we already have data for this week in cache
      if (
        !force &&
        scheduleAppointments &&
        scheduleWeekStart === weekStartStr
      ) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await authFetch(
          `${API_BASE_URL}/reception/schedule?week_start=${weekStartStr}&branch_id=${user.branch_id}&employee_id=${user.employee_id}`,
        );
        const data = await res.json();
        if (data.success) {
          setScheduleAppointments(data.appointments);
          setScheduleWeekStart(weekStartStr);
        }
      } catch (e) {
        toast.error("Failed to load schedule");
      } finally {
        setIsLoading(false);
      }
    },
    [
      user?.branch_id,
      user?.employee_id,
      weekStartStr,
      scheduleAppointments,
      scheduleWeekStart,
      setScheduleAppointments,
      setScheduleWeekStart,
    ],
  );

  useEffect(() => {
    fetchSchedule(true);
  }, [weekStartStr]); // Only re-fetch if week changes or forced

  // --- Shortcuts ---
  const shortcuts: ShortcutItem[] = [
    // General
    {
      keys: ["Alt", "/"],
      description: "Keyboard Shortcuts",
      group: "General",
      action: () => setShowShortcuts((prev) => !prev),
    },
    {
      keys: ["Alt", "S"],
      description: "Global Search",
      group: "General",
      action: () => setShowGlobalSearch(true),
    },
    {
      keys: ["Alt", "W"],
      description: "Toggle Theme",
      group: "General",
      action: toggleTheme,
    },
    {
      keys: ["Alt", "N"],
      description: "Notifications",
      group: "General",
      action: () => {
        // Handled by PageHeader
      },
    },
    {
      keys: ["Alt", "E"],
      description: "Branch Notes",
      group: "General",
      action: () => setShowNotes((prev) => !prev),
    },
    {
      keys: ["Alt", "C"],
      description: "Toggle Chat",
      group: "General",
      action: () => setShowChatModal((prev) => !prev),
    },
    {
      keys: ["Alt", "X"],
      description: "Consultation",
      group: "Navigation",
      action: () => navigate("/reception/inquiry"),
    },
    {
      keys: ["Alt", "I"],
      description: "Daily Intelligence",
      group: "General",
      action: () => setShowIntelligence((prev) => !prev),
    },
    {
      keys: ["Alt", "L"],
      description: "Logout",
      group: "Actions",
      action: () => setShowLogoutConfirm(true),
    },

    // Navigation
    {
      keys: ["Alt", "1"],
      description: "Dashboard",
      group: "Navigation",
      action: () => navigate("/reception/dashboard"),
    },
    {
      keys: ["Alt", "2"],
      description: "Schedule",
      group: "Navigation",
      action: () => navigate("/reception/schedule"),
    },
    {
      keys: ["Alt", "3"],
      description: "Inquiry",
      group: "Navigation",
      action: () => navigate("/reception/inquiry"),
    },
    {
      keys: ["Alt", "4"],
      description: "Registration",
      group: "Navigation",
      action: () => navigate("/reception/registration"),
    },
    {
      keys: ["Alt", "5"],
      description: "Patients",
      group: "Navigation",
      action: () => navigate("/reception/patients"),
    },

    // Schedule Controls

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
    {
      keys: ["Ctrl", "R"],
      description: "Refresh",
      group: "General",
      action: handleRefresh,
    },
  ];

  // Global Key Listener for Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Modals and Common Actions
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setShowGlobalSearch(true);
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setShowNotes((prev) => !prev);
        return;
      }
      if (e.altKey && e.key === "/") {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        toggleTheme();
        return;
      }

      // Escape to close modals
      if (e.key === "Escape") {
        if (showGlobalSearch) setShowGlobalSearch(false);
        else if (showShortcuts) setShowShortcuts(false);
        else if (showLogoutConfirm) setShowLogoutConfirm(false);
        else if (showRescheduleModal) setShowRescheduleModal(false);
        else if (showChatModal) setShowChatModal(false);
        else if (showIntelligence) setShowIntelligence(false);
        else if (showNotes) setShowNotes(false);
      }

      const shortcut = shortcuts.find((s) => {
        const keys = s.keys.map((k) => k.toLowerCase());
        const altRequired = keys.includes("alt");
        const ctrlRequired = keys.includes("ctrl");
        const shiftRequired = keys.includes("shift");

        const keyMap: Record<string, string> = {
          arrowleft: "ArrowLeft",
          arrowright: "ArrowRight",
          arrowup: "ArrowUp",
          arrowdown: "ArrowDown",
        };

        const targetKey = keys.filter(
          (k) => k !== "alt" && k !== "ctrl" && k !== "shift",
        )[0];
        const keyMatch =
          e.key.toLowerCase() === targetKey.toLowerCase() ||
          e.key === keyMap[targetKey.toLowerCase()];

        const altMatch = e.altKey === altRequired;
        const ctrlMatch = e.ctrlKey === ctrlRequired;
        const shiftMatch = e.shiftKey === shiftRequired;

        return keyMatch && altMatch && ctrlMatch && shiftMatch;
      });

      if (shortcut && shortcut.action) {
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;
        if (isInput && !e.altKey && !e.ctrlKey && !e.metaKey) return;

        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showGlobalSearch,
    showShortcuts,
    showLogoutConfirm,
    showRescheduleModal,
    showChatModal,
    showIntelligence,
    showNotes,
    toggleTheme,
    shortcuts,
  ]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const appointment = active.data.current?.appointment as Appointment;
    const { day, time } = over.data.current as { day: Date; time: string };
    const newDate = format(day, "yyyy-MM-dd");
    const newTime = time;
    if (
      appointment.appointment_date === newDate &&
      appointment.appointment_time.startsWith(newTime)
    )
      return;

    setIsUpdating(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/schedule/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registration_id: appointment.registration_id,
            new_date: newDate,
            new_time: newTime,
            branch_id: user?.branch_id,
            employee_id: user?.employee_id,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Rescheduled to ${format(day, "MMM d")} at ${format(parse(time, "HH:mm", new Date()), "hh:mm a")}`,
        );
        fetchSchedule(true); // Force refresh
      } else {
        toast.error(data.message || "Rescheduling failed");
      }
    } catch (e) {
      toast.error("Error during reschedule");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFC] dark:bg-[#0E110E] overflow-hidden selection:bg-emerald-500/30">
      <Sidebar
        onShowChat={() => setShowChatModal(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <PageHeader
          title="Schedule"
          icon={Calendar}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          refreshCooldown={refreshCooldown}
          onShowIntelligence={() => setShowIntelligence(true)}
          onShowNotes={() => setShowNotes(true)}
        />

        {/* Action Widgets Removed: Moved to Header Utilities Capsule */}

        {/* Main Content: Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL: Branch Overview & Daily Tree */}
          <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`hidden xl:flex w-[440px] flex-col p-6 border-r relative shrink-0 transition-colors duration-300 z-50 ${isDark ? "bg-[#0A0A0A] border-white/5 shadow-2xl shadow-black/50" : "bg-white border-gray-100"}`}
            style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
          >
            {/* Brand & Greeting */}
            <div className="space-y-4 z-10 w-full mb-8">
              <div className="space-y-1">
                <h1 className="text-5xl font-serif font-light tracking-tight leading-[1.1] text-[#1a1c1e] dark:text-[#e3e2e6]">
                  Today's{" "}
                  <span
                    className={`italic font-bold ${isDark ? "text-[#4ADE80]" : "text-[#16a34a]"}`}
                  >
                    Schedule
                  </span>
                </h1>
                <p className="text-gray-500 text-base">
                  {format(new Date(), "EEEE, do MMMM")}
                </p>
              </div>
            </div>

            {/* Daily Activity Tree */}
            <div className="flex-1 flex flex-col min-h-0">
              <div
                className="flex-1 overflow-y-auto pr-4"
                style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
              >
                <div className="relative pl-8 space-y-8">
                  {/* Vertical Line */}
                  <div
                    className={`absolute left-[11px] top-2 bottom-2 w-0.5 ${isDark ? "bg-white/5" : "bg-gray-100"}`}
                  />

                  {/* Appointments Summary Tree Branches */}
                  {(scheduleAppointments || []).filter(
                    (a) =>
                      a &&
                      a.appointment_date &&
                      isToday(new Date(a.appointment_date)),
                  ).length > 0 ? (
                    (scheduleAppointments || [])
                      .filter(
                        (a) =>
                          a &&
                          a.appointment_date &&
                          isToday(new Date(a.appointment_date)),
                      )
                      .sort((a, b) =>
                        (a.appointment_time || "").localeCompare(
                          b.appointment_time || "",
                        ),
                      )
                      .slice(0, 5) // Limit to top 5 for visual impact
                      .map((appt) => (
                        <div
                          key={appt.registration_id}
                          className="relative group cursor-pointer"
                          onClick={() => {
                            setActiveAppointment(appt);
                            setShowRescheduleModal(true);
                          }}
                        >
                          {/* Branch Line */}
                          <div
                            className={`absolute -left-[20px] top-4 w-5 h-0.5 ${isDark ? "bg-white/10" : "bg-gray-200"}`}
                          />
                          <div
                            className={`absolute -left-[8px] top-[14px] w-1.5 h-1.5 rounded-full ${appt.status === "consulted"
                                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                : "bg-orange-400 opacity-60"
                              } group-hover:scale-150 transition-transform duration-300`}
                          />

                          <div
                            className={`ml-8 p-3 rounded-[28px] border transition-all duration-300 ${isDark ? "bg-white/[0.04] border-white/5 hover:bg-white/[0.08] hover:border-white/10 shadow-2xl shadow-black/20" : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-2xl hover:shadow-black/[0.04]"}`}
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-black tracking-[0.2em] text-emerald-500 uppercase">
                                    {appt.appointment_time
                                      ? format(
                                        parse(
                                          appt.appointment_time,
                                          "HH:mm:ss",
                                          new Date(),
                                        ),
                                        "hh:mm a",
                                      )
                                      : "--:--"}
                                  </span>
                                  <p className="text-lg font-black tracking-tight truncate">
                                    {appt.patient_name || "Unknown Patient"}
                                  </p>
                                </div>
                                <span
                                  className={`text-[10px] font-black uppercase px-3 py-1 rounded-full shrink-0 ${appt.status === "consulted"
                                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                      : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                    }`}
                                >
                                  {appt.status}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 opacity-30">
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                  ID:{" "}
                                  {appt.registration_id
                                    ? String(appt.registration_id).slice(-6)
                                    : "------"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="relative pl-4">
                      <div
                        className={`absolute -left-[20px] top-4 w-5 h-0.5 ${isDark ? "bg-white/10" : "bg-gray-200"}`}
                      />
                      <p className="text-sm italic opacity-30 font-medium">
                        No appointments scheduled for today.
                      </p>
                    </div>
                  )}

                  {/* Footer Node */}
                  <div className="relative pt-4">
                    <div
                      className={`absolute -left-[30px] top-5 w-6 h-6 rounded-full ${isDark ? "bg-white/5" : "bg-gray-100"} flex items-center justify-center`}
                    >
                      <Clock size={12} className="opacity-30" />
                    </div>
                    <div className="pl-4 pt-4">
                      <p className="text-xs font-black tracking-[0.2em] opacity-20 uppercase">
                        End of Summary
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* MAIN CONTENT Area (Right) */}
          <motion.main
            className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8"
            initial="hidden"
            animate="visible"
            variants={itemVariants}
          >
            {/* Week Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center gap-1 p-1 rounded-2xl border ${isDark ? "bg-black/20 border-white/5" : "bg-gray-50 border-gray-100"}`}
                >
                  <button
                    onClick={() => setCurrentDate((d) => subWeeks(d, 1))}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isDark ? "hover:bg-white/5 text-white/60 hover:text-white" : "hover:bg-white text-gray-500 hover:text-gray-900 shadow-none hover:shadow-lg hover:shadow-black/[0.03]"}`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="px-4 py-2 text-sm font-bold tracking-tight">
                    {format(weekStartDate, "MMM d")} -{" "}
                    {format(endOfWeek(currentDate), "MMM d, yyyy")}
                  </div>
                  <button
                    onClick={() => setCurrentDate((d) => addWeeks(d, 1))}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isDark ? "hover:bg-white/5 text-white/60 hover:text-white" : "hover:bg-white text-gray-500 hover:text-gray-900 shadow-none hover:shadow-lg hover:shadow-black/[0.03]"}`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900"}`}
                >
                  Today
                </button>
              </div>

              {/* View Switcher could go here */}
            </div>

            {/* Grid Area */}
            <motion.div
              variants={itemVariants}
              className="bg-[#fdfcff] dark:bg-[#1a1c1e] border border-[#e0e2ec] dark:border-[#43474e] rounded-[28px] overflow-hidden shadow-sm relative min-h-[600px]"
            >
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fdfcff]/50 dark:bg-[#1a1c1e]/50 z-50">
                  <Loader2
                    size={40}
                    className="animate-spin text-emerald-600 dark:text-emerald-500"
                  />
                  <p className="mt-4 text-sm font-bold text-[#43474e] dark:text-[#c4c7c5]">
                    Loading Schedule...
                  </p>
                </div>
              ) : null}
              <DndContext
                sensors={sensors}
                onDragEnd={handleDragEnd}
                collisionDetection={closestCenter}
              >
                <div className="grid grid-cols-[80px_repeat(7,1fr)] bg-[#f1f5f9] dark:bg-[#252825] gap-[1px]">
                  {/* Header Row */}
                  <div className="bg-[#fdfcff] dark:bg-[#111315] p-4 flex flex-col items-center justify-center sticky top-0 z-30">
                    <Clock
                      size={18}
                      className="text-emerald-600 dark:text-emerald-500"
                    />
                  </div>
                  {days.map((day: Date) => (
                    <div
                      key={day.toString()}
                      className={`bg-[#fdfcff] dark:bg-[#111315] p-3 flex flex-col items-center justify-center gap-1 sticky top-0 z-30 ${isToday(day) ? "bg-emerald-500/5" : ""}`}
                    >
                      <span
                        className={`text-[10px] font-black uppercase tracking-[0.2em] ${isToday(day) ? "text-emerald-500" : "opacity-40 text-[#43474e] dark:text-[#c4c7c5]"}`}
                      >
                        {format(day, "EEEE")}
                      </span>
                      <div
                        className={`w-10 h-10 flex items-center justify-center rounded-2xl text-xl font-black transition-all ${isToday(day) ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/30" : "text-[#1a1c1e] dark:text-white"}`}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  ))}

                  {/* Time Slots */}
                  {timeSlots.map(({ time, label }) => (
                    <div key={time} className="contents">
                      <div className="bg-[#f0f4f9]/5 dark:bg-white/[0.01] p-4 flex items-center justify-center border-r border-[#e0e2ec] dark:border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#43474e] dark:text-white/30">
                          {label}
                        </span>
                      </div>
                      {days.map((day: Date) => {
                        const dayStr = format(day, "yyyy-MM-dd");
                        const slotApps = (scheduleAppointments || []).filter(
                          (a: any) =>
                            a.appointment_date === dayStr &&
                            a.appointment_time.startsWith(time),
                        );
                        return (
                          <DroppableSlot
                            key={`${dayStr}-${time}`}
                            id={`${dayStr}-${time}`}
                            day={day}
                            time={time}
                          >
                            {slotApps.map((app: any) => (
                              <DraggableAppointment
                                key={app.registration_id}
                                appointment={app}
                                onClick={() => {
                                  setActiveAppointment(app);
                                  setShowRescheduleModal(true);
                                }}
                              />
                            ))}
                          </DroppableSlot>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </DndContext>

              {/* Updating Overlay */}
              <AnimatePresence>
                {isUpdating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
                  >
                    <div className="bg-[#1a1c1e] text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-xl">
                      <Loader2 className="animate-spin text-emerald-500" />
                      <span className="text-sm font-bold">
                        Updating Schedule...
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.main>
        </div>

        {/* --- GLOBAL COMPONENTS --- */}
        <KeyboardShortcuts
          shortcuts={shortcuts}
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          onToggle={() => setShowShortcuts((prev) => !prev)}
        />
        <LogoutConfirmation
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            logout();
            navigate("/login");
          }}
        />

        <DailyIntelligence
          isOpen={showIntelligence}
          onClose={() => setShowIntelligence(false)}
        />

        <NotesDrawer isOpen={showNotes} onClose={() => setShowNotes(false)} />

        {showChatModal && (
          <ChatModal
            isOpen={showChatModal}
            onClose={() => setShowChatModal(false)}
          />
        )}

        {showRescheduleModal && activeAppointment && (
          <RescheduleModal
            appointment={activeAppointment}
            allAppointments={scheduleAppointments || []}
            onClose={() => setShowRescheduleModal(false)}
            onSuccess={() => {
              setShowRescheduleModal(false);
              fetchSchedule(true);
            }}
          />
        )}

        <ActionFAB
          onAction={(action) => {
            navigate("/reception/dashboard", {
              state: { openModal: action as any },
            });
          }}
        />
      </div>
    </div>
  );
};

// --- Reschedule Modal Component ---
const RescheduleModal = ({
  appointment,
  allAppointments,
  onClose,
  onSuccess,
}: {
  appointment: Appointment;
  allAppointments: Appointment[];
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();
  const [selectedDate, setSelectedDate] = useState(
    appointment.appointment_date,
  );
  const [selectedSlot, setSelectedSlot] = useState(
    appointment.appointment_time.slice(0, 5),
  );
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const generatedSlots = Array.from({ length: 20 }, (_, i) => {
      const hour = Math.floor(i / 2) + 9;
      const minute = (i % 2) * 30;
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const label = format(parse(time, "HH:mm", new Date()), "hh:mm a");

      const isBooked = allAppointments.some(
        (appt) =>
          appt.appointment_date === selectedDate &&
          appt.appointment_time.startsWith(time) &&
          String(appt.registration_id) !== String(appointment.registration_id),
      );

      return { time, label, isBooked };
    });
    setSlots(generatedSlots);
  }, [selectedDate, allAppointments, appointment.registration_id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/schedule/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registration_id: appointment.registration_id,
            new_date: selectedDate,
            new_time: selectedSlot,
            branch_id: user?.branch_id,
            employee_id: user?.employee_id,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Rescheduled successfully");
        onSuccess();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch (e) {
      toast.error("Error during reschedule");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className={`w-full max-w-4xl max-h-[90vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col border transition-colors ${isDark
            ? "bg-[#121412] border-white/5 shadow-black/50"
            : "bg-white border-gray-100 shadow-xl"
          }`}
      >
        {/* Header Enhancement */}
        <div
          className={`px-8 py-6 flex items-start justify-between border-b ${isDark ? "border-white/5" : "border-gray-50"
            }`}
        >
          <div>
            <div className={`flex items-center gap-3 mb-1`}>
              <div className="w-1.5 h-6 rounded-full bg-emerald-500" />
              <h3 className="text-xl font-bold tracking-tight">
                Reschedule Appointment
              </h3>
            </div>
            <p className="text-sm opacity-40 font-bold uppercase tracking-widest pl-4">
              Patient: {appointment.patient_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isDark
                ? "bg-white/5 hover:bg-white/10"
                : "bg-gray-100 hover:bg-gray-200"
              }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Left Panel: Date Selection */}
          <div
            className={`md:w-[350px] flex flex-col border-r ${isDark
                ? "bg-black/20 border-white/5"
                : "bg-[#F9FAFB] border-gray-100"
              }`}
          >
            <div className="p-8 flex flex-col h-full">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mb-4 block">
                Select Date
              </label>
              <div
                className={`p-4 rounded-[24px] border transition-all ${isDark
                    ? "bg-white/5 border-white/5"
                    : "bg-white border-gray-100 shadow-sm"
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold opacity-40">
                      {format(new Date(selectedDate), "EEEE")}
                    </span>
                    <span className="text-2xl font-black tracking-tight">
                      {format(new Date(selectedDate), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? "bg-emerald-500/10 text-emerald-500" : "bg-emerald-50 text-emerald-600"}`}
                  >
                    <Calendar size={20} />
                  </div>
                </div>

                <InlineDatePicker
                  value={selectedDate}
                  onChange={(d: string) => {
                    setSelectedDate(d);
                    setSelectedSlot("");
                  }}
                  showActions={false}
                  hideHeader={true}
                  className="w-full !bg-transparent p-0"
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Slot Selection */}
          <div className="flex-1 flex flex-col min-w-0 bg-transparent min-h-0">
            <div className="p-8 flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-8">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
                  Available Slots
                </label>
                {selectedSlot && (
                  <div
                    className={`px-5 py-2 rounded-full text-[10px] font-black tracking-[0.1em] shadow-xl flex items-center gap-2 ${isDark
                        ? "bg-emerald-500 text-black shadow-emerald-500/20"
                        : "bg-emerald-500 text-white shadow-emerald-500/30"
                      }`}
                  >
                    SELECTED:{" "}
                    {format(
                      parse(selectedSlot, "HH:mm", new Date()),
                      "hh:mm a",
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {slots.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <Clock size={48} strokeWidth={1} className="mb-4" />
                    <p className="text-sm font-bold">
                      No slots found for this date
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {slots.map((slot: any) => {
                      const isSelected = selectedSlot === slot.time;
                      const isBooked =
                        slot.isBooked &&
                        (selectedDate !== appointment.appointment_date ||
                          slot.time !==
                          appointment.appointment_time.slice(0, 5));

                      return (
                        <button
                          key={slot.time}
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`group relative p-4 rounded-[24px] border transition-all duration-300 ${isSelected
                              ? isDark
                                ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10"
                                : "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                              : isBooked
                                ? "opacity-10 grayscale border-transparent cursor-not-allowed"
                                : isDark
                                  ? "bg-white/5 border-white/5 hover:border-emerald-500/30 hover:bg-white/10"
                                  : "bg-white border-gray-100 hover:border-emerald-200 shadow-sm"
                            }`}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md ${isSelected
                                  ? isDark
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-white/20 text-white"
                                  : isDark
                                    ? "bg-white/5 text-white/30"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                            >
                              {slot.time < "12:00"
                                ? "Morning"
                                : slot.time < "17:00"
                                  ? "Afternoon"
                                  : "Evening"}
                            </span>
                            <span
                              className={`text-lg font-black tracking-tight mt-1 ${isSelected ? (isDark ? "text-emerald-400" : "text-white") : ""}`}
                            >
                              {slot.label}
                            </span>
                          </div>
                          {isSelected && (
                            <div
                              className={`absolute top-4 right-4 ${isDark ? "text-emerald-500" : "text-white"}`}
                            >
                              <div className="w-6 h-6 rounded-full bg-current flex items-center justify-center shadow-lg">
                                <Check
                                  size={14}
                                  strokeWidth={3}
                                  className={
                                    isDark ? "text-black" : "text-emerald-600"
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Footer (Outside panels to guarantee visibility) */}
        <div
          className={`p-6 px-8 border-t flex items-center justify-between gap-4 shrink-0 z-20 ${isDark ? "bg-black/40 border-white/5" : "bg-gray-50 border-gray-100"
            }`}
        >
          <div className="hidden sm:flex items-center gap-2 opacity-30 italic text-[11px] font-bold">
            <Info size={14} />
            Click a slot to select, then confirm to save
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className={`flex-1 sm:flex-none px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isDark
                  ? "hover:bg-white/5 text-white/40 hover:text-white"
                  : "hover:bg-gray-200 text-gray-500 hover:text-gray-900"
                }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !selectedSlot}
              className={`flex-1 sm:flex-none px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${isSaving || !selectedSlot
                  ? "opacity-50 grayscale cursor-not-allowed bg-gray-400 text-white shadow-none"
                  : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20 active:scale-95"
                }`}
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Confirm Reschedule"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Schedule;
