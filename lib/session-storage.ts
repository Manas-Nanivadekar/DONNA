/**
 * Session storage utilities for managing chat sessions in localStorage
 */

export interface SessionInfo {
    sessionId: string;
    caseId: string;
    userId: string;
    lastUpdated: string;
}

const SESSION_PREFIX = "donna_session_";
const SESSIONS_KEY = "donna_sessions";

/**
 * Get the current session ID for a case and user
 */
export function getSession(caseId: string, userId: string): string | null {
    const key = `${SESSION_PREFIX}${caseId}_${userId}`;
    return localStorage.getItem(key);
}

/**
 * Store a session ID for a case and user
 */
export function setSession(caseId: string, userId: string, sessionId: string): void {
    const key = `${SESSION_PREFIX}${caseId}_${userId}`;
    localStorage.setItem(key, sessionId);

    // Also update the sessions index
    const sessionInfo: SessionInfo = {
        sessionId,
        caseId,
        userId,
        lastUpdated: new Date().toISOString(),
    };

    updateSessionsIndex(sessionInfo);
}

/**
 * Clear the session for a case and user
 */
export function clearSession(caseId: string, userId: string): void {
    const key = `${SESSION_PREFIX}${caseId}_${userId}`;
    const sessionId = localStorage.getItem(key);

    if (sessionId) {
        localStorage.removeItem(key);
        removeFromSessionsIndex(sessionId);
    }
}

/**
 * Get all sessions for a user
 */
export function getAllSessions(userId: string): SessionInfo[] {
    const sessionsJson = localStorage.getItem(SESSIONS_KEY);
    if (!sessionsJson) return [];

    try {
        const allSessions: SessionInfo[] = JSON.parse(sessionsJson);
        return allSessions.filter(s => s.userId === userId);
    } catch (e) {
        console.error("Failed to parse sessions", e);
        return [];
    }
}

/**
 * Update the sessions index with a new or updated session
 */
function updateSessionsIndex(sessionInfo: SessionInfo): void {
    const sessionsJson = localStorage.getItem(SESSIONS_KEY);
    let sessions: SessionInfo[] = [];

    if (sessionsJson) {
        try {
            sessions = JSON.parse(sessionsJson);
        } catch (e) {
            console.error("Failed to parse sessions", e);
        }
    }

    // Remove existing entry if present
    sessions = sessions.filter(s => s.sessionId !== sessionInfo.sessionId);

    // Add new entry
    sessions.push(sessionInfo);

    // Save back
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

/**
 * Remove a session from the index
 */
function removeFromSessionsIndex(sessionId: string): void {
    const sessionsJson = localStorage.getItem(SESSIONS_KEY);
    if (!sessionsJson) return;

    try {
        let sessions: SessionInfo[] = JSON.parse(sessionsJson);
        sessions = sessions.filter(s => s.sessionId !== sessionId);
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error("Failed to parse sessions", e);
    }
}
