"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Cpu, Database, Zap, Sparkles } from "lucide-react";

const pipelineNodes = [
    { name: "User Query", sub: "FastAPI Route", icon: User },
    { name: "Intent Classifier", sub: "LangGraph Node", icon: Cpu },
    { name: "Pinecone + BM25", sub: "Reciprocal Rank Fusion", icon: Database },
    { name: "FlashRank Reranker", sub: "Top Candidate Scoring", icon: Zap },
    { name: "Gemini LLM", sub: "SSE Streaming", icon: Sparkles },
];

export function ArchitecturePipelineSection() {
    return (
        <section className="py-24 px-6 max-w-7xl mx-auto space-y-16 border-t border-[var(--border-color)]">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <span className="px-3.5 py-1 rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-bold uppercase tracking-wider">
                    Engineering Architecture
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--text-main)] tracking-tight">
                    Under the Hood Pipeline
                </h2>
                <p className="text-base sm:text-lg text-[var(--text-muted)] font-medium">
                    A multi-stage LangGraph StateGraph workflow built for latency, precision, and state persistence.
                </p>
            </div>

            {/* SVG Interactive Flow Pipeline */}
            <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                    {pipelineNodes.map((node, idx) => {
                        const IconComp = node.icon;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-center space-y-3 relative group hover:border-[var(--accent-color)] transition-all shadow-sm"
                            >
                                <div className="p-3 rounded-xl bg-[var(--bg-hover)] text-[var(--accent-color)] border border-[var(--border-color)] inline-block shadow-sm">
                                    <IconComp className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-[var(--text-main)]">
                                        {node.name}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
                                        {node.sub}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
