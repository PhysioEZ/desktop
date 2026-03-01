import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import type { ChatUser } from "../../store/useChatStore";

interface ChatListProps {
  users: ChatUser[];
  activePartner: ChatUser | null;
  isLoading: boolean;
  isDark: boolean;
  onSelectUser: (user: ChatUser) => void;
}

const ChatList = ({
  users,
  activePartner,
  isLoading,
  isDark,
  onSelectUser,
}: ChatListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter((u) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (u.full_name || "").toLowerCase().includes(searchLower) ||
      (u.username || "").toLowerCase().includes(searchLower) ||
      (u.role || "").toLowerCase().includes(searchLower)
    );
  });

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    if (messageDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
    if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString("en-IN", { weekday: "short" });
    }
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="flex flex-col h-full border-r">
      {/* Header */}
      <div
        className={`px-5 py-5 shrink-0 border-b ${
          isDark
            ? "bg-zinc-900 border-white/10"
            : "bg-white border-slate-200"
        }`}
      >
        <h2
          className={`text-[15px] font-black tracking-tight leading-none uppercase mb-4 ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          Messenger
        </h2>
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
                ? "bg-white/[0.03] border-white/10 focus:border-emerald-500/40 text-white placeholder:text-white/30"
                : "bg-white border-slate-200 focus:border-emerald-500/40 text-slate-900 placeholder:text-slate-400"
            }`}
          />
        </div>
      </div>

      {/* User List */}
      <div
        className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex justify-center py-20 opacity-20">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 opacity-20 text-[9px] font-black uppercase tracking-widest">
            No users found
          </div>
        ) : (
          filteredUsers.map((u, index) => {
            const isActive = activePartner?.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => onSelectUser(u)}
                className={`w-full flex items-start gap-3 p-3 rounded-2xl mb-1 transition-all group relative ${
                  index === 0 ? "mt-3" : ""
                } ${
                  isActive
                    ? isDark
                      ? "bg-emerald-500/10 border border-emerald-500/20"
                      : "bg-emerald-50 border border-emerald-100"
                    : isDark
                      ? "hover:bg-white/[0.04] border border-transparent"
                      : "hover:bg-slate-50 border border-transparent hover:border-slate-100"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-sm shrink-0 ${
                    isActive
                      ? "bg-emerald-500 text-white"
                      : isDark
                        ? "bg-white/5 text-emerald-500"
                        : "bg-slate-100 text-emerald-600"
                  }`}
                >
                  {(u.full_name || u.username || "?").charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="text-left flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p
                      className={`font-black text-[13px] truncate ${
                        isActive
                          ? isDark
                            ? "text-emerald-400"
                            : "text-emerald-700"
                          : isDark
                            ? "text-white/90"
                            : "text-slate-800"
                      }`}
                    >
                      {u.full_name || u.username}
                    </p>
                    {u.last_message_time && (
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider shrink-0 ${
                          isActive
                            ? "text-emerald-600/60"
                            : isDark
                              ? "text-white/30"
                              : "text-slate-400"
                        }`}
                      >
                        {formatTimestamp(u.last_message_time)}
                      </span>
                    )}
                  </div>

                  {/* Last Message Preview */}
                  {u.last_message && (
                    <p
                      className={`text-[11px] font-bold truncate leading-tight ${
                        isActive
                          ? isDark
                            ? "text-emerald-500/60"
                            : "text-emerald-600/70"
                          : u.unread_count > 0
                            ? isDark
                              ? "text-white/70"
                              : "text-slate-700"
                            : isDark
                              ? "text-white/40"
                              : "text-slate-500"
                      }`}
                    >
                      {u.is_sender && (
                        <span className="opacity-70 mr-1">You: </span>
                      )}
                      {u.last_message}
                    </p>
                  )}

                  {/* Role Badge */}
                  {!u.last_message && (
                    <p className="text-[8.5px] font-black uppercase tracking-widest opacity-30 mt-0.5">
                      {u.role}
                    </p>
                  )}
                </div>

                {/* Unread Badge */}
                {u.unread_count > 0 && (
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 shadow-lg">
                    {u.unread_count > 9 ? "9+" : u.unread_count}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
