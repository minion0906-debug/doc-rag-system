"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, FileText, Lock } from "lucide-react";

export function CtaBanner() {
    return (
        <section className="py-24 px-6 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="p-10 sm:p-16 rounded-3xl bg-gradient-to-r from-[var(--accent-color)] via-amber-500 to-amber-600 text-white text-center relative overflow-hidden space-y-8"
            >
                {/* Background Floating Elements */}
                <div className="absolute top-0 right-0 p-12 opacity-15 pointer-events-none">
                    <FileText className="w-64 h-64 text-white" />
                </div>

                <div className="max-w-3xl mx-auto space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white">
                        <Sparkles className="w-4 h-4" />
                        <span>Ready to Unlock Your Documents?</span>
                    </div>

                    <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
                        Try AskDoc on Your Own Documents Now
                    </h2>

                    <p className="text-lg sm:text-xl text-white/90 font-medium max-w-2xl mx-auto leading-relaxed">
                        Upload your PDF, DOCX, XLSX, PPTX, or CSV files and start asking questions in seconds with zero setup.
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            href="/chat"
                            className="w-full sm:w-auto px-10 py-4 rounded-full bg-white text-[var(--accent-color)] font-extrabold text-lg hover:bg-white/90 transition-all flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.97]"
                        >
                            <span>Start Chatting</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>

                    <p className="text-xs text-white/80 font-medium flex items-center justify-center gap-2 pt-2">
                        <Lock className="w-3.5 h-3.5" />
                        <span>User-scoped Supabase Row-Level Security Enabled</span>
                    </p>
                </div>
            </motion.div>
        </section>
    );
}
