"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";
import { LogIn, UserPlus, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    canClose?: boolean;
}

export function AuthModal({ isOpen, onClose, onSuccess, canClose = true }: AuthModalProps) {
    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            if (mode === "signin") {
                const { error: err } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (err) throw err;
                if (onSuccess) onSuccess();
                onClose();
            } else {
                const { data, error: err } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
                    },
                });
                if (err) throw err;

                if (data.session) {
                    // Session created immediately (Auto logged in)
                    if (onSuccess) onSuccess();
                    onClose();
                } else if (data.user) {
                    // Account created but email confirmation required
                    setSuccessMessage("Account created successfully! Please check your email inbox to verify your account before signing in.");
                    setMode("signin");
                }
            }
        } catch (err: any) {
            const rawMsg = err.message || "";
            if (rawMsg.toLowerCase().includes("rate limit") || rawMsg.toLowerCase().includes("over_email_send_rate_limit")) {
                setError("Email rate limit exceeded. Supabase limits how many auth emails can be sent per hour. Please wait a few minutes before trying again, or disable 'Confirm Email' in your Supabase Dashboard (Auth > Providers > Email).");
            } else {
                setError(rawMsg || "Authentication failed. Please check your credentials.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleModalClose = () => {
        if (canClose) {
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleModalClose}
            title={mode === "signin" ? "Sign In Required" : "Create AskDoc Account"}
            showCloseButton={canClose}
        >
            <div className="space-y-4 pt-1 font-serif">
                <p className="text-xs text-[var(--text-muted)] font-medium text-center">
                    Please sign in or create an account to start chatting and managing your documents.
                </p>

                {/* Mode Selector Tabs */}
                <div className="flex border-b border-[var(--border-color)]">
                    <button
                        type="button"
                        onClick={() => { setMode("signin"); setError(null); setSuccessMessage(null); }}
                        className={`flex-1 py-2 text-center font-bold text-sm border-b-2 transition-all ${
                            mode === "signin"
                                ? "border-[var(--accent-color)] text-[var(--accent-color)]"
                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode("signup"); setError(null); setSuccessMessage(null); }}
                        className={`flex-1 py-2 text-center font-bold text-sm border-b-2 transition-all ${
                            mode === "signup"
                                ? "border-[var(--accent-color)] text-[var(--accent-color)]"
                                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        }`}
                    >
                        Sign Up
                    </button>
                </div>

                {successMessage && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                        <span>{successMessage}</span>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-500 flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)] font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1">Password</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded p-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)] font-medium"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-bold rounded transition-colors text-sm disabled:opacity-50 mt-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : mode === "signin" ? (
                            <LogIn className="w-4 h-4" />
                        ) : (
                            <UserPlus className="w-4 h-4" />
                        )}
                        <span>{loading ? "Processing..." : mode === "signin" ? "Sign In" : "Create Account"}</span>
                    </button>
                </form>
            </div>
        </Modal>
    );
}
