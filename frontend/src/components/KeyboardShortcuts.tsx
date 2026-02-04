import React, { useEffect } from "react";
import {
  Keyboard,
  X,
  Option,
  Command,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Search,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ShortcutItem } from "../types/shortcuts";
import { useThemeStore } from "../store/useThemeStore";

export type { ShortcutItem };

interface KeyboardShortcutsProps {
  shortcuts: ShortcutItem[];
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  shortcuts,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { isDark } = useThemeStore();
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  // Reset search on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handle Keyboard Events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
        return;
      }

      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      const hasModifier = e.altKey || e.ctrlKey || e.metaKey;
      if (isInput && !hasModifier) return;

      for (const shortcut of shortcuts) {
        if (!shortcut.action) continue;

        const definitionKeys = shortcut.keys.map((k) => k.toLowerCase());

        const altRequired = definitionKeys.includes("alt");
        const ctrlRequired =
          definitionKeys.includes("ctrl") || definitionKeys.includes("control");
        const metaRequired =
          definitionKeys.includes("meta") || definitionKeys.includes("cmd");
        const shiftRequired = definitionKeys.includes("shift");

        const altMatch = altRequired === e.altKey;
        const ctrlMatch = ctrlRequired === e.ctrlKey;
        const metaMatch = metaRequired === e.metaKey;
        const shiftMatch = shiftRequired === e.shiftKey;

        if (!altMatch || !ctrlMatch || !metaMatch || !shiftMatch) continue;

        const mainKey = definitionKeys.find(
          (k) =>
            !["alt", "ctrl", "control", "meta", "cmd", "shift"].includes(k),
        );
        if (!mainKey) continue;

        const eventKey = e.key.toLowerCase();
        const eventCode = e.code.toLowerCase();

        const isKeyMatch =
          eventKey === mainKey ||
          eventCode === `key${mainKey}` ||
          eventCode === `digit${mainKey}` ||
          eventCode === mainKey;

        if (isKeyMatch) {
          e.preventDefault();
          e.stopPropagation();
          shortcut.action();
          if (
            isOpen &&
            shortcut.group !== "General" &&
            shortcut.group !== "Navigation"
          ) {
            onClose();
          }
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [shortcuts, isOpen, onClose]);

  const filteredAndGrouped = React.useMemo(() => {
    const query = searchQuery.toLowerCase();

    const filtered = shortcuts.filter((s) => {
      if (!query) return true;
      return (
        s.description.toLowerCase().includes(query) ||
        s.keys.some((k) => k.toLowerCase().includes(query))
      );
    });

    const grouped: Record<string, ShortcutItem[]> = {};
    filtered.forEach((s) => {
      const g = s.group || "Other";
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(s);
    });
    return grouped;
  }, [shortcuts, searchQuery]);

  const renderKey = (key: string) => {
    if (key === "Alt")
      return isMac ? (
        <Option size={14} strokeWidth={2.5} />
      ) : (
        <span className="text-[10px] font-black">ALT</span>
      );
    if (key === "Ctrl")
      return isMac ? (
        <Command size={14} strokeWidth={2.5} />
      ) : (
        <span className="text-[10px] font-black">CTRL</span>
      );
    if (key === "Shift")
      return <span className="text-[10px] font-black">SHIFT</span>;
    if (key === "ArrowLeft") return <ArrowLeft size={16} strokeWidth={2.5} />;
    if (key === "ArrowRight") return <ArrowRight size={16} strokeWidth={2.5} />;
    if (key === "ArrowUp") return <ArrowUp size={16} strokeWidth={2.5} />;
    if (key === "ArrowDown") return <ArrowDown size={16} strokeWidth={2.5} />;
    return <span className="text-xs font-black uppercase">{key}</span>;
  };

  const commonGroups = ["Navigation", "General", "Actions"];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center p-6 md:p-12 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`w-full max-w-5xl rounded-[48px] border relative overflow-hidden flex flex-col max-h-[90vh] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] ${
              isDark
                ? "bg-[#0A0A0A]/90 border-white/10 shadow-black"
                : "bg-white/95 border-slate-200"
            }`}
          >
            {/* Header Identity Overlay */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50`}
            />

            {/* Header Content */}
            <div className="px-10 py-8 shrink-0 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                      isDark
                        ? "bg-emerald-500 text-black"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    <Keyboard size={30} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2
                      className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      Command Center
                    </h2>
                    <div className="flex items-center gap-3 mt-1.5 font-black uppercase text-[10px] tracking-[0.2em]">
                      <span
                        className={
                          isDark ? "text-emerald-500" : "text-emerald-600"
                        }
                      >
                        PhysioEZ Core
                      </span>
                      <span className="opacity-20">•</span>
                      <span
                        className={isDark ? "text-white/40" : "text-slate-400"}
                      >
                        Keyboard Shortcuts
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={`hidden md:flex items-center gap-3 px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${
                      isDark
                        ? "bg-white/[0.03] border-white/10 text-white/40"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <Option size={14} className="text-emerald-500/60" />
                    <span>Alt Key Optimized</span>
                  </div>

                  <button
                    onClick={onClose}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                      isDark
                        ? "bg-white/5 hover:bg-red-500/20 text-white border border-white/5 hover:text-red-500"
                        : "bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600"
                    }`}
                  >
                    <X size={24} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative group">
                <Search
                  size={20}
                  className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark
                      ? "text-white/20 group-focus-within:text-emerald-500"
                      : "text-slate-300 group-focus-within:text-emerald-600"
                  }`}
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Filter commands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full rounded-2xl pl-16 pr-6 py-5 text-sm font-bold outline-none transition-all ${
                    isDark
                      ? "bg-white/[0.03] border border-white/[0.05] text-white focus:bg-white/[0.06] focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-white/10"
                      : "bg-slate-50 border border-slate-100 text-slate-900 focus:bg-white focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-300"
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    <X size={14} className="opacity-50" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto px-10 pb-12 custom-scrollbar">
              <motion.div
                layout
                className="grid gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              >
                {/* Column 1: Navigation */}
                {filteredAndGrouped["Navigation"] && (
                  <GroupSection
                    title="Navigation"
                    items={filteredAndGrouped["Navigation"]}
                    isDark={isDark}
                    renderKey={renderKey}
                    accent="text-emerald-500"
                  />
                )}

                {/* Column 2: General \u0026 Actions */}
                <div className="space-y-10">
                  {filteredAndGrouped["General"] && (
                    <GroupSection
                      title="General"
                      items={filteredAndGrouped["General"]}
                      isDark={isDark}
                      renderKey={renderKey}
                      accent="text-blue-500"
                    />
                  )}
                  {filteredAndGrouped["Actions"] && (
                    <GroupSection
                      title="Quick Actions"
                      items={filteredAndGrouped["Actions"]}
                      isDark={isDark}
                      renderKey={renderKey}
                      accent="text-amber-500"
                    />
                  )}
                </div>

                {/* Column 3: The Rest */}
                <div
                  className={`rounded-[32px] p-8 -mx-4 ${
                    isDark
                      ? "bg-white/[0.02]"
                      : "bg-slate-50 border border-slate-100"
                  }`}
                >
                  {Object.entries(filteredAndGrouped).map(([group, items]) => {
                    if (commonGroups.includes(group)) return null;
                    return (
                      <GroupSection
                        key={group}
                        title={group}
                        items={items}
                        isDark={isDark}
                        renderKey={renderKey}
                        accent="text-purple-500"
                      />
                    );
                  })}

                  {Object.keys(filteredAndGrouped).length === 0 && (
                    <div className="py-20 text-center space-y-4">
                      <Search size={40} className="mx-auto opacity-10" />
                      <p
                        className={`text-[10px] uppercase font-black tracking-widest ${isDark ? "text-white/20" : "text-slate-300"}`}
                      >
                        No results found
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Bottom Meta */}
            <div
              className={`px-10 py-5 shrink-0 border-t flex items-center justify-between ${
                isDark
                  ? "bg-black border-white/5"
                  : "bg-slate-50 border-slate-100"
              }`}
            >
              <div className="flex items-center gap-2 opacity-40">
                <Sparkles size={12} className="text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">
                  Precision Control v0.7.2b
                </span>
              </div>
              <div
                className={`px-3 py-1 rounded-lg text-[9px] font-black border tracking-widest ${
                  isDark
                    ? "border-white/10 text-white/30"
                    : "border-slate-200 text-slate-400"
                }`}
              >
                ESC TO CLOSE
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface GroupSectionProps {
  title: string;
  items: ShortcutItem[];
  isDark: boolean;
  renderKey: (k: string) => React.ReactNode;
  accent: string;
}

const GroupSection = ({
  title,
  items,
  isDark,
  renderKey,
  accent,
}: GroupSectionProps) => (
  <motion.div layout className="space-y-5">
    <div className="flex items-center gap-3">
      <div
        className={`w-2 h-2 rounded-full ${accent.replace("text-", "bg-")}`}
      />
      <h3
        className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? "text-white/40" : "text-slate-500"}`}
      >
        {title}
      </h3>
    </div>
    <div className="space-y-1">
      {items.map((s, i) => (
        <ShortcutRow
          key={i}
          shortcut={s}
          isDark={isDark}
          renderKey={renderKey}
        />
      ))}
    </div>
  </motion.div>
);

const ShortcutRow = ({
  shortcut,
  isDark,
  renderKey,
}: {
  shortcut: ShortcutItem;
  isDark: boolean;
  renderKey: (k: string) => React.ReactNode;
}) => (
  <motion.div
    layout
    className={`flex items-center justify-between py-3.5 px-4 -mx-4 rounded-2xl transition-all group hover:scale-[1.01] ${
      isDark
        ? "hover:bg-white/[0.03]"
        : "hover:bg-white hover:shadow-lg hover:shadow-slate-200/50"
    }`}
  >
    <span
      className={`text-[13px] font-bold tracking-tight ${isDark ? "text-white/60 group-hover:text-white" : "text-slate-600 group-hover:text-slate-900"}`}
    >
      {shortcut.description}
    </span>
    <div className="flex items-center gap-1.5">
      {shortcut.keys.map((key, i) => (
        <React.Fragment key={i}>
          <kbd
            className={`h-8 min-w-[32px] px-2.5 flex items-center justify-center rounded-[10px] text-[11px] font-black shadow-sm transition-colors border ${
              isDark
                ? "bg-[#121212] border-white/10 text-white group-hover:border-emerald-500/30"
                : "bg-[#F3F4F6] border-slate-200 text-slate-800 group-hover:border-emerald-500/30"
            }`}
          >
            {renderKey(key)}
          </kbd>
          {i < shortcut.keys.length - 1 && (
            <span className="text-[10px] font-black opacity-20">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  </motion.div>
);

export default KeyboardShortcuts;
