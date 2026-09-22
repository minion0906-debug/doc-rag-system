"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { 
    Key, 
    Cpu, 
    Eye, 
    EyeOff, 
    Check, 
    ExternalLink, 
    Sparkles, 
    ShieldCheck, 
    ArrowRight,
    AlertCircle
} from "lucide-react";
import { 
    getStoredApiKey, 
    setStoredApiKey, 
    getStoredModel, 
    setStoredModel,
    DEFAULT_GEMINI_MODEL,
    FREE_PROMPT_LIMIT
} from "@/lib/api";

interface ApiKeySetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason?: "onboarding" | "limit_reached" | "doc_limit";
    onSuccess?: () => void;
}

const AVAILABLE_MODELS = [
    { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", tag: "Fastest & Recommended" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tag: "Thinking & Complex RAG" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tag: "Deep Reasoning & Long Context" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", tag: "Legacy Fast" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", tag: "Legacy Pro" },
];

export function ApiKeySetupModal({ isOpen, onClose, reason = "onboarding", onSuccess }: ApiKeySetupModalProps) {
    const [apiKey, setApiKey] = useState("");
    const [model, setModel] = useState(DEFAULT_GEMINI_MODEL);
    const [customModel, setCustomModel] = useState("");
    const [isCustomModel, setIsCustomModel] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

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
            setErrorMsg("");
        }
    }, [isOpen]);

    const handleSave = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!apiKey.trim()) {
            setErrorMsg("Please enter a valid Gemini API key from Google AI Studio.");
            return;
        }

        setStoredApiKey(apiKey.trim());
        const finalModel = isCustomModel && customModel.trim() ? customModel.trim() : model;
        setStoredModel(finalModel);

        if (onSuccess) onSuccess();
        onClose();
    };

    const handleTryFree = () => {
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={reason === "limit_reached" ? "Free Trial Limit Reached" : "Configure Your Gemini AI"}
            description={
                reason === "limit_reached"
                    ? `You have used your ${FREE_PROMPT_LIMIT} free demo messages. Add your Gemini API key for unlimited chat.`
                    : reason === "doc_limit"
                    ? "Free demo allows 1 document. Add your Gemini API key for unlimited document indexing."
                    : "Connect your Google Gemini API key to enable fast, unlimited document intelligence."
            }
        >
            <div className="space-y-5 font-sans">
                {/* Alert banner if limit reached */}
                {reason === "limit_reached" && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                        <div>
                            <p className="font-bold">Free trial message limit reached ({FREE_PROMPT_LIMIT}/{FREE_PROMPT_LIMIT})</p>
                            <p className="text-[11px] opacity-90 mt-0.5">
                                Add your free Google Gemini API key below to continue chatting with this document and create unlimited sessions.
                            </p>
                        </div>
                    </div>
                )}

                {reason === "doc_limit" && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                        <div>
                            <p className="font-bold">Document limit reached</p>
                            <p className="text-[11px] opacity-90 mt-0.5">
                                The free demo supports 1 document. Enter your Gemini API key below to upload and index unlimited PDF, Word, PowerPoint, and Excel files.
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                    {/* Gemini API Key */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                                <span>Gemini API Key</span>
                                <span className="text-red-500">*</span>
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
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    if (errorMsg) setErrorMsg("");
                                }}
                                placeholder="Paste your Gemini API key (e.g. AIzaSy...)"
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-2.5 pl-3.5 pr-10 text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)]/20 transition-all placeholder:text-[var(--text-muted)]/50"
                                autoFocus
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
                        {errorMsg ? (
                            <p className="text-[11px] text-red-500 font-medium">{errorMsg}</p>
                        ) : (
                            <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Stored locally in your browser. Never shared or stored on external servers.</span>
                            </p>
                        )}
                    </div>

                    {/* Gemini Model Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--text-main)] flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                            <span>Gemini Model</span>
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
                            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)]/20 transition-all font-medium cursor-pointer"
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

                        {isCustomModel && (
                            <input
                                type="text"
                                value={customModel}
                                onChange={(e) => setCustomModel(e.target.value)}
                                placeholder="Enter model name (e.g. gemini-3.6-flash)"
                                className="w-full mt-2 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-2.5 px-3.5 text-xs font-mono text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)] transition-all"
                            />
                        )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-between gap-3 border-t border-[var(--border-color)]/60">
                        {reason === "onboarding" ? (
                            <button
                                type="button"
                                onClick={handleTryFree}
                                className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded-xl transition-all cursor-pointer"
                            >
                                Try Demo First ({FREE_PROMPT_LIMIT} messages)
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded-xl transition-all cursor-pointer"
                            >
                                Close
                            </button>
                        )}

                        <button
                            type="submit"
                            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer active:scale-95 ml-auto"
                        >
                            <span>Save & Unlock Full AI</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
