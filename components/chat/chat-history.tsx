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
            try {
                const response = await fetchChatHistory(userId, caseId, 10);
                if (response.success) {
                    setSessions(response.sessions);
                }
            } catch (err) {
                console.error("Failed to load chat history:", err);
                setError("Failed to load history");
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            loadHistory();
        }
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
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <History className="h-4 w-4" />
                    <span>Chat History</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNewChat}
                    className="h-8"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    New
                </Button>
            </div>

            {loading ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                    Loading...
                </div>
            ) : error ? (
                <div className="text-sm text-destructive text-center py-4">
                    {error}
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                    No previous chats
                </div>
            ) : (
                <div className="space-y-2">
                    {sessions.map((session) => (
                        <button
                            key={session.session_id}
                            onClick={() => onLoadSession(session.session_id)}
                            className={cn(
                                "w-full text-left p-3 rounded-lg border transition-colors",
                                session.session_id === currentSessionId
                                    ? "bg-primary/10 border-primary"
                                    : "bg-background border-border hover:bg-accent"
                            )}
                        >
                            <div className="text-sm font-medium truncate">
                                {getFirstUserMessage(session)}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-muted-foreground">
                                    {session.messages.length} messages
                                </span>
                                <span className="text-xs text-muted-foreground">
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
