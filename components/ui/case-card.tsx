import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaseCardProps {
    id: string;
    title: string;
    summary: string;
    context: string;
}

export function CaseCard({ id, title, summary, context }: CaseCardProps) {
    return (
        <Link
            href={`/case/${id}`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/50 p-6 transition-all duration-500 hover:border-neutral-600 hover:bg-neutral-900"
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-mono text-xl font-bold tracking-tight text-neutral-100 group-hover:text-white">
                        {title}
                    </h3>
                    <ArrowRight className="h-5 w-5 -translate-x-2 text-neutral-500 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-white" />
                </div>
                <p className="text-sm text-neutral-400 group-hover:text-neutral-300">{summary}</p>
                <div className="rounded-lg bg-neutral-900 p-3 text-xs text-neutral-500 border border-neutral-800 group-hover:border-neutral-700 group-hover:text-neutral-400">
                    <span className="font-semibold text-neutral-300">Context: </span>
                    {context}
                </div>
            </div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </Link>
    );
}
