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
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Summary Panel - Desktop */}
            <div className="hidden md:block h-full">
                <SummaryPanel caseId={caseId} />
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col min-w-0">
                <header className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
                    <div className="flex items-center gap-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="-ml-2">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Summary</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-80">
                                <SummaryPanel caseId={caseId} className="w-full border-none" />
                            </SheetContent>
                        </Sheet>
                        <h1 className="font-semibold truncate">{caseId}</h1>
                    </div>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2">
                                <Lightbulb className="h-5 w-5" />
                                <span className="sr-only">Suggestions</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="p-0 w-72">
                            <SuggestionsPanel caseId={caseId} onSelect={(text) => {
                                setChatInput(text);
                            }} className="w-full border-none h-full" />
                        </SheetContent>
                    </Sheet>
                </header>

                <div className="flex-1 overflow-hidden">
                    <ChatInterface
                        key={sessionKey} // Force remount when session changes
                        caseId={caseId}
                        initialInput={chatInput}
                        onInputChange={setChatInput}
                    />
                </div>
            </div>

            {/* Suggestions Panel - Desktop */}
            <div className="hidden lg:flex lg:flex-col h-full w-72 border-l border-border">
                <div className="flex-1 overflow-y-auto p-4">
                    <SuggestionsPanel caseId={caseId} onSelect={setChatInput} className="border-none" />

                    {identity && (
                        <div className="mt-6 pt-6 border-t border-border">
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

            <IdentityModal
                open={showIdentityModal}
                onOpenChange={(open) => {
                    if (!open && !identity) {
                        // Prevent closing if identity is still missing? 
                    }
                    setShowIdentityModal(open);
                }}
            />
        </div>
    );
}

