"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cpu, Database, Layers, ShieldCheck, Zap } from "lucide-react";

const techStack = [
    { name: "Google Gemini", icon: Cpu, color: "text-amber-500" },
    { name: "Pinecone Hybrid RAG", icon: Database, color: "text-blue-500" },
    { name: "FlashRank Reranker", icon: Zap, color: "text-purple-500" },
    { name: "LangGraph StateGraph", icon: Layers, color: "text-emerald-500" },
    { name: "Supabase Auth & RLS", icon: ShieldCheck, color: "text-teal-500" },
];

export function TrustStrip() {
    return (
        <section className="py-8 border-y border-[var(--border-color)] bg-[var(--bg-card)]/50 backdrop-blur-sm relative">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-center text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-5">
                    Architected with Industry-Leading AI Frameworks
                </p>
                <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6">
                    {techStack.map((tech, idx) => {
                        const IconComponent = tech.icon;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.35, delay: idx * 0.06 }}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-main)] hover:border-[var(--accent-color)] transition-colors cursor-default"
                            >
                                <IconComponent className={`w-4 h-4 ${tech.color}`} />
                                <span>{tech.name}</span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
