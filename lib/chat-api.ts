/**
 * API client for chat history endpoints
 */

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL;

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

export interface ChatSession {
    session_id: string;
    user_id: string;
    company_id: string;
    messages: ChatMessage[];
    created_at: string;
    updated_at: string;
}

export interface ChatHistoryResponse {
    success: boolean;
    user_id: string;
    sessions: ChatSession[];
    count: number;
}

export interface SessionResponse {
    success: boolean;
    session: ChatSession;
}

export interface MessagesResponse {
    success: boolean;
    session_id: string;
    messages: ChatMessage[];
}

/**
 * Fetch user's chat history
 */
export async function fetchChatHistory(
    userId: string,
    companyId?: string,
    limit: number = 50
): Promise<ChatHistoryResponse> {
    const params = new URLSearchParams();
    if (companyId) params.append("company_id", companyId);
    params.append("limit", limit.toString());

    const url = `${API_BASE}/api/users/${userId}/chat-history?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch chat history: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch a specific session
 */
export async function fetchSession(sessionId: string): Promise<SessionResponse> {
    const url = `${API_BASE}/api/sessions/${sessionId}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch session: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch messages for a specific session
 */
export async function fetchSessionMessages(sessionId: string): Promise<MessagesResponse> {
    const url = `${API_BASE}/api/sessions/${sessionId}/messages`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch session messages: ${response.statusText}`);
    }

    return response.json();
}
