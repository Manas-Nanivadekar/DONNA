"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
    const [metadata, setMetadata] = useState<CompanyMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const navigate = useRouter();

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const response = await fetch(`${baseUrl}/api/companies/${caseId}/metadata`);
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
                "relative flex h-full flex-col border-r border-white/10 bg-black w-full",
                className
            )}
        >
            <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
                <ChevronLeft onClick={() => { navigate.back() }} className="h-4 w-4 cursor-pointer text-white" />
                <span className="font-semibold text-white">Case Summary</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex gap-1">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "0ms" }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "150ms" }} />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-white/60" style={{ animationDelay: "300ms" }} />
                        </div>
                    </div>
                ) : metadata ? (
                    <>
                        <div>
                            <div className="mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-400" />
                                <h3 className="font-semibold text-white">Overview</h3>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4 backdrop-blur-sm">
                                <h4 className="mb-2 font-medium text-white">{metadata.name}</h4>
                                <p className="text-sm text-white/70 leading-relaxed">{metadata.long_summary}</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="rounded-lg border border-white/10 bg-neutral-900/50 p-4 text-center backdrop-blur-sm">
                        <p className="text-sm text-white/60">No data available</p>
                    </div>
                )}
            </div>
        </div>
    );
}
