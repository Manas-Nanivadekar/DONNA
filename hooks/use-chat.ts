"use client";

import { useState, useCallback, useEffect } from "react";
import { getSession, setSession, clearSession } from "@/lib/session-storage";
import { fetchSessionMessages } from "@/lib/chat-api";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
}

interface UseChatProps {
    caseId: string;
    userId?: string;
}

export function useChat({ caseId, userId }: UseChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loadingSession, setLoadingSession] = useState(true);

    // Load existing session on mount
    useEffect(() => {
        const loadExistingSession = async () => {
            if (!userId) {
                setLoadingSession(false);
                return;
            }

            const existingSessionId = getSession(caseId, userId);

            if (existingSessionId) {
                try {
                    // Load messages from the existing session
                    const response = await fetchSessionMessages(existingSessionId);
                    if (response.success && response.messages) {
                        const loadedMessages: Message[] = response.messages.map((msg, idx) => ({
                            id: `${existingSessionId}_${idx}`,
                            role: msg.role,
                            content: msg.content,
                            timestamp: msg.timestamp,
                        }));
                        setMessages(loadedMessages);
                        setSessionId(existingSessionId);
                    }
                } catch (err) {
                    console.error("Failed to load session:", err);
                    // Clear invalid session
                    clearSession(caseId, userId);
                }
            }

            setLoadingSession(false);
        };

        loadExistingSession();
    }, [caseId, userId]);

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim()) return;

            const userMessage: Message = {
                id: Date.now().toString(),
                role: "user",
                content,
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch("http://15.206.173.162:8000/api/contextual-query", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        company_id: caseId,
                        task: content,
                        user_id: userId,
                        session_id: sessionId,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch response");
                }

                if (!response.body) {
                    throw new Error("No response body");
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "",
                    timestamp: new Date().toISOString(),
                };

                setMessages((prev) => [...prev, assistantMessage]);

                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;
                }

                // After receiving all chunks, parse the complete JSON response
                let finalContent = "";
                try {
                    const jsonResponse = JSON.parse(buffer);

                    if (jsonResponse.success && jsonResponse.response) {
                        finalContent = jsonResponse.response;

                        // Update session ID if provided by backend
                        if (jsonResponse.session_id && !sessionId && userId) {
                            setSessionId(jsonResponse.session_id);
                            setSession(caseId, userId, jsonResponse.session_id);
                        }
                    } else {
                        throw new Error("Invalid response format");
                    }
                } catch (parseError) {
                    console.error("Failed to parse response:", parseError);
                    // If parsing fails, use the raw buffer as content
                    finalContent = buffer;
                }

                // Animate the text display character by character
                const words = finalContent.split(' ');
                let currentText = '';

                for (let i = 0; i < words.length; i++) {
                    currentText += (i > 0 ? ' ' : '') + words[i];

                    assistantMessage = {
                        ...assistantMessage,
                        content: currentText,
                    };

                    setMessages((prev) => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = assistantMessage;
                        return newMessages;
                    });

                    // Add a small delay between words for typing effect
                    // Adjust speed: lower = faster, higher = slower
                    await new Promise(resolve => setTimeout(resolve, 30));
                }

                // Store session if we don't have one yet
                if (!sessionId && userId) {
                    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    setSessionId(newSessionId);
                    setSession(caseId, userId, newSessionId);
                }
            } catch (err) {
                console.error("Chat error:", err);
                setError("Failed to get response. Please try again.");
            } finally {
                setIsLoading(false);
            }
        },
        [caseId, userId, sessionId]
    );

    const loadSession = useCallback(
        async (loadSessionId: string) => {
            if (!userId) return;

            setLoadingSession(true);
            setError(null);

            try {
                const response = await fetchSessionMessages(loadSessionId);
                if (response.success && response.messages) {
                    const loadedMessages: Message[] = response.messages.map((msg, idx) => ({
                        id: `${loadSessionId}_${idx}`,
                        role: msg.role,
                        content: msg.content,
                        timestamp: msg.timestamp,
                    }));
                    setMessages(loadedMessages);
                    setSessionId(loadSessionId);
                    setSession(caseId, userId, loadSessionId);
                }
            } catch (err) {
                console.error("Failed to load session:", err);
                setError("Failed to load session. Please try again.");
            } finally {
                setLoadingSession(false);
            }
        },
        [caseId, userId]
    );

    const startNewSession = useCallback(() => {
        if (!userId) return;

        setMessages([]);
        setSessionId(null);
        clearSession(caseId, userId);
    }, [caseId, userId]);

    return {
        messages,
        sendMessage,
        isLoading,
        error,
        sessionId,
        loadingSession,
        loadSession,
        startNewSession,
    };
}

