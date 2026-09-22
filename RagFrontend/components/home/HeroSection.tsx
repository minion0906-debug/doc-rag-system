"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Github, FileText, Sparkles, Database, ShieldCheck } from "lucide-react";

const vectorNodes = [
    { cx: 150, cy: 120, r: 4, label: "Vector Node [0.84, 0.12]" },
    { cx: 350, cy: 80, r: 5, label: "Sparse BM25 Keyword" },
    { cx: 580, cy: 150, r: 4, label: "FlashRank Scored" },
    { cx: 750, cy: 100, r: 6, label: "Dense Embedding" },
    { cx: 900, cy: 220, r: 4, label: "Chunk Context" },
];

export function HeroSection() {
    return (
        <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center pt-8 pb-12 px-6 text-center overflow-hidden">
            {/* Ambient Background Gradient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[520px] bg-gradient-to-tr from-[var(--accent-color)]/15 via-amber-500/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

            {/* SVG Vector Space Network Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden max-w-7xl mx-auto -z-10">
                <svg className="w-full h-full opacity-30" viewBox="0 0 1000 400" fill="none">
                    {/* Connecting Vector Space Distance Lines */}
                    <motion.path
                        d="M150 120 L350 80 L580 150 L750 100 L900 220 M350 80 L750 100 M150 120 L580 150"
                        stroke="var(--accent-color)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Vector Nodes */}
                    {vectorNodes.map((node, i) => (
                        <g key={i}>
                            <motion.circle
                                cx={node.cx}
                                cy={node.cy}
                                r={node.r}
                                fill="var(--accent-color)"
                                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.25, 1] }}
                                style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
                                transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <motion.circle
                                cx={node.cx}
                                cy={node.cy}
                                r={node.r * 2.5}
                                stroke="var(--accent-color)"
                                strokeWidth="0.8"
                                opacity="0.4"
                                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
                                style={{ transformOrigin: `${node.cx}px ${node.cy}px` }}
                                transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                            />
                        </g>
                    ))}
                </svg>

                {/* Floating Doc Card 1 - Top Left */}
                <motion.div
                    animate={{ y: [0, -15, 0], rotate: [-4, 2, -4] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-12 left-6 md:left-12 p-4 rounded-xl bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-color)] hidden lg:flex items-center gap-3 opacity-75"
                >
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-left text-xs font-semibold">
                        <p className="text-[var(--text-main)] font-bold">Annual_Report_2025.pdf</p>
                        <p className="text-[var(--text-muted)]">Indexed • 142 Chunks</p>
                    </div>
                </motion.div>

                {/* Floating Doc Card 2 - Top Right */}
                <motion.div
                    animate={{ y: [0, 18, 0], rotate: [3, -3, 3] }}
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-16 right-6 md:right-16 p-4 rounded-xl bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-color)] hidden lg:flex items-center gap-3 opacity-75"
                >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                        <Database className="w-6 h-6" />
                    </div>
                    <div className="text-left text-xs font-semibold">
                        <p className="text-[var(--text-main)] font-bold">Pinecone Hybrid Index</p>
                        <p className="text-[var(--text-muted)]">Sparse + Dense Vectors</p>
                    </div>
                </motion.div>

                {/* Floating Doc Card 3 - Bottom Right */}
                <motion.div
                    animate={{ y: [0, -12, 0], rotate: [-2, 4, -2] }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute bottom-12 right-10 md:right-24 p-3.5 rounded-xl bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border-color)] hidden lg:flex items-center gap-3 opacity-70"
                >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="text-left text-xs">
                        <p className="text-[var(--text-main)] font-bold">FlashRank Reranked</p>
                        <p className="text-[var(--text-muted)]">Top 5 Context Selected</p>
                    </div>
                </motion.div>
            </div>

            <div className="max-w-4xl mx-auto space-y-8 flex flex-col items-center">
                {/* Main Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.15] text-[var(--text-main)] max-w-4xl mx-auto"
                >
                    Your documents, finally{" "}
                    <span className="bg-gradient-to-r from-[var(--accent-color)] via-amber-500 to-amber-600 bg-clip-text text-transparent">
                        answering back
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg sm:text-xl md:text-2xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed font-medium"
                >
                    Upload documents, ask complex questions, and receive instant, citation-backed answers with real-time SSE token streaming and FlashRank reranking.
                </motion.p>

                {/* Action CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2 w-full sm:w-auto"
                >
                    <Link
                        href="/chat"
                        className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[var(--accent-color)] text-white font-bold text-base hover:bg-[var(--accent-hover)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <span>Start Chatting</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                        href="https://github.com/DJ-InfinityCoder/RAG"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] font-semibold text-base hover:bg-[var(--bg-hover)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Github className="w-4 h-4 text-[var(--text-main)]" />
                        <span>Star on GitHub</span>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
