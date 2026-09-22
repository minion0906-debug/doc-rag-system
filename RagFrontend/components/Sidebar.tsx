import React, { useState, useEffect, useRef } from "react";
import { 
    Plus, 
    MessageSquare, 
    FileText, 
    Settings, 
    Menu, 
    Trash2, 
    Loader2, 
    User, 
    LogOut, 
    LogIn, 
    Sparkles, 
    PanelLeft, 
    Pencil, 
    Check, 
    X,
    Key
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Session, 
    updateSessionTitle,
    hasConfiguredApiKey,
    getStoredModel,
    getFreePromptCount,
    FREE_PROMPT_LIMIT,
    FREE_SESSION_LIMIT
} from "@/lib/api";
import Link from "next/link";
import { SettingsDialog } from "./SettingsDialog";
import { AuthModal } from "./AuthModal";
import { ApiKeySetupModal } from "./ApiKeySetupModal";
import { supabase, signOutUser } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    sessions: Session[];
    currentSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => Promise<void>;
    onDeleteSession: (sessionId: string) => Promise<void>;
    onDeleteAllSessions: () => Promise<void>;
    onUpdateSessionTitle?: (sessionId: string, newTitle: string) => Promise<void>;
    isLoading?: boolean;
}

function groupSessionsByRecency(sessions: Session[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const groups: { label: string; sessions: Session[] }[] = [
        { label: "Today", sessions: [] },
        { label: "Yesterday", sessions: [] },
        { label: "Previous 7 Days", sessions: [] },
        { label: "Older", sessions: [] },
    ];

    sessions.forEach((session) => {
        const date = new Date(session.created_at || Date.now());
        if (date >= today) {
            groups[0].sessions.push(session);
        } else if (date >= yesterday) {
            groups[1].sessions.push(session);
        } else if (date >= sevenDaysAgo) {
            groups[2].sessions.push(session);
        } else {
            groups[3].sessions.push(session);
        }
    });

    return groups.filter((g) => g.sessions.length > 0);
}

export function Sidebar({
    isOpen,
    setIsOpen,
    sessions,
    currentSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    onDeleteAllSessions,
    onUpdateSessionTitle,
    isLoading
}: SidebarProps) {
    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
    const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [isSavingTitle, setIsSavingTitle] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    const [apiKeyModalReason, setApiKeyModalReason] = useState<"onboarding" | "limit_reached" | "doc_limit">("onboarding");

    // Key state for sidebar widget
    const [hasKey, setHasKey] = useState(false);
    const [currentModel, setCurrentModel] = useState("gemini-3.6-flash");
    const [freePromptsUsed, setFreePromptsUsed] = useState(0);

    const { user, signOut } = useAuth();
    const editInputRef = useRef<HTMLInputElement>(null);

    const refreshKeyState = () => {
        const keyExists = hasConfiguredApiKey();
        setHasKey(keyExists);
        setCurrentModel(getStoredModel());
        setFreePromptsUsed(getFreePromptCount());
    };

    useEffect(() => {
        refreshKeyState();

        // First-time visit or login: show setup prompt if no key is configured
        if (typeof window !== "undefined") {
            const hasKeyNow = hasConfiguredApiKey();
            const prompted = localStorage.getItem("askdoc_gemini_setup_prompted");
            if (!hasKeyNow && !prompted) {
                localStorage.setItem("askdoc_gemini_setup_prompted", "true");
                setApiKeyModalReason("onboarding");
                setIsApiKeyModalOpen(true);
            }
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (editingSessionId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingSessionId]);

    const handleStartEdit = (e: React.MouseEvent, session: Session) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingSessionId(session.id);
        setEditingTitle(session.title || "New Chat");
    };

    const handleCancelEdit = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setEditingSessionId(null);
        setEditingTitle("");
    };

    const handleSaveTitle = async (e: React.FormEvent | React.MouseEvent, sessionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const trimmed = editingTitle.trim();
        if (!trimmed) return;
        setIsSavingTitle(true);
        try {
            if (onUpdateSessionTitle) {
                await onUpdateSessionTitle(sessionId, trimmed);
            } else {
                await updateSessionTitle(sessionId, trimmed);
            }
            setEditingSessionId(null);
        } catch (err) {
            console.error("Failed to update session title:", err);
        } finally {
            setIsSavingTitle(false);
        }
    };

    const handleNewChatClick = async () => {
        // Enforce free tier 1-session limit if user has no custom API key
        if (!hasConfiguredApiKey() && sessions.length >= FREE_SESSION_LIMIT) {
            setApiKeyModalReason("limit_reached");
            setIsApiKeyModalOpen(true);
            return;
        }

        setIsCreating(true);
        try {
            await onNewChat();
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, session: Session) => {
        e.preventDefault();
        e.stopPropagation();
        setSessionToDelete(session);
    };

    const handleConfirmDelete = async () => {
        if (!sessionToDelete) return;
        setDeletingSessionId(sessionToDelete.id);
        try {
            await onDeleteSession(sessionToDelete.id);
            setSessionToDelete(null);
        } catch (err) {
            console.error("Failed to delete session:", err);
        } finally {
            setDeletingSessionId(null);
        }
    };

    const handleSignOut = async () => {
        await signOut();
    };

    const sessionGroups = groupSessionsByRecency(sessions);

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Content */}
            <div
                className={cn(
                    "fixed md:static inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--border-color)]/80 bg-[var(--bg-sidebar)] transition-all duration-300 ease-in-out font-sans",
                    isOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden"
                )}
            >
                {/* Header Brand */}
                <div className="flex h-[52px] items-center justify-between px-4 border-b border-[var(--border-color)]/60 shrink-0">
                    <Link
                        href="/"
                        className="font-serif font-bold text-xl tracking-tight text-[var(--accent-color)] hover:opacity-80 transition-opacity"
                    >
                        AskDoc
                    </Link>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                        title="Close Sidebar"
                        aria-label="Close Sidebar"
                    >
                        <PanelLeft className="w-4 h-4" />
                    </button>
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 custom-scrollbar min-h-0 text-xs">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-32 text-[var(--text-muted)] gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-color)]" />
                            <span className="text-[11px]">Loading chats...</span>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="text-center text-[var(--text-muted)] py-10 px-3 space-y-1">
                            <p className="font-semibold text-xs text-[var(--text-main)]">No conversations yet</p>
                            <p className="text-[11px] leading-relaxed">Upload a document or ask a question to start.</p>
                        </div>
                    ) : (
                        sessionGroups.map((group) => (
                            <div key={group.label} className="space-y-1">
                                <div className="px-2.5 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                    {group.label}
                                </div>
                                <AnimatePresence initial={false}>
                                    {group.sessions.map((session) => {
                                        const isActive = session.id === currentSessionId;
                                        const isEditing = editingSessionId === session.id;

                                        return (
                                            <motion.div
                                                key={session.id}
                                                layout
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                {isEditing ? (
                                                    <form
                                                        onSubmit={(e) => handleSaveTitle(e, session.id)}
                                                        className="flex items-center gap-1 px-2 py-1.5 bg-[var(--bg-main)] rounded-xl border border-[var(--accent-color)] shadow-xs"
                                                    >
                                                        <input
                                                            ref={editInputRef}
                                                            type="text"
                                                            value={editingTitle}
                                                            onChange={(e) => setEditingTitle(e.target.value)}
                                                            className="flex-1 bg-transparent text-xs text-[var(--text-main)] focus:outline-none min-w-0 font-medium px-1"
                                                            disabled={isSavingTitle}
                                                            maxLength={60}
                                                        />
                                                        <button
                                                            type="submit"
                                                            disabled={isSavingTitle}
                                                            className="p-1 hover:bg-[var(--accent-color)]/20 text-[var(--accent-color)] rounded-md transition-colors shrink-0 cursor-pointer"
                                                            title="Save"
                                                        >
                                                            {isSavingTitle ? (
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <Check className="w-3 h-3 stroke-[2.5]" />
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleCancelEdit}
                                                            disabled={isSavingTitle}
                                                            className="p-1 hover:bg-red-500/20 text-red-500 rounded-md transition-colors shrink-0 cursor-pointer"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </form>
                                                ) : (
                                                    <div
                                                        onClick={() => onSelectSession(session.id)}
                                                        className={cn(
                                                            "group flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer select-none",
                                                            isActive
                                                                ? "bg-[var(--bg-main)] text-[var(--text-main)] font-semibold border border-[var(--border-color)] shadow-2xs"
                                                                : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]/60 hover:text-[var(--text-main)]"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                                                            {session.file_path || session.file_name ? (
                                                                <FileText className={cn(
                                                                    "w-3.5 h-3.5 shrink-0 transition-colors",
                                                                    isActive ? "text-[var(--accent-color)]" : "text-[var(--text-muted)] group-hover:text-[var(--accent-color)]"
                                                                )} />
                                                            ) : (
                                                                <MessageSquare className={cn(
                                                                    "w-3.5 h-3.5 shrink-0 transition-colors",
                                                                    isActive ? "text-[var(--accent-color)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-main)]"
                                                                )} />
                                                            )}
                                                            <span className="truncate leading-snug">{session.title || "New Chat"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleStartEdit(e, session)}
                                                                className="p-1 hover:bg-[var(--accent-color)]/15 text-[var(--text-muted)] hover:text-[var(--accent-color)] rounded-md transition-all cursor-pointer"
                                                                title="Rename chat"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleDeleteClick(e, session)}
                                                                disabled={deletingSessionId === session.id}
                                                                className="p-1 hover:bg-red-500/15 text-red-500 rounded-md transition-all disabled:opacity-100 cursor-pointer"
                                                                title="Delete session"
                                                            >
                                                                {deletingSessionId === session.id ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin text-red-500" />
                                                                ) : (
                                                                    <Trash2 className="w-3 h-3" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer User Profile & Settings */}
                <div className="p-3 border-t border-[var(--border-color)]/60 space-y-2 font-sans shrink-0">
                    {/* Gemini Key Setup / Status widget */}
                    <div>
                        {!hasKey ? (
                            <button
                                onClick={() => {
                                    setApiKeyModalReason("onboarding");
                                    setIsApiKeyModalOpen(true);
                                }}
                                className="w-full text-left p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/15 hover:border-amber-500/40 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 truncate">
                                                Free Trial Active
                                            </p>
                                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                                {Math.min(freePromptsUsed, FREE_PROMPT_LIMIT)}/{FREE_PROMPT_LIMIT}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-amber-600/90 dark:text-amber-400/90 font-semibold mt-0.5">
                                            Setup Gemini Key for unlimited →
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="w-full text-left p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 stroke-[2.5]" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 truncate">
                                            Gemini Key Active
                                        </p>
                                        <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-mono truncate">
                                            {currentModel}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* User profile row */}
                    <div className="px-2.5 py-1.5 flex items-center justify-between rounded-xl bg-[var(--bg-hover)]/50 text-xs border border-[var(--border-color)]/60">
                        <div className="flex items-center gap-2 truncate pr-1">
                            <div className="w-6 h-6 rounded-full bg-[var(--accent-color)] text-white flex items-center justify-center font-bold shrink-0 text-xs shadow-2xs">
                                {user?.email ? user.email[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
                            </div>
                            <span className="truncate font-semibold text-[var(--text-main)] text-[11px]">
                                {user?.email || "Guest User"}
                            </span>
                        </div>
                        {user ? (
                            <button
                                onClick={handleSignOut}
                                className="p-1 hover:bg-red-500/10 text-red-500 rounded-md transition-colors cursor-pointer"
                                title="Sign Out"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsAuthOpen(true)}
                                className="p-1 hover:bg-[var(--accent-color)]/20 text-[var(--accent-color)] rounded-md transition-colors font-bold flex items-center gap-1 text-[10px] cursor-pointer"
                                title="Sign In"
                            >
                                <LogIn className="w-3 h-3" />
                                <span>Sign In</span>
                            </button>
                        )}
                    </div>

                    {/* Settings Button */}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-[var(--bg-hover)]/70 rounded-xl transition-colors text-xs text-[var(--text-main)] font-medium cursor-pointer"
                    >
                        <Settings className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                        <span>Settings & Info</span>
                    </button>
                </div>
            </div>

            {/* Chat Delete Confirmation Modal */}
            <AnimatePresence>
                {sessionToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !deletingSessionId && setSessionToDelete(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 z-10 font-sans space-y-4"
                        >
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0 text-red-500 border border-red-500/20">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div className="space-y-1.5 min-w-0 flex-1">
                                    <h3 className="text-base font-bold text-[var(--text-main)]">Delete Chat?</h3>
                                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                                        Are you sure you want to delete <span className="font-semibold text-[var(--text-main)] break-all">&ldquo;{sessionToDelete.title || "this chat"}&rdquo;</span>?
                                    </p>
                                    <p className="text-[11px] text-red-500/90 font-medium">
                                        This will permanently remove all messages, uploaded files, and vector index data across all storage tiers.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-color)]/40">
                                <button
                                    type="button"
                                    onClick={() => setSessionToDelete(null)}
                                    disabled={!!deletingSessionId}
                                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]/60 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDelete}
                                    disabled={!!deletingSessionId}
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all cursor-pointer disabled:opacity-70"
                                >
                                    {deletingSessionId ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Delete</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ApiKeySetupModal
                isOpen={isApiKeyModalOpen}
                onClose={() => {
                    setIsApiKeyModalOpen(false);
                    refreshKeyState();
                }}
                reason={apiKeyModalReason}
                onSuccess={refreshKeyState}
            />

            <SettingsDialog
                isOpen={isSettingsOpen}
                onClose={() => {
                    setIsSettingsOpen(false);
                    refreshKeyState();
                }}
                onDeleteAllSessions={onDeleteAllSessions}
            />

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                canClose={!!user}
            />
        </>
    );
}
