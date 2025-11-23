"use client";

import { useState, useEffect } from "react";

interface Identity {
    user_id: string;
    name: string;
    email: string;
}

const IDENTITY_STORAGE_KEY = "donna_identity";
const IDENTITY_UPDATE_EVENT = "donna_identity_update";

export function useIdentity() {
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load initial identity
        const stored = localStorage.getItem(IDENTITY_STORAGE_KEY);
        if (stored) {
            try {
                setIdentity(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse identity", e);
            }
        }
        setLoading(false);

        // Listen for identity updates from other components
        const handleIdentityUpdate = (e: CustomEvent) => {
            setIdentity(e.detail);
        };

        window.addEventListener(IDENTITY_UPDATE_EVENT as any, handleIdentityUpdate);

        return () => {
            window.removeEventListener(IDENTITY_UPDATE_EVENT as any, handleIdentityUpdate);
        };
    }, []);

    const saveIdentity = (newIdentity: Identity) => {
        localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(newIdentity));
        setIdentity(newIdentity);

        // Notify all other components about the identity update
        window.dispatchEvent(new CustomEvent(IDENTITY_UPDATE_EVENT, { detail: newIdentity }));
    };

    const clearIdentity = () => {
        localStorage.removeItem(IDENTITY_STORAGE_KEY);
        setIdentity(null);

        // Notify all other components about the identity clear
        window.dispatchEvent(new CustomEvent(IDENTITY_UPDATE_EVENT, { detail: null }));
    };

    return {
        identity,
        setIdentity: saveIdentity,
        clearIdentity,
        loading,
    };
}
