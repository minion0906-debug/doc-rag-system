import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Server, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-serif selection:bg-[var(--accent-color)] selection:text-white flex flex-col justify-between">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-[var(--bg-main)]/85 backdrop-blur-md border-b border-[var(--border-color)]">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-sm font-semibold">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--accent-color)] to-amber-500 bg-clip-text text-transparent">
                            AskDoc
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full space-y-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-bold uppercase tracking-wider mb-4">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Data Protection & Privacy</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-main)] mb-3">
                        Privacy Policy
                    </h1>
                    <p className="text-sm font-medium text-[var(--text-muted)]">
                        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>

                <div className="space-y-8 text-[var(--text-muted)] leading-relaxed font-medium text-base">
                    {/* Section 1 */}
                    <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
                        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                            <Lock className="w-5 h-5 text-[var(--accent-color)]" />
                            1. Introduction & Overview
                        </h2>
                        <p>
                            Welcome to AskDoc. We respect your privacy and are committed to protecting your personal information and uploaded document contents. This Privacy Policy explains how our Retrieval-Augmented Generation (RAG) platform collects, processes, and protects your information.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
                        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                            <Eye className="w-5 h-5 text-[var(--accent-color)]" />
                            2. Information We Collect
                        </h2>
                        <p>
                            We only collect information necessary to deliver semantic document retrieval and Q&A features:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                            <li><strong className="text-[var(--text-main)]">Uploaded Documents:</strong> Files you upload (PDF, DOCX, XLSX, PPTX, CSV, TXT) are parsed and vectorized to enable search.</li>
                            <li><strong className="text-[var(--text-main)]">Chat Interaction Data:</strong> Search queries, user prompts, and conversation history stored securely per session.</li>
                            <li><strong className="text-[var(--text-main)]">Authentication Claims:</strong> Supabase user UUID identifiers to ensure strict user-scoped document access via Row-Level Security (RLS).</li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
                        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                            <Server className="w-5 h-5 text-[var(--accent-color)]" />
                            3. How We Process & Store Data
                        </h2>
                        <p>
                            Your data is processed strictly for retrieval operations:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                            <li>Documents are converted into embeddings via Pinecone Inference and indexed in vector namespaces isolated by user and session.</li>
                            <li>Context chunks are stored in Supabase PostgreSQL with encrypted connections.</li>
                            <li>Prompts and retrieved context passages are sent to Google Gemini LLM via secure APIs solely to synthesize answers.</li>
                            <li>When you delete a session or clear your history, all associated vectors, database records, and Supabase Storage files are immediately and permanently purged.</li>
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
                        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                            <Mail className="w-5 h-5 text-[var(--accent-color)]" />
                            4. Contact Us
                        </h2>
                        <p>
                            If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact us directly at:
                        </p>
                        <p className="pt-1">
                            <a href="mailto:contact@dilip.website" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--accent-color)] hover:underline font-bold text-sm">
                                <Mail className="w-4 h-4" />
                                contact@dilip.website
                            </a>
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] mt-12">
                <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--text-muted)] font-medium">
                    <p>© 2026 AskDoc. Built with ❤️ by Dilip Meghwal.</p>
                    <div className="flex gap-6">
                        <Link href="/terms" className="hover:text-[var(--text-main)] transition-colors">Terms of Service</Link>
                        <Link href="/docs" className="hover:text-[var(--text-main)] transition-colors">Documentation</Link>
                        <Link href="/chat" className="hover:text-[var(--text-main)] transition-colors">Chat</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
