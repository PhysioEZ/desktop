import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/useAuthStore';
import { API_BASE_URL, authFetch } from '../../config';
import { 
    X, Send, RefreshCw, Search, Lock, MessageCircle, 
    Loader2, CheckCheck, Clock, Paperclip, FileText, Download
} from 'lucide-react';

interface ChatUser {
    id: number;
    username: string;
    full_name: string;
    role: string;
    unread_count: number;
}

interface ChatMessage {
    message_id: number;
    sender_employee_id: number;
    message_type: string;
    message_text: string;
    created_at: string;
    is_read: number;
    is_sender: boolean;
}

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatModal = ({ isOpen, onClose }: ChatModalProps) => {
    const { user } = useAuthStore();
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [activePartner, setActivePartner] = useState<ChatUser | null>(null);
    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch users when modal opens
    useEffect(() => {
        if (isOpen && user?.branch_id && user?.employee_id) {
            fetchUsers();
            startPolling();
        }
        return () => stopPolling();
    }, [isOpen, user?.branch_id, user?.employee_id]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const startPolling = () => {
        if (!pollingRef.current) {
            pollingRef.current = setInterval(() => {
                if (activePartner) {
                    fetchMessages(activePartner.id, true);
                }
            }, 5000);
        }
    };

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    const fetchUsers = async () => {
        if (!user?.branch_id || !user?.employee_id) return;
        setIsLoadingUsers(true);
        try {
            const res = await authFetch(
                `${API_BASE_URL}/reception/chat.php?action=users&branch_id=${user.branch_id}&employee_id=${user.employee_id}`
            );
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (e) {
            console.error('Failed to fetch users:', e);
            setError('Could not load user list');
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const fetchMessages = async (partnerId: number, silent = false) => {
        if (!user?.employee_id) return;
        if (!silent) setIsLoadingMessages(true);
        try {
            const res = await authFetch(
                `${API_BASE_URL}/reception/chat.php?action=fetch&employee_id=${user.employee_id}&partner_id=${partnerId}`
            );
            const data = await res.json();
            if (data.success) {
                setMessages(data.messages);
                setUsers(prev => prev.map(u => 
                    u.id === partnerId ? { ...u, unread_count: 0 } : u
                ));
            }
        } catch (e) {
            console.error('Failed to fetch messages:', e);
            if (!silent) {
                setError('Could not load messages');
                setTimeout(() => setError(null), 3000);
            }
        } finally {
            if (!silent) setIsLoadingMessages(false);
        }
    };

    const sendMessage = async () => {
        if ((!messageText.trim() && !selectedFile) || !activePartner || !user?.employee_id) return;
        
        setIsSending(true);
        try {
            let res;
            if (activePartner && user) {
                if (selectedFile) {
                    // Use FormData for file upload
                    const formData = new FormData();
                    formData.append('sender_id', String(user.employee_id));
                    formData.append('receiver_id', String(activePartner.id));
                    formData.append('message_text', messageText);
                    formData.append('branch_id', String(user.branch_id));
                    formData.append('sender_name', user.name);
                    formData.append('chat_file', selectedFile);

                    res = await authFetch(`${API_BASE_URL}/reception/chat.php?action=send`, {
                        method: 'POST',
                        body: formData
                    });
                } else {
                    // Use JSON for text only
                    res = await authFetch(`${API_BASE_URL}/reception/chat.php?action=send`, {
                        method: 'POST',
                        body: JSON.stringify({
                            sender_id: user.employee_id,
                            receiver_id: activePartner.id,
                            message_text: messageText,
                            branch_id: user.branch_id,
                            sender_name: user.name
                        })
                    });
                }

                const data = await res.json();
                if (data.success) {
                    setMessageText('');
                    setSelectedFile(null);
                    fetchMessages(activePartner.id);
                    inputRef.current?.focus();
                } else {
                    setError(data.message || 'Failed to send message');
                    setTimeout(() => setError(null), 3000);
                }
            }
        } catch (e) {
            console.error('Failed to send message:', e);
        } finally {
            setIsSending(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Pre-fill the input with filename if it's currently empty or just placeholder
            if (!messageText.trim()) {
                setMessageText(`File: ${file.name}`);
            }
            e.target.value = ''; // Reset input to allow re-selecting same file
        }
    };

    const selectUser = (selectedUser: ChatUser) => {
        setActivePartner(selectedUser);
        setMessages([]);
        fetchMessages(selectedUser.id);
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getFileName = (path: string) => {
        return path.split('/').pop() || 'file';
    };

    const renderMessageContent = (msg: ChatMessage) => {
        // Derive the server origin from API_BASE_URL (e.g., http://localhost)
        const serverOrigin = API_BASE_URL.split('/admin')[0];
        
        switch (msg.message_type) {
            case 'image':
                return (
                    <img 
                        src={`${serverOrigin}/${msg.message_text}`}
                        alt="Shared image"
                        className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setImagePreview(`${serverOrigin}/${msg.message_text}`)}
                        onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://placehold.co/600x400?text=Image+Not+Found';
                        }}
                    />
                );
            case 'pdf':
                return (
                    <a 
                        href={`${serverOrigin}/${msg.message_text}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 p-3 rounded-xl ${
                            msg.is_sender 
                                ? 'bg-[#00390a] hover:bg-[#005313] text-[#ccebc4]' 
                                : 'bg-[#e0e2ec] dark:bg-[#43474e] hover:bg-[#d2d5db] dark:hover:bg-[#50545c] text-[#1a1c1e] dark:text-[#c4c7c5]'
                        } transition-colors`}
                    >
                        <FileText className="w-8 h-8 text-[#b3261e] dark:text-[#ffb4ab]" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{getFileName(msg.message_text)}</p>
                            <p className="text-xs opacity-70">PDF Document</p>
                        </div>
                        <Download className="w-4 h-4 opacity-70" />
                    </a>
                );
            case 'doc':
                return (
                    <a 
                        href={`${serverOrigin}/${msg.message_text}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 p-3 rounded-xl ${
                            msg.is_sender 
                                ? 'bg-[#00390a] hover:bg-[#005313] text-[#ccebc4]' 
                                : 'bg-[#e0e2ec] dark:bg-[#43474e] hover:bg-[#d2d5db] dark:hover:bg-[#50545c] text-[#1a1c1e] dark:text-[#c4c7c5]'
                        } transition-colors`}
                    >
                        <FileText className="w-8 h-8 text-[#00639b] dark:text-[#7fcfff]" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{getFileName(msg.message_text)}</p>
                            <p className="text-xs opacity-70">Document</p>
                        </div>
                        <Download className="w-4 h-4 opacity-70" />
                    </a>
                );
            default:
                return <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>;
        }
    };

    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-end justify-end p-4 md:p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div 
                    className="w-full max-w-4xl h-[85vh] bg-[#fdfcff] dark:bg-[#1a1c1e] rounded-[28px] shadow-2xl overflow-hidden flex font-sans"
                    initial={{ opacity: 0, y: 100, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 100, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                    {/* Sidebar - User List */}
                    <div className="w-80 border-r border-[#e0e2ec] dark:border-[#43474e] flex flex-col bg-[#f0f2f5] dark:bg-[#1a1c1e]">
                        {/* Sidebar Header */}
                        <div className="p-4 border-b border-[#e0e2ec] dark:border-[#43474e] flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#43474e] dark:text-[#c4c7c5]" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-[#e0e2ec] dark:bg-[#43474e]/50 border-0 rounded-full text-sm text-[#1a1c1e] dark:text-[#e3e2e6] focus:outline-none focus:ring-2 focus:ring-[#006e1c] dark:focus:ring-[#88d99d] placeholder:text-[#43474e]/50"
                                />
                            </div>
                            <button 
                                onClick={fetchUsers}
                                disabled={isLoadingUsers}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                            </button>
                            <button 
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* User List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {isLoadingUsers ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#006e1c]" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-8 text-[#43474e] dark:text-[#c4c7c5] text-sm">
                                    No users found
                                </div>
                            ) : (
                                filteredUsers.map(chatUser => (
                                    <motion.div
                                        key={chatUser.id}
                                        onClick={() => selectUser(chatUser)}
                                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors mx-2 ${
                                            activePartner?.id === chatUser.id 
                                                ? 'bg-[#ccebc4] dark:bg-[#0c3b10] text-[#001e2f] dark:text-[#ccebc4]' 
                                                : 'hover:bg-[#e0e2ec]/50 dark:hover:bg-[#43474e]/30'
                                        }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                            activePartner?.id === chatUser.id 
                                            ? 'bg-[#006e1c] text-white' 
                                            : 'bg-[#e0e2ec] dark:bg-[#43474e] text-[#1a1c1e] dark:text-[#c4c7c5]'
                                        }`}>
                                            {(chatUser.full_name || chatUser.username).charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-semibold text-sm truncate ${activePartner?.id === chatUser.id ? 'text-[#001d36] dark:text-[#ccebc4]' : 'text-[#1a1c1e] dark:text-[#e3e2e6]'}`}>
                                                {chatUser.full_name || chatUser.username}
                                            </p>
                                            <p className={`text-xs truncate ${activePartner?.id === chatUser.id ? 'text-[#001d36]/70 dark:text-[#ccebc4]/70' : 'text-[#43474e] dark:text-[#c4c7c5]'}`}>
                                                {chatUser.role}
                                            </p>
                                        </div>
                                        {chatUser.unread_count > 0 && (
                                            <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-[#b3261e] rounded-full">
                                                {chatUser.unread_count}
                                            </span>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {activePartner ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-[#e0e2ec] dark:border-[#43474e] flex items-center gap-3 bg-[#fdfcff] dark:bg-[#1a1c1e]">
                                    <div className="w-10 h-10 rounded-full bg-[#e0e2ec] dark:bg-[#43474e] flex items-center justify-center text-[#1a1c1e] dark:text-[#e3e2e6] font-bold">
                                        {(activePartner.full_name || activePartner.username).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-[#1a1c1e] dark:text-[#e3e2e6]">
                                            {activePartner.full_name || activePartner.username}
                                        </h3>
                                        <p className="text-xs text-[#43474e] dark:text-[#c4c7c5] flex items-center gap-1">
                                            <Lock className="w-3 h-3" />
                                            End-to-end encrypted
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => fetchMessages(activePartner.id)}
                                        className="p-2 rounded-full hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] text-[#43474e] dark:text-[#c4c7c5]"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isLoadingMessages ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fdfcff] dark:bg-[#1a1c1e]">
                                    {isLoadingMessages ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#006e1c]" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-[#43474e] dark:text-[#c4c7c5]">
                                            <MessageCircle className="w-12 h-12 mb-2 opacity-30" />
                                            <p className="text-sm">No messages yet</p>
                                            <p className="text-xs">Start the conversation!</p>
                                        </div>
                                    ) : (
                                        messages.map(msg => (
                                            <div 
                                                key={msg.message_id}
                                                className={`flex ${msg.is_sender ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[70%] px-4 py-2 rounded-[20px] ${
                                                    msg.is_sender 
                                                        ? 'bg-[#006e1c] text-white rounded-br-none' 
                                                        : 'bg-[#e0e2ec] dark:bg-[#30333b] text-[#1a1c1e] dark:text-[#e3e2e6] rounded-bl-none'
                                                }`}>
                                                    {renderMessageContent(msg)}
                                                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                                        msg.is_sender ? 'text-[#ccebc4]' : 'text-[#43474e] dark:text-[#c4c7c5]'
                                                    }`}>
                                                        <Clock className="w-2.5 h-2.5" />
                                                        {formatTime(msg.created_at)}
                                                        {msg.is_sender && (
                                                            <CheckCheck className={`w-3 h-3 ${msg.is_read ? 'text-[#ccebc4]' : ''}`} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t border-[#e0e2ec] dark:border-[#43474e] bg-[#fdfcff] dark:bg-[#1a1c1e]">
                                    {selectedFile && (
                                        <div className="mb-3 flex items-center gap-2 bg-[#ccebc4]/30 p-2 rounded-xl border border-[#ccebc4] animate-in slide-in-from-bottom-2">
                                            <Paperclip className="w-4 h-4 text-[#006e1c]" />
                                            <span className="text-xs font-medium text-[#006e1c] truncate flex-1">
                                                {selectedFile.name}
                                            </span>
                                            <button 
                                                onClick={() => setSelectedFile(null)}
                                                className="p-1 hover:bg-[#ccebc4] rounded-full text-[#006e1c]"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isSending}
                                            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#e0e2ec] dark:hover:bg-[#43474e] text-[#43474e] dark:text-[#c4c7c5] disabled:opacity-50 transition-colors"
                                            title="Attach File"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                            placeholder="Type your message..."
                                            className="flex-1 px-5 py-3 bg-[#e0e2ec] dark:bg-[#43474e]/30 border-0 rounded-full text-sm text-[#1a1c1e] dark:text-[#e3e2e6] focus:outline-none focus:ring-2 focus:ring-[#006e1c] dark:focus:ring-[#88d99d] transition-all font-medium placeholder:text-[#43474e]/50"
                                        />
                                        <motion.button
                                            onClick={sendMessage}
                                            disabled={isSending || (!messageText.trim() && !selectedFile)}
                                            className="w-11 h-11 flex items-center justify-center rounded-full bg-[#006e1c] text-white hover:bg-[#005313] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            title="Send Message"
                                        >
                                            {isSending ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Send className="w-5 h-5" />
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Welcome Screen */
                            <div className="flex-1 flex flex-col items-center justify-center text-[#43474e] dark:text-[#c4c7c5] p-8 bg-[#fdfcff] dark:bg-[#1a1c1e]">
                                <div className="w-20 h-20 rounded-full bg-[#e0e2ec] dark:bg-[#43474e] flex items-center justify-center mb-4">
                                    <MessageCircle className="w-10 h-10 text-[#006e1c] dark:text-[#88d99d]" />
                                </div>
                                <h3 className="text-lg font-semibold text-[#1a1c1e] dark:text-[#e3e2e6] mb-2">
                                    Select a chat
                                </h3>
                                <p className="text-sm text-center max-w-xs">
                                    Choose a user from the list to start messaging securely.
                                </p>
                                <div className="flex items-center gap-1 mt-4 text-xs opacity-70">
                                    <Lock className="w-3 h-3" />
                                    Messages are end-to-end encrypted
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Image Preview Modal */}
                <AnimatePresence>
                    {imagePreview && (
                        <motion.div
                            className="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setImagePreview(null)}
                        >
                            <button
                                onClick={() => setImagePreview(null)}
                                className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
                            >
                                ×
                            </button>
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toast Notification */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            className="fixed bottom-24 right-8 z-[10001] bg-[#b3261e] text-white px-6 py-3 rounded-[20px] shadow-2xl flex items-center gap-3"
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        >
                            <X className="w-5 h-5 cursor-pointer" onClick={() => setError(null)} />
                            <span className="text-sm font-medium">{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
};

export default ChatModal;
