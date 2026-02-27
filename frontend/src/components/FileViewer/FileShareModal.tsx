import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Loader2,
  Search,
  MessageSquare,
  StickyNote,
  Users,
  Check,
} from "lucide-react";
import { useThemeStore, useAuthStore } from "../../store";
import { API_BASE_URL, authFetch } from "../../config";
import { toast } from "sonner";

interface FileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

const FileShareModal: React.FC<FileShareModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName,
}) => {
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"messenger" | "notes">(
    "messenger",
  );
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Messenger State
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Notes State
  const [noteType, setNoteType] = useState<"public" | "private">("public");

  useEffect(() => {
    if (isOpen && activeTab === "messenger" && users.length === 0) {
      fetchUsers();
    }
  }, [isOpen, activeTab]);

  const fetchUsers = async () => {
    if (!user) return;
    setIsLoadingUsers(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/chat/users?branch_id=${user.branch_id || ""}&employee_id=${user.employee_id || ""}`,
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load users for sharing");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const toggleUser = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const getFileFromUrl = async (): Promise<File> => {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type });
  };

  const handleShare = async () => {
    if (!user) return;

    if (activeTab === "messenger" && selectedUsers.size === 0) {
      toast.error("Please select at least one user to share with");
      return;
    }

    setIsSending(true);

    try {
      const fileToShare = await getFileFromUrl();

      if (activeTab === "messenger") {
        const promises = Array.from(selectedUsers).map(async (receiverId) => {
          const fd = new FormData();
          fd.append("sender_id", String(user.employee_id));
          fd.append("receiver_id", String(receiverId));
          fd.append("message_text", messageText || `Shared File: ${fileName}`);
          fd.append("branch_id", String(user.branch_id));
          fd.append("sender_name", user.name || "");
          fd.append("chat_file", fileToShare);

          return authFetch(`${API_BASE_URL}/reception/chat/send`, {
            method: "POST",
            body: fd,
          });
        });

        await Promise.all(promises);
        toast.success(`File shared with ${selectedUsers.size} user(s)`);
      } else {
        // Notes Sharing
        const formData = new FormData();
        formData.append("branch_id", String(user.branch_id));
        formData.append("employee_id", String(user.employee_id));
        formData.append("content", messageText || `Shared File: ${fileName}`);
        formData.append("type", noteType);
        formData.append("attachment", fileToShare);

        const res = await authFetch(`${API_BASE_URL}/reception/notes`, {
          method: "POST",
          body: formData,
        });

        const result = await res.json();
        if (result.success) {
          toast.success(
            `File shared to ${noteType === "public" ? "Branch" : "Personal"} Notes`,
          );
        } else {
          throw new Error(result.message || "Failed to share to notes");
        }
      }

      onClose();
      setMessageText("");
      setSelectedUsers(new Set());
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to share file");
    } finally {
      setIsSending(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.full_name || u.username || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[30000] flex items-center justify-center p-4 pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl relative flex flex-col ${
              isDark
                ? "bg-[#121412] border border-white/10"
                : "bg-white border text-slate-900"
            }`}
          >
            {/* Header */}
            <div
              className={`px-6 py-5 shrink-0 border-b flex items-center justify-between ${
                isDark
                  ? "border-white/5 bg-white/[0.02]"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">
                  Share File
                </h2>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1">
                  {fileName}
                </p>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-all ${
                  isDark
                    ? "hover:bg-white/5 text-white/40"
                    : "hover:bg-slate-200 text-slate-400"
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div
              className={`p-4 border-b flex gap-2 ${isDark ? "border-white/5" : "border-slate-100"}`}
            >
              <button
                onClick={() => setActiveTab("messenger")}
                className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "messenger"
                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                    : isDark
                      ? "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <MessageSquare size={14} />
                Messenger
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                  activeTab === "notes"
                    ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20"
                    : isDark
                      ? "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <StickyNote size={14} />
                Notes
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {activeTab === "messenger" ? (
                <div className="flex flex-col h-[300px]">
                  <div className="relative mb-4 shrink-0">
                    <Search
                      size={14}
                      className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30"
                    />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full py-3 pl-10 pr-4 rounded-xl text-xs font-bold outline-none border transition-all ${
                        isDark
                          ? "bg-black/20 border-white/5 focus:border-emerald-500/50"
                          : "bg-slate-50 border-slate-200 focus:border-emerald-500/50"
                      }`}
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center h-full opacity-30">
                        <Loader2 size={24} className="animate-spin" />
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center opacity-30 text-[10px] font-bold uppercase tracking-widest mt-10">
                        No users found
                      </div>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelected = selectedUsers.has(u.id);
                        return (
                          <button
                            key={u.id}
                            onClick={() => toggleUser(u.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                              isSelected
                                ? isDark
                                  ? "bg-emerald-500/10 border border-emerald-500/20"
                                  : "bg-emerald-50 border border-emerald-100"
                                : isDark
                                  ? "border border-transparent hover:bg-white/5"
                                  : "border border-transparent hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black ${
                                isDark
                                  ? "bg-white/5 text-emerald-400"
                                  : "bg-white text-emerald-600 shadow-sm"
                              }`}
                            >
                              {(u.full_name || u.username || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-sm font-bold truncate">
                                {u.full_name || u.username}
                              </p>
                              <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">
                                {u.role}
                              </p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? "bg-emerald-500 text-white"
                                  : isDark
                                    ? "bg-white/10"
                                    : "bg-slate-200"
                              }`}
                            >
                              {isSelected && (
                                <Check size={12} strokeWidth={3} />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-[300px]">
                  <p className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-3 block">
                    Save Note To
                  </p>
                  <div
                    className={`p-1 rounded-2xl flex items-center gap-1 mb-6 ${isDark ? "bg-white/5" : "bg-slate-100"}`}
                  >
                    <button
                      onClick={() => setNoteType("public")}
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex justify-center items-center gap-2 ${
                        noteType === "public"
                          ? isDark
                            ? "bg-white/10 text-white shadow-lg"
                            : "bg-white text-slate-900 shadow-md"
                          : isDark
                            ? "text-white/40 hover:text-white/60"
                            : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <Users
                        size={14}
                        className={noteType === "public" ? "text-pink-500" : ""}
                      />
                      Branch (Shared)
                    </button>
                    <button
                      onClick={() => setNoteType("private")}
                      className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex justify-center items-center gap-2 ${
                        noteType === "private"
                          ? isDark
                            ? "bg-white/10 text-white shadow-lg"
                            : "bg-white text-slate-900 shadow-md"
                          : isDark
                            ? "text-white/40 hover:text-white/60"
                            : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <Search
                        size={14}
                        className={
                          noteType === "private" ? "text-indigo-500" : ""
                        }
                      />
                      Personal (Private)
                    </button>
                  </div>
                  <div
                    className={`flex-1 flex flex-col justify-center items-center text-center p-6 rounded-3xl border border-dashed ${isDark ? "border-white/10" : "border-slate-200"}`}
                  >
                    <StickyNote
                      size={32}
                      className={`mb-4 ${noteType === "public" ? "text-pink-500" : "text-indigo-500"}`}
                    />
                    <p className="text-sm font-bold opacity-60">
                      The file will be attached securely to a new{" "}
                      {noteType === "public" ? "branch" : "personal"} note.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Form */}
            <div
              className={`p-6 border-t ${isDark ? "border-white/5 bg-black/20" : "border-slate-100 bg-slate-50"}`}
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Add an optional message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className={`w-full py-4 pl-5 pr-14 rounded-[20px] text-xs font-bold outline-none border transition-all ${
                    isDark
                      ? "bg-white/5 border-white/5 focus:border-emerald-500/50 text-white"
                      : "bg-white border-slate-200 focus:border-emerald-500/50 text-slate-900 shadow-sm"
                  }`}
                />
                <button
                  onClick={handleShare}
                  disabled={
                    isSending ||
                    (activeTab === "messenger" && selectedUsers.size === 0)
                  }
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    isSending ||
                    (activeTab === "messenger" && selectedUsers.size === 0)
                      ? "bg-gray-300 text-gray-500 dark:bg-white/10 dark:text-gray-500 cursor-not-allowed"
                      : activeTab === "messenger"
                        ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 hover:scale-105"
                        : "bg-pink-500 text-white shadow-lg shadow-pink-500/20 hover:scale-105"
                  }`}
                >
                  {isSending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FileShareModal;
