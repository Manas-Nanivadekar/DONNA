"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Database,
  GitBranch,
  MessageSquare,
  ShieldAlert,
  Zap,
  Search,
  FileText,
  Clock,
  AlertTriangle,
  ChevronRight,
  Terminal,
  Network,
  Sparkles,
  ArrowRight,
  Users,
} from "lucide-react";
import { DonnaLogo } from "@/components/ui/donna-logo";

const FEATURES = [
  {
    id: "ingest",
    title: "Total Recall",
    subtitle: "Learns from History",
    description:
      "DONNA ingests data from Slack, Jira, GitHub, and Confluence to build a complete timeline of every decision, bug, and feature.",
    icon: <Clock className="h-6 w-6" />,
    visual: "timeline",
  },
  {
    id: "map",
    title: "Neural Mapping",
    subtitle: "Understands Context",
    description:
      "Constructs a dynamic knowledge graph linking code commits to the conversations and decisions that drove them.",
    icon: <Network className="h-6 w-6" />,
    visual: "graph",
  },
  {
    id: "prevent",
    title: "Predictive Warning",
    subtitle: "Prevents Mistakes",
    description:
      "Recognizes patterns of failure in real-time and warns developers before they deploy risky code.",
    icon: <ShieldAlert className="h-6 w-6" />,
    visual: "shield",
  },
  {
    id: "retain",
    title: "Wisdom Vault",
    subtitle: "Preserves Knowledge",
    description:
      "Ensures that when experts leave, their expertise stays. Instant answers for new hires based on years of context.",
    icon: <Brain className="h-6 w-6" />,
    visual: "brain",
  },
];

const TimelineVisual = () => (
  <div className="relative flex h-full w-full flex-col justify-center gap-4 p-8">
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.2 }}
        className="flex items-center gap-4 rounded-lg border border-white/10 bg-neutral-900/50 p-4 backdrop-blur-sm"
      >
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center ${i === 1
            ? "bg-blue-500/20 text-blue-400"
            : i === 2
              ? "bg-purple-500/20 text-purple-400"
              : "bg-green-500/20 text-green-400"
            }`}
        >
          {i === 1 ? (
            <MessageSquare size={16} />
          ) : i === 2 ? (
            <GitBranch size={16} />
          ) : (
            <FileText size={16} />
          )}
        </div>
        <div className="space-y-2">
          <div className="h-2 w-32 rounded bg-white/20" />
          <div className="h-2 w-20 rounded bg-white/10" />
        </div>
      </motion.div>
    ))}
    <div className="absolute left-12 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent border-r border-dashed border-white/20 -z-10" />
  </div>
);

const GraphVisual = () => (
  <div className="relative h-full w-full flex items-center justify-center">
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="w-80 h-80 rounded-full border border-white/5 border-dashed"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute w-56 h-56 rounded-full border border-white/10 border-dashed"
      />
    </div>
    <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20">
      <Database className="h-6 w-6 text-white" />
    </div>
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        className="absolute h-2 w-2 rounded-full bg-neutral-400"
        animate={{
          x: [0, Math.cos(i * 1.5) * 140, 0],
          y: [0, Math.sin(i * 1.5) * 140, 0],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 4 + i,
          repeat: Infinity,
          delay: i * 0.5,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

const ShieldVisual = () => (
  <div className="flex h-full flex-col items-center justify-center gap-6">
    <div className="relative">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full bg-red-500/20 blur-xl"
      />
      <ShieldAlert className="h-24 w-24 text-white relative z-10" />
    </div>
    <div className="space-y-2 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key="warning-text"
        className="rounded-md bg-red-950/30 px-4 py-2 text-sm text-red-200 border border-red-900/50 backdrop-blur-md"
      >
        <span className="font-semibold">Alert:</span> Recursive dependency
        detected
      </motion.div>
    </div>
  </div>
);

const BrainVisual = () => (
  <div className="flex h-full items-center justify-center">
    <div className="relative grid grid-cols-8 gap-3 p-4">
      {Array.from({ length: 48 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.6, 0.1], scale: [1, 1.2, 1] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
          className="h-1.5 w-1.5 rounded-full bg-white"
        />
      ))}
    </div>
    <Zap className="absolute h-16 w-16 text-white mix-blend-overlay opacity-80" />
    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
  </div>
);

interface CaseStudy {
  company_id: string;
  name: string;
  short_summary: string;
}

export default function Home() {
  const [activeFeature, setActiveFeature] = useState(FEATURES[0].id);
  const activeData =
    FEATURES.find((f) => f.id === activeFeature) || FEATURES[0];
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
      {/* --- Navigation --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <DonnaLogo />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="#problem" className="hover:text-white transition-colors">
              The Problem
            </a>
            <a href="#solution" className="hover:text-white transition-colors">
              Solution
            </a>
            <a href="#memory" className="hover:text-white transition-colors">
              Memory
            </a>
          </div>
          <button
            onClick={() => router.push("/case")}
            className="hidden md:block rounded-full bg-white px-5 py-2 text-sm font-medium text-black hover:bg-neutral-200 transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#222_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="container relative mx-auto px-6 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-8 flex max-w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-neutral-300 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default"
          >
            <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
            <span>The Operating System for Organizational Memory</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* <div className="mb-6 flex items-center justify-center gap-2">
                            <span className="h-px w-8 bg-white/30" />
                            <span className="text-xs font-mono text-neutral-500 uppercase tracking-[0.2em]">System Status: Critical</span>
                            <span className="h-px w-8 bg-white/30" />
                        </div> */}

            <h1 className="font-serif text-6xl font-medium leading-[0.9] tracking-tight md:text-8xl lg:text-9xl mb-8">
              Your Organization <br />
              <span className="italic text-neutral-500">Has Amnesia.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-8 max-w-2xl text-lg text-neutral-400 md:text-xl leading-relaxed font-light"
          >
            Teams repeat mistakes because lessons are buried in chats and
            tickets. <br className="hidden md:block" />
            DONNA connects your scattered history into a coherent, queryable
            brain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 md:flex-row"
          >
            <button className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-all hover:bg-neutral-200 hover:pr-6 hover:pl-10">
              <a href="#memory">Try DONNA</a>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="rounded-full border border-white/10 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5">
              View Documentation
            </button>
          </motion.div>
        </div>
      </section>

      {/* --- Problem Statement --- */}
      <section
        id="problem"
        className="border-y border-white/5 bg-neutral-950 py-24"
      >
        <div className="container mx-auto px-6">
          <div className="mb-16 md:text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl text-white">
              The &quot;Ignorance Tax&quot;
            </h2>
            <p className="mt-4 text-neutral-400 text-lg">
              When employees leave, the knowledge leaves too. You are paying for
              the same mistakes over and over again.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Fragmented Context",
                desc: "Codebases and design docs are disconnected. Understanding 'why' often takes longer than doing the work.",
                icon: <Search className="h-6 w-6 text-neutral-200" />,
              },
              {
                title: "Brain Drain",
                desc: "Senior engineers leave, taking years of unwritten knowledge with them. New hires start from zero.",
                icon: <Users className="h-6 w-6 text-neutral-200" />,
              },
              {
                title: "Zombie Errors",
                desc: "The same bugs keep coming back because the fix wasn't propagated to the collective consciousness.",
                icon: <AlertTriangle className="h-6 w-6 text-neutral-200" />,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="group rounded-2xl border border-white/5 bg-black p-8 transition-all hover:border-white/20"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                  {item.icon}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-neutral-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Interactive Mechanism --- */}
      <section id="solution" className="py-32 bg-black">
        <div className="container mx-auto px-6">
          <div className="mb-20">
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              How DONNA Works
            </h2>
          </div>

          <div className="grid gap-12 lg:grid-cols-12">
            {/* Tabs */}
            <div className="lg:col-span-5 flex flex-col gap-2">
              {FEATURES.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`group relative flex flex-col gap-2 rounded-xl border p-6 text-left transition-all duration-300 ${activeFeature === feature.id
                    ? "border-white/20 bg-neutral-900"
                    : "border-transparent hover:bg-neutral-900/50"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${activeFeature === feature.id
                        ? "text-white"
                        : "text-neutral-500"
                        }`}
                    >
                      {feature.icon}
                    </div>
                    <span
                      className={`text-xs font-bold tracking-widest uppercase ${activeFeature === feature.id
                        ? "text-neutral-400"
                        : "text-neutral-600"
                        }`}
                    >
                      {feature.subtitle}
                    </span>
                  </div>
                  <div className="pl-12">
                    <h3
                      className={`text-lg font-semibold transition-colors ${activeFeature === feature.id
                        ? "text-white"
                        : "text-neutral-400"
                        }`}
                    >
                      {feature.title}
                    </h3>
                    <div
                      className={`grid transition-all duration-300 ${activeFeature === feature.id
                        ? "grid-rows-[1fr] opacity-100 pt-2"
                        : "grid-rows-[0fr] opacity-0"
                        }`}
                    >
                      <p className="overflow-hidden text-neutral-400 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Visualization Window */}
            <div className="lg:col-span-7">
              <div className="relative h-[500px] w-full overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/20 backdrop-blur-sm">
                {/* Scanner lines decoration */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                {/* @ts-ignore */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeData.id}
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                    className="h-full w-full"
                  >
                    {activeData.visual === "timeline" && <TimelineVisual />}
                    {activeData.visual === "graph" && <GraphVisual />}
                    {activeData.visual === "shield" && <ShieldVisual />}
                    {activeData.visual === "brain" && <BrainVisual />}
                  </motion.div>
                </AnimatePresence>

                {/* Decorative UI Elements */}
                <div className="absolute top-6 left-6 flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-white/20" />
                  <div className="h-2 w-2 rounded-full bg-white/10" />
                  <div className="h-2 w-2 rounded-full bg-white/10" />
                </div>
                <div className="absolute bottom-6 right-6 text-[10px] font-mono text-neutral-600 tracking-widest">
                  SYSTEM_STATUS: ACTIVE // NODE: {activeData.id.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Case Studies (Memory Nodes) --- */}
      <section
        id="memory"
        className="py-32 border-t border-white/5 bg-neutral-950"
      >
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Recovered Memories
              </h2>
              <p className="mt-4 text-neutral-400 max-w-xl text-lg">
                Real examples of how DONNA structures disparate events into
                actionable insights.
              </p>
            </div>
            <button
              onClick={() => router.push("/case")}
              className="flex items-center gap-2 text-sm font-medium text-white hover:text-neutral-300 transition-colors"
            >
              Explore more <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {cases.slice(0, 3).map((c, i) => (
              <motion.div
                key={c.company_id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleCaseClick(c.company_id)}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-black p-8 hover:border-white/20 transition-all duration-500 hover:-translate-y-1"
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
                    <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1 font-semibold">
                      Summary
                    </div>
                    <div className="text-sm text-neutral-400 group-hover:text-neutral-300 transition-colors line-clamp-6">
                      {c.short_summary}
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-40 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,#333_0%,transparent_50%)] opacity-50" />
        <div className="container relative mx-auto px-6 text-center">
          <h2 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 pb-4">
            Preserve your <br /> organizational wisdom.
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-xl text-neutral-400">
            Ready to stop the cycle of amnesia?
          </p>
          <div className="mt-12 flex justify-center gap-4">
            <button onClick={() => router.push("/case")} className="rounded-full bg-white px-10 py-4 text-base font-bold text-black hover:bg-neutral-200 transition-colors shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
              Get Started Now
            </button>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="border-t border-white/10 bg-black py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <DonnaLogo />
          </div>
          <div className="flex gap-8 text-sm text-neutral-500">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-white transition-colors">
              GitHub
            </a>
          </div>
          <div className="text-xs text-neutral-600">
            © 2025 DONNA by Team RiverBridge. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
