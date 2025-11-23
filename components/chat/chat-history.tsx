"use client";

import { useEffect, useState } from "react";
import { History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchChatHistory, ChatSession } from "@/lib/chat-api";
import { cn } from "@/lib/utils";

interface ChatHistoryProps {
    userId: string;
    caseId: string;
    currentSessionId: string | null;
    onLoadSession: (sessionId: string) => void;
    onNewChat: () => void;
    className?: string;
}

export function ChatHistory({
    userId,
    caseId,
    currentSessionId,
    onLoadSession,
    onNewChat,
    className
}: ChatHistoryProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadHistory = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                console.log("Fetching chat history for user:", userId, "case:", caseId);
                const response = await fetchChatHistory(userId, caseId, 10);
                console.log("Chat history response:", response);

                if (response.success) {
                    setSessions(response.sessions || []);
                } else {
                    setError("Failed to load history");
                }
            } catch (err) {
                console.error("Failed to load chat history:", err);
                setError("Failed to load history");
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [userId, caseId]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString();
    };

    const getFirstUserMessage = (session: ChatSession) => {
        const firstMsg = session.messages.find(m => m.role === "user");
        return firstMsg ? firstMsg.content.substring(0, 60) + (firstMsg.content.length > 60 ? "..." : "") : "New conversation";
    };

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <History className="h-4 w-4 text-blue-400" />
                    <span>Chat History</span>
                </div>
                <button
                    onClick={onNewChat}
                    className="flex h-8 items-center gap-1 rounded-lg px-3 text-sm font-medium text-white/80 transition-all hover:bg-white/5"
                >
                    <Plus className="h-4 w-4" />
                    New
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "300ms" }} />
                    </div>
                </div>
            ) : error ? (
                <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4 text-center backdrop-blur-sm">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            ) : sessions.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4 text-center backdrop-blur-sm">
                    <p className="text-sm text-white/60">No previous chats</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {sessions.map((session) => (
                        <button
                            key={session.session_id}
                            onClick={() => onLoadSession(session.session_id)}
                            className={cn(
                                "w-full text-left p-3 rounded-lg border transition-all backdrop-blur-sm",
                                session.session_id === currentSessionId
                                    ? "bg-blue-500/20 border-blue-500/30"
                                    : "bg-neutral-900/50 border-white/10 hover:border-white/20 hover:bg-neutral-900"
                            )}
                        >
                            <div className="text-sm font-medium truncate text-white/90">
                                {getFirstUserMessage(session)}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-white/50">
                                    {session.messages.length} messages
                                </span>
                                <span className="text-xs text-white/50">
                                    {formatDate(session.updated_at)}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
