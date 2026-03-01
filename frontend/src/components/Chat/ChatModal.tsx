import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";
import { useChatStore } from "../../store/useChatStore";
import type { ChatUser, ChatMessage } from "../../store/useChatStore";
import { API_BASE_URL, authFetch } from "../../config";
import {
  X,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import ChatList from "./ChatList";
import ChatThread from "./ChatThread";
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
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(
    null
  );
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchUsers();
    }
    return () => {
      setActivePartner(null);
      setMessages([]);
      setIsExpanded(false);
    };
  }, [isOpen, user]);

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

  const requestDelete = (messageId: number) => {
    setDeleteConfirmation(messageId);
  };

  const confirmDelete = async () => {
    if (!user || !activePartner || !deleteConfirmation) return;

    const messageId = deleteConfirmation;
    setDeleteConfirmation(null);

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

  const handleClose = () => {
    setIsExpanded(false);
    onClose();
  };

  if (!isOpen) return null;

  // Container styles based on expand state
  const containerClass = isExpanded
    ? "fixed inset-0 z-[10010] pointer-events-auto p-4"
    : "fixed inset-0 z-[10010] flex items-center justify-end p-6 md:p-10 pointer-events-none";

  // Width changes based on whether a chat is active
  const getModalWidth = () => {
    if (isExpanded) return "w-full h-full";
    if (activePartner) return "w-full max-w-[1100px] h-[calc(100vh-80px)]";
    return "w-full max-w-[420px] h-[calc(100vh-80px)]";
  };

  const modalClass = isExpanded
    ? `w-full h-full flex flex-col shadow-2xl pointer-events-auto rounded-2xl overflow-hidden ${
        isDark ? "bg-zinc-900" : "bg-white"
      }`
    : `${getModalWidth()} rounded-[32px] border overflow-hidden flex flex-col shadow-xl pointer-events-auto transition-all duration-300 ${
        isDark ? "bg-zinc-900 border-white/10" : "bg-white border-slate-200"
      }`;

  return (
    <div className={containerClass}>
      {/* Backdrop - only show when not expanded */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/20 pointer-events-auto"
        />
      )}

      <motion.div
        initial={isExpanded ? { opacity: 1 } : { x: 100, opacity: 0 }}
        animate={isExpanded ? { opacity: 1 } : { x: 0, opacity: 1 }}
        exit={isExpanded ? { opacity: 0 } : { x: 100, opacity: 0 }}
        transition={{
          duration: 0.15,
          ease: "easeOut"
        }}
        className={`${modalClass} relative z-10`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div
          className={`px-6 py-4 shrink-0 border-b flex items-center justify-between ${
            isDark
              ? "bg-zinc-900 border-white/10"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
              Messenger
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                isDark
                  ? "bg-white/5 hover:bg-emerald-500/20 text-white/40 hover:text-emerald-500"
                  : "bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
              }`}
              title={isExpanded ? "Exit fullscreen" : "Expand fullscreen"}
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              onClick={handleClose}
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

        {/* Main Content - Split Panel */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Panel - Chat List */}
          <div
            className={`shrink-0 h-full ${
              activePartner
                ? isExpanded
                  ? "w-80"
                  : "w-72"
                : isExpanded
                  ? "w-96"
                  : "w-full"
            } transition-all duration-300`}
          >
            <ChatList
              users={users}
              activePartner={activePartner}
              isLoading={isLoadingUsers}
              isDark={isDark}
              onSelectUser={selectUser}
            />
          </div>

          {/* Right Panel - Active Chat Thread */}
          <AnimatePresence mode="wait">
            {activePartner && (
              <motion.div
                key={activePartner.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex-1 overflow-hidden"
              >
                <ChatThread
                  activePartner={activePartner}
                  messages={messages}
                  messageText={messageText}
                  selectedFile={selectedFile}
                  isLoadingMessages={isLoadingMessages}
                  isSending={isSending}
                  isDark={isDark}
                  refreshCooldown={refreshCooldown}
                  onMessageTextChange={setMessageText}
                  onFileSelect={setSelectedFile}
                  onSendMessage={sendMessage}
                  onRefresh={handleManualRefresh}
                  onDeleteRequest={requestDelete}
                  onFileView={(url, fileName) =>
                    setViewerConfig({ isOpen: true, url, fileName })
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State for No Chat Selected - only show when expanded */}
          {!activePartner && isExpanded && (
            <div
              className={`flex-1 flex items-center justify-center border-l ${
                isDark ? "border-white/5" : "border-slate-100"
              }`}
            >
              <div className="text-center px-8 max-w-md">
                <div
                  className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center ${
                    isDark
                      ? "bg-emerald-500/10"
                      : "bg-emerald-50 border border-emerald-100"
                  }`}
                >
                  <Sparkles size={32} className="text-emerald-500" />
                </div>
                <h3
                  className={`text-lg font-black uppercase tracking-tight mb-3 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Welcome to Messenger
                </h3>
                <p
                  className={`text-[12px] font-bold leading-relaxed ${
                    isDark ? "text-white/40" : "text-slate-500"
                  }`}
                >
                  Select a colleague from the list to start a secure,
                  end-to-end encrypted conversation. Share messages, images, and
                  documents seamlessly.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* File Viewer Modal */}
      {viewerConfig && (
        <FileViewer
          isOpen={viewerConfig.isOpen}
          url={viewerConfig.url}
          fileName={viewerConfig.fileName}
          onClose={() => setViewerConfig(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
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
