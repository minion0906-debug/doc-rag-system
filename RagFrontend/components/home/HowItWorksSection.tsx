"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Search, CheckCircle2, ArrowRight, FileText, Sparkles, Layers, Cpu } from "lucide-react";

const steps = [
    {
        id: 1,
        title: "1. Upload Documents",
        shortDesc: "Drag & drop PDF, DOCX, XLSX, PPTX, or CSV files",
        detail: "Files are processed server-side with strict 10MB validation, split into semantic overlapping chunks, and vectorized instantly.",
        icon: UploadCloud,
        badge: "Server Validation",
        preview: {
            title: "Q3_Financial_Summary.pdf",
            status: "Parsed & Vectorized",
            chunks: "84 Chunks",
            extraTitle: "Semantic Overlapping Chunks",
            extraSubtitle: "500 Tokens / 50 Token Overlap",
            subDetails: ["PDF Table Extraction", "OCR Scanned Fallback", "1024-dim Vectorization"]
        }
    },
    {
        id: 2,
        title: "2. Hybrid Rerank & Quality Check",
        shortDesc: "Pinecone Sparse/Dense Fusion + FlashRank Reranker",
        detail: "LangGraph queries Pinecone vectors & BM25 keyword indexes simultaneously, then re-scores top candidates using FlashRank before checking relevance quality.",
        icon: Search,
        badge: "Rerank Loop",
        preview: {
            title: "Top 5 Candidates Selected",
            status: "Score: 0.94 (Relevant)",
            chunks: "Context Extracted",
            extraTitle: "Query Vector Beam",
            extraSubtitle: "FlashRank Scoring Top 5",
            scores: [
                { label: "Doc #1", score: "0.94" },
                { label: "Doc #2", score: "0.89" },
                { label: "Doc #3", score: "0.82" },
                { label: "Doc #4", score: "0.41" }
            ]
        }
    },
    {
        id: 3,
        title: "3. Citation-Backed Response",
        shortDesc: "Real-Time SSE Token Streaming + Citations",
        detail: "Gemini streams verified answers token-by-token alongside exact page citations and response metrics.",
        icon: CheckCircle2,
        badge: "SSE Streaming",
        preview: {
            title: "Answer Generated in 0.8s",
            status: "100% Citation Accuracy",
            chunks: "3 Sources Linked",
            extraTitle: "Real-Time SSE Stream",
            extraSubtitle: "Gemini 3.6 Flash Active",
            citations: ["Page 12: Operating Income", "Page 14: Revenue Table", "Page 19: Outlook"]
        }
    }
];

export function HowItWorksSection() {
    const [activeStep, setActiveStep] = useState(1);

    return (
        <section className="py-24 px-6 max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <span className="px-3.5 py-1 rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-bold uppercase tracking-wider">
                    Interactive RAG Workflow
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--text-main)] tracking-tight">
                    How AskDoc Answers Your Questions
                </h2>
                <p className="text-base sm:text-lg text-[var(--text-muted)] font-medium">
                    Experience an enterprise-grade retrieval pipeline engineered for speed, accuracy, and absolute precision.
                </p>
            </div>

            {/* Interactive 3-Step Selection Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Left Step Selectors */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                    {steps.map((step) => {
                        const IconComp = step.icon;
                        const isActive = activeStep === step.id;
                        return (
                            <motion.div
                                key={step.id}
                                onClick={() => setActiveStep(step.id)}
                                whileHover={{ scale: 1.005 }}
                                className={`p-6 rounded-2xl border cursor-pointer transition-all flex-1 flex flex-col justify-center ${
                                    isActive
                                        ? "bg-[var(--bg-card)] border-[var(--accent-color)]"
                                        : "bg-[var(--bg-card)]/40 border-[var(--border-color)] hover:border-[var(--text-muted)]"
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl shrink-0 ${isActive ? "bg-[var(--accent-color)] text-white" : "bg-[var(--bg-hover)] text-[var(--text-muted)]"}`}>
                                        <IconComp className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-[var(--text-main)]">
                                                {step.title}
                                            </h3>
                                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)] font-mono">
                                                {step.badge}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold text-[var(--accent-color)]">
                                            {step.shortDesc}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-1 font-medium">
                                            {step.detail}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Right Interactive Preview Card - Fixed Uniform Height Container */}
                <div className="lg:col-span-6">
                    <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] relative overflow-hidden h-full flex flex-col justify-between min-h-[460px]">
                        <div>
                            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-6">
                                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                    Pipeline Simulation — Step {activeStep} of 3
                                </span>
                                <div className="flex gap-1.5">
                                    <div className={`w-2.5 h-2.5 rounded-full ${activeStep === 1 ? "bg-[var(--accent-color)]" : "bg-[var(--border-color)]"}`} />
                                    <div className={`w-2.5 h-2.5 rounded-full ${activeStep === 2 ? "bg-[var(--accent-color)]" : "bg-[var(--border-color)]"}`} />
                                    <div className={`w-2.5 h-2.5 rounded-full ${activeStep === 3 ? "bg-[var(--accent-color)]" : "bg-[var(--border-color)]"}`} />
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeStep}
                                    initial={{ opacity: 0, x: 15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -15 }}
                                    transition={{ duration: 0.25 }}
                                    className="space-y-6"
                                >
                                    {/* Primary Status Card */}
                                    <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-hover)]/50 space-y-4 relative overflow-hidden min-h-[175px] flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-base text-[var(--text-main)]">
                                                    {steps[activeStep - 1].preview.title}
                                                </span>
                                                <span className="text-xs font-bold px-2.5 py-1 rounded bg-[var(--bg-card)] text-[var(--accent-color)] border border-[var(--border-color)]">
                                                    {steps[activeStep - 1].preview.chunks}
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-[var(--text-muted)] mt-1">
                                                Status: <span className="text-[var(--text-main)]">{steps[activeStep - 1].preview.status}</span>
                                            </p>
                                        </div>

                                        {/* Step 1 Preview Widget: Semantic Overlap Chunk Badges */}
                                        {activeStep === 1 && (
                                            <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
                                                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                                                    <span>{steps[0].preview.extraTitle}</span>
                                                    <span>{steps[0].preview.extraSubtitle}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {steps[0].preview.subDetails?.map((badge, idx) => (
                                                        <span key={idx} className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]">
                                                            ✓ {badge}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 2 Preview Widget: Animated Query Vector Beam + FlashRank Scores */}
                                        {activeStep === 2 && (
                                            <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
                                                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                                                    <span>{steps[1].preview.extraTitle}</span>
                                                    <span>{steps[1].preview.extraSubtitle}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-[var(--bg-card)] rounded-full overflow-hidden relative border border-[var(--border-color)]">
                                                    <motion.div
                                                        className="h-full bg-[var(--accent-color)] rounded-full"
                                                        animate={{ x: ["-100%", "100%"] }}
                                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                    />
                                                </div>
                                                <div className="flex justify-between gap-1 text-[10px] text-[var(--text-muted)] font-mono pt-0.5">
                                                    {steps[1].preview.scores?.map((item, idx) => (
                                                        <span key={idx} className={idx < 3 ? "text-[var(--accent-color)] font-bold" : ""}>
                                                            {item.label}: {item.score}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Step 3 Preview Widget: Real-time Citations and Token Streaming */}
                                        {activeStep === 3 && (
                                            <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
                                                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                                                    <span>{steps[2].preview.extraTitle}</span>
                                                    <span>{steps[2].preview.extraSubtitle}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {steps[2].preview.citations?.map((cite, idx) => (
                                                        <span key={idx} className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--accent-color)]">
                                                            [{idx + 1}] {cite}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Under the Hood Execution Terminal Box */}
                                    <div className="p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)] text-xs space-y-1.5">
                                        <p className="font-bold text-[var(--text-main)]">Under the Hood Execution:</p>
                                        <p className="text-[var(--text-muted)] font-mono leading-relaxed min-h-[36px]">
                                            {activeStep === 1 && "> Validating 10MB limit... Chunking 500 tokens / 50 overlap... Upserting Pinecone vectors."}
                                            {activeStep === 2 && "> Executing Pinecone Similarity Search & BM25 Keyword Search... Reranking top passages with FlashRank."}
                                            {activeStep === 3 && "> LangGraph Checkpointer loaded session thread... Streaming SSE tokens via Gemini."}
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Step Navigation Bar */}
                        <div className="flex justify-between items-center pt-6 border-t border-[var(--border-color)]">
                            <div className="flex gap-2">
                                {[1, 2, 3].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setActiveStep(s)}
                                        className={`h-2 rounded-full transition-all ${
                                            activeStep === s ? "bg-[var(--accent-color)] w-7" : "bg-[var(--border-color)] hover:bg-[var(--text-muted)] w-2"
                                        }`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => setActiveStep((prev) => (prev % 3) + 1)}
                                className="text-xs font-bold text-[var(--accent-color)] hover:underline flex items-center gap-1"
                            >
                                <span>Next Stage</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
