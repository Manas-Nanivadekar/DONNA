"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Message {
    author: string;
    timestamp: string;
    text: string;
    reactions: string; // Comma separated for input, converted to array for API
}

interface IngestData {
    source: string;
    channel: string;
    thread_title: string;
    key_decisions: string;
    warnings: string;
    severity: string;
    messages: Message[];
}

export default function CreatePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [userId, setUserId] = useState("");
    const [userName, setUserName] = useState("");

    // Step 1 Data
    const [companyId, setCompanyId] = useState("");
    const [companyName, setCompanyName] = useState("");

    // Step 2 Data
    const [ingestData, setIngestData] = useState<IngestData>({
        source: "slack_conversations",
        channel: "",
        thread_title: "",
        key_decisions: "",
        warnings: "",
        severity: "medium",
        messages: [
            { author: "", timestamp: new Date().toISOString(), text: "", reactions: "" }
        ]
    });

    useEffect(() => {
        const storedIdentity = localStorage.getItem("donna_identity");
        if (storedIdentity) {
            try {
                const parsed = JSON.parse(storedIdentity);
                if (parsed.email) {
                    setUserId(parsed.email);
                }
                if (parsed.name) {
                    setUserName(parsed.name);
                }
            } catch (e) {
                console.error("Failed to parse identity", e);
                toast.error("Invalid identity data.");
            }
        } else {
            toast.error("User identity not found. Please log in.");
        }
    }, []);

    const slugify = (text: string) => {
        return text
            .toLowerCase()
            .replace(/ /g, '_')
            .replace(/[^\w-]+/g, '');
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setCompanyName(newName);
        setCompanyId(slugify(newName));
    };

    const handleCreateCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyId || !companyName || !userId) {
            toast.error("Please fill in all fields (User ID missing)");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/companies/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company_id: companyId,
                    name: companyName,
                    user_id: userId
                })
            });

            const data = await response.json();

            if (data.success || response.ok) {
                localStorage.setItem("company_id", companyId);
                toast.success("Company created successfully");
                setStep(2);
            } else {
                toast.error(data.message || "Failed to create company");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMessage = () => {
        setIngestData(prev => ({
            ...prev,
            messages: [...prev.messages, { author: "", timestamp: new Date().toISOString(), text: "", reactions: "" }]
        }));
    };

    const handleRemoveMessage = (index: number) => {
        setIngestData(prev => ({
            ...prev,
            messages: prev.messages.filter((_, i) => i !== index)
        }));
    };

    const updateMessage = (index: number, field: keyof Message, value: string) => {
        setIngestData(prev => ({
            ...prev,
            messages: prev.messages.map((msg, i) =>
                i === index ? { ...msg, [field]: value } : msg
            )
        }));
    };

    const handleIngest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formattedMessages = ingestData.messages.map(msg => ({
                ...msg,
                reactions: msg.reactions.split(",").map(r => r.trim()).filter(Boolean)
            }));

            const payload = {
                data: [{
                    ...ingestData,
                    messages: formattedMessages
                }]
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/companies/${companyId}/ingest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success || response.ok) {
                toast.success("Data ingested successfully");
                router.push(`/case/${companyId}`);
            } else {
                toast.error(data.message || "Failed to ingest data");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during ingestion");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans p-6">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="mb-8 flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back
                </button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                        {step === 1 ? "Create New Case Study" : "Ingest Case Data"}
                    </h1>
                    <p className="text-neutral-400">
                        {step === 1
                            ? "Start by defining the organization or project."
                            : "Add initial conversation data to seed the memory."}
                    </p>
                    {step === 1 && userName && (
                        <p className="mt-2 text-sm text-neutral-500">
                            Creating as <span className="text-white font-medium">{userName}</span>
                        </p>
                    )}
                </div>

                {step === 1 && (
                    <form onSubmit={handleCreateCompany} className="space-y-6 border border-white/10 rounded-xl p-6 bg-neutral-900/30">
                        <div className="space-y-2">
                            <Label htmlFor="name">Company Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Acme Corp"
                                value={companyName}
                                onChange={handleNameChange}
                                required
                                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company_id">Company ID (Slug)</Label>
                            <Input
                                id="company_id"
                                placeholder="e.g. acme-corp"
                                value={companyId}
                                onChange={(e) => setCompanyId(e.target.value)}
                                required
                                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Company
                        </Button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleIngest} className="space-y-8">
                        <div className="space-y-6 border border-white/10 rounded-xl p-6 bg-neutral-900/30">
                            <h3 className="text-lg font-semibold border-b border-white/10 pb-2">Thread Context</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="source">Source</Label>
                                    <Input
                                        id="source"
                                        value={ingestData.source}
                                        onChange={(e) => setIngestData({ ...ingestData, source: e.target.value })}
                                        className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="channel">Channel</Label>
                                    <Input
                                        id="channel"
                                        placeholder="#engineering"
                                        value={ingestData.channel}
                                        onChange={(e) => setIngestData({ ...ingestData, channel: e.target.value })}
                                        className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="thread_title">Thread Title</Label>
                                <Input
                                    id="thread_title"
                                    placeholder="Incident #123 Discussion"
                                    value={ingestData.thread_title}
                                    onChange={(e) => setIngestData({ ...ingestData, thread_title: e.target.value })}
                                    className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="key_decisions">Key Decisions</Label>
                                <Textarea
                                    id="key_decisions"
                                    placeholder="What was decided?"
                                    value={ingestData.key_decisions}
                                    onChange={(e) => setIngestData({ ...ingestData, key_decisions: e.target.value })}
                                    className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="warnings">Warnings</Label>
                                    <Input
                                        id="warnings"
                                        placeholder="Any caveats?"
                                        value={ingestData.warnings}
                                        onChange={(e) => setIngestData({ ...ingestData, warnings: e.target.value })}
                                        className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="severity">Severity</Label>
                                    <Input
                                        id="severity"
                                        placeholder="low, medium, high"
                                        value={ingestData.severity}
                                        onChange={(e) => setIngestData({ ...ingestData, severity: e.target.value })}
                                        className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Messages</h3>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddMessage}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Message
                                </Button>
                            </div>

                            {ingestData.messages.map((msg, idx) => (
                                <div key={idx} className="border border-white/10 rounded-xl p-4 bg-neutral-900/30 space-y-4 relative group">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMessage(idx)}
                                        className="absolute top-4 right-4 text-neutral-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Author</Label>
                                            <Input
                                                value={msg.author}
                                                onChange={(e) => updateMessage(idx, "author", e.target.value)}
                                                placeholder="Username"
                                                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Timestamp</Label>
                                            <Input
                                                value={msg.timestamp}
                                                onChange={(e) => updateMessage(idx, "timestamp", e.target.value)}
                                                className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Text</Label>
                                        <Textarea
                                            value={msg.text}
                                            onChange={(e) => updateMessage(idx, "text", e.target.value)}
                                            placeholder="Message content..."
                                            className="min-h-[80px] bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Reactions (comma separated)</Label>
                                        <Input
                                            value={msg.reactions}
                                            onChange={(e) => updateMessage(idx, "reactions", e.target.value)}
                                            placeholder="thumbsup, heart"
                                            className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Ingest Data
                        </Button>
                    </form>
                )}
            </div>
        </main>
    );
}
