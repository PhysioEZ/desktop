import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  X,
  StickyNote,
  Loader2,
  Send,
  Trash2,
  Calendar,
  User,
  RefreshCw,
  ChevronDown,
  Info,
  Paperclip,
  FileText,
  Search,
  Download,
  DownloadCloud,
} from "lucide-react";
import { useThemeStore, useAuthStore, useDashboardStore } from "../store";
import { API_BASE_URL, authFetch } from "../config";
import { toast } from "sonner";
import { format } from "date-fns";
import FileViewer from "./FileViewer/FileViewer";

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotesDrawer: React.FC<NotesDrawerProps> = ({ isOpen, onClose }) => {
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();

  const {
    publicNotes,
    privateNotes,
    branchUsers,
    notesPagination,
    setPublicNotes,
    setPrivateNotes,
    setBranchUsers,
    setNotesPagination,
  } = useDashboardStore();

  const [newNote, setNewNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [noteType, setNoteType] = useState<"public" | "private">("public");

  // New States
  const [showUserList, setShowUserList] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [viewerConfig, setViewerConfig] = useState<{
    isOpen: boolean;
    url: string;
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Refresh cooldown logic
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const cooldownTimerRef = useRef<any>(null);

  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

  const themeHex = noteType === "public" ? "#ec4899" : "#6366f1"; // pink-500 : indigo-500
  const currentNotes = noteType === "public" ? publicNotes : privateNotes;
  const currentPagination =
    noteType === "public" ? notesPagination.public : notesPagination.private;

  const fetchNotes = useCallback(
    async (type: "public" | "private", reset = false) => {
      if (!user?.branch_id) return;
      setIsFetching(true);

      // Determine offset
      let offset = 0;
      if (!reset) {
        if (type === "public") offset = publicNotes?.length || 0;
        else offset = privateNotes?.length || 0;
      }

      const limit = 15;

      try {
        const res = await authFetch(
          `${API_BASE_URL}/reception/notes?branch_id=${user.branch_id}&type=${type}&limit=${limit}&offset=${offset}`,
        );
        const result = await res.json();
        if (result.success) {
          if (type === "public") {
            const updatedNotes = reset
              ? result.notes
              : [...(publicNotes || []), ...result.notes];
            setPublicNotes(updatedNotes);
          } else {
            const updatedNotes = reset
              ? result.notes
              : [...(privateNotes || []), ...result.notes];
            setPrivateNotes(updatedNotes);
          }
          setNotesPagination(type, {
            hasMore: result.hasMore,
            offset: offset + result.notes.length,
          });
        }
      } catch (error) {
        console.error("Error fetching notes:", error);
        toast.error("Failed to load notes");
      } finally {
        setIsFetching(false);
      }
    },
    [
      user?.branch_id,
      publicNotes,
      privateNotes,
      setPublicNotes,
      setPrivateNotes,
      setNotesPagination,
    ],
  );

  const fetchBranchUsers = useCallback(async () => {
    if (!user?.branch_id) return;
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/notes/users?branch_id=${user.branch_id}`,
      );
      const data = await res.json();
      if (data.success) {
        setBranchUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching branch users:", error);
    }
  }, [user?.branch_id, setBranchUsers]);

  // Initial fetch: only if cache is empty
  useEffect(() => {
    if (isOpen) {
      if (publicNotes === null || privateNotes === null) {
        fetchNotes("public", true);
        fetchNotes("private", true);
      }
      if (branchUsers === null) {
        fetchBranchUsers();
      }
    }
  }, [
    isOpen,
    publicNotes,
    privateNotes,
    branchUsers,
    fetchNotes,
    fetchBranchUsers,
  ]);

  const handleRefresh = async () => {
    if (refreshCooldown > 0) return;

    await Promise.all([
      fetchNotes("public", true),
      fetchNotes("private", true),
    ]);

    setRefreshCooldown(20);
    cooldownTimerRef.current = setInterval(() => {
      setRefreshCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewNote(val);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

    if (
      noteType === "public" &&
      lastAtSymbol !== -1 &&
      (lastAtSymbol === 0 || textBeforeCursor[lastAtSymbol - 1] === " ")
    ) {
      const query = textBeforeCursor.substring(lastAtSymbol + 1);
      if (!query.includes(" ")) {
        setMentionSearch(query);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (targetUser: any) => {
    if (!textareaRef.current) return;
    const val = newNote;
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPosition);
    const textAfterCursor = val.substring(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf("@");

    const newVal =
      textBeforeCursor.substring(0, lastAtSymbol) +
      "@" +
      targetUser.username +
      " " +
      textAfterCursor;
    setNewNote(newVal);
    setShowMentions(false);
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = lastAtSymbol + targetUser.username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() && !selectedFile) return;
    if (!user) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("branch_id", String(user.branch_id));
      formData.append("employee_id", String(user.employee_id));
      formData.append("content", newNote.trim());
      formData.append("type", noteType);

      if (selectedFile) {
        formData.append("attachment", selectedFile);
      }

      // Extract mentions from text for the backend
      const mentionRegex = /@(\w+)/g;
      const foundMentions: string[] = [];
      let match;
      while ((match = mentionRegex.exec(newNote)) !== null) {
        const username = match[1];
        const mentionUser = branchUsers?.find((u) => u.username === username);
        if (mentionUser) foundMentions.push(mentionUser.id);
      }
      if (foundMentions.length > 0) {
        formData.append("mentions", JSON.stringify(foundMentions));
      }

      const res = await authFetch(`${API_BASE_URL}/reception/notes`, {
        method: "POST",
        body: formData, // authFetch handles FormData correctly (removes Content-Type for browser to set it)
      });
      const result = await res.json();
      if (result.success) {
        toast.success(
          `Note saved to ${noteType === "public" ? "Branch" : "Personal"} folder`,
        );
        setNewNote("");
        setSelectedFile(null);
        fetchNotes(noteType, true);
      } else {
        toast.error(result.message || "Failed to save note");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error saving note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/reception/notes/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Note deleted");
        fetchNotes(noteType, true);
        setNoteToDelete(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting note");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1000]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "circOut", duration: 0.4 }}
            className={`fixed inset-y-0 right-0 w-full max-w-[650px] shadow-2xl z-[1001] border-l flex flex-col ${isDark ? "bg-[#121412] border-[#2A2D2A]" : "bg-white border-gray-100"}`}
          >
            {/* Header */}
            <div
              className={`px-6 pt-6 pb-4 border-b ${isDark ? "border-[#2A2D2A]" : "border-gray-100"}`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      backgroundColor:
                        noteType === "public" ? "#ec48991a" : "#6366f11a",
                      color: themeHex,
                    }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300"
                  >
                    <StickyNote size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2
                      className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {noteType === "public"
                        ? "Branch Notes"
                        : "Personal Notes"}
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                      {noteType === "public"
                        ? "Visible to entire team"
                        : "Visible only to you"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUserList(true)}
                    className={`p-2 rounded-xl transition-all ${isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-50 text-gray-400"}`}
                    title="Branch Users"
                  >
                    <Info size={18} />
                  </button>

                  <button
                    onClick={handleRefresh}
                    disabled={refreshCooldown > 0 || isFetching}
                    className={`p-2 rounded-xl transition-all relative ${isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-50 text-gray-400"} ${refreshCooldown > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={
                      refreshCooldown > 0
                        ? `Refresh in ${refreshCooldown}s`
                        : "Refresh Notes"
                    }
                  >
                    <RefreshCw
                      size={18}
                      className={isFetching ? "animate-spin" : ""}
                    />
                    {refreshCooldown > 0 && (
                      <span className="absolute -top-1 -right-1 text-[8px] font-black bg-white dark:bg-[#2A2D2A] px-1 rounded-full shadow-sm">
                        {refreshCooldown}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={onClose}
                    className={`p-2 rounded-xl transition-all ${isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-50 text-gray-400"}`}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Branch Users Floating Modal / Area */}
              <AnimatePresence>
                {showUserList && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className={`absolute top-20 right-6 left-6 z-[1010] p-6 rounded-[32px] border shadow-2xl ${isDark ? "bg-[#1A1C1A] border-white/10" : "bg-white border-gray-100"}`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3 text-emerald-500">
                        <User size={20} strokeWidth={2.5} />
                        <h3
                          className={`text-sm font-black uppercase tracking-widest ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          Branch Members
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowUserList(false)}
                        className={`p-2 rounded-xl ${isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-50 text-gray-400"}`}
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="relative mb-4">
                      <Search
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-20"
                      />
                      <input
                        type="text"
                        placeholder="Search members..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className={`w-full py-2.5 pl-10 pr-4 rounded-xl text-xs font-bold outline-none border transition-all ${isDark ? "bg-white/5 border-white/5 text-white focus:border-emerald-500/50" : "bg-gray-50 border-gray-100 text-gray-900 focus:border-emerald-500/50"}`}
                      />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
                      {branchUsers
                        ?.filter((u) =>
                          (u.full_name || u.username || "")
                            .toLowerCase()
                            .includes(userSearchQuery.toLowerCase()),
                        )
                        .map((u: any) => (
                          <div
                            key={u.id}
                            className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? "bg-white/5 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}
                            >
                              {(u.full_name || u.username || "?").charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}
                              >
                                {u.full_name || u.username}
                              </p>
                              <p className="text-[9px] font-bold uppercase tracking-widest opacity-30 mt-0.5">
                                {u.role}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tab Switcher */}
              <div
                className={`p-1 rounded-2xl flex items-center gap-1 ${isDark ? "bg-white/5" : "bg-gray-100"}`}
              >
                <button
                  onClick={() => setNoteType("public")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${noteType === "public" ? (isDark ? "bg-white/10 text-white shadow-lg" : "bg-white text-slate-900 shadow-md") : isDark ? "text-white/40 hover:text-white/60" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${noteType === "public" ? "bg-pink-500" : "bg-transparent border border-current opacity-20"}`}
                  />
                  Branch
                </button>
                <button
                  onClick={() => setNoteType("private")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${noteType === "private" ? (isDark ? "bg-white/10 text-white shadow-lg" : "bg-white text-slate-900 shadow-md") : isDark ? "text-white/40 hover:text-white/60" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${noteType === "private" ? "bg-indigo-500" : "bg-transparent border border-current opacity-20"}`}
                  />
                  Personal
                </button>
              </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {isFetching && (!currentNotes || currentNotes.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-40 opacity-40 gap-3">
                  <Loader2
                    size={32}
                    className={`animate-spin ${noteType === "public" ? "text-pink-500" : "text-indigo-500"}`}
                  />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Loading {noteType} notes...
                  </p>
                </div>
              ) : currentNotes && currentNotes.length > 0 ? (
                <>
                  <LayoutGroup id={noteType}>
                    {currentNotes.map((note: any) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-5 rounded-2xl border transition-all ${isDark ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]" : "bg-white border-gray-100 shadow-sm"} ${noteType === "public" ? "hover:border-pink-500/20" : "hover:border-indigo-500/20"}`}
                      >
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${noteType === "public" ? (isDark ? "bg-pink-500/10 text-pink-400" : "bg-pink-50 text-pink-600") : isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}
                            >
                              {note.author_name ? (
                                String(note.author_name).charAt(0)
                              ) : (
                                <User size={14} />
                              )}
                            </div>
                            <div>
                              <p
                                className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                              >
                                {noteType === "private"
                                  ? "You"
                                  : String(note.author_name || "Unknown")}
                              </p>
                              <div className="flex items-center gap-2 opacity-40">
                                <Calendar size={10} />
                                <span className="text-[10px] font-bold">
                                  {format(
                                    new Date(note.created_at),
                                    "dd MMM yyyy • hh:mm a",
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          {user?.employee_id === note.employee_id && (
                            <button
                              onClick={() => setNoteToDelete(note.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <p
                          className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? "text-gray-300" : "text-gray-600"}`}
                        >
                          {note.content}
                        </p>

                        {/* Rendering Attachments */}
                        {note.attachment_path && (
                          <div className="mt-4">
                            {note.attachment_type === "image" ? (
                              <div className="relative group/img overflow-hidden rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                                <img
                                  src={`${API_BASE_URL.replace("/api", "")}/${note.attachment_path}`}
                                  alt="Attachment"
                                  className="w-full max-h-[300px] object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-500"
                                  onClick={() =>
                                    setViewerConfig({
                                      isOpen: true,
                                      url: `${API_BASE_URL.replace("/api", "")}/${note.attachment_path}`,
                                      fileName:
                                        note.attachment_path.split("/").pop() ||
                                        "Image",
                                    })
                                  }
                                />
                                <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `${API_BASE_URL.replace("/api", "")}/${note.attachment_path}`,
                                        "_blank",
                                      )
                                    }
                                    className="p-2 bg-black/50 backdrop-blur-md rounded-xl text-white hover:bg-black/70 transition-all"
                                  >
                                    <Download size={14} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() =>
                                  setViewerConfig({
                                    isOpen: true,
                                    url: `${API_BASE_URL.replace("/api", "")}/${note.attachment_path}`,
                                    fileName:
                                      note.attachment_path.split("/").pop() ||
                                      "Document",
                                  })
                                }
                                className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-gray-50 border-gray-100 hover:bg-gray-100"}`}
                              >
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-white/5 text-emerald-400" : "bg-white text-emerald-600 shadow-sm"}`}
                                >
                                  <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}
                                  >
                                    {note.attachment_path.split("/").pop()}
                                  </p>
                                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mt-0.5">
                                    {note.attachment_type} File
                                  </p>
                                </div>
                                <DownloadCloud
                                  size={18}
                                  className="opacity-20 hover:opacity-100 transition-opacity"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </LayoutGroup>

                  {currentPagination.hasMore && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => fetchNotes(noteType)}
                        disabled={isFetching}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-white/60" : "bg-gray-100 hover:bg-gray-200 text-gray-500"}`}
                      >
                        {isFetching ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                        Load More
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-60 text-center opacity-30">
                  <div
                    className={`w-16 h-16 rounded-[24px] border border-dashed border-current mb-4 flex items-center justify-center ${noteType === "public" ? "text-pink-500" : "text-indigo-500"}`}
                  >
                    <StickyNote size={32} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest">
                    No {noteType} Notes
                  </p>
                  <p className="text-[10px] uppercase tracking-widest mt-1">
                    Start by adding one below
                  </p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div
              className={`p-6 border-t relative ${isDark ? "border-[#2A2D2A] bg-[#121412]" : "border-gray-100 bg-white"}`}
            >
              {/* Mentions Popup */}
              <AnimatePresence>
                {showMentions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className={`absolute bottom-full left-6 right-6 mb-2 z-[1010] p-2 rounded-2xl border shadow-xl ${isDark ? "bg-[#1A1C1A] border-white/10" : "bg-white border-gray-100"}`}
                  >
                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                      {branchUsers?.filter((u) =>
                        u.username
                          .toLowerCase()
                          .includes(mentionSearch.toLowerCase()),
                      ).length === 0 ? (
                        <div className="p-4 text-center opacity-40 text-[10px] font-bold uppercase tracking-widest">
                          No users found
                        </div>
                      ) : (
                        branchUsers
                          ?.filter((u) =>
                            u.username
                              .toLowerCase()
                              .includes(mentionSearch.toLowerCase()),
                          )
                          .map((u) => (
                            <button
                              key={u.id}
                              onClick={() => insertMention(u)}
                              className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${isDark ? "bg-white/5 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}
                              >
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <span
                                className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                              >
                                {u.username}
                              </span>
                            </button>
                          ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* File Selection Preview */}
              <AnimatePresence>
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`mb-4 p-3 rounded-2xl flex items-center gap-3 border ${isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-100 text-emerald-600"}`}
                  >
                    <FileText size={16} />
                    <span className="text-[10px] font-black truncate flex-1 tracking-tight">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-emerald-500/20 rounded-full transition-all"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleAddNote} className="relative">
                <textarea
                  ref={textareaRef}
                  value={newNote}
                  onChange={handleTextareaChange}
                  placeholder={
                    noteType === "public"
                      ? "Shared thoughts, instructions, or use @ to mention..."
                      : "Private reminders or personal logs..."
                  }
                  className={`w-full min-h-[100px] max-h-[200px] p-4 pr-24 rounded-2xl border transition-all resize-none text-sm ${isDark ? "bg-[#1A1C1A] border-white/5 text-white" : "bg-gray-50 border-gray-100 text-gray-900"} ${noteType === "public" ? "focus:border-pink-500/50" : "focus:border-indigo-500/50"}`}
                />

                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2.5 rounded-xl transition-all ${isDark ? "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"}`}
                  >
                    <Paperclip size={18} />
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving || (!newNote.trim() && !selectedFile)}
                    className={`p-2.5 rounded-xl transition-all shadow-lg ${isSaving || (!newNote.trim() && !selectedFile) ? "bg-gray-200 text-gray-400 scale-95" : noteType === "public" ? "bg-pink-500 text-white hover:bg-pink-600 shadow-pink-500/20" : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/20"}`}
                  >
                    {isSaving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </form>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-3 text-center">
                {noteType === "public"
                  ? "Notes are visible to everyone in this branch"
                  : "Notes are only visible to you"}
              </p>
            </div>

            {/* Confirmation Modal Over Drawer */}
            <AnimatePresence>
              {noteToDelete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[1002] flex items-center justify-center p-6 bg-black/20 backdrop-blur-[2px]"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className={`w-full max-w-[320px] p-8 rounded-[32px] shadow-2xl border ${isDark ? "bg-[#1A1C1A] border-white/5" : "bg-white border-gray-100"}`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                        <Trash2 size={28} />
                      </div>
                      <h3
                        className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        Delete Note?
                      </h3>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-8">
                        This action is permanent and cannot be undone.
                      </p>
                      <div className="flex flex-col w-full gap-3">
                        <button
                          onClick={() => handleDeleteNote(noteToDelete)}
                          className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-lg shadow-red-500/20 transition-all"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setNoteToDelete(null)}
                          className={`w-full py-4 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all ${isDark ? "bg-white/5 text-white/40 hover:bg-white/10" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* File Viewer Modal */}
      {viewerConfig && (
        <FileViewer
          isOpen={viewerConfig.isOpen}
          onClose={() => setViewerConfig(null)}
          url={viewerConfig.url}
          fileName={viewerConfig.fileName}
        />
      )}
    </AnimatePresence>
  );
};

export default NotesDrawer;
