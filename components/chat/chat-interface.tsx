"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ChatInput } from "./chat-input";
import { useChat } from "@/hooks/use-chat";
import { useIdentity } from "@/hooks/use-identity";
import { IdentityModal } from "@/components/ui/identity-modal";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { User } from "lucide-react";

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
        <div className="flex h-full flex-col overflow-hidden bg-black">
            <div className="flex-1 overflow-y-auto px-4 py-8 scrollbar-hide" ref={scrollRef}>
                {loadingSession ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="flex gap-1">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "0ms" }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "150ms" }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "300ms" }} />
                        </div>
                        <p className="mt-4 text-sm text-white/60">Loading session...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center max-w-2xl mx-auto">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl" />
                            {/* <Sparkles className="h-16 w-16 text-white relative z-10" /> */}
                            <svg
                                width="40"
                                height="40"
                                viewBox="0 0 40 40"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-white"
                            >
                                {/* Square */}
                                <rect x="0" y="8" width="20" height="20" fill="currentColor" />
                                {/* Triangle */}
                                <path d="M22 8 L40 8 L22 26 Z" fill="currentColor" />
                                {/* Circle */}
                                <circle cx="30" cy="30" r="10" fill="currentColor" />
                            </svg>
                        </div>
                        <h3 className="mb-3 text-2xl font-bold text-white">Welcome to DONNA</h3>
                        <p className="text-white/60 mb-8">Ask me anything about this case study. I&apos;ll provide insights based on the team&apos;s history.</p>
                        <div className="grid gap-3 w-full max-w-md">
                            {["What went wrong?", "What patterns should I watch for?", "What did the team learn?"].map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSend(prompt)}
                                    className="rounded-lg border border-white/10 bg-neutral-900/50 px-4 py-3 text-left text-sm text-white/80 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-neutral-900"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto max-w-3xl space-y-8">
                        {messages.map((msg, idx) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500",
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                )}
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                {msg.role === "assistant" && (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                                        <svg
                                            width="40"
                                            height="40"
                                            viewBox="0 0 40 40"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="text-white"
                                        >
                                            {/* Square */}
                                            <rect x="0" y="8" width="20" height="20" fill="currentColor" />
                                            {/* Triangle */}
                                            <path d="M22 8 L40 8 L22 26 Z" fill="currentColor" />
                                            {/* Circle */}
                                            <circle cx="30" cy="30" r="10" fill="currentColor" />
                                        </svg>
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "rounded-2xl px-5 py-4 max-w-[85%]",
                                        msg.role === "user"
                                            ? "bg-blue-500/20 text-blue-100 backdrop-blur-sm border border-blue-500/30"
                                            : "bg-neutral-900/50 text-white backdrop-blur-sm border border-white/10"
                                    )}
                                >
                                    {msg.role === "assistant" ? (
                                        <div className="prose prose-sm prose-invert max-w-none">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ children }) => <p className="mb-4 last:mb-0 text-white/90">{children}</p>,
                                                    ul: ({ children }) => <ul className="mb-4 list-disc pl-5 space-y-2 text-white/90">{children}</ul>,
                                                    ol: ({ children }) => <ol className="mb-4 list-decimal pl-5 space-y-2 text-white/90">{children}</ol>,
                                                    li: ({ children }) => <li className="text-white/90">{children}</li>,
                                                    h1: ({ children }) => <h1 className="mb-4 text-2xl font-bold text-white">{children}</h1>,
                                                    h2: ({ children }) => <h2 className="mb-3 text-xl font-bold text-white">{children}</h2>,
                                                    h3: ({ children }) => <h3 className="mb-2 text-lg font-semibold text-white">{children}</h3>,
                                                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                                                    code: ({ children }) => <code className="rounded bg-black/50 px-1.5 py-0.5 font-mono text-xs text-blue-300">{children}</code>,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                    )}
                                </div>
                                {msg.role === "user" && (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 backdrop-blur-sm ring-1 ring-blue-500/30">
                                        <User className="h-4 w-4 text-blue-300" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                                    <svg
                                        width="40"
                                        height="40"
                                        viewBox="0 0 40 40"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="text-white"
                                    >
                                        {/* Square */}
                                        <rect x="0" y="8" width="20" height="20" fill="currentColor" />
                                        {/* Triangle */}
                                        <path d="M22 8 L40 8 L22 26 Z" fill="currentColor" />
                                        {/* Circle */}
                                        <circle cx="30" cy="30" r="10" fill="currentColor" />
                                    </svg>
                                </div>
                                <div className="rounded-2xl bg-neutral-900/50 px-5 py-4 backdrop-blur-sm border border-white/10">
                                    <div className="flex gap-1">
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "0ms" }} />
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "150ms" }} />
                                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="flex justify-center">
                                <p className="rounded-lg bg-red-950/30 px-4 py-2 text-sm text-red-200 border border-red-900/50 backdrop-blur-md">{error}</p>
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
