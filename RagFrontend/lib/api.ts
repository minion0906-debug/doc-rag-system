import { getAuthToken } from "./supabase";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export const GEMINI_API_KEY_STORAGE_KEY = "askdoc_gemini_api_key";
export const GEMINI_MODEL_STORAGE_KEY = "askdoc_gemini_model";
export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

export function getStoredApiKey(): string {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || "";
}

export function setStoredApiKey(key: string): void {
    if (typeof window === "undefined") return;
    if (key.trim()) {
        localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key.trim());
    } else {
        localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    }
}

export function getStoredModel(): string {
    if (typeof window === "undefined") return DEFAULT_GEMINI_MODEL;
    return localStorage.getItem(GEMINI_MODEL_STORAGE_KEY) || DEFAULT_GEMINI_MODEL;
}

export function setStoredModel(model: string): void {
    if (typeof window === "undefined") return;
    if (model.trim()) {
        localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, model.trim());
    } else {
        localStorage.removeItem(GEMINI_MODEL_STORAGE_KEY);
    }
}

export const FREE_PROMPT_LIMIT = 2;
export const FREE_DOCUMENT_LIMIT = 1;
export const FREE_SESSION_LIMIT = 1;

export function hasConfiguredApiKey(): boolean {
    return !!getStoredApiKey().trim();
}

export function getFreePromptCount(sessionId?: string): number {
    if (typeof window === "undefined") return 0;
    if (sessionId) {
        const sessionCount = localStorage.getItem(`askdoc_free_prompts_${sessionId}`);
        if (sessionCount !== null) return parseInt(sessionCount, 10) || 0;
    }
    const globalCount = localStorage.getItem("askdoc_free_prompt_count");
    return globalCount !== null ? parseInt(globalCount, 10) || 0 : 0;
}

export function incrementFreePromptCount(sessionId?: string): number {
    if (typeof window === "undefined") return 1;
    const current = getFreePromptCount(sessionId);
    const updated = current + 1;
    if (sessionId) {
        localStorage.setItem(`askdoc_free_prompts_${sessionId}`, String(updated));
    }
    localStorage.setItem("askdoc_free_prompt_count", String(updated));
    return updated;
}

export function isFreeLimitReached(currentPromptCount?: number): boolean {
    if (hasConfiguredApiKey()) return false;
    const count = currentPromptCount !== undefined ? currentPromptCount : getFreePromptCount();
    return count >= FREE_PROMPT_LIMIT;
}

export interface Session {
    id: string;
    title: string;
    file_name: string | null;
    file_path?: string | null;
    file_size?: number | null;
    file_type?: string | null;
    file_url?: string | null;
    created_at: string;
}

export interface DocumentInfo {
    file_name: string;
    file_path: string;
    file_size: number | null;
    file_type: string | null;
    download_url: string;
    session_id: string;
}

export interface Metrics {
    time: number;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost: number;
    low_confidence?: boolean;
    retries?: number;
}

export interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    sources: Source[] | null;
    metrics?: Metrics;
    needs_clarification?: boolean;
    created_at: string;
}

export interface Source {
    id: number;
    title: string;
    content: string;
    metadata: Record<string, unknown>;
}

export interface ChatResponse {
    answer: string;
    sources: Source[];
    metrics?: Metrics;
    needs_clarification?: boolean;
}

async function getAuthHeaders(additionalHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
    const token = await getAuthToken();
    const headers: Record<string, string> = { ...additionalHeaders };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    const userApiKey = getStoredApiKey();
    if (userApiKey) {
        headers["X-Gemini-API-Key"] = userApiKey;
    }
    const userModel = getStoredModel();
    if (userModel) {
        headers["X-Gemini-Model"] = userModel;
    }
    return headers;
}

export async function createSession(title: string = "New Chat"): Promise<Session> {
    const headers = await getAuthHeaders({ "Content-Type": "application/json" });
    const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ title }),
    });
    if (!response.ok) {
        let errDetail = `Failed to create session (${response.status})`;
        try {
            const errData = await response.json();
            errDetail = errData.detail || errDetail;
        } catch {}
        throw new Error(errDetail);
    }
    return response.json();
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<Session> {
    const headers = await getAuthHeaders({ "Content-Type": "application/json" });
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ title }),
    });
    if (!response.ok) {
        let errDetail = "Failed to update session title";
        try {
            const errData = await response.json();
            errDetail = errData.detail || errDetail;
        } catch {}
        throw new Error(errDetail);
    }
    return response.json();
}

export async function getSessions(): Promise<Session[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/sessions`, { headers });
    if (!response.ok) {
        let errDetail = "Failed to fetch sessions";
        try {
            const errData = await response.json();
            errDetail = errData.detail || errDetail;
        } catch {}
        throw new Error(errDetail);
    }
    return response.json();
}

export async function getMessages(sessionId: string): Promise<Message[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages`, { headers });
    if (!response.ok) throw new Error("Failed to fetch messages");
    return response.json();
}

export interface StreamEvent {
    type: "token" | "done" | "error" | "status";
    content?: string;
    answer?: string;
    sources?: Source[];
    metrics?: Metrics;
    step?: string;
    label?: string;
    needs_clarification?: boolean;
}

export async function sendMessage(sessionId: string, question: string): Promise<ChatResponse> {
    const headers = await getAuthHeaders({ "Content-Type": "application/json" });
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ 
            question,
            api_key: getStoredApiKey(),
            model_name: getStoredModel()
        }),
    });
    if (!response.ok) throw new Error("Failed to send message");
    return response.json();
}

export async function sendMessageStream(
    sessionId: string,
    question: string,
    onChunk: (event: StreamEvent) => void
): Promise<void> {
    const headers = await getAuthHeaders({ "Content-Type": "application/json" });
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ 
            question,
            api_key: getStoredApiKey(),
            model_name: getStoredModel()
        }),
    });

    if (!response.ok) {
        let errDetail = "Failed to send message";
        try {
            const errData = await response.json();
            errDetail = errData.detail || errDetail;
        } catch {}
        throw new Error(errDetail);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body reader available");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
                try {
                    const eventData = JSON.parse(trimmed.slice(6));
                    onChunk(eventData);
                } catch (e) {
                    console.error("Failed to parse SSE line:", trimmed, e);
                }
            }
        }
    }

    // Process remainder
    if (buffer.trim().startsWith("data: ")) {
        try {
            const eventData = JSON.parse(buffer.trim().slice(6));
            onChunk(eventData);
        } catch (e) {
            console.error("Failed to parse final SSE buffer:", buffer, e);
        }
    }
}

export async function regenerateMessageStream(
    sessionId: string,
    onChunk: (event: StreamEvent) => void
): Promise<void> {
    const headers = await getAuthHeaders({ "Content-Type": "application/json" });
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/regenerate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            api_key: getStoredApiKey(),
            model_name: getStoredModel()
        })
    });

    if (!response.ok) {
        let errDetail = "Failed to regenerate message";
        try {
            const errData = await response.json();
            errDetail = errData.detail || errDetail;
        } catch {}
        throw new Error(errDetail);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body reader available");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
                try {
                    const eventData = JSON.parse(trimmed.slice(6));
                    onChunk(eventData);
                } catch (e) {
                    console.error("Failed to parse SSE line:", trimmed, e);
                }
            }
        }
    }
}

export async function uploadFile(sessionId: string, file: File) {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/upload`, {
        method: "POST",
        headers,
        body: formData,
    });
    if (!response.ok) {
        let errDetail = "Failed to upload file";
        try {
            const errData = await response.json();
            errDetail = errData.detail || errDetail;
        } catch {}
        throw new Error(errDetail);
    }
    return response.json();
}

export async function ingestPastedText(sessionId: string, text: string, title?: string) {
    const headers = await getAuthHeaders({ "Content-Type": "application/json" });
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/ingest_text`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text, title: title || "Pasted Text" }),
    });
    if (!response.ok) {
        let errDetail = "Failed to ingest text";
        try {
            const errData = await response.json();
            errDetail = errData.detail || errDetail;
        } catch {}
        throw new Error(errDetail);
    }
    return response.json();
}

export const ingestText = ingestPastedText;

export async function deleteSession(sessionId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: "DELETE",
        headers,
    });
    if (!response.ok) throw new Error("Failed to delete session");
}

export async function deleteAllSessions(): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: "DELETE",
        headers,
    });
    if (!response.ok) throw new Error("Failed to delete all sessions");
}

export async function getSessionDocument(sessionId: string): Promise<DocumentInfo | null> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/document`, { headers });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Failed to fetch session document");
    return response.json();
}

export interface EvaluationItem {
    id: string;
    session_id: string;
    question: string;
    rag_answer: string | null;
    relevance_score: number | null;
    accuracy_score: number | null;
    completeness_score: number | null;
    overall_score: number | null;
    feedback: string | null;
    metrics?: Metrics | null;
    created_at: string;
}

export async function evaluateSession(sessionId: string): Promise<EvaluationItem[]> {
    const headers = await getAuthHeaders({ "Content-Type": "application/json" });
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/evaluate`, {
        method: "POST",
        headers,
    });
    if (!response.ok) throw new Error("Failed to evaluate session");
    return response.json();
}

export async function getSessionEvaluations(sessionId: string): Promise<EvaluationItem[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/evaluations`, { headers });
    if (!response.ok) throw new Error("Failed to fetch evaluations");
    return response.json();
}
