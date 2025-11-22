"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Menu, Lightbulb } from "lucide-react";
import { SummaryPanel } from "@/components/layout/summary-panel";
import { SuggestionsPanel } from "@/components/layout/suggestions-panel";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ChatHistory } from "@/components/chat/chat-history";
import { IdentityModal } from "@/components/ui/identity-modal";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIdentity } from "@/hooks/use-identity";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function CaseWorkspace() {
    const params = useParams();
    const caseId = params.id as string;
    const { identity, loading } = useIdentity();
    const [showIdentityModal, setShowIdentityModal] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [sessionKey, setSessionKey] = useState(0); // Key to force remount

    useEffect(() => {
        if (!loading && !identity) {
            setShowIdentityModal(true);
        }
    }, [loading, identity]);

    const handleNewChat = useCallback(() => {
        // Force remount of ChatInterface to start a new session
        setSessionKey(prev => prev + 1);
    }, []);

    const handleLoadSession = useCallback((sessionId: string) => {
        // Force remount of ChatInterface with loaded session
        setSessionKey(prev => prev + 1);
    }, []);

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-background">Loading...</div>;
    }

    return (
        <div className="h-screen w-full overflow-hidden bg-black">
            {/* Mobile Layout */}
            <div className="flex h-full flex-col md:hidden">
                <header className="flex h-14 items-center justify-between border-b border-white/10 px-4">
                    <div className="flex items-center gap-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="-ml-2 text-white hover:bg-white/10 hover:text-white">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Summary</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-80 bg-black border-r border-white/10">
                                <SummaryPanel caseId={caseId} className="w-full border-none" />
                            </SheetContent>
                        </Sheet>
                        <h1 className="font-semibold truncate text-white">{caseId}</h1>
                    </div>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2 text-white hover:bg-white/10 hover:text-white">
                                <Lightbulb className="h-5 w-5" />
                                <span className="sr-only">Suggestions</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0 w-72 bg-black border-l border-white/10">
                            <div className="h-full overflow-y-auto scrollbar-hide">
                                <SuggestionsPanel caseId={caseId} onSelect={setChatInput} className="w-full border-none" />
                            </div>
                        </SheetContent>
                    </Sheet>
                </header>
                <div className="flex-1 overflow-hidden">
                    <ChatInterface
                        key={sessionKey}
                        caseId={caseId}
                        initialInput={chatInput}
                        onInputChange={setChatInput}
                    />
                </div>
            </div>

            {/* Desktop Layout with Resizable Panels */}
            <div className="hidden md:block h-full w-full">
                <PanelGroup direction="horizontal">
                    <Panel defaultSize={20} minSize={15} maxSize={30} className="bg-black border-r border-white/10">
                        <SummaryPanel caseId={caseId} className="border-none" />
                    </Panel>

                    <PanelResizeHandle className="bg-black w-1 transition-colors hover:bg-blue-500/50 data-[resize-handle-active]:bg-blue-500" />

                    <Panel defaultSize={60} minSize={30}>
                        <ChatInterface
                            key={sessionKey}
                            caseId={caseId}
                            initialInput={chatInput}
                            onInputChange={setChatInput}
                        />
                    </Panel>

                    <PanelResizeHandle className="bg-black w-1 transition-colors hover:bg-blue-500/50 data-[resize-handle-active]:bg-blue-500" />

                    <Panel defaultSize={20} minSize={15} maxSize={30} className="bg-black border-l border-white/10">
                        <div className="flex h-full flex-col">
                            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                                <SuggestionsPanel caseId={caseId} onSelect={setChatInput} className="border-none p-0" />

                                {identity && (
                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <ChatHistory
                                            userId={identity.user_id}
                                            caseId={caseId}
                                            currentSessionId={null}
                                            onLoadSession={handleLoadSession}
                                            onNewChat={handleNewChat}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </Panel>
                </PanelGroup>
            </div>

            <IdentityModal
                open={showIdentityModal}
                onOpenChange={(open) => {
                    if (!open && !identity) {
                        // Prevent closing if identity is still missing
                    }
                    setShowIdentityModal(open);
                }}
            />
        </div>
    );
}

