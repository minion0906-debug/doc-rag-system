"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { User, Bot, Copy, Check, FileText, HelpCircle, Sparkles, Zap, BarChart2, ChevronDown, ChevronUp, PanelLeft, Plus, AlertTriangle, Clock, Hash, ExternalLink, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Message, Source } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatSkeleton } from "./ChatSkeleton";

interface ChatAreaProps {
    messages: Message[];
    isLoading?: boolean;
    isUploading?: boolean;
    uploadingFileName?: string | null;
    sessionTitle?: string;
    sessionDocument?: {
        file_name?: string | null;
        file_size?: number | null;
        file_url?: string | null;
    } | null;
    isHistoryLoading?: boolean;
    statusLabel?: string | null;
    isSidebarOpen?: boolean;
    onToggleSidebar?: () => void;
    onNewChat?: () => void;
    onSendMessage?: (message: string, files: File[]) => void;
}


const STATUS_MAP: Record<string, string> = {
    "classify_intent": "Analyzing query intent...",
    "intent_classifier": "Analyzing query intent...",
    "needs_retrieve": "Searching knowledge base...",
    "needs_retrieval": "Searching knowledge base...",
    "retrieve": "Retrieving document chunks...",
    "retrieve_documents": "Retrieving document chunks...",
    "rerank": "Reranking context relevance...",
    "grade_retrieval": "Checking relevance quality...",
    "check_ambiguity": "Checking query clarity...",
    "rewrite_query": "Optimizing search query...",
    "rephrase_query": "Rephrasing query...",
    "generate_answer": "Generating answer...",
    "generate_direct_answer": "Formulating response...",
    "generate_clarifying_question": "Formulating clarifying question...",
};

function formatStatusLabel(label?: string | null): string {
    if (!label) return "Thinking...";
    const lower = label.toLowerCase().trim();
    if (STATUS_MAP[lower]) return STATUS_MAP[lower];
    if (lower.includes("retrieve")) return "Searching knowledge base...";
    if (lower.includes("intent") || lower.includes("classify")) return "Analyzing query intent...";
    if (lower.includes("grade") || lower.includes("eval")) return "Evaluating context...";
    if (lower.includes("answer") || lower.includes("generate")) return "Formulating response...";
    if (label.includes(" ")) return label;
    return "Thinking...";
}

// ---------- Dual-Buffer Streaming Typewriter Hook (60fps rAF + Adaptive Catch-Up) ----------
function useTypingText(rawTargetText: string, active: boolean, onFrame?: () => void) {
    const fullText = typeof rawTargetText === "string" ? rawTargetText : String(rawTargetText || "");
    const [displayedText, setDisplayedText] = useState("");
    const rafRef = useRef<number | null>(null);
    const displayedRef = useRef(displayedText);
    displayedRef.current = displayedText;

    useEffect(() => {
        if (!active) return;

        const tick = () => {
            const currentLen = displayedRef.current.length;
            const targetLen = fullText.length;
            const diff = targetLen - currentLen;

            if (diff > 0) {
                // Smooth natural typewriter pace: 1 or 2 chars per 60fps tick (max 3 when catching up)
                const increment = diff > 60 ? 3 : diff > 25 ? 2 : 1;
                const nextText = fullText.slice(0, currentLen + increment);
                setDisplayedText(nextText);
                if (onFrame) onFrame();
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [fullText, active, onFrame]);

    if (!active) return fullText;
    return displayedText;
}

// ---------- Streaming Message Wrapper ----------
function StreamingMessage({
    message,
    isStreaming,
    renderTextWithCitations,
    expandedSourceIndex,
    toggleSourceExpand,
    copiedId,
    handleCopy,
    onFrame,
}: {
    message: Message;
    isStreaming: boolean;
    renderTextWithCitations: (children: React.ReactNode, msgId: number, sources?: Source[] | null) => React.ReactNode;
    expandedSourceIndex: { [msgId: number]: number | null };
    toggleSourceExpand: (msgId: number, idx: number) => void;
    copiedId: number | null;
    handleCopy: (text: string, id: number) => void;
    onFrame?: () => void;
}) {
    const displayedText = useTypingText(message.content, isStreaming, onFrame);
    const isFullyRendered = displayedText === message.content;

    // Check if this is an uploaded document / ingested text confirmation message
    const cleanContent = (message.content || "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
    const isDocConfirmation = cleanContent.includes("Uploaded Document:") || cleanContent.includes("Ingested Text:") || cleanContent.includes("Uploading & Indexing");
    const isCurrentlyIndexing = cleanContent.includes("Uploading & Indexing");

    if (isDocConfirmation) {
        const parts = cleanContent.split("\n\n");
        const titleLine = parts[0] || "";
        const subtitleLine = parts.slice(1).join("\n\n") || "";

        return (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]/80 hover:border-[var(--accent-color)]/40 transition-all shadow-2xs font-sans max-w-2xl w-full">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-color)]/10 text-[var(--accent-color)] flex items-center justify-center shrink-0 mt-0.5">
                        {isCurrentlyIndexing ? (
                            <Loader2 className="w-4 h-4 text-[var(--accent-color)] animate-spin" />
                        ) : (
                            <FileText className="w-4 h-4" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="text-xs font-bold text-[var(--text-main)] truncate">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-color)] hover:underline inline-flex items-center gap-1 font-semibold">{children} <ExternalLink className="w-2.5 h-2.5" /></a>,
                                p: ({ children }) => <span className="inline">{children}</span>
                            }}>
                                {titleLine}
                            </ReactMarkdown>
                        </div>
                        {subtitleLine && (
                            <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                                    p: ({ children }) => <span className="inline">{children}</span>
                                }}>
                                    {subtitleLine}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>

                {!isCurrentlyIndexing && (
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                            <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                            <span>Indexed</span>
                        </span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="text-[var(--text-main)] text-base leading-relaxed font-serif w-full overflow-visible">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed font-serif overflow-visible">{renderTextWithCitations(children, message.id, message.sources)}</p>,
                ul: ({ children }) => <ul className="list-disc list-outside mb-3 space-y-2 pl-6 font-serif overflow-visible">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-outside mb-3 space-y-3 pl-6 font-serif overflow-visible">{children}</ol>,
                li: ({ children }) => <li className="font-serif leading-relaxed pl-1 [&>p]:inline [&>p]:mb-1 overflow-visible">{renderTextWithCitations(children, message.id, message.sources)}</li>,
                h1: ({ children }) => <h1 className="text-2xl font-bold font-serif mb-2 mt-5 border-b border-[var(--border-color)]/40 pb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xl font-bold font-serif mb-2 mt-4">{children}</h2>,
                h3: ({ children }) => <h3 className="text-lg font-bold font-serif mb-1 mt-3">{children}</h3>,
                code: ({ children }) => <code className="bg-[var(--bg-hover)] px-1.5 py-0.5 rounded text-xs font-mono text-[var(--accent-color)] border border-[var(--border-color)]/40">{children}</code>,
                pre: ({ children }) => <pre className="bg-[var(--bg-hover)] p-4 rounded-xl overflow-x-auto mb-3 border border-[var(--border-color)]/40 text-xs font-mono">{children}</pre>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                blockquote: ({ children }) => <blockquote className="border-l-2 border-[var(--accent-color)]/40 pl-4 italic text-[var(--text-muted)] my-3">{children}</blockquote>,
                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-color)] underline underline-offset-2 hover:opacity-80">{children}</a>,
                table: ({ children }) => <div className="overflow-x-auto mb-3"><table className="w-full text-xs border border-[var(--border-color)]/40 rounded-lg overflow-hidden">{children}</table></div>,
                th: ({ children }) => <th className="px-3 py-2 bg-[var(--bg-hover)] text-left font-bold border-b border-[var(--border-color)]/40">{children}</th>,
                td: ({ children }) => <td className="px-3 py-2 border-b border-[var(--border-color)]/20">{children}</td>,
            }}>
                {displayedText}
            </ReactMarkdown>
            {/* Blinking cursor while typing */}
            {isStreaming && !isFullyRendered && (
                <span className="inline-block w-0.5 h-3.5 bg-[var(--accent-color)] ml-0.5 animate-pulse rounded-sm align-middle" />
            )}
        </div>
    );
}

function cleanSourceTitle(rawTitle?: any, sessionDocName?: string | null): string {
    const titleStr = typeof rawTitle === "string" ? rawTitle : "";
    if (!titleStr) return sessionDocName || "Document";
    const isPath = titleStr.includes("\\") || titleStr.includes("/");
    let name = isPath ? titleStr.split(/[/\\]/).pop() || titleStr : titleStr;
    if (/^tmp[a-z0-9_]+\.pdf$/i.test(name) || name.startsWith("tmp")) {
        return sessionDocName || "Document.pdf";
    }
    // Remove appended UUIDs like 345eb07c-0fdb-46e8-9df9-dff4181b7155
    name = name.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "");
    // Remove user email/id suffixes like _1@nitdelhi or @user
    name = name.replace(/_[0-9]+@[a-z0-9_.-]+/gi, "");
    name = name.replace(/@[a-z0-9_.-]+/gi, "");
    // Clean up double dots, underscores, dashes
    const extMatch = name.match(/\.([a-z0-9]+)$/i);
    const ext = extMatch ? `.${extMatch[1]}` : "";
    let base = extMatch ? name.slice(0, -ext.length) : name;
    base = base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    return base ? `${base}${ext}` : (sessionDocName || "Document.pdf");
}

// Interactive hover popover badge for inline citations [1], [2], [1, 3], etc.
function CitationBadge({
    num,
    source,
    fallbackDocName,
    docUrl,
    onToggleExpand,
}: {
    num: number;
    source?: Source;
    fallbackDocName?: string | null;
    docUrl?: string | null;
    onToggleExpand: () => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 220);
    };

    const handleCopyExcerpt = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!source?.content) return;
        navigator.clipboard.writeText(source.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const meta = source?.metadata || {};
    const title = cleanSourceTitle(source?.title || (meta as any).title || (meta as any).source, fallbackDocName);
    const page = meta.page !== undefined && meta.page !== null ? (Number(meta.page) === 0 ? 1 : Number(meta.page)) : null;
    const chunk = meta.chunk_index !== undefined && meta.chunk_index !== null ? Number(meta.chunk_index) + 1 : null;
    const row = meta.row !== undefined && meta.row !== null ? Number(meta.row) + 1 : null;

    return (
        <span
            className="relative inline-flex items-center mx-0.5 align-super select-none not-italic font-sans -top-0.5"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen((prev) => !prev);
                    onToggleExpand();
                }}
                className={cn(
                    "inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-bold font-mono leading-none cursor-pointer transition-all border shadow-2xs shrink-0",
                    isOpen
                        ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/25 scale-110 shadow-sm"
                        : "bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/25 text-[var(--accent-color)] border-[var(--accent-color)]/30 hover:border-[var(--accent-color)]/60 hover:scale-105"
                )}
                title={`Citation [${num}]: ${title}`}
            >
                {num}
            </button>

            {/* Anchored Hover Modal with Proper Outer Padding, Fixed Height & Width */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 2, scale: 0.96 }}
                        transition={{ duration: 0.12, ease: "easeOut" }}
                        style={{ width: "400px", maxWidth: "88vw", height: "205px" }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 p-3.5 rounded-2xl bg-white dark:bg-[#18181b] border border-[var(--border-color)] shadow-2xl text-left z-[99999] pointer-events-auto font-sans flex flex-col ring-1 ring-black/10 dark:ring-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]/60 gap-2 shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="w-5 h-5 rounded-md bg-[var(--accent-color)] text-white text-[10px] font-bold font-mono flex items-center justify-center shrink-0 shadow-2xs">
                                    {num}
                                </span>
                                <div className="truncate min-w-0">
                                    <p className="text-xs font-bold text-[var(--text-main)] truncate flex items-center gap-1">
                                        <FileText className="w-3.5 h-3.5 text-[var(--accent-color)] shrink-0" />
                                        <span className="truncate">{title}</span>
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                                        {page !== null && <span>Page {page}</span>}
                                        {row !== null && <span>• Row {row}</span>}
                                        {chunk !== null && <span>• Chunk #{chunk}</span>}
                                    </div>
                                </div>
                            </div>

                            {docUrl && (
                                <a
                                    href={docUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20 text-[var(--accent-color)] text-[10px] font-semibold transition-colors shrink-0 border border-[var(--accent-color)]/25"
                                    title="Open original document"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Doc</span>
                                </a>
                            )}
                        </div>

                        {/* Content Excerpt: Scrollable Container with Callout Border */}
                        <div className="my-2 flex-1 min-h-0 overflow-y-auto p-2.5 rounded-xl bg-[var(--bg-hover)]/45 border border-[var(--border-color)]/50 border-l-3 border-l-[var(--accent-color)] text-xs text-[var(--text-main)] leading-relaxed font-sans select-text whitespace-pre-wrap shadow-inner">
                            {source?.content ? (
                                <p className="leading-relaxed whitespace-pre-wrap">{source.content.trim()}</p>
                            ) : (
                                <p className="text-xs text-[var(--text-muted)] italic">No text excerpt available for citation [{num}].</p>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-2 border-t border-[var(--border-color)]/60 text-[10px] flex items-center justify-between shrink-0 text-[var(--text-muted)]">
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="uppercase tracking-wider font-semibold text-[var(--accent-color)] text-[9px]">Verified Citation</span>
                            </div>
                            <button
                                onClick={handleCopyExcerpt}
                                className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] text-[10px] font-medium transition-all cursor-pointer border border-[var(--border-color)]/60 shadow-2xs"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3 h-3 text-emerald-500" />
                                        <span className="text-emerald-600 font-semibold">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3 text-[var(--text-muted)]" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Caret pointing down directly to the badge */}
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 border-r border-b border-[var(--border-color)] bg-white dark:bg-[#18181b] rotate-45 pointer-events-none" />
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
}

// ---------- Main ChatArea ----------
export function ChatArea({ 
    messages, 
    isLoading, 
    isUploading = false,
    uploadingFileName = null,
    sessionTitle, 
    sessionDocument, 
    isHistoryLoading, 
    statusLabel, 
    isSidebarOpen, 
    onToggleSidebar, 
    onNewChat, 
    onSendMessage 
}: ChatAreaProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [expandedSourceIndex, setExpandedSourceIndex] = useState<{ [msgId: number]: number | null }>({});
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const scrollToBottom = (smooth = true) => {
        if (!scrollContainerRef.current || messages.length === 0) return;
        const { scrollHeight, scrollTop, clientHeight } = scrollContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
        if (isNearBottom || messages.length <= 2) {
            messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
        }
    };

    useEffect(() => { scrollToBottom(); }, [messages, isLoading, isUploading, statusLabel]);

    const handleCopy = useCallback((text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    const toggleSourceExpand = useCallback((msgId: number, idx: number) => {
        setExpandedSourceIndex((prev) => ({ ...prev, [msgId]: prev[msgId] === idx ? null : idx }));
    }, []);

    const handleSuggestionClick = (prompt: string) => { if (onSendMessage) onSendMessage(prompt, []); };

    // Support single citations [1] as well as array citations [1, 3], [1, 2, 3], [1-3]
    const renderTextWithCitations = useCallback((children: React.ReactNode, msgId: number, sources?: Source[] | null): React.ReactNode => {
        if (typeof children === "string") {
            const parts = children.split(/(\[\s*\d+(?:\s*[,–-]\s*\d+)*\s*\])/g);
            if (parts.length <= 1) return children;
            return parts.map((part, i) => {
                const innerMatch = part.match(/^\[([\d\s,–-]+)\]$/);
                if (innerMatch && sources && sources.length > 0) {
                    const rawNumbers = innerMatch[1];
                    const numTokens = rawNumbers.split(/[,]+/);
                    const nums: number[] = [];

                    for (const token of numTokens) {
                        const trimmed = token.trim();
                        const rangeMatch = trimmed.match(/^(\d+)\s*[–-]\s*(\d+)$/);
                        if (rangeMatch) {
                            const start = parseInt(rangeMatch[1]);
                            const end = parseInt(rangeMatch[2]);
                            if (start <= end && end - start < 10) {
                                for (let n = start; n <= end; n++) {
                                    nums.push(n);
                                }
                            } else {
                                nums.push(start, end);
                            }
                        } else {
                            const parsed = parseInt(trimmed);
                            if (!isNaN(parsed) && parsed > 0) {
                                nums.push(parsed);
                            }
                        }
                    }

                    if (nums.length > 0) {
                        return (
                            <span key={i} className="inline-flex items-center gap-0.5 whitespace-nowrap not-italic font-sans align-baseline select-none leading-none">
                                {nums.map((citationNum, subIdx) => {
                                    const src = sources[citationNum - 1];
                                    return (
                                        <CitationBadge
                                            key={`${i}-${subIdx}`}
                                            num={citationNum}
                                            source={src}
                                            fallbackDocName={sessionDocument?.file_name}
                                            docUrl={sessionDocument?.file_url}
                                            onToggleExpand={() => toggleSourceExpand(msgId, citationNum - 1)}
                                        />
                                    );
                                })}
                            </span>
                        );
                    }
                }
                return part;
            });
        }
        return children;
    }, [toggleSourceExpand, sessionDocument]);

    const hasDocument = !!sessionDocument?.file_name;

    const displayMessages = React.useMemo(() => {
        if (!messages || messages.length === 0) return [];
        const seenIds = new Set<number>();
        const seenContent = new Set<string>();
        const deduplicated: Message[] = [];

        for (const msg of messages) {
            if (msg.id && seenIds.has(msg.id)) continue;
            const contentKey = `${msg.role}:${msg.content.trim()}`;
            if (msg.content.trim() && seenContent.has(contentKey)) continue;

            // If top document banner is active, avoid duplicating the system doc confirmation card in the chat stream
            if (hasDocument && msg.role === "assistant") {
                const clean = (msg.content || "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
                if (clean.includes("Uploaded Document:") || clean.includes("Uploading & Indexing")) {
                    continue;
                }
            }

            if (msg.id) seenIds.add(msg.id);
            if (msg.content.trim()) seenContent.add(contentKey);
            deduplicated.push(msg);
        }

        return deduplicated;
    }, [messages, hasDocument]);

    const userMessages = React.useMemo(() => {
        return displayMessages.filter(m => m.role === "user");
    }, [displayMessages]);

    const lastAssistantIdx = React.useMemo(() => {
        for (let i = displayMessages.length - 1; i >= 0; i--) {
            if (displayMessages[i].role === "assistant") return i;
        }
        return -1;
    }, [displayMessages]);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Header */}
            <div className="h-[52px] border-b border-[var(--border-color)]/50 px-4 flex items-center justify-between bg-[var(--bg-main)]/90 backdrop-blur-md shrink-0 gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    {!isSidebarOpen && onToggleSidebar && (
                        <button onClick={onToggleSidebar} className="p-1.5 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-color)] transition-colors border border-transparent hover:border-[var(--border-color)]/60 cursor-pointer shrink-0" title="Expand sidebar">
                            <PanelLeft className="w-4 h-4" />
                        </button>
                    )}
                    {!isSidebarOpen && (
                        <div className="flex items-center gap-2 shrink-0">
                            <Link href="/" className="text-lg font-serif font-bold tracking-tight hover:opacity-80 transition-opacity text-[var(--accent-color)]">
                                AskDoc
                            </Link>
                            <div className="h-4 w-px bg-[var(--border-color)]/60 hidden sm:block" />
                        </div>
                    )}
                    <div className="flex items-center gap-2 min-w-0">
                        {isSidebarOpen && (
                            <div className="w-6 h-6 rounded-md bg-[var(--accent-color)]/15 flex items-center justify-center shrink-0">
                                <FileText className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                            </div>
                        )}
                        <span className="font-semibold text-[var(--text-main)] truncate text-sm">
                            {cleanSourceTitle(sessionTitle || sessionDocument?.file_name || "AskDoc Assistant", sessionDocument?.file_name)}
                        </span>
                    </div>
                </div>
                {onNewChat && (
                    <button onClick={onNewChat} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0" title="Start New Chat">
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="hidden sm:inline">New Chat</span>
                    </button>
                )}
            </div>

            {/* Scroll Area */}
            <div ref={scrollContainerRef} className={cn("flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col", !hasDocument && displayMessages.length === 0 && "justify-center items-center")}>
                {isHistoryLoading ? (
                    <ChatSkeleton />
                ) : (
                    <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto px-1.5 flex-1">
                        {/* Pinned Top Document Header Banner (shown once upload is complete) */}
                        {hasDocument && !isUploading && (
                            <motion.div 
                                initial={{ opacity: 0, y: -6 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                className="w-full p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/80 hover:border-[var(--accent-color)]/40 shadow-xs flex items-center justify-between gap-3 font-sans shrink-0"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-[var(--accent-color)]/15 text-[var(--accent-color)] flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs sm:text-sm font-bold text-[var(--text-main)] truncate max-w-xs sm:max-w-md">
                                                {sessionDocument?.file_name}
                                            </p>
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20 shrink-0">
                                                <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                                <span>Indexed & Ready</span>
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                            {sessionDocument?.file_size ? `${(sessionDocument.file_size / (1024 * 1024)).toFixed(2)} MB • ` : ""}Ready for instant search & Q&A
                                        </p>
                                    </div>
                                </div>
                                {sessionDocument?.file_url && (
                                    <a
                                        href={sessionDocument.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/20 text-[var(--accent-color)] text-xs font-bold transition-all shrink-0 cursor-pointer"
                                        title="View original document in new tab"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">View Doc</span>
                                    </a>
                                )}
                            </motion.div>
                        )}

                        {/* Empty State when NO document and NO messages */}
                        {!hasDocument && displayMessages.length === 0 && !isLoading ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                                className="flex flex-col items-center text-center space-y-4 max-w-xl w-full mx-auto my-auto py-8">
                                <div className="w-14 h-14 rounded-2xl bg-[var(--accent-color)]/10 text-[var(--accent-color)] flex items-center justify-center mb-2 shadow-sm border border-[var(--accent-color)]/20">
                                    <FileText className="w-7 h-7" />
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[var(--text-main)] tracking-tight leading-tight">
                                        Ask anything from your documents
                                    </h1>
                                    <p className="text-xs sm:text-sm text-[var(--text-muted)] font-serif max-w-md mx-auto leading-relaxed">
                                        Upload a PDF, DOCX, XLSX, PPTX, CSV, or text file to extract verified, cited answers strictly grounded in your content.
                                    </p>
                                </div>
                            </motion.div>
                        ) : hasDocument && userMessages.length === 0 && !isLoading ? (
                            /* Document-Ready state: Focused purely on the uploaded document */
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center space-y-5 max-w-xl w-full mx-auto my-auto py-8">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs border border-emerald-500/20">
                                    <Check className="w-6 h-6 stroke-[2.5]" />
                                </div>
                                <div className="space-y-1.5">
                                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-main)]">
                                        {sessionDocument?.file_name ? cleanSourceTitle(sessionDocument.file_name) : "Document Ready"}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-[var(--text-muted)] font-serif max-w-md mx-auto">
                                        Ask any question below to extract facts, tables, and cited answers from this document.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                                    <button
                                        onClick={() => handleSuggestionClick("Summarize the main contents and key facts from this document.")}
                                        className="px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]/70 hover:border-[var(--accent-color)]/40 text-xs font-medium text-[var(--text-main)] transition-all cursor-pointer shadow-2xs"
                                    >
                                        Summarize document
                                    </button>
                                    <button
                                        onClick={() => handleSuggestionClick("What are the key points and takeaways in this document?")}
                                        className="px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]/70 hover:border-[var(--accent-color)]/40 text-xs font-medium text-[var(--text-main)] transition-all cursor-pointer shadow-2xs"
                                    >
                                        Key takeaways
                                    </button>
                                    <button
                                        onClick={() => handleSuggestionClick("List all structured data, figures, and important details mentioned in this document.")}
                                        className="px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)]/70 hover:border-[var(--accent-color)]/40 text-xs font-medium text-[var(--text-main)] transition-all cursor-pointer shadow-2xs"
                                    >
                                        Extract key data
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <>
                                {/* Message stream list */}
                                {displayMessages.map((message, msgIndex) => {
                                const isStreamingMsg = isLoading && msgIndex === lastAssistantIdx && message.role === "assistant";
                                return (
                                    <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
                                        className={cn("flex w-full", message.role === "user" ? "justify-end" : "justify-start")}>
                                        <div className={cn("flex flex-col gap-2 min-w-0", message.role === "user" ? "items-end max-w-[85%]" : "items-start w-full")}>
                                            {message.needs_clarification && (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 text-xs font-semibold">
                                                    <HelpCircle className="w-3 h-3" /><span>Clarification needed</span>
                                                </div>
                                            )}
                                            {message.role === "user" ? (
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/15 text-[var(--text-main)] rounded-xl rounded-tr-sm px-3 py-1 text-base leading-relaxed font-serif whitespace-pre-wrap">
                                                        {message.content}
                                                    </div>
                                                    <button
                                                        onClick={() => handleCopy(message.content, message.id)}
                                                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded-md transition-all font-medium font-sans cursor-pointer"
                                                        title="Copy message"
                                                    >
                                                        {copiedId === message.id ? (
                                                            <>
                                                                <Check className="w-3 h-3 text-emerald-500" />
                                                                <span className="text-emerald-600 font-semibold">Copied!</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3 h-3" />
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <StreamingMessage
                                                    message={message}
                                                    isStreaming={!!isStreamingMsg}
                                                    renderTextWithCitations={renderTextWithCitations}
                                                    expandedSourceIndex={expandedSourceIndex}
                                                    toggleSourceExpand={toggleSourceExpand}
                                                    copiedId={copiedId}
                                                    handleCopy={handleCopy}
                                                    onFrame={scrollToBottom}
                                                />
                                            )}

                                        {/* Enhanced Sources & Citations Section */}
                                        {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                                            <div className="mt-2.5 space-y-2.5 w-full font-sans">
                                                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                                                    <span>Verified Sources</span>
                                                    <span className="px-1.5 py-0.2 rounded-full bg-[var(--accent-color)]/15 text-[var(--accent-color)] text-[9px] font-semibold">{message.sources.length}</span>
                                                </div>

                                                {/* Source Pills Carousel/Grid */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    {message.sources.map((source, idx) => {
                                                        const isExpanded = expandedSourceIndex[message.id] === idx;
                                                        const meta = source.metadata || {};
                                                        const displayTitle = cleanSourceTitle(source.title || (meta as any).title || (meta as any).source, sessionDocument?.file_name);

                                                        // Contextual label: Row, Sheet, Page, Chunk
                                                        let metaBadge = "";
                                                        if (meta.row !== undefined && meta.row !== null) {
                                                            metaBadge = `Row ${Number(meta.row) + 1}`;
                                                        } else if (meta.page !== undefined && meta.page !== null) {
                                                            metaBadge = `Page ${Number(meta.page) === 0 ? 1 : Number(meta.page)}`;
                                                        } else if (meta.sheet) {
                                                            metaBadge = String(meta.sheet);
                                                        } else if (meta.chunk_index !== undefined && meta.chunk_index !== null) {
                                                            metaBadge = `Chunk ${Number(meta.chunk_index) + 1}`;
                                                        }

                                                        return (
                                                            <button
                                                                key={idx}
                                                                onClick={() => toggleSourceExpand(message.id, idx)}
                                                                className={cn(
                                                                    "group flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                                                                    isExpanded
                                                                        ? "bg-[var(--accent-color)]/15 border-[var(--accent-color)] text-[var(--accent-color)] font-semibold shadow-2xs"
                                                                        : "bg-[var(--bg-card)] border-[var(--border-color)]/70 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--accent-color)]/40 hover:bg-[var(--bg-hover)]"
                                                                )}
                                                                title={`View citation [${idx + 1}]`}
                                                            >
                                                                <span className={cn(
                                                                    "w-3.5 h-3.5 rounded text-[9px] font-bold flex items-center justify-center shrink-0",
                                                                    isExpanded ? "bg-[var(--accent-color)] text-white" : "bg-[var(--accent-color)]/15 text-[var(--accent-color)]"
                                                                )}>
                                                                    {idx + 1}
                                                                </span>
                                                                <span className="truncate max-w-[130px] font-medium">{displayTitle}</span>
                                                                {metaBadge && (
                                                                    <span className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--accent-color)] font-mono font-medium shrink-0">
                                                                        • {metaBadge}
                                                                    </span>
                                                                )}
                                                                {isExpanded ? <ChevronUp className="w-3 h-3 shrink-0 ml-0.5" /> : <ChevronDown className="w-3 h-3 shrink-0 ml-0.5" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Expanded Source Inspector Card */}
                                                <AnimatePresence>
                                                    {expandedSourceIndex[message.id] !== undefined && expandedSourceIndex[message.id] !== null && message.sources[expandedSourceIndex[message.id]!] && (() => {
                                                        const activeSrc = message.sources[expandedSourceIndex[message.id]!];
                                                        const srcIdx = expandedSourceIndex[message.id]!;
                                                        const meta = activeSrc.metadata || {};
                                                        const isSrcCopied = copiedId === (message.id * 1000 + srcIdx);
                                                        const displayTitle = cleanSourceTitle(activeSrc.title || (meta as any).title || (meta as any).source, sessionDocument?.file_name);

                                                        const pageDisplay = meta.page !== undefined && meta.page !== null
                                                            ? (Number(meta.page) === 0 ? 1 : Number(meta.page))
                                                            : null;

                                                        return (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 4, height: 0 }}
                                                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                                                exit={{ opacity: 0, y: 4, height: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--accent-color)]/30 shadow-xs space-y-3 font-sans">
                                                                    {/* Header with Title, Badges, and Action Buttons */}
                                                                    <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-color)]/40 gap-2">
                                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                                            <span className="w-5 h-5 rounded-md bg-[var(--accent-color)] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs">
                                                                                {srcIdx + 1}
                                                                            </span>
                                                                            <div className="truncate min-w-0">
                                                                                <div className="flex items-center gap-1.5 truncate">
                                                                                    <FileText className="w-3.5 h-3.5 text-[var(--accent-color)] shrink-0" />
                                                                                    <p className="text-xs font-bold text-[var(--text-main)] truncate">{displayTitle}</p>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                                                                                    {pageDisplay !== null && <span>Page {pageDisplay}</span>}
                                                                                    {meta.row !== undefined && meta.row !== null && <span>• Row {Number(meta.row) + 1}</span>}
                                                                                    {meta.sheet ? <span>• Sheet: {String(meta.sheet)}</span> : null}
                                                                                    {meta.chunk_index !== undefined && meta.chunk_index !== null && <span>• Chunk #{Number(meta.chunk_index) + 1}</span>}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                                            {sessionDocument?.file_url && (
                                                                                <a
                                                                                    href={sessionDocument.file_url}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 rounded-md border border-[var(--accent-color)]/30 transition-all cursor-pointer"
                                                                                    title="Open original document in new tab"
                                                                                >
                                                                                    <ExternalLink className="w-3 h-3" />
                                                                                    <span className="hidden sm:inline">View Doc</span>
                                                                                </a>
                                                                            )}

                                                                            <button
                                                                                onClick={() => handleCopy(activeSrc.content, message.id * 1000 + srcIdx)}
                                                                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-hover)]/70 hover:bg-[var(--bg-hover)] rounded-md border border-[var(--border-color)]/50 transition-all cursor-pointer"
                                                                                title="Copy citation snippet"
                                                                            >
                                                                                {isSrcCopied ? (
                                                                                    <>
                                                                                        <Check className="w-3 h-3 text-emerald-500" />
                                                                                        <span className="text-emerald-600">Copied</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Copy className="w-3 h-3" />
                                                                                        <span>Copy quote</span>
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Formatted Content Body */}
                                                                    <div className="text-xs text-[var(--text-main)] leading-relaxed">
                                                                        {(() => {
                                                                            const rawContent = activeSrc.content || "";
                                                                            
                                                                            // Check if spreadsheet key-value rows
                                                                            if (rawContent.includes("Row Data:") || (rawContent.includes("File:") && rawContent.includes("Sheet:"))) {
                                                                                const parts = rawContent.split("Row Data:");
                                                                                const headerInfo = parts[0]?.trim();
                                                                                const rowData = parts[1]?.trim() || "";

                                                                                const kvRegex = /([A-Za-z0-9_\s–-]+):/g;
                                                                                let match;
                                                                                const matches: { key: string; index: number }[] = [];
                                                                                while ((match = kvRegex.exec(rowData)) !== null) {
                                                                                    matches.push({ key: match[1].trim(), index: match.index + match[0].length });
                                                                                }

                                                                                const kvPairs: { key: string; value: string }[] = [];
                                                                                if (matches.length > 0) {
                                                                                    for (let i = 0; i < matches.length; i++) {
                                                                                        const cur = matches[i];
                                                                                        const next = matches[i + 1];
                                                                                        const startIdx = cur.index;
                                                                                        const endIdx = next ? next.index - matches[i + 1].key.length - 1 : rowData.length;
                                                                                        const val = rowData.slice(startIdx, endIdx).trim();
                                                                                        if (cur.key && val) kvPairs.push({ key: cur.key, value: val });
                                                                                    }
                                                                                }

                                                                                if (kvPairs.length > 0) {
                                                                                    return (
                                                                                        <div className="space-y-2.5">
                                                                                            {headerInfo && (
                                                                                                <div className="flex flex-wrap gap-1.5 pb-1 text-[10px] text-[var(--text-muted)] font-mono">
                                                                                                    {headerInfo.split("|").map((h, i) => (
                                                                                                        <span key={i} className="bg-[var(--bg-hover)] px-2 py-0.5 rounded border border-[var(--border-color)]/40">{h.trim()}</span>
                                                                                                    ))}
                                                                                                </div>
                                                                                            )}
                                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                                {kvPairs.map((kv, i) => (
                                                                                                    <div key={i} className="flex flex-col p-2.5 rounded-lg bg-[var(--bg-hover)]/40 border border-[var(--border-color)]/40">
                                                                                                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">{kv.key}</span>
                                                                                                        <span className="text-xs text-[var(--text-main)] font-medium break-all mt-0.5">
                                                                                                            {kv.value.startsWith("http") ? (
                                                                                                                <a href={kv.value} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-color)] hover:underline flex items-center gap-1">
                                                                                                                    <span className="truncate">{kv.value}</span>
                                                                                                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                                                                                                </a>
                                                                                                            ) : kv.value}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                            }

                                                                            // Default narrative or fee structure text rendering
                                                                            const lines = rawContent.split("\n").filter(l => l.trim().length > 0);
                                                                            const looksLikeListOrTable = lines.length > 2 && lines.some(l => /^\d+\s+[A-Za-z]|:\s*\d+|\b(Total|Fee|Rs|INR)\b/i.test(l));

                                                                            if (looksLikeListOrTable) {
                                                                                return (
                                                                                    <div className="space-y-1 bg-[var(--bg-hover)]/30 rounded-lg p-3 border border-[var(--border-color)]/40">
                                                                                        {lines.map((line, lineIdx) => {
                                                                                            const isHeaderOrTotal = /^(Total|[A-Z]\.|\d+\.)/i.test(line.trim());
                                                                                            return (
                                                                                                <div
                                                                                                    key={lineIdx}
                                                                                                    className={cn(
                                                                                                        "py-1 px-2 rounded text-xs leading-relaxed flex items-start justify-between gap-2 font-mono",
                                                                                                        isHeaderOrTotal ? "bg-[var(--bg-card)] font-semibold text-[var(--text-main)] border border-[var(--border-color)]/30" : "text-[var(--text-main)]/90"
                                                                                                    )}
                                                                                                >
                                                                                                    <span>{line}</span>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                );
                                                                            }

                                                                            // Clean paragraph excerpt
                                                                            return (
                                                                                <div className="border-l-3 border-[var(--accent-color)] pl-3.5 py-1 bg-[var(--accent-color)]/5 rounded-r-lg">
                                                                                    <p className="text-xs text-[var(--text-main)] leading-relaxed font-sans whitespace-pre-wrap">
                                                                                        {rawContent}
                                                                                    </p>
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })()}
                                                </AnimatePresence>
                                            </div>
                                        )}

                                        {/* Metrics — icon-only, no emoji */}
                                        {/* Assistant Response Toolbar (Metrics & Actions) */}
                                        {message.role === "assistant" && !isStreamingMsg && !(
                                            (message.content || "").includes("Uploaded Document:") ||
                                            (message.content || "").includes("Ingested Text:") ||
                                            (message.content || "").includes("Uploading & Indexing")
                                        ) && (
                                            <div className="flex items-center justify-between w-full pt-2 border-t border-[var(--border-color)]/30 mt-1.5 font-sans">
                                                {/* Left: Metrics Badges */}
                                                <div className="flex items-center gap-2">
                                                    {message.metrics?.time !== undefined && message.metrics.time !== null && Number(message.metrics.time) > 0 && (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] text-[var(--text-main)] text-xs font-semibold font-sans border border-[var(--border-color)]/60 shadow-2xs">
                                                            <Clock className="w-3.5 h-3.5 text-[var(--accent-color)] shrink-0" />
                                                            <span>{message.metrics.time}s</span>
                                                        </div>
                                                    )}
                                                    {Boolean(message.metrics?.total_tokens || message.metrics?.output_tokens || message.metrics?.input_tokens) && (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] text-[var(--text-main)] text-xs font-semibold font-sans border border-[var(--border-color)]/60 shadow-2xs">
                                                            <Hash className="w-3.5 h-3.5 text-[var(--accent-color)] shrink-0" />
                                                            <span>{message.metrics?.total_tokens || ((message.metrics?.input_tokens || 0) + (message.metrics?.output_tokens || 0))} tokens</span>
                                                        </div>
                                                    )}
                                                    {message.metrics?.low_confidence && (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold font-sans border border-amber-500/30 shadow-2xs">
                                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                            <span>Low confidence</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right: Copy Action */}
                                                {message.content && message.content.trim().length > 0 && (
                                                    <button
                                                        onClick={() => handleCopy(message.content, message.id)}
                                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]/60 text-xs font-medium transition-all shadow-2xs cursor-pointer"
                                                        title="Copy response"
                                                    >
                                                        {copiedId === message.id ? (
                                                            <>
                                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                                <span className="text-emerald-600 font-semibold">Copied!</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-main)]" />
                                                                <span>Copy</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                            </>
                        )}
                        {/* Streaming indicator (only shown during active AI response generation) */}
                        {isLoading && !isUploading && (messages.length === 0 || messages[messages.length - 1]?.role === "user" || messages[messages.length - 1]?.content === "") && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl rounded-tl-sm bg-[var(--bg-card)] border border-[var(--border-color)]/60 text-xs shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-[var(--accent-color)] rounded-full animate-bounce [animation-delay:0ms]" />
                                        <span className="w-1.5 h-1.5 bg-[var(--accent-color)] rounded-full animate-bounce [animation-delay:150ms]" />
                                        <span className="w-1.5 h-1.5 bg-[var(--accent-color)] rounded-full animate-bounce [animation-delay:300ms]" />
                                    </div>
                                    <span className="text-[var(--text-main)] font-medium font-sans">{formatStatusLabel(statusLabel)}</span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
                {messages.length === 0 && <div ref={messagesEndRef} />}
            </div>
        </div>
    );
}
