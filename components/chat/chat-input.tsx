"use client";

import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        <div className="flex items-center gap-2 p-4 border-t border-border bg-background">
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || "Ask DONNA a question..."}
                disabled={disabled}
                className="flex-1"
            />
            <Button onClick={handleSend} disabled={disabled || !inputValue.trim()} size="icon">
                <Send className="h-4 w-4" />
            </Button>
        </div>
    );
}
