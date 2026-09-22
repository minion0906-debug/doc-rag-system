import React from "react";
import Link from "next/link";
import { ArrowLeft, Server, Database, Code, Cloud, Terminal, Settings, Layers, ShieldCheck, Activity, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HealthStatus } from "@/components/HealthStatus";

export default function Documentation() {
    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-serif selection:bg-[var(--accent-color)] selection:text-white flex flex-col justify-between">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-[var(--bg-main)]/85 backdrop-blur-md border-b border-[var(--border-color)]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-sm font-semibold">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <HealthStatus />
                        <ThemeToggle />
                        <Link
                            href="/chat"
                            className="h-9 px-4 rounded-full bg-[var(--accent-color)] text-white text-xs sm:text-sm font-bold hover:bg-[var(--accent-hover)] transition-all flex items-center justify-center"
                        >
                            Open Chat
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-12 flex-1 w-full">
                {/* Sidebar Navigation */}
                <aside className="hidden md:block col-span-1 sticky top-24 h-fit space-y-4">
                    <div className="font-bold text-[var(--accent-color)] text-sm tracking-wider uppercase">Table of Contents</div>
                    <ul className="space-y-2 text-sm font-medium text-[var(--text-muted)]">
                        <li><a href="#getting-started" className="hover:text-[var(--text-main)] transition-colors">1. Getting Started</a></li>
                        <li><a href="#architecture" className="hover:text-[var(--text-main)] transition-colors">2. Architecture & Pipeline</a></li>
                        <li><a href="#configuration" className="hover:text-[var(--text-main)] transition-colors">3. Environment Configuration</a></li>
                        <li><a href="#observability" className="hover:text-[var(--text-main)] transition-colors">4. Observability & LangSmith</a></li>
                        <li><a href="#deployment" className="hover:text-[var(--text-main)] transition-colors">5. Deployment Guide</a></li>
                        <li><a href="#support" className="hover:text-[var(--text-main)] transition-colors">6. Support & Inquiries</a></li>
                    </ul>
                </aside>

                {/* Main Content */}
                <div className="col-span-1 md:col-span-3 space-y-16">
                    {/* Getting Started */}
                    <section id="getting-started" className="scroll-mt-24 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-bold uppercase tracking-wider">
                            <Terminal className="w-3.5 h-3.5" />
                            <span>Developer Guide</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-main)]">
                            AskDoc Documentation
                        </h1>
                        <p className="text-lg text-[var(--text-muted)] font-medium leading-relaxed">
                            AskDoc is a production-grade Retrieval-Augmented Generation (RAG) intelligence platform powered by Google Gemini, Pinecone vector search, Supabase PostgreSQL, and LangGraph.
                        </p>

                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4">
                            <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-[var(--accent-color)]" />
                                Quick Start Command Line
                            </h3>
                            <pre className="bg-[var(--bg-hover)] p-4 rounded-xl overflow-x-auto text-xs sm:text-sm text-[var(--text-main)] font-mono border border-[var(--border-color)]">
{`# 1. Clone the repository
git clone https://github.com/DJ-InfinityCoder/RAG.git
cd RAG

# 2. Setup & Start Backend (FastAPI + LangGraph)
cd RagBackend
python -m venv venv
.\\venv\\Scripts\\activate   # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 3. Setup & Start Frontend (Next.js 16 App Router)
cd ../RagFrontend
npm install
npm run dev`}
                            </pre>
                        </div>
                    </section>

                    {/* Architecture */}
                    <section id="architecture" className="scroll-mt-24 space-y-6">
                        <h2 className="text-3xl font-extrabold text-[var(--text-main)] flex items-center gap-3">
                            <Server className="w-7 h-7 text-[var(--accent-color)]" />
                            System Architecture
                        </h2>
                        <p className="text-[var(--text-muted)] font-medium">
                            The application is decoupled into modular layers for maximum reliability, speed, and clean code organization:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] space-y-3">
                                <h3 className="font-bold text-[var(--text-main)] text-lg flex items-center gap-2">
                                    <Code className="w-5 h-5 text-[var(--accent-color)]" />
                                    Frontend (Next.js 16)
                                </h3>
                                <ul className="list-disc pl-5 text-sm text-[var(--text-muted)] space-y-1.5 font-medium">
                                    <li>App Router, Server Components & Suspense</li>
                                    <li>Tailwind CSS design system with Dark/Light theme</li>
                                    <li>SSE Streaming token reader with real-time UI updates</li>
                                    <li>SWR for client-side caching & optimistic mutations</li>
                                </ul>
                            </div>

                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] space-y-3">
                                <h3 className="font-bold text-[var(--text-main)] text-lg flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-amber-500" />
                                    Backend (Modular FastAPI)
                                </h3>
                                <ul className="list-disc pl-5 text-sm text-[var(--text-muted)] space-y-1.5 font-medium">
                                    <li>7-layer architecture (<code className="text-xs">app/api</code>, <code className="text-xs">app/core</code>, <code className="text-xs">app/services</code>)</li>
                                    <li>Document parsers (PDF with OCR, DOCX, PPTX, XLSX, CSV)</li>
                                    <li>FlashRank reranker for high-precision context filtering</li>
                                    <li>In-memory sliding-window rate limiter & query caching</li>
                                </ul>
                            </div>

                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] space-y-3">
                                <h3 className="font-bold text-[var(--text-main)] text-lg flex items-center gap-2">
                                    <Database className="w-5 h-5 text-blue-500" />
                                    Storage & Vector Database
                                </h3>
                                <ul className="list-disc pl-5 text-sm text-[var(--text-muted)] space-y-1.5 font-medium">
                                    <li>Pinecone Serverless Index (1024-dim Llama embeddings)</li>
                                    <li>Supabase PostgreSQL for full-text search & chat memory</li>
                                    <li>Supabase Storage for secure multi-format document hosting</li>
                                    <li>PostgresSaver checkpointer for LangGraph state persistence</li>
                                </ul>
                            </div>

                            <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] space-y-3">
                                <h3 className="font-bold text-[var(--text-main)] text-lg flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    Security & Auth
                                </h3>
                                <ul className="list-disc pl-5 text-sm text-[var(--text-muted)] space-y-1.5 font-medium">
                                    <li>Supabase JWT token verification (HS256)</li>
                                    <li>User-isolated namespaces in Pinecone and PostgreSQL</li>
                                    <li>Cascade deletion across vector DB, storage bucket & SQL</li>
                                    <li>Strict 10MB file size boundary checks</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Configuration */}
                    <section id="configuration" className="scroll-mt-24 space-y-6">
                        <h2 className="text-3xl font-extrabold text-[var(--text-main)] flex items-center gap-3">
                            <Settings className="w-7 h-7 text-[var(--accent-color)]" />
                            Environment Variables
                        </h2>

                        <div className="space-y-6">
                            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
                                <div className="p-4 bg-[var(--bg-hover)] border-b border-[var(--border-color)] font-bold text-sm text-[var(--text-main)]">
                                    Backend Configuration (<code className="font-mono">RagBackend/.env</code>)
                                </div>
                                <div className="p-4 overflow-x-auto">
                                    <table className="w-full text-left text-xs sm:text-sm text-[var(--text-muted)]">
                                        <tbody className="divide-y divide-[var(--border-color)] font-medium">
                                            <tr><td className="p-2.5 font-mono text-[var(--text-main)] font-bold">GOOGLE_API_KEY</td><td className="p-2.5">Google Gemini API key for chat synthesis and generation</td></tr>
                                            <tr><td className="p-2.5 font-mono text-[var(--text-main)] font-bold">PINECONE_API_KEY</td><td className="p-2.5">Pinecone vector database API key</td></tr>
                                            <tr><td className="p-2.5 font-mono text-[var(--text-main)] font-bold">DATABASE_URL</td><td className="p-2.5">PostgreSQL connection string (Supabase)</td></tr>
                                            <tr><td className="p-2.5 font-mono text-[var(--text-main)] font-bold">ALLOWED_ORIGINS</td><td className="p-2.5">Comma-separated CORS origins (e.g. <code className="font-mono text-xs">https://askdoc.dilip.website</code>)</td></tr>
                                            <tr><td className="p-2.5 font-mono text-[var(--text-main)] font-bold">GEMINI_MODEL</td><td className="p-2.5">Active Gemini model (default: <code className="font-mono text-xs">gemini-3.6-flash</code>)</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Observability */}
                    <section id="observability" className="scroll-mt-24 space-y-4">
                        <h2 className="text-3xl font-extrabold text-[var(--text-main)] flex items-center gap-3">
                            <Activity className="w-7 h-7 text-[var(--accent-color)]" />
                            Observability & LangSmith
                        </h2>
                        <p className="text-[var(--text-muted)] font-medium">
                            AskDoc natively streams telemetry and trace metadata directly to LangSmith dashboards:
                        </p>
                        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-3 font-medium text-sm text-[var(--text-muted)]">
                            <p><strong className="text-[var(--text-main)]">Traced Nodes:</strong> <code className="text-xs bg-[var(--bg-hover)] px-2 py-0.5 rounded border border-[var(--border-color)]">classify_intent</code>, <code className="text-xs bg-[var(--bg-hover)] px-2 py-0.5 rounded border border-[var(--border-color)]">rephrase_query</code>, <code className="text-xs bg-[var(--bg-hover)] px-2 py-0.5 rounded border border-[var(--border-color)]">retrieve</code>, <code className="text-xs bg-[var(--bg-hover)] px-2 py-0.5 rounded border border-[var(--border-color)]">rerank</code>, <code className="text-xs bg-[var(--bg-hover)] px-2 py-0.5 rounded border border-[var(--border-color)]">grade_retrieval</code>, <code className="text-xs bg-[var(--bg-hover)] px-2 py-0.5 rounded border border-[var(--border-color)]">generate_answer</code>.</p>
                            <p><strong className="text-[var(--text-main)]">Filterable Tags:</strong> <code className="text-xs font-mono">session:&#123;id&#125;</code>, <code className="text-xs font-mono">user:&#123;id&#125;</code>, <code className="text-xs font-mono">askdoc-streaming</code>.</p>
                        </div>
                    </section>

                    {/* Support */}
                    <section id="support" className="scroll-mt-24 space-y-4">
                        <h2 className="text-3xl font-extrabold text-[var(--text-main)] flex items-center gap-3">
                            <Mail className="w-7 h-7 text-[var(--accent-color)]" />
                            Support & Contact
                        </h2>
                        <p className="text-[var(--text-muted)] font-medium">
                            Have questions, suggestions, or need help deploying AskDoc in your organization?
                        </p>
                        <div>
                            <a href="mailto:contact@dilip.website" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--accent-color)] hover:bg-[var(--bg-hover)] font-bold text-sm transition-all">
                                <Mail className="w-4 h-4" />
                                contact@dilip.website
                            </a>
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] mt-12">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--text-muted)] font-medium">
                    <p>© 2026 AskDoc. Built with ❤️ by Dilip Meghwal.</p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-[var(--text-main)] transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-[var(--text-main)] transition-colors">Terms of Service</Link>
                        <Link href="/evaluation" className="hover:text-[var(--text-main)] transition-colors">Evaluation Report</Link>
                        <Link href="/chat" className="hover:text-[var(--text-main)] transition-colors">Chat</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
