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
        <div className={cn("flex w-72 flex-col border-l border-border bg-muted/10 p-4", className)}>
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Lightbulb className="h-4 w-4" />
                <span>Suggested Questions</span>
            </div>
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">Loading...</div>
                </div>
            ) : suggestions.length > 0 ? (
                <div className="space-y-2">
                    {suggestions.map((question, i) => (
                        <button
                            key={i}
                            onClick={() => onSelect(question)}
                            className="w-full rounded-lg border border-border bg-background p-3 text-left text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                            {question}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">No suggestions available</div>
                </div>
            )}
        </div>
    );
}
