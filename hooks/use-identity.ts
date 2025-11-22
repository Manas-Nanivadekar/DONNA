"use client";

import { useState, useEffect } from "react";

interface Identity {
    user_id: string;
    name: string;
    email: string;
}

export function useIdentity() {
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("donna_identity");
        if (stored) {
            try {
                setIdentity(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse identity", e);
            }
        }
        setLoading(false);
    }, []);

    const saveIdentity = (newIdentity: Identity) => {
        localStorage.setItem("donna_identity", JSON.stringify(newIdentity));
        setIdentity(newIdentity);
    };

    const clearIdentity = () => {
        localStorage.removeItem("donna_identity");
        setIdentity(null);
    };

    return {
        identity,
        setIdentity: saveIdentity,
        clearIdentity,
        loading,
    };
}
