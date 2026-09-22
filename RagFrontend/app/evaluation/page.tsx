"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Play, Award, Target, Zap, ShieldCheck } from "lucide-react";
import { useSessions } from "@/lib/hooks";
import { evaluateSession, getSessionEvaluations, EvaluationItem } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HealthStatus } from "@/components/HealthStatus";

export default function EvaluationPage() {
    const { sessions, isLoading: isSessionsLoading } = useSessions();
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");
    const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
    const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
    const [isFetchingEvals, setIsFetchingEvals] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-select first session when loaded
    useEffect(() => {
        if (sessions && sessions.length > 0 && !selectedSessionId) {
            setSelectedSessionId(sessions[0].id);
        }
    }, [sessions, selectedSessionId]);

    // Fetch existing evaluations when session changes
    useEffect(() => {
        if (!selectedSessionId) return;

        let isMounted = true;
        setIsFetchingEvals(true);
        setError(null);

        getSessionEvaluations(selectedSessionId)
            .then((data) => {
                if (isMounted) {
                    setEvaluations(data);
                    setIsFetchingEvals(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    console.error("Failed to fetch evaluations:", err);
                    setEvaluations([]);
                    setIsFetchingEvals(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [selectedSessionId]);

    const handleRunEvaluation = async () => {
        if (!selectedSessionId) return;
        setIsEvaluating(true);
        setError(null);

        try {
            const data = await evaluateSession(selectedSessionId);
            setEvaluations(data);
        } catch (err: any) {
            console.error("Evaluation run failed:", err);
            setError(err.message || "Failed to execute evaluation suite.");
        } finally {
            setIsEvaluating(false);
        }
    };

    // Calculate Summary Averages
    const totalCount = evaluations.length;
    const avgOverall = totalCount > 0 
        ? Math.round(evaluations.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / totalCount) 
        : 0;
    const avgRelevance = totalCount > 0 
        ? Math.round(evaluations.reduce((acc, curr) => acc + (curr.relevance_score || 0), 0) / totalCount) 
        : 0;
    const avgAccuracy = totalCount > 0 
        ? Math.round(evaluations.reduce((acc, curr) => acc + (curr.accuracy_score || 0), 0) / totalCount) 
        : 0;
    const avgCompleteness = totalCount > 0 
        ? Math.round(evaluations.reduce((acc, curr) => acc + (curr.completeness_score || 0), 0) / totalCount) 
        : 0;

    const getScoreBadge = (score: number | null) => {
        if (score === null || score === undefined) return <span className="text-[var(--text-muted)]">N/A</span>;
        if (score >= 80) return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold text-xs border border-emerald-500/20">{score}%</span>;
        if (score >= 60) return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold text-xs border border-amber-500/20">{score}%</span>;
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-semibold text-xs border border-rose-500/20">{score}%</span>;
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] font-serif selection:bg-[var(--accent-color)] selection:text-white flex flex-col justify-between">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-[var(--bg-main)]/85 backdrop-blur-md border-b border-[var(--border-color)]">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/chat" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-sm font-semibold">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Chat</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <HealthStatus />
                        <ThemeToggle />
                        <Link
                            href="/"
                            className="h-9 px-4 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-xs sm:text-sm font-semibold text-[var(--text-main)] transition-all flex items-center justify-center"
                        >
                            Home
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-10 flex-1 w-full">
                {/* Title Section */}
                <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-bold uppercase tracking-wider mb-2">
                            <Award className="w-3.5 h-3.5" />
                            <span>Automated Quality Benchmark</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-main)] mb-2">
                            LLM Judge RAG Evaluation
                        </h1>
                        <p className="text-[var(--text-muted)] text-base font-medium">
                            Run automated Gemini LLM Judge evaluations to benchmark relevance, accuracy, and completeness across documents.
                        </p>
                    </div>

                    {/* Session Selector & Evaluate Trigger Button */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)]">
                        <select
                            className="bg-[var(--bg-hover)] text-[var(--text-main)] px-3 py-2 rounded-xl border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]/50 text-sm font-sans"
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                            disabled={isSessionsLoading || isEvaluating}
                        >
                            {isSessionsLoading ? (
                                <option>Loading sessions...</option>
                            ) : sessions && sessions.length > 0 ? (
                                sessions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.title} ({s.id.slice(0, 8)})
                                    </option>
                                ))
                            ) : (
                                <option value="">No sessions available</option>
                            )}
                        </select>

                        <button
                            onClick={handleRunEvaluation}
                            disabled={!selectedSessionId || isEvaluating}
                            className="flex items-center justify-center gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isEvaluating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Evaluating...</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-current" />
                                    <span>Run Evaluation</span>
                                </>
                            )}
                        </button>
                    </div>
                </section>

                {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-500 text-sm flex items-center gap-3 font-medium">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Score Summary Metrics */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] flex items-center gap-4">
                        <div className="p-3 bg-[var(--accent-color)]/10 rounded-xl text-[var(--accent-color)]"><Award className="w-6 h-6" /></div>
                        <div>
                            <div className="text-2xl font-bold text-[var(--text-main)]">{totalCount > 0 ? `${avgOverall}%` : "--"}</div>
                            <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Overall RAG Score</div>
                        </div>
                    </div>
                    <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Target className="w-6 h-6" /></div>
                        <div>
                            <div className="text-2xl font-bold text-[var(--text-main)]">{totalCount > 0 ? `${avgRelevance}%` : "--"}</div>
                            <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Relevance Score</div>
                        </div>
                    </div>
                    <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500"><ShieldCheck className="w-6 h-6" /></div>
                        <div>
                            <div className="text-2xl font-bold text-[var(--text-main)]">{totalCount > 0 ? `${avgAccuracy}%` : "--"}</div>
                            <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Faithfulness</div>
                        </div>
                    </div>
                    <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-color)] flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500"><Zap className="w-6 h-6" /></div>
                        <div>
                            <div className="text-2xl font-bold text-[var(--text-main)]">{totalCount > 0 ? `${avgCompleteness}%` : "--"}</div>
                            <div className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">Completeness</div>
                        </div>
                    </div>
                </section>

                {/* Evaluation Breakdown Table */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-[var(--text-main)]">Benchmark Question Results</h2>
                        {isFetchingEvals && (
                            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 font-medium">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Loading evaluation history...
                            </span>
                        )}
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--bg-hover)] text-[var(--text-main)] font-semibold border-b border-[var(--border-color)] text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Benchmark Query</th>
                                    <th className="p-4">RAG Answer Preview</th>
                                    <th className="p-4">Scores (Rel / Acc / Comp)</th>
                                    <th className="p-4">Overall Score</th>
                                    <th className="p-4">Judge Feedback</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)] font-medium">
                                {evaluations.length > 0 ? (
                                    evaluations.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-[var(--bg-hover)] transition-colors">
                                            <td className="p-4 font-semibold text-[var(--text-main)] max-w-xs">{item.question}</td>
                                            <td className="p-4 text-[var(--text-muted)] max-w-sm">
                                                <p className="line-clamp-2">{item.rag_answer || "No response generated"}</p>
                                            </td>
                                            <td className="p-4 text-xs space-y-1">
                                                <div>Rel: {getScoreBadge(item.relevance_score)}</div>
                                                <div>Acc: {getScoreBadge(item.accuracy_score)}</div>
                                                <div>Comp: {getScoreBadge(item.completeness_score)}</div>
                                            </td>
                                            <td className="p-4 font-bold">
                                                {getScoreBadge(item.overall_score)}
                                            </td>
                                            <td className="p-4 text-xs text-[var(--text-muted)] max-w-xs">
                                                {item.feedback || "Satisfactory RAG quality."}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                                            {isEvaluating ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-color)]" />
                                                    <span>Running Gemini LLM Judge evaluations...</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <p className="text-base font-bold text-[var(--text-main)]">No evaluation data for this session yet.</p>
                                                    <p className="text-xs">Select a session above and click <strong>"Run Evaluation"</strong> to generate benchmark scores.</p>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Evaluation Methodology Note */}
                <section className="bg-[var(--bg-card)] border border-[var(--accent-color)]/30 p-6 rounded-2xl flex gap-4">
                    <AlertCircle className="w-6 h-6 text-[var(--accent-color)] shrink-0" />
                    <div className="space-y-1">
                        <h3 className="font-bold text-[var(--text-main)]">LLM Judge Evaluation Methodology</h3>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed font-medium">
                            The evaluation engine executes gold-standard benchmark queries against your uploaded documents using AskDoc RAG retrieval (Pinecone + Supabase Postgres full-text search + FlashRank reranking). Gemini acts as an independent judge, scoring faithfulness to source documents, relevance to the query, and completeness.
                        </p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] mt-12">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[var(--text-muted)] font-medium">
                    <p>© 2026 AskDoc. Built with ❤️ by Dilip Meghwal.</p>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-[var(--text-main)] transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-[var(--text-main)] transition-colors">Terms of Service</Link>
                        <Link href="/docs" className="hover:text-[var(--text-main)] transition-colors">Documentation</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
