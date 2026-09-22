import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function TermsOfService() {
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
                        <FileText className="w-3.5 h-3.5" />
                        <span>Legal Agreement</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-main)] mb-3">
                        Terms of Service
                    </h1>
                    <p className="text-sm font-medium text-[var(--text-muted)]">
                        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>

                <div className="space-y-8 text-[var(--text-muted)] leading-relaxed font-medium text-base">
                    {/* Section 1 */}
                    <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
                        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[var(--accent-color)]" />
                            1. Acceptance of Terms
                        </h2>
                        <p>
                            By accessing or using AskDoc ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions, you may not access or use the application.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
                        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-[var(--accent-color)]" />
                            2. Permitted Use & Document Ownership
                        </h2>
                        <p>
                            You retain full ownership of all documents, data, and content you upload to AskDoc. You grant AskDoc a limited license solely to process, chunk, vectorize, and retrieve your content to answer your queries during your session.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                            <li>You agree not to upload harmful, malicious, or unlawful materials.</li>
                            <li>You are responsible for ensuring you hold appropriate rights to any confidential documents you upload.</li>
                            <li>The service enforces a 10MB maximum file size limit per upload.</li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
                        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            3. AI Disclaimer & Limitations
                        </h2>
                        <p>
                            AskDoc utilizes advanced language models (Google Gemini) and vector retrieval systems (Pinecone). While the system employs self-correcting retrieval, FlashRank reranking, and citation verifications, AI responses should be reviewed for critical financial, legal, or medical decisions.
                        </p>
                    </section>

                    {/* Section 4 */}
                    <section className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
                        <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                            <Mail className="w-5 h-5 text-[var(--accent-color)]" />
                            4. Contact & Inquiries
                        </h2>
                        <p>
                            For inquiries regarding terms, licensing, or enterprise deployment, please reach out to us at:
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
                        <Link href="/privacy" className="hover:text-[var(--text-main)] transition-colors">Privacy Policy</Link>
                        <Link href="/docs" className="hover:text-[var(--text-main)] transition-colors">Documentation</Link>
                        <Link href="/chat" className="hover:text-[var(--text-main)] transition-colors">Chat</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
