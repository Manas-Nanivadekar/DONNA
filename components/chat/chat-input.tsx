"use client";

import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
}

export function ChatInput({ onSend, disabled, placeholder, value, onChange }: ChatInputProps) {
    const [internalValue, setInternalValue] = useState("");

    const inputValue = value !== undefined ? value : internalValue;
    const setInputValue = onChange || setInternalValue;

    const handleSend = () => {
        if (inputValue.trim()) {
            onSend(inputValue);
            setInputValue("");
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-white/10 bg-black p-4">
            <div className="mx-auto max-w-3xl">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/50 px-4 py-3 backdrop-blur-sm transition-all focus-within:border-white/20 focus-within:bg-neutral-900">
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || "Ask DONNA a question..."}
                        disabled={disabled}
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={disabled || !inputValue.trim()}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 transition-all hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed ring-1 ring-blue-500/30"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
