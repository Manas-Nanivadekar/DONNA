"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChatInput } from "./chat-input";
import { useChat } from "@/hooks/use-chat";
import { useIdentity } from "@/hooks/use-identity";
import { IdentityModal } from "@/components/ui/identity-modal";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
    caseId: string;
    initialInput?: string;
    onInputChange?: (value: string) => void;
}

export function ChatInterface({ caseId, initialInput, onInputChange }: ChatInterfaceProps) {
    const { identity } = useIdentity();
    const { messages, sendMessage, isLoading, error, loadingSession } = useChat({
        caseId,
        userId: identity?.user_id
    });
    const [showIdentityModal, setShowIdentityModal] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (content: string) => {
        // Enforce identity check - user must be registered before sending
        if (!identity || !identity.user_id || !identity.email || !identity.name) {
            setShowIdentityModal(true);
            return;
        }
        sendMessage(content);
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
                {loadingSession ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                        <p>Loading session...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                        <h3 className="mb-2 text-lg font-semibold">Welcome!</h3>
                        <p>Ask DONNA anything about this case study.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex w-full",
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "max-w-[80%] rounded-lg px-4 py-2",
                                        msg.role === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-foreground"
                                    )}
                                >
                                    {msg.role === "assistant" ? (
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                                    <div className="flex gap-1">
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/50" style={{ animationDelay: "0ms" }} />
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/50" style={{ animationDelay: "150ms" }} />
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/50" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="flex justify-center">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ChatInput
                onSend={handleSend}
                disabled={isLoading}
                value={initialInput}
                onChange={onInputChange}
            />

            <IdentityModal open={showIdentityModal} onOpenChange={setShowIdentityModal} />
        </div>
    );
}
