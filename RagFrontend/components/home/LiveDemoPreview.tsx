"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, FileText, HelpCircle, Clock, Coins, CircleDollarSign, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const sampleScenarios = [
    {
        question: "What is the Q3 revenue and growth rate?",
        answer: "According to **Q3_Financial_Report.pdf**, the total revenue reached **$14.2M**, representing a **24.5% YoY growth** compared to Q3 2024.",
        sources: [{ title: "Q3_Financial_Report.pdf", page: 12 }],
        metrics: { time: "0.85s", tokens: "142 tokens", cost: "$0.000042" },
        needsClarification: false
    },
    {
        question: "what about that one?",
        answer: "Could you please specify which document or financial metric you are referring to? (e.g., *Q3 Operating Expenses* or *Net Profit Margin*)",
        sources: [],
        metrics: { time: "0.42s", tokens: "45 tokens", cost: "$0.000012" },
        needsClarification: true
    }
];

export function LiveDemoPreview() {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [displayedAnswer, setDisplayedAnswer] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const scenario = sampleScenarios[selectedIdx];

    useEffect(() => {
        setIsTyping(true);
        setDisplayedAnswer("");
        let currentText = "";
        const fullText = scenario.answer;
        let charIdx = 0;

        const interval = setInterval(() => {
            if (charIdx < fullText.length) {
                currentText += fullText[charIdx];
                setDisplayedAnswer(currentText);
                charIdx++;
            } else {
                setIsTyping(false);
                clearInterval(interval);
            }
        }, 16);

        return () => clearInterval(interval);
    }, [selectedIdx]);

    return (
        <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <span className="px-3.5 py-1 rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-xs font-bold uppercase tracking-wider">
                    Live Product Preview
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--text-main)] tracking-tight">
                    See Real-Time Streaming & Citations
                </h2>
                <p className="text-base sm:text-lg text-[var(--text-muted)] font-medium">
                    Try sample prompts below to test SSE token streaming, FlashRank citations, and ambiguity detection in action.
                </p>
            </div>

            {/* Prompt Selector Pills */}
            <div className="flex flex-wrap justify-center gap-3">
                {sampleScenarios.map((sc, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSelectedIdx(idx)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                            selectedIdx === idx
                                ? "bg-[var(--accent-color)]/10 border-[var(--accent-color)] text-[var(--accent-color)] ring-1 ring-[var(--accent-color)]/30"
                                : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]"
                        }`}
                    >
                        Prompt #{idx + 1}: &ldquo;{sc.question}&rdquo;
                    </button>
                ))}
            </div>

            {/* Mock Chat Window */}
            <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
                    <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-bold text-[var(--text-main)]">AskDoc Live Session</span>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border-color)]">
                        Model: Gemini 3.6 Flash
                    </span>
                </div>

                {/* User Message */}
                <div className="flex justify-end">
                    <div className="bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/15 text-[var(--text-main)] rounded-2xl rounded-tr-sm px-4 py-2.5 text-base font-serif leading-relaxed max-w-[85%]">
                        {scenario.question}
                    </div>
                </div>

                {/* Assistant Message */}
                <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-lg bg-[var(--accent-color)]/15 border border-[var(--accent-color)]/25 flex items-center justify-center text-[var(--accent-color)] shrink-0 mt-1">
                        <Bot className="w-4 h-4" />
                    </div>

                    <div className="space-y-3 flex-1 min-w-0">
                        {scenario.needsClarification && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Clarification requested</span>
                            </div>
                        )}

                        <div className={`p-4 rounded-2xl border text-base font-serif leading-relaxed ${
                            scenario.needsClarification 
                                ? "border-amber-500/30 bg-amber-500/5 text-[var(--text-main)]" 
                                : "bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-main)]"
                        }`}>
                            <div className="prose dark:prose-invert max-w-none text-[var(--text-main)] font-serif text-base leading-relaxed inline">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {displayedAnswer}
                                </ReactMarkdown>
                            </div>
                            {isTyping && (
                                <span className="inline-block w-2 h-4 bg-[var(--accent-color)] animate-pulse ml-1 align-middle" />
                            )}
                        </div>

                        {/* Citations */}
                        {!isTyping && scenario.sources.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-wrap gap-2 pt-1"
                            >
                                {scenario.sources.map((src, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] font-medium">
                                        <FileText className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                                        <span><strong className="text-[var(--text-main)]">{src.title}</strong> (Page {src.page})</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* Metrics */}
                        {!isTyping && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-4 text-xs text-[var(--text-muted)] font-mono pt-1"
                            >
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[var(--accent-color)]" /> {scenario.metrics.time}</span>
                                <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-amber-500" /> {scenario.metrics.tokens}</span>
                                <span className="flex items-center gap-1"><CircleDollarSign className="w-3 h-3 text-emerald-500" /> {scenario.metrics.cost}</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
