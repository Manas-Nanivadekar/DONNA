"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, FileText, Github, Slack, Trello } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SummaryPanelProps {
    caseId: string;
    className?: string;
}

interface CompanyMetadata {
    company_id: string;
    name: string;
    short_summary: string;
    long_summary: string;
    suggested_questions: string[];
    created_at: string;
}

export function SummaryPanel({ caseId, className }: SummaryPanelProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [metadata, setMetadata] = useState<CompanyMetadata | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const response = await fetch(`http://15.206.173.162:8000/api/companies/${caseId}/metadata`);
                const data = await response.json();
                if (data.success) {
                    setMetadata(data.metadata);
                }
            } catch (error) {
                console.error("Failed to fetch company metadata:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetadata();
    }, [caseId]);

    return (
        <div
            className={cn(
                "relative flex h-full flex-col border-r border-border bg-muted/10 transition-all duration-300 ease-in-out",
                isCollapsed ? "w-[60px]" : "w-80",
                className
            )}
        >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
                {!isCollapsed && <span className="font-semibold">Case Summary</span>}
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {isCollapsed ? (
                    <div className="flex flex-col items-center gap-4">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-sm text-muted-foreground">Loading...</div>
                    </div>
                ) : metadata ? (
                    <div className="space-y-6">
                        <div>
                            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Company</h3>
                            <p className="text-base font-semibold">{metadata.name}</p>
                        </div>

                        <div>
                            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Overview</h3>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {metadata.long_summary}
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-2 text-sm font-medium text-muted-foreground">Sources</h3>
                            <div className="flex flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 rounded-md bg-background px-2 py-1 text-xs border border-border">
                                    <Slack className="h-3 w-3" /> Slack
                                </div>
                                <div className="flex items-center gap-1.5 rounded-md bg-background px-2 py-1 text-xs border border-border">
                                    <Github className="h-3 w-3" /> GitHub
                                </div>
                                <div className="flex items-center gap-1.5 rounded-md bg-background px-2 py-1 text-xs border border-border">
                                    <Trello className="h-3 w-3" /> Jira
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-sm text-muted-foreground">No data available</div>
                    </div>
                )}
            </div>
        </div>
    );
}
