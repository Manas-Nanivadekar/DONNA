"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestionsPanelProps {
    onSelect: (question: string) => void;
    className?: string;
    caseId?: string;
}

interface CompanyMetadata {
    company_id: string;
    name: string;
    short_summary: string;
    long_summary: string;
    suggested_questions: string[];
    created_at: string;
}

export function SuggestionsPanel({ onSelect, className, caseId }: SuggestionsPanelProps) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!caseId) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://15.206.173.162:8000/api/companies/${caseId}/metadata`);
                const data = await response.json();
                if (data.success && data.metadata.suggested_questions) {
                    setSuggestions(data.metadata.suggested_questions);
                }
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestions();
    }, [caseId]);

    return (
        <div className={cn("flex flex-col p-4", className)}>
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                <Lightbulb className="h-4 w-4 text-blue-400" />
                <span>Suggested Questions</span>
            </div>
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "300ms" }} />
                    </div>
                </div>
            ) : suggestions.length > 0 ? (
                <div className="space-y-3">
                    {suggestions.map((question, i) => (
                        <button
                            key={i}
                            onClick={() => onSelect(question)}
                            className="w-full rounded-lg border border-white/10 bg-neutral-900/50 p-3 text-left text-sm text-white/80 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-neutral-900"
                        >
                            {question}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4 text-center backdrop-blur-sm">
                    <p className="text-sm text-white/60">No suggestions available</p>
                </div>
            )}
        </div>
    );
}
