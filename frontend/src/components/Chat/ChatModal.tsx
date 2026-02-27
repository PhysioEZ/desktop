import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useChatStore } from "../../store/useChatStore";
import type { ChatUser, ChatMessage } from "../../store/useChatStore";
import { API_BASE_URL, authFetch } from "../../config";
import {
  X,
  Send,
  Search,
  Loader2,
  CheckCheck,
  Check,
  Paperclip,
  FileText,
  ChevronLeft,
  Lock,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Download,
  RefreshCw,
  Trash2,
} from "lucide-react";
import FileViewer from "../FileViewer/FileViewer";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatModal = ({ isOpen, onClose }: ChatModalProps) => {
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();
  const {
    cachedUsers,
    usersLastFetched,
    messagesCache,
    setCachedUsers,
    setCachedMessages,
  } = useChatStore();

  const [users, setUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activePartner, setActivePartner] = useState<ChatUser | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewerConfig, setViewerConfig] = useState<{
    isOpen: boolean;
    url: string;
    fileName: string;
  } | null>(null);

  const [refreshCooldown, setRefreshCooldown] = useState(0);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchUsers();
    }
    return () => {
      setActivePartner(null);
      setMessages([]);
    };
  }, [isOpen, user]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const setChatContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      chatContainerRef.current = node;
      if (node && messages.length > 0) {
        scrollToBottom();
        setTimeout(scrollToBottom, 100);
        setTimeout(scrollToBottom, 300);
        setTimeout(scrollToBottom, 500);
      }
    },
    [messages],
  );

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
    }
  }, [messages, activePartner]);

  // Cooldown Timer
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(() => {
        setRefreshCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  const fetchUsers = async () => {
    if (!user) return;

    // Check Cache (5 minutes)
    const now = Date.now();
    if (cachedUsers.length > 0 && now - usersLastFetched < 5 * 60 * 1000) {
      setUsers(cachedUsers);
      return;
    }

    setIsLoadingUsers(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/chat/users?branch_id=${user.branch_id || ""}&employee_id=${user.employee_id || ""}`,
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
        setCachedUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchMessages = async (
    partnerId: number,
    silent = false,
    force = false,
  ) => {
    if (!user) return;

    // Check Cache (5 minutes)
    const now = Date.now();
    const cacheEntry = messagesCache[partnerId];
    if (
      !force &&
      cacheEntry &&
      cacheEntry.data &&
      now - cacheEntry.lastFetched < 5 * 60 * 1000
    ) {
      setMessages(cacheEntry.data);
      return;
    }

    if (!silent) setIsLoadingMessages(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/reception/chat/fetch?employee_id=${user.employee_id}&partner_id=${partnerId}`,
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
        setCachedMessages(partnerId, data.messages);
        setUsers((prev) =>
          prev.map((u) => (u.id === partnerId ? { ...u, unread_count: 0 } : u)),
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  };

  const handleManualRefresh = () => {
    if (refreshCooldown > 0 || isLoadingMessages || !activePartner) return;
    fetchMessages(activePartner.id, false, true);
    setRefreshCooldown(10);
  };

  const selectUser = (selectedUser: ChatUser) => {
    setActivePartner(selectedUser);
    setMessages([]);
    fetchMessages(selectedUser.id);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!messageText.trim()) setMessageText(`File: ${file.name}`);
      e.target.value = "";
    }
  };

  const sendMessage = async () => {
    if ((!messageText.trim() && !selectedFile) || !activePartner || !user)
      return;
    setIsSending(true);
    try {
      let body: any;
      const headers: any = {};

      if (selectedFile) {
        const fd = new FormData();
        fd.append("sender_id", String(user.employee_id));
        fd.append("receiver_id", String(activePartner.id));
        fd.append("message_text", messageText);
        fd.append("branch_id", String(user.branch_id));
        fd.append("sender_name", user.name || "");
        fd.append("chat_file", selectedFile);
        body = fd;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          sender_id: user.employee_id,
          receiver_id: activePartner.id,
          message_text: messageText,
          branch_id: user.branch_id,
          sender_name: user.name || "",
        });
      }

      const res = await authFetch(`${API_BASE_URL}/reception/chat/send`, {
        method: "POST",
        headers,
        body,
      });
      const result = await res.json();
      if (result.success) {
        setMessageText("");
        setSelectedFile(null);
        fetchMessages(activePartner.id, true, true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(
    null,
  );

  const requestDelete = (messageId: number) => {
    setDeleteConfirmation(messageId);
  };

  const confirmDelete = async () => {
    if (!user || !activePartner || !deleteConfirmation) return;

    const messageId = deleteConfirmation;
    setDeleteConfirmation(null); // Close modal immediately

    try {
      const res = await authFetch(`${API_BASE_URL}/reception/chat/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: messageId,
          employee_id: user.employee_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((m) => m.message_id !== messageId));
        const currentCache = messagesCache[activePartner.id];
        if (currentCache) {
          const updatedMessages = currentCache.data.filter(
            (m) => m.message_id !== messageId,
          );
          setCachedMessages(activePartner.id, updatedMessages);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      (u.full_name || u.username || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [users, searchQuery]);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getDateLabel = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (msgDate.getTime() === today.getTime()) return "Today";
    if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";

    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const renderMessageContent = (msg: ChatMessage) => {
    const serverOrigin = (API_BASE_URL || "").replace("/api", "");
    const text = msg.message_text || "";

    switch (msg.message_type) {
      case "image":
        const imageUrl = `${serverOrigin}/${text.replace("admin/desktop/server/", "")}`;
        return (
          <img
            src={imageUrl}
            alt="Shared Content"
            onClick={() =>
              setViewerConfig({
                isOpen: true,
                url: imageUrl,
                fileName: text.split("/").pop() || "Image",
              })
            }
            className="max-w-full max-h-48 rounded-xl cursor-pointer hover:opacity-90 transition-opacity shadow-sm border border-black/5"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/400?text=Media+Error";
            }}
          />
        );
      case "pdf":
      case "doc":
      case "docx":
      case "xls":
      case "xlsx":
        const fileUrl = `${serverOrigin}/${text.replace("admin/desktop/server/", "")}`;
        return (
          <div
            onClick={() =>
              setViewerConfig({
                isOpen: true,
                url: fileUrl,
                fileName: text.split("/").pop() || "Document",
              })
            }
            className={`flex items-center gap-2 p-2 rounded-xl transition-colors cursor-pointer ${
              msg.is_sender
                ? "bg-white/10 hover:bg-white/20"
                : "bg-black/5 hover:bg-black/10"
            }`}
          >
            <FileText size={16} />
            <span className="text-[11px] font-bold truncate max-w-[120px]">
              {text.split("/").pop()}
            </span>
            <Download size={14} className="opacity-40" />
          </div>
        );
      default:
        return (
          <p className="text-[12.5px] font-bold leading-relaxed tracking-tight pr-1">
            {text}
          </p>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10010] flex items-center justify-end p-6 md:p-10 pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/10 backdrop-blur-[2px] pointer-events-auto"
      />

      <motion.div
        initial={{ x: 600, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 600, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
        className={`w-full max-w-[480px] h-[calc(100vh-80px)] rounded-[32px] border relative overflow-hidden flex flex-col shadow-xl pointer-events-auto ${
          isDark
            ? "bg-[#0A0A0A]/95 border-white/10"
            : "bg-white border-slate-200"
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 shrink-0 border-b flex items-center justify-between z-10 transition-colors ${
            isDark
              ? "bg-white/[0.02] border-white/5"
              : "bg-slate-50 border-slate-100"
          }`}
        >
          <div className="flex items-center gap-4">
            {activePartner && (
              <button
                onClick={() => {
                  setActivePartner(null);
                  setMessages([]);
                }}
                className="w-8 h-8 rounded-full hover:bg-emerald-500/10 text-emerald-500 flex items-center justify-center transition-all bg-white/5"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <h2
                className={`text-[15px] font-black tracking-tight leading-none uppercase ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {activePartner
                  ? activePartner.full_name || activePartner.username
                  : "Messenger"}
              </h2>
              <div className="flex items-center gap-1.5 mt-1.5 opacity-30 text-[8px] font-black uppercase tracking-[0.2em]">
                <ShieldCheck size={10} className="text-emerald-500" />
                <span>Staff</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activePartner && (
              <button
                onClick={handleManualRefresh}
                disabled={refreshCooldown > 0 || isLoadingMessages}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  isDark
                    ? "bg-white/5 hover:bg-white/10 text-white/40"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-400"
                } ${refreshCooldown > 0 ? "opacity-30 cursor-not-allowed" : ""}`}
                title={
                  refreshCooldown > 0
                    ? `Refresh available in ${refreshCooldown}s`
                    : "Refresh chat"
                }
              >
                <RefreshCw
                  size={18}
                  className={
                    isLoadingMessages && !refreshCooldown ? "animate-spin" : ""
                  }
                />
              </button>
            )}
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                isDark
                  ? "bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-500"
                  : "bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600"
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {!activePartner ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute inset-0 flex flex-col"
              >
                {/* Introduction Section */}
                <div className="p-5 pb-2">
                  <div
                    className={`p-5 rounded-3xl border text-center relative overflow-hidden ${
                      isDark
                        ? "bg-white/[0.03] border-white/10"
                        : "bg-slate-50 border-slate-100 shadow-inner"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-4">
                      <MessageSquare size={24} />
                    </div>
                    <h3
                      className={`text-sm font-black uppercase tracking-tight mb-2 ${isDark ? "text-white" : "text-slate-800"}`}
                    >
                      Select a chat
                    </h3>
                    <p
                      className={`text-[11px] font-bold leading-relaxed mb-4 ${isDark ? "text-white/40" : "text-slate-500"}`}
                    >
                      Choose a user from the list below to start messaging. You
                      can also share images, PDFs, and other documents securely.
                    </p>
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                        isDark
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                          : "bg-white border-slate-200 text-emerald-600 shadow-sm"
                      }`}
                    >
                      <Lock size={10} />
                      Messages are end-to-end encrypted
                    </div>
                  </div>
                </div>

                {/* Search */}
                <div className="px-5 pt-3 pb-2">
                  <div className="relative group">
                    <Search
                      size={14}
                      className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20"
                    />
                    <input
                      type="text"
                      placeholder="Search colleagues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full rounded-2xl pl-11 pr-4 py-3 text-[11.5px] font-bold outline-none border transition-all ${
                        isDark
                          ? "bg-white/[0.03] border-white/[0.04] focus:border-emerald-500/40"
                          : "bg-slate-100 border-slate-100 focus:bg-white focus:border-emerald-500/40"
                      }`}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
                  {isLoadingUsers ? (
                    <div className="flex justify-center py-20 opacity-20">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-20 opacity-20 text-[9px] font-black uppercase tracking-widest">
                      No nodes found
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => selectUser(u)}
                        className={`w-full flex items-center gap-4 p-4 rounded-[26px] mb-1 transition-all group ${
                          isDark
                            ? "hover:bg-white/[0.04]"
                            : "hover:bg-slate-50 border border-transparent hover:border-slate-100"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-[18px] flex items-center justify-center font-black text-xs shrink-0 ${
                            isDark
                              ? "bg-white/5 text-emerald-500"
                              : "bg-slate-100 text-emerald-600"
                          }`}
                        >
                          {(u.full_name || u.username || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p
                            className={`font-black text-[12.5px] truncate ${isDark ? "text-white/80" : "text-slate-800"}`}
                          >
                            {u.full_name || u.username}
                          </p>
                          <p className="text-[8.5px] font-black uppercase tracking-widest opacity-30 mt-0.5">
                            {u.role}
                          </p>
                        </div>
                        {u.unread_count > 0 && (
                          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white">
                            {u.unread_count}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute inset-0 flex flex-col"
              >
                <div
                  ref={setChatContainerRef}
                  className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar"
                >
                  {isLoadingMessages ? (
                    <div className="h-full flex items-center justify-center opacity-10">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const showDateHeader =
                        index === 0 ||
                        getDateLabel(msg.created_at) !==
                          getDateLabel(messages[index - 1].created_at);

                      return (
                        <div
                          key={msg.message_id || `msg-${index}`}
                          className="flex flex-col gap-4"
                        >
                          {showDateHeader && (
                            <div className="flex justify-center my-4">
                              <span
                                className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isDark ? "bg-white/5 text-white/20" : "bg-slate-100 text-slate-400"}`}
                              >
                                {getDateLabel(msg.created_at)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`flex ${msg.is_sender ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] group relative ${msg.is_sender ? "items-end" : "items-start"}`}
                            >
                              <div
                                className={`px-4 py-2.5 rounded-[22px] shadow-sm relative ${
                                  msg.is_sender
                                    ? "bg-emerald-600 text-white rounded-br-none"
                                    : isDark
                                      ? "bg-white/[0.04] text-white rounded-bl-none border border-white/5"
                                      : "bg-slate-100 text-slate-900 rounded-bl-none"
                                }`}
                              >
                                {renderMessageContent(msg)}
                              </div>
                              <div
                                className={`mt-2 flex items-center gap-2 transition-all ${
                                  msg.is_sender
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-30">
                                  {formatTime(msg.created_at)}
                                </span>
                                {msg.is_sender && (
                                  <>
                                    <div className="flex items-center gap-1">
                                      {msg.is_read ? (
                                        <>
                                          <CheckCheck
                                            size={10}
                                            className="text-emerald-500"
                                          />
                                          <span className="text-[7px] font-black uppercase text-emerald-500/60 tracking-tighter">
                                            READ
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <Check
                                            size={10}
                                            className="opacity-30"
                                          />
                                          <span className="text-[7px] font-black uppercase opacity-20 tracking-tighter">
                                            SENT
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <button
                                      onClick={() =>
                                        requestDelete(msg.message_id)
                                      }
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-500 hover:bg-red-500/10 rounded-full ml-1"
                                      title="Delete message"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div
                  className={`p-6 border-t shrink-0 ${isDark ? "bg-black/20 border-white/5" : "bg-white border-slate-100"}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                        isDark
                          ? "bg-white/5 hover:bg-white/10 text-white/20"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-400"
                      }`}
                    >
                      <Paperclip size={18} />
                    </button>

                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && !e.shiftKey && sendMessage()
                        }
                        placeholder="Message..."
                        className={`w-full rounded-[20px] pl-5 pr-12 py-3.5 text-[12.5px] font-bold outline-none border transition-all ${
                          isDark
                            ? "bg-white/[0.03] border border-white/[0.05] text-white focus:bg-white/[0.05] focus:border-emerald-500/40"
                            : "bg-slate-50 border-slate-100 text-slate-900 focus:bg-white focus:border-emerald-500/40"
                        }`}
                      />
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 font-black">
                        <button
                          onClick={sendMessage}
                          disabled={
                            isSending || (!messageText.trim() && !selectedFile)
                          }
                          className={`w-9 h-9 rounded-[14px] flex items-center justify-center transition-all ${
                            isSending || (!messageText.trim() && !selectedFile)
                              ? "opacity-10 grayscale"
                              : "bg-emerald-500 text-black shadow-lg"
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
                  </div>
                  {selectedFile && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 p-3 rounded-2xl flex items-center gap-3 border ${
                        isDark
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                          : "bg-emerald-50 border-emerald-100 text-emerald-600 font-bold shadow-sm"
                      }`}
                    >
                      <FileText size={16} />
                      <span className="text-[10px] font-black truncate flex-1 tracking-tight">
                        {selectedFile.name}
                      </span>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="p-1 hover:bg-emerald-500/20 rounded-full"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Branding Footer */}
        <div
          className={`px-8 py-3 shrink-0 border-t flex items-center gap-3 opacity-20 ${isDark ? "bg-[#050505] border-white/5" : "bg-slate-50 border-slate-100"}`}
        >
          <Sparkles size={10} className="text-emerald-500" />
          <span className="text-[8px] font-black uppercase tracking-[0.4em]">
            Messenger
          </span>
        </div>
      </motion.div>

      {/* Modular File Viewer integration */}
      {viewerConfig && (
        <FileViewer
          isOpen={viewerConfig.isOpen}
          url={viewerConfig.url}
          fileName={viewerConfig.fileName}
          onClose={() => setViewerConfig(null)}
        />
      )}
      {/* Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="absolute inset-0 z-[10020] flex items-center justify-center p-6 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmation(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-[300px] p-6 rounded-3xl shadow-2xl border ${
                isDark
                  ? "bg-[#111] border-white/10"
                  : "bg-white border-slate-100"
              }`}
            >
              <h3
                className={`text-sm font-black uppercase tracking-tight mb-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Delete message?
              </h3>
              <p
                className={`text-[11px] font-bold leading-relaxed mb-6 ${
                  isDark ? "text-white/40" : "text-slate-500"
                }`}
              >
                This action cannot be undone. The message will be removed for
                both you and the recipient.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${
                    isDark
                      ? "bg-white/5 text-white hover:bg-white/10"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatModal;
