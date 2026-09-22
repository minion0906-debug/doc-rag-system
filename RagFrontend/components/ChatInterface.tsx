"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { InputArea } from "@/components/InputArea";
import { AuthModal } from "@/components/AuthModal";
import { ApiKeySetupModal } from "@/components/ApiKeySetupModal";
import {
    createSession,
    sendMessageStream,
    uploadFile,
    deleteSession,
    deleteAllSessions,
    updateSessionTitle,
    hasConfiguredApiKey,
    incrementFreePromptCount,
    FREE_PROMPT_LIMIT,
    FREE_SESSION_LIMIT,
    FREE_DOCUMENT_LIMIT,
    Message,
    API_BASE_URL
} from "@/lib/api";
import { useSessions, useMessages } from "@/lib/hooks";
import { mutate } from "swr";
import { useAuth } from "@/components/AuthProvider";

interface ChatInterfaceProps {
    initialSessionId?: string;
}

export function ChatInterface({ initialSessionId }: ChatInterfaceProps) {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId || null);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [apiKeyModalReason, setApiKeyModalReason] = useState<"onboarding" | "limit_reached" | "doc_limit">("onboarding");
    const [currentStepStatus, setCurrentStepStatus] = useState<string | null>(null);

    // TanStack Query Hooks (using persistent global auth)
    const { sessions, mutate: mutateSessions, isLoading: isSessionsLoading } = useSessions(isAuthenticated);
    const { messages, mutate: mutateMessages, isLoading: isMessagesLoading } = useMessages(currentSessionId);

    // Update currentSessionId when initialSessionId prop changes or browser popstate occurs
    useEffect(() => {
        if (initialSessionId && initialSessionId !== currentSessionId) {
            setCurrentSessionId(initialSessionId);
        }

        const handlePopState = () => {
            const match = window.location.pathname.match(/\/chat\/([^/?#]+)/);
            if (match && match[1]) {
                setCurrentSessionId(match[1]);
            } else if (window.location.pathname.startsWith("/chat")) {
                setCurrentSessionId(null);
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [initialSessionId]);

    const handleNewChat = async () => {
        if (!isAuthenticated) {
            setIsAuthModalOpen(true);
            return;
        }

        // Free tier: 1 session limit if no custom API key
        if (!hasConfiguredApiKey() && sessions && sessions.length >= FREE_SESSION_LIMIT) {
            setApiKeyModalReason("limit_reached");
            setIsApiKeyModalOpen(true);
            return;
        }

        setIsCreating(true);
        try {
            const newSession = await createSession();
            await mutateSessions();
            setCurrentSessionId(newSession.id);
            window.history.pushState(null, "", `/chat/${newSession.id}`);
        } catch (error: any) {
            console.error("Failed to create new session:", error);
            if (error?.message?.includes("Free demo") || error?.message?.includes("402")) {
                setApiKeyModalReason("limit_reached");
                setIsApiKeyModalOpen(true);
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelectSession = (sessionId: string) => {
        setCurrentSessionId(sessionId);
        window.history.pushState(null, "", `/chat/${sessionId}`);
    };

    const handleDeleteSession = async (sessionId: string) => {
        try {
            await deleteSession(sessionId);
            await mutateSessions();

            if (currentSessionId === sessionId) {
                const remaining = sessions?.filter((s) => s.id !== sessionId) || [];
                if (remaining.length > 0) {
                    setCurrentSessionId(remaining[0].id);
                    window.history.pushState(null, "", `/chat/${remaining[0].id}`);
                } else {
                    setCurrentSessionId(null);
                    window.history.pushState(null, "", `/chat`);
                }
            }
        } catch (error) {
            console.error("Failed to delete session:", error);
        }
    };

    const handleDeleteAllSessions = async () => {
        try {
            await deleteAllSessions();
            await mutateSessions();
            setCurrentSessionId(null);
            router.push("/chat");
        } catch (error) {
            console.error("Failed to delete all sessions:", error);
        }
    };

    // Immediate Document Upload & Indexing when file is selected
    const handleUploadFiles = async (files: File[]) => {
        if (!files || files.length === 0 || isUploading || isSending) return;
        if (!isAuthenticated) {
            setIsAuthModalOpen(true);
            return;
        }

        // Free tier: 1 document limit if no custom API key
        if (!hasConfiguredApiKey()) {
            const currentSession = sessions?.find(s => s.id === currentSessionId);
            const hasDocument = currentSession?.file_name || (sessions && sessions.some(s => s.file_name));
            if (hasDocument) {
                setApiKeyModalReason("doc_limit");
                setIsApiKeyModalOpen(true);
                return;
            }
        }

        setIsUploading(true);
        let sessionId = currentSessionId;

        // Ensure session exists (reuse existing empty session if available)
        if (!sessionId) {
            const emptySession = sessions?.find(s => !s.file_name);
            if (emptySession) {
                sessionId = emptySession.id;
                setCurrentSessionId(sessionId);
                window.history.pushState(null, "", `/chat/${sessionId}`);
            } else {
                try {
                    const newSession = await createSession();
                    await mutateSessions();
                    sessionId = newSession.id;
                    setCurrentSessionId(sessionId);
                    window.history.pushState(null, "", `/chat/${newSession.id}`);
                } catch (error: any) {
                    console.error("Failed to create session for upload:", error);
                    setApiKeyModalReason("limit_reached");
                    setIsApiKeyModalOpen(true);
                    setIsUploading(false);
                    return;
                }
            }
        }

        for (const file of files) {
            setUploadingFileName(file.name);
            setCurrentStepStatus(`Indexing ${file.name}...`);

            try {
                await uploadFile(sessionId, file);
                await mutateSessions();
                await mutateMessages();
            } catch (error: any) {
                console.error(`Failed to upload ${file.name}:`, error);
                if (error?.message?.includes("Free demo") || error?.message?.includes("402")) {
                    setApiKeyModalReason("doc_limit");
                    setIsApiKeyModalOpen(true);
                } else {
                    await mutateMessages((curr) => [
                        ...(curr || []),
                        {
                            id: Date.now(),
                            role: "assistant",
                            content: `**Failed to upload \`${file.name}\`**: ${error?.message || "Upload error occurred"}`,
                            sources: null,
                            created_at: new Date().toISOString()
                        }
                    ], { revalidate: false });
                }
            }
        }

        setUploadingFileName(null);
        setCurrentStepStatus(null);
        setIsUploading(false);
    };

    const handleSendMessage = async (content: string, files?: File[]) => {
        if (isSending || isUploading) return;
        if (!isAuthenticated) {
            setIsAuthModalOpen(true);
            return;
        }

        // Free tier prompt limit check: Max 2 messages if no custom API key
        if (!hasConfiguredApiKey()) {
            const assistantMsgCount = (messages || []).filter(m => m.role === "assistant").length;
            if (assistantMsgCount >= FREE_PROMPT_LIMIT) {
                setApiKeyModalReason("limit_reached");
                setIsApiKeyModalOpen(true);
                return;
            }
        }

        setIsSending(true);
        let sessionId = currentSessionId;

        // Create session if none exists
        if (!sessionId) {
            const emptySession = sessions?.find(s => !s.file_name);
            if (emptySession) {
                sessionId = emptySession.id;
                setCurrentSessionId(sessionId);
                window.history.pushState(null, "", `/chat/${sessionId}`);
            } else {
                try {
                    const newSession = await createSession();
                    await mutateSessions();
                    sessionId = newSession.id;
                    setCurrentSessionId(sessionId);
                    window.history.pushState(null, "", `/chat/${newSession.id}`);
                } catch (error: any) {
                    console.error("Failed to create session:", error);
                    setApiKeyModalReason("limit_reached");
                    setIsApiKeyModalOpen(true);
                    setIsSending(false);
                    return;
                }
            }
        }

        // Upload any extra attached files
        if (files && files.length > 0) {
            await handleUploadFiles(files);
        }

        // Send text message with real-time SSE streaming
        if (content.trim()) {
            const tempUserMsg: Message = {
                id: Date.now(),
                role: "user",
                content: content,
                sources: null,
                created_at: new Date().toISOString(),
            };

            const tempBotMsgId = Date.now() + 1;
            const tempBotMsg: Message = {
                id: tempBotMsgId,
                role: "assistant",
                content: "",
                sources: null,
                created_at: new Date().toISOString(),
            };

            await mutateMessages((currentMessages: Message[] | undefined) => {
                return [...(currentMessages || []), tempUserMsg, tempBotMsg];
            }, { revalidate: false });

            let accumulatedContent = "";
            setCurrentStepStatus(null);

            try {
                await sendMessageStream(sessionId, content, (event) => {
                    if (event.type === "status") {
                        if (event.label) {
                            setCurrentStepStatus(event.label);
                        }
                    } else if (event.type === "token" && event.content) {
                        setCurrentStepStatus(null);
                        accumulatedContent += event.content;
                        const currentText = accumulatedContent;
                        mutateMessages((currentMessages: Message[] | undefined) => {
                            if (!currentMessages) return [];
                            return currentMessages.map((m) =>
                                m.id === tempBotMsgId ? { ...m, content: currentText } : m
                            );
                        }, { revalidate: false });
                    } else if (event.type === "done") {
                        setCurrentStepStatus(null);
                        const finalAnswer = event.answer || accumulatedContent;
                        mutateMessages((currentMessages: Message[] | undefined) => {
                            if (!currentMessages) return [];
                            return currentMessages.map((m) =>
                                m.id === tempBotMsgId
                                    ? {
                                        ...m,
                                        content: finalAnswer,
                                        sources: event.sources || null,
                                        metrics: event.metrics || undefined,
                                    }
                                    : m
                            );
                        }, { revalidate: false });

                        // Increment free prompt counter if user is on free tier
                        if (!hasConfiguredApiKey()) {
                            incrementFreePromptCount(sessionId || undefined);
                        }
                    } else if (event.type === "error") {
                        setCurrentStepStatus(null);
                        const errorContent = event.content || "An error occurred during response generation.";
                        mutateMessages((currentMessages: Message[] | undefined) => {
                            if (!currentMessages) return [];
                            return currentMessages.map((m) =>
                                m.id === tempBotMsgId
                                    ? {
                                        ...m,
                                        content: `**Error:** ${errorContent}`,
                                    }
                                    : m
                            );
                        }, { revalidate: false });

                        if (errorContent.includes("Free trial limit") || errorContent.includes("Gemini API Key")) {
                            setApiKeyModalReason("limit_reached");
                            setIsApiKeyModalOpen(true);
                        }
                    }
                });

                await mutateSessions();
                await mutateMessages();
            } catch (error: any) {
                console.error("Failed to send message:", error);
                setCurrentStepStatus(null);
                if (error?.message?.includes("Free trial limit") || error?.message?.includes("402")) {
                    setApiKeyModalReason("limit_reached");
                    setIsApiKeyModalOpen(true);
                }
                await mutateMessages();
            }
        }

        setIsSending(false);
    };

    const currentSession = sessions?.find((s) => s.id === currentSessionId);

    return (
        <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden font-sans">
            <Sidebar
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                sessions={sessions || []}
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
                onDeleteSession={handleDeleteSession}
                onDeleteAllSessions={handleDeleteAllSessions}
                onUpdateSessionTitle={async (sessionId, newTitle) => {
                    await updateSessionTitle(sessionId, newTitle);
                    await mutateSessions();
                }}
                isLoading={isSessionsLoading}
            />

            <main className="flex-1 flex flex-col h-full min-w-0 bg-[var(--bg-main)] relative">
                <ChatArea
                    messages={messages || []}
                    isLoading={isSending}
                    isHistoryLoading={isMessagesLoading && !messages && !!currentSessionId}
                    isUploading={isUploading}
                    uploadingFileName={uploadingFileName}
                    sessionTitle={currentSession?.title}
                    sessionDocument={currentSession ? {
                        file_name: currentSession.file_name || null,
                        file_size: currentSession.file_size || null,
                        file_url: currentSession.file_url || null,
                    } : null}
                    statusLabel={currentStepStatus}
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    onNewChat={handleNewChat}
                    onSendMessage={handleSendMessage}
                />

                <InputArea
                    onSendMessage={handleSendMessage}
                    onUploadFiles={handleUploadFiles}
                    isUploading={isUploading}
                    uploadingFileName={uploadingFileName}
                    currentSessionId={currentSessionId}
                    attachedDocuments={currentSession?.file_name ? [{
                        name: currentSession.file_name,
                        size: currentSession.file_size || null,
                        url: currentSession.file_url || null
                    }] : []}
                    onIngest={async () => {
                        await mutateSessions();
                        await mutateMessages();
                    }}
                />
            </main>

            <ApiKeySetupModal
                isOpen={isApiKeyModalOpen}
                onClose={() => setIsApiKeyModalOpen(false)}
                reason={apiKeyModalReason}
                onSuccess={() => {
                    mutateSessions();
                    mutateMessages();
                }}
            />

            <AuthModal
                isOpen={(!isAuthLoading && !isAuthenticated) || isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                canClose={isAuthenticated}
            />
        </div>
    );
}
