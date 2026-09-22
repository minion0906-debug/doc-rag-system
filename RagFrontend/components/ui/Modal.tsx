import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, title, description, children, className, showCloseButton = true }: ModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => showCloseButton && onClose()}
                        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-md"
                    />

                    {/* Modal Wrapper */}
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 pointer-events-none font-sans">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 16 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className={cn(
                                "w-full max-w-xl max-h-[88vh] flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto",
                                className
                            )}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]/90 backdrop-blur-sm shrink-0">
                                <div>
                                    <h2 className="text-base font-bold text-[var(--text-main)] tracking-tight font-sans">{title}</h2>
                                    {description && (
                                        <p className="text-xs text-[var(--text-muted)] font-normal mt-0.5 font-sans">{description}</p>
                                    )}
                                </div>
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                                        aria-label="Close dialog"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Scrollable Body */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 font-sans">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
