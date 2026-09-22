"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { 
    Trash2, 
    Info, 
    Loader2, 
    Sun, 
    Moon, 
    Monitor, 
    Key, 
    Cpu, 
    Eye, 
    EyeOff, 
    Check, 
    ExternalLink,
    Sparkles,
    ShieldAlert
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { 
    getStoredApiKey, 
    setStoredApiKey, 
    getStoredModel, 
    setStoredModel,
    DEFAULT_GEMINI_MODEL 
} from "@/lib/api";

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onDeleteAllSessions: () => Promise<void>;
}

const AVAILABLE_MODELS = [
    { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", tag: "Fastest & Recommended" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tag: "Thinking & Complex RAG" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tag: "Deep Reasoning & Long Context" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", tag: "Legacy Fast" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", tag: "Legacy Pro" },
];

export function SettingsDialog({ isOpen, onClose, onDeleteAllSessions }: SettingsDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { theme, setTheme } = useTheme();

    // Gemini API Key & Model State
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState(DEFAULT_GEMINI_MODEL);
    const [customModel, setCustomModel] = useState("");
    const [isCustomModel, setIsCustomModel] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const currentKey = getStoredApiKey();
            const currentModel = getStoredModel();
            setApiKey(currentKey);

            const isStandard = AVAILABLE_MODELS.some(m => m.id === currentModel);
            if (isStandard) {
                setModel(currentModel);
                setIsCustomModel(false);
                setCustomModel("");
            } else if (currentModel) {
                setModel("custom");
                setIsCustomModel(true);
                setCustomModel(currentModel);
            } else {
                setModel(DEFAULT_GEMINI_MODEL);
            }
            setIsSaved(false);
        }
    }, [isOpen]);

    const handleSaveAiSettings = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setStoredApiKey(apiKey);
        const finalModel = isCustomModel && customModel.trim() ? customModel.trim() : model;
        setStoredModel(finalModel);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
    };

    const handleDeleteAll = async () => {
        if (confirm("Are you sure you want to delete ALL chat history? This action cannot be undone.")) {
            setIsDeleting(true);
            try {
                await onDeleteAllSessions();
                onClose();
            } catch (error) {
                console.error("Failed to delete all sessions:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Settings & Preferences"
            description="Manage your AI model configurations, visual appearance, and account data"
        >
            <div className="space-y-6 font-sans">
                {/* Gemini AI BYOK Section */}
                <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3.5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[var(--accent-color)]/10 text-[var(--accent-color)] flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-main)]">
                                    Google Gemini AI Configuration
                                </h3>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Bring your own Gemini API key & select active model
                                </p>
                            </div>
                        </div>
                        {apiKey.trim() ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold tracking-tight flex items-center gap-1 border border-emerald-500/20 shrink-0">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Saved
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold tracking-tight border border-amber-500/20 shrink-0">
                                Key Required
                            </span>
                        )}
                    </div>

                    <form onSubmit={handleSaveAiSettings} className="space-y-4 pt-1">
                        {/* Gemini API Key */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                                    <Key className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                                    Gemini API Key
                                </label>
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[var(--accent-color)] hover:underline inline-flex items-center gap-1 font-semibold"
                                >
                                    <span>Get Free Key (Google AI Studio)</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="relative">
                                <input
                                    type={showApiKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Paste your Gemini API key (e.g. AIzaSy...)"
                                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-2.5 pl-3.5 pr-10 text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)]/20 transition-all placeholder:text-[var(--text-muted)]/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1.5 rounded-lg hover:bg-[var(--bg-hover)]"
                                    title={showApiKey ? "Hide Key" : "Show Key"}
                                    tabIndex={-1}
                                >
                                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                Stored securely in your browser&apos;s localStorage and sent only with your chat requests.
                            </p>
                        </div>

                        {/* Gemini Model Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                                Gemini Model
                            </label>
                            <select
                                value={isCustomModel ? "custom" : model}
                                onChange={(e) => {
                                    if (e.target.value === "custom") {
                                        setIsCustomModel(true);
                                    } else {
                                        setIsCustomModel(false);
                                        setModel(e.target.value);
                                    }
                                }}
                                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)]/20 transition-all font-medium cursor-pointer"
                            >
                                {AVAILABLE_MODELS.map((m) => (
                                    <option key={m.id} value={m.id} className="bg-[var(--bg-card)] text-[var(--text-main)] py-1">
                                        {m.name} — {m.tag}
                                    </option>
                                ))}
                                <option value="custom" className="bg-[var(--bg-card)] text-[var(--text-main)]">
                                    Custom Model ID...
                                </option>
                            </select>

                            {/* Custom Model Text Input */}
                            {isCustomModel && (
                                <input
                                    type="text"
                                    value={customModel}
                                    onChange={(e) => setCustomModel(e.target.value)}
                                    placeholder="Enter model identifier (e.g. gemini-3.6-flash)"
                                    className="w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)] transition-all"
                                />
                            )}
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-1">
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95"
                            >
                                {isSaved ? (
                                    <>
                                        <Check className="w-4 h-4 stroke-[3]" />
                                        <span>Saved Successfully</span>
                                    </>
                                ) : (
                                    <span>Save Configuration</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Appearance Theme */}
                <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Appearance Theme
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setTheme("light")}
                            className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all font-medium cursor-pointer ${
                                theme === "light"
                                    ? "border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--accent-color)] font-bold ring-2 ring-[var(--accent-color)]/20 shadow-sm"
                                    : "border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
                            }`}
                        >
                            <Sun className="w-5 h-5 text-amber-500" />
                            <span className="text-xs">Light</span>
                        </button>
                        <button
                            onClick={() => setTheme("dark")}
                            className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all font-medium cursor-pointer ${
                                theme === "dark"
                                    ? "border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--accent-color)] font-bold ring-2 ring-[var(--accent-color)]/20 shadow-sm"
                                    : "border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
                            }`}
                        >
                            <Moon className="w-5 h-5 text-amber-400" />
                            <span className="text-xs">Dark</span>
                        </button>
                        <button
                            onClick={() => setTheme("system")}
                            className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all font-medium cursor-pointer ${
                                theme === "system"
                                    ? "border-[var(--accent-color)] bg-[var(--accent-color)]/10 text-[var(--accent-color)] font-bold ring-2 ring-[var(--accent-color)]/20 shadow-sm"
                                    : "border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
                            }`}
                        >
                            <Monitor className="w-5 h-5 text-amber-500" />
                            <span className="text-xs">System</span>
                        </button>
                    </div>
                </div>

                {/* About Section */}
                <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        About AskDoc
                    </h3>
                    <div className="p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)] space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                            <p className="text-[var(--text-main)] font-bold text-xs">AskDoc Enterprise RAG</p>
                            <span className="px-2 py-0.5 rounded-md bg-[var(--bg-hover)] text-[10px] font-mono text-[var(--text-muted)]">v2.1.0</span>
                        </div>
                        <p className="text-[var(--text-muted)] leading-relaxed text-[11px]">
                            Hybrid retrieval pipeline powered by Google Gemini, Pinecone vector search, FlashRank reranker, and Supabase Postgres.
                        </p>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="space-y-2.5">
                    <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Danger Zone
                    </h3>
                    <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20 space-y-3">
                        <p className="text-red-600 dark:text-red-400 text-xs font-medium leading-relaxed">
                            Permanently delete all of your chat sessions, messages, and vector embeddings.
                        </p>
                        <button
                            onClick={handleDeleteAll}
                            disabled={isDeleting}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all text-xs font-bold disabled:opacity-50 cursor-pointer shadow-sm active:scale-98"
                        >
                            {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                            <span>{isDeleting ? "Deleting All Chats..." : "Clear All My Chats"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
