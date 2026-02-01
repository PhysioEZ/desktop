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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ShortcutItem } from "../types/shortcuts";

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
  onToggle,
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  // Reset search on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      // Focus search input after animation
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handle Keyboard Events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Priority 1: Escape (only if modal is open)
      if (e.key === "Escape" && isOpen) {
        onClose();
        return;
      }

      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Allow all shortcuts if any modifier (Alt, Ctrl, Meta) is pressed, even in inputs
      const hasModifier = e.altKey || e.ctrlKey || e.metaKey;
      if (isInput && !hasModifier) return;

      for (const shortcut of shortcuts) {
        if (!shortcut.action) continue;

        const definitionKeys = shortcut.keys.map((k) => k.toLowerCase());

        // Modifier matches
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

        // Main key match
        const mainKey = definitionKeys.find(
          (k) =>
            !["alt", "ctrl", "control", "meta", "cmd", "shift"].includes(k),
        );
        if (!mainKey) continue;

        const eventKey = e.key.toLowerCase();
        const eventCode = e.code.toLowerCase();

        // Highly robust key matching
        const isKeyMatch =
          eventKey === mainKey ||
          eventCode === `key${mainKey}` ||
          eventCode === `digit${mainKey}` ||
          eventCode === mainKey;

        if (isKeyMatch) {
          e.preventDefault();
          e.stopPropagation();
          shortcut.action();
          // Close shortcut list if it's open and we triggered a navigation/modal
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

    // Use capture phase to ensure we catch it before browser or other listeners
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [shortcuts, isOpen, onClose]);

  // Filter and Group Shortcuts
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
    if (key === "Alt") return <Option size={14} strokeWidth={3} />;
    if (key === "Ctrl")
      return isMac ? (
        <Command size={14} strokeWidth={3} />
      ) : (
        <span className="text-xs font-bold">Ctrl</span>
      );
    if (key === "Shift")
      return <span className="text-xs font-bold">Shift</span>;
    if (key === "ArrowLeft") return <ArrowLeft size={16} strokeWidth={3} />;
    if (key === "ArrowRight") return <ArrowRight size={16} strokeWidth={3} />;
    if (key === "ArrowUp") return <ArrowUp size={16} strokeWidth={3} />;
    if (key === "ArrowDown") return <ArrowDown size={16} strokeWidth={3} />;
    return <span className="text-sm font-bold uppercase">{key}</span>;
  };

  // Columns Configuration
  const commonGroups = ["Navigation", "General", "Actions"];
  const getShortcutKey = (s: ShortcutItem) => s.description + s.keys.join("-");

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-[#e8def8] dark:bg-[#4a4458] text-[#1d192b] dark:text-[#e8def8] rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center transition-all"
        title="Keyboard Shortcuts"
      >
        <Keyboard size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[10010] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#fdfcff] dark:bg-[#1a1c1e] w-full max-w-5xl rounded-[28px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-[#e0e2ec] dark:border-[#43474e] flex flex-col gap-4 shrink-0 bg-[#fdfcff] dark:bg-[#1a1c1e]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#e8def8] dark:bg-[#4a4458] flex items-center justify-center shrink-0">
                      <Keyboard
                        size={20}
                        className="text-[#1d192b] dark:text-[#e8def8]"
                      />
                    </div>
                    <h2 className="text-2xl font-normal text-[#1a1c1e] dark:text-[#e3e2e6] font-serif">
                      Keyboard Shortcuts
                    </h2>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-[#444746] dark:text-[#c4c7c5] bg-[#f2f0f4] dark:bg-[#30333b] px-3 py-1.5 rounded-full border border-[#e0e2ec] dark:border-[#43474e]">
                      <Option size={14} /> <span>Alt / Option</span>
                    </div>

                    <button
                      onClick={onClose}
                      className="w-8 h-8 rounded-full hover:bg-[#f2f0f4] dark:hover:bg-[#30333b] flex items-center justify-center transition-colors ml-2"
                    >
                      <X
                        size={20}
                        className="text-[#444746] dark:text-[#c4c7c5]"
                      />
                    </button>
                  </div>
                </div>

                {/* Search Bar Row */}
                <div className="relative max-w-full">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search shortcuts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#f2f0f4] dark:bg-[#30333b] rounded-full pl-12 pr-4 py-3 text-sm text-[#1a1c1e] dark:text-[#e3e2e6] placeholder:text-[#74777f] focus:outline-none focus:ring-2 focus:ring-[#006e1c] dark:focus:ring-[#88d99d] transition-shadow"
                  />
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#74777f]"
                  />
                </div>
              </div>

              {/* Body */}
              <div className="p-8 overflow-y-auto bg-[#fdfcff] dark:bg-[#1a1c1e]">
                <motion.div
                  layout
                  className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                >
                  {/* Column 1: Navigation */}
                  {filteredAndGrouped["Navigation"] &&
                    filteredAndGrouped["Navigation"].length > 0 && (
                      <motion.div layout className="space-y-6">
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold text-[#006c4c] dark:text-[#88d99d] tracking-widest uppercase border-b border-[#e0e2ec] dark:border-[#43474e] pb-2 mb-2">
                            Navigation
                          </h3>
                          <motion.div layout className="space-y-1">
                            <AnimatePresence>
                              {filteredAndGrouped["Navigation"].map((s) => (
                                <ShortcutRow
                                  key={getShortcutKey(s)}
                                  shortcut={s}
                                  renderKey={renderKey}
                                />
                              ))}
                            </AnimatePresence>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                  {/* Column 2: General & Actions */}
                  {(filteredAndGrouped["General"] ||
                    filteredAndGrouped["Actions"]) && (
                    <motion.div layout className="space-y-6">
                      {filteredAndGrouped["General"] &&
                        filteredAndGrouped["General"].length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-xs font-bold text-[#006c4c] dark:text-[#88d99d] tracking-widest uppercase border-b border-[#e0e2ec] dark:border-[#43474e] pb-2 mb-2">
                              General
                            </h3>
                            <motion.div layout className="space-y-1">
                              <AnimatePresence>
                                {filteredAndGrouped["General"].map((s) => (
                                  <ShortcutRow
                                    key={getShortcutKey(s)}
                                    shortcut={s}
                                    renderKey={renderKey}
                                  />
                                ))}
                              </AnimatePresence>
                            </motion.div>
                          </div>
                        )}
                      {filteredAndGrouped["Actions"] &&
                        filteredAndGrouped["Actions"].length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-xs font-bold text-[#b3261e] dark:text-[#ffb4ab] tracking-widest uppercase border-b border-[#e0e2ec] dark:border-[#43474e] pb-2 mb-2">
                              Actions
                            </h3>
                            <motion.div layout className="space-y-1">
                              <AnimatePresence>
                                {filteredAndGrouped["Actions"].map((s) => (
                                  <ShortcutRow
                                    key={getShortcutKey(s)}
                                    shortcut={s}
                                    renderKey={renderKey}
                                  />
                                ))}
                              </AnimatePresence>
                            </motion.div>
                          </div>
                        )}
                    </motion.div>
                  )}

                  {/* Column 3: Specific Groups (The Rest) */}
                  <motion.div
                    layout
                    className="space-y-6 bg-[#f0f4ff] dark:bg-[#004a77]/20 rounded-2xl p-6 -my-6"
                  >
                    {Object.entries(filteredAndGrouped).map(
                      ([group, items]) => {
                        if (commonGroups.includes(group)) return null;
                        return (
                          <div key={group} className="space-y-3">
                            <h3 className="text-xs font-bold tracking-widest uppercase border-b border-[#c2e7ff] dark:border-[#004a77] pb-2 mb-2 text-[#00639b] dark:text-[#7fcfff]">
                              {group}
                            </h3>
                            <motion.div layout className="space-y-1">
                              <AnimatePresence>
                                {items.map((s) => (
                                  <ShortcutRow
                                    key={getShortcutKey(s)}
                                    shortcut={s}
                                    renderKey={renderKey}
                                  />
                                ))}
                              </AnimatePresence>
                            </motion.div>
                          </div>
                        );
                      },
                    )}

                    {/* If no specific groups found */}
                    {Object.keys(filteredAndGrouped).every((g) =>
                      commonGroups.includes(g),
                    ) &&
                      searchQuery === "" && (
                        <div className="text-center text-[#74777f] py-4 border-2 border-dashed border-[#e0e2ec] dark:border-[#43474e] rounded-xl">
                          <p className="text-xs font-medium">
                            No page-specific shortcuts.
                          </p>
                        </div>
                      )}
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const ShortcutRow = ({
  shortcut,
  renderKey,
}: {
  shortcut: ShortcutItem;
  renderKey: (k: string) => React.ReactNode;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    className="flex items-center justify-between py-2 group hover:bg-[#f2f0f4] dark:hover:bg-[#30333b] px-3 -mx-3 rounded-lg transition-colors cursor-default"
  >
    <span className="text-sm text-[#1a1c1e] dark:text-[#e3e2e6] font-medium">
      {shortcut.description}
    </span>
    <div className="flex items-center gap-1.5">
      {shortcut.keys.map((key, i) => (
        <kbd
          key={i}
          className="h-8 min-w-[32px] px-2 flex items-center justify-center bg-white dark:bg-[#1a1c1e] border border-[#74777f] dark:border-[#8e918f] rounded-lg text-xs font-bold text-[#1a1c1e] dark:text-[#e3e2e6] shadow-sm font-sans mx-0.5"
        >
          {renderKey(key)}
        </kbd>
      ))}
    </div>
  </motion.div>
);

export default KeyboardShortcuts;
