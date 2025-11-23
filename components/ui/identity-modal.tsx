"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useIdentity } from "@/hooks/use-identity";

interface IdentityModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function IdentityModal({ open, onOpenChange }: IdentityModalProps) {
    const { identity, setIdentity } = useIdentity();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (identity) {
            setName(identity.name);
            setEmail(identity.email);
        }
    }, [identity]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !email.trim()) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Call the register user API
            const response = await fetch("http://15.206.173.162:8000/api/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to register user");
            }

            // Save the identity with user_id from the API response
            setIdentity({
                user_id: data.user_id,
                name: name.trim(),
                email: email.trim(),
            });

            onOpenChange(false);
        } catch (err) {
            console.error("Registration error:", err);
            setError(err instanceof Error ? err.message : "Failed to register. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e: any) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Welcome to DONNA</DialogTitle>
                    <DialogDescription>
                        Please enter your name and email to continue to the workspace.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            disabled={loading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            disabled={loading}
                        />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Registering..." : "Continue"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
