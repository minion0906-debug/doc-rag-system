"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, Database, Zap, Layers, CheckCircle2 } from "lucide-react";

const features = [
    {
        number: "01",
        icon: FileText,
        title: "Multi-Format Document Support",
        tagline: "Ingest PDF, DOCX, XLSX, PPTX & CSV",
        desc: "Ingest any document type effortlessly. Server-side 10MB file validation occurs instantly before parsing text into 500-token semantic chunks with 50-token overlapping boundaries.",
        badge: "Multi-Format Ingestion",
        stats: ["PDF / DOCX / XLSX", "PPTX / CSV", "10MB Server Validation"]
    },
    {
        number: "02",
        icon: Database,
        title: "Pinecone Hybrid Vector Search",
        tagline: "Dense Vectors + Sparse BM25 Keywords",
        desc: "Executes simultaneous dense embedding vector similarity queries alongside sparse BM25 keyword matching using Reciprocal Rank Fusion (RRF) for 99.4% precision.",
        badge: "Sparse + Dense RRF",
        stats: ["Pinecone Indexing", "BM25 Sparse Match", "Reciprocal Rank Fusion"]
    },
    {
        number: "03",
        icon: Zap,
        title: "FlashRank Candidate Reranking",
        tagline: "Ultra-Fast Context Re-scoring",
        desc: "Reranks top candidate passages before passing context to the Gemini LLM. Eliminates irrelevant noise, preserving token budget and driving millisecond latency.",
        badge: "FlashRank Engine",
        stats: ["Context Re-scoring", "Noise Elimination", "<1.2s Total Latency"]
    },
    {
        number: "04",
        icon: Layers,
        title: "LangGraph StateGraph & Checkpointer",
        tagline: "Stateful Reasoning & Ambiguity Detection",
        desc: "Orchestrates intent routing, quality-check loops, ambiguity detection, and persistent Postgres checkpointer thread memory for multi-turn conversations.",
        badge: "Postgres Checkpointer",
        stats: ["Intent Classification", "Ambiguity Check", "Multi-Turn Memory"]
    }
];

export function FeatureCardsSection() {
    return (
        <section className="py-12 px-6 max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <span className="px-3.5 py-1 rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-bold uppercase tracking-wider">
                    Apple & Stripe Style Stacked Scroll
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--text-main)] tracking-tight">
                    Architected for Uncompromising Quality
                </h2>
                <p className="text-base sm:text-lg text-[var(--text-muted)] font-medium">
                    Scroll down to explore how AskDoc processes, reranks, and streams citation-backed answers.
                </p>
            </div>

            {/* Stacked Cards Container */}
            <div className="space-y-12 relative pb-12">
                {features.map((feat, idx) => {
                    const IconComp = feat.icon;
                    return (
                        <div
                            key={idx}
                            className="sticky top-28"
                            style={{ zIndex: idx + 1 }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5 }}
                                className="p-8 sm:p-12 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6 transform-gpu transition-all hover:border-[var(--accent-color)]/50"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
                                    <div className="flex items-center gap-4">
                                        <span className="text-4xl font-extrabold text-[var(--accent-color)] font-mono opacity-80">
                                            {feat.number}
                                        </span>
                                        <div className="p-3 rounded-2xl bg-[var(--bg-hover)] text-[var(--accent-color)] border border-[var(--border-color)]">
                                            <IconComp className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-main)]">
                                                {feat.title}
                                            </h3>
                                            <p className="text-xs font-semibold text-[var(--accent-color)]">
                                                {feat.tagline}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border-color)] self-start sm:self-auto">
                                        {feat.badge}
                                    </span>
                                </div>

                                <p className="text-base text-[var(--text-muted)] leading-relaxed font-medium">
                                    {feat.desc}
                                </p>

                                <div className="flex flex-wrap gap-3 pt-2">
                                    {feat.stats.map((st, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-color)] text-xs text-[var(--text-main)] font-semibold"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                                            <span>{st}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
