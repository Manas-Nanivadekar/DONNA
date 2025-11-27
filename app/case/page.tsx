"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Terminal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface CaseStudy {
    company_id: string;
    name: string;
    short_summary: string;
}

export default function CasesPage() {
    const [cases, setCases] = useState<CaseStudy[]>([]);
    const router = useRouter();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    useEffect(() => {
        const fetchCases = async () => {
            try {
                const response = await fetch(`${baseUrl}/api/companies`);
                const data = await response.json();
                if (data.success) {
                    setCases(data.companies);
                }
            } catch (error) {
                console.error("Failed to fetch cases:", error);
            }
        };
        fetchCases();
    }, []);

    const handleCaseClick = (caseId: string) => {
        router.push(`/case/${caseId}`);
    };

    return (
        <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
            <section id="memory" className="py-16 border-t border-white/5 bg-neutral-950">
                <div className="container mx-auto px-6">
                    <button
                        onClick={() => router.push("/")}
                        className="mb-8 flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Home
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-6">
                        <div>
                            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Case Studies</h2>
                            <p className="mt-4 text-neutral-400 max-w-xl text-lg">
                                Real examples of how DONNA structures disparate events into actionable insights.
                            </p>
                        </div>
                        <div className="flex-shrink-0">
                            <Button>Create Case Study</Button>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {cases.map((c, i) => (
                            <motion.div
                                key={c.company_id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => handleCaseClick(c.company_id)}
                                className="group relative overflow-hidden rounded-xl border border-white/10 bg-black p-8 hover:border-white/20 transition-all duration-500 hover:-translate-y-1 cursor-pointer"
                            >
                                <div className="mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
                                        <Terminal className="h-3 w-3" />
                                        <span>Nov 2025</span>
                                    </div>
                                    <div className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border border-white/5">
                                        Case Study
                                    </div>
                                </div>

                                <h3 className="mb-3 text-xl font-semibold leading-tight text-neutral-200 group-hover:text-white transition-colors">
                                    {c.name}
                                </h3>

                                <div className="space-y-4 mt-6">
                                    <div className="relative pl-4 border-l border-blue-500/20">
                                        <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1 font-semibold">Summary</div>
                                        <div className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors line-clamp-6">{c.short_summary}</div>
                                    </div>
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
