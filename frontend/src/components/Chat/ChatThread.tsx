import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Loader2,
  CheckCheck,
  Check,
  Paperclip,
  FileText,
  ShieldCheck,
  Download,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import type { ChatUser, ChatMessage } from "../../store/useChatStore";
import { API_BASE_URL } from "../../config";

interface ChatThreadProps {
  activePartner: ChatUser;
  messages: ChatMessage[];
  messageText: string;
  selectedFile: File | null;
  isLoadingMessages: boolean;
  isSending: boolean;
  isDark: boolean;
  refreshCooldown: number;
  onMessageTextChange: (text: string) => void;
  onFileSelect: (file: File | null) => void;
  onSendMessage: () => void;
  onRefresh: () => void;
  onDeleteRequest: (messageId: number) => void;
  onFileView: (url: string, fileName: string) => void;
}

const ChatThread = ({
  activePartner,
  messages,
  messageText,
  selectedFile,
  isLoadingMessages,
  isSending,
  isDark,
  refreshCooldown,
  onMessageTextChange,
  onFileSelect,
  onSendMessage,
  onRefresh,
  onDeleteRequest,
  onFileView,
}: ChatThreadProps) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      }
    },
    [messages]
  );

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
    }
  }, [messages, activePartner]);

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleTimeString("en-IN", {
        hour: "numeric",
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
              onFileView(imageUrl, text.split("/").pop() || "Image")
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
              onFileView(fileUrl, text.split("/").pop() || "Document")
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
          <p className="text-[13px] font-medium leading-relaxed tracking-normal">
            {text}
          </p>
        );
    }
  };

  // Group consecutive messages from the same sender
  const groupedMessages = messages.reduce((groups: any[], msg, index) => {
    if (index === 0 || messages[index - 1].is_sender !== msg.is_sender) {
      groups.push([msg]);
    } else {
      groups[groups.length - 1].push(msg);
    }
    return groups;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className={`px-6 py-5 shrink-0 border-b flex items-center justify-between ${
          isDark
            ? "bg-zinc-900 border-white/10"
            : "bg-white border-slate-200"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-11 h-11 rounded-[18px] flex items-center justify-center font-black text-sm shrink-0 ${
              isDark
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {(activePartner.full_name || activePartner.username || "?")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div>
            <h2
              className={`text-[15px] font-black tracking-tight leading-none uppercase ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {activePartner.full_name || activePartner.username}
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5 opacity-30 text-[8px] font-black uppercase tracking-[0.2em]">
              <ShieldCheck size={10} className="text-emerald-500" />
              <span>{activePartner.role || "Staff"}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onRefresh}
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
            className={isLoadingMessages && !refreshCooldown ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={setChatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {isLoadingMessages && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-10">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-20">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest mb-2">
                No messages yet
              </p>
              <p className="text-[9px] font-bold opacity-60">
                Start the conversation
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedMessages.map((group, groupIndex) => {
              const firstMsg = group[0];
              const showDateHeader =
                groupIndex === 0 ||
                getDateLabel(firstMsg.created_at) !==
                  getDateLabel(groupedMessages[groupIndex - 1][0].created_at);

              return (
                <div key={`group-${groupIndex}`} className="flex flex-col">
                  {showDateHeader && (
                    <div className="flex justify-center mb-6">
                      <span
                        className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          isDark
                            ? "bg-white/5 text-white/30"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {getDateLabel(firstMsg.created_at)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex flex-col gap-4 ${
                    firstMsg.is_sender ? "items-end" : "items-start"
                  }`}
                >
                  {group.map((msg: ChatMessage, msgIndex: number) => (
                    <div
                      key={msg.message_id || `msg-${groupIndex}-${msgIndex}`}
                      className={`max-w-[85%] group relative ${
                        msg.is_sender ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`px-5 py-3 rounded-[22px] shadow-sm relative ${
                          msg.is_sender
                            ? msgIndex === group.length - 1
                              ? "bg-emerald-600 text-white rounded-br-md"
                              : "bg-emerald-600 text-white"
                            : isDark
                              ? msgIndex === group.length - 1
                                ? "bg-white/[0.06] text-white rounded-bl-md border border-white/5"
                                : "bg-white/[0.06] text-white border border-white/5"
                              : msgIndex === group.length - 1
                                ? "bg-slate-100 text-slate-900 rounded-bl-md"
                                : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        {renderMessageContent(msg)}
                      </div>

                      <div
                        className={`mt-2 flex items-center gap-2 transition-all ${
                          msg.is_sender ? "justify-end" : "justify-start"
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
                                  <Check size={10} className="opacity-30" />
                                  <span className="text-[7px] font-black uppercase opacity-20 tracking-tighter">
                                    SENT
                                  </span>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => onDeleteRequest(msg.message_id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-500 hover:bg-red-500/10 rounded-full ml-1"
                              title="Delete message"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div
        className={`px-6 py-4 shrink-0 border-t ${
          isDark ? "bg-zinc-900 border-white/10" : "bg-white border-slate-200"
        }`}
      >
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileSelect(file);
              }}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 text-white/40 hover:text-emerald-500"
                  : "bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
              } ${isSending ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              <Paperclip size={18} />
            </button>

            <input
              type="text"
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => onMessageTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              disabled={isSending}
              className={`flex-1 rounded-2xl px-5 py-3 text-[12px] font-bold outline-none border transition-all ${
                isDark
                  ? "bg-white/[0.03] border-white/[0.04] focus:border-emerald-500/40 text-white placeholder:text-white/20"
                  : "bg-white border-slate-200 focus:border-emerald-500/40 text-slate-900 placeholder:text-slate-400"
              }`}
            />

            <button
              onClick={onSendMessage}
              disabled={isSending || (!messageText.trim() && !selectedFile)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                isSending || (!messageText.trim() && !selectedFile)
                  ? "opacity-10 grayscale bg-emerald-500"
                  : "bg-emerald-500 text-black shadow-lg hover:bg-emerald-400"
              }`}
            >
              {isSending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>

          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-2xl flex items-center gap-3 border ${
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
                onClick={() => onFileSelect(null)}
                className="p-1 hover:bg-emerald-500/20 rounded-full"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatThread;
