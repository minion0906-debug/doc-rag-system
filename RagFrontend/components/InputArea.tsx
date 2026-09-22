import React, { useState, useRef } from "react";
import { Paperclip, ArrowUp, X, FileText, Clipboard, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { ingestText } from "@/lib/api";

export interface AttachedDoc {
    name: string;
    size?: number | null;
    url?: string | null;
}

interface InputAreaProps {
    onSendMessage: (message: string, files?: File[]) => void;
    onUploadFiles?: (files: File[]) => Promise<void>;
    isUploading?: boolean;
    uploadingFileName?: string | null;
    currentSessionId: string | null;
    attachedDocuments?: AttachedDoc[];
    onIngest?: () => void;
}

export function InputArea({ 
    onSendMessage, 
    onUploadFiles,
    isUploading = false,
    uploadingFileName = null,
    currentSessionId, 
    attachedDocuments = [],
    onIngest 
}: InputAreaProps) {
    const [input, setInput] = useState("");
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const [pasteTitle, setPasteTitle] = useState("");
    const [pasteContent, setPasteContent] = useState("");
    const [isIngesting, setIsIngesting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isUploading) {
                handleSend();
            }
        }
    };

    const handleSend = () => {
        if (isUploading) return;
        if (input.trim()) {
            onSendMessage(input, []);
            setInput("");
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            // Reset input value to allow re-selection
            e.target.value = "";
            if (onUploadFiles) {
                await onUploadFiles(selectedFiles);
            }
        }
    };

    const handlePasteSubmit = async () => {
        if (!pasteContent.trim() || !currentSessionId) return;

        setIsIngesting(true);
        try {
            await ingestText(currentSessionId, pasteContent, pasteTitle || "Pasted Text");
            setIsPasteModalOpen(false);
            setPasteTitle("");
            setPasteContent("");
            if (onIngest) onIngest();
        } catch (error) {
            console.error("Failed to ingest text:", error);
        } finally {
            setIsIngesting(false);
        }
    };

    return (
        <div className="w-full px-4 sm:px-6 pb-4 pt-1 relative font-serif">
            {/* Paste Modal */}
            {isPasteModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-full max-w-lg p-6 space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-[var(--text-main)]">Paste Raw Text</h3>
                            <button onClick={() => setIsPasteModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Title (optional)"
                            value={pasteTitle}
                            onChange={(e) => setPasteTitle(e.target.value)}
                            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-color)] transition-colors font-medium"
                        />
                        <textarea
                            placeholder="Paste your text content here..."
                            value={pasteContent}
                            onChange={(e) => setPasteContent(e.target.value)}
                            className="w-full h-48 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-main)] resize-none focus:outline-none focus:border-[var(--accent-color)] transition-colors font-medium"
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setIsPasteModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasteSubmit}
                                disabled={isIngesting || !pasteContent.trim()}
                                className="px-4 py-2 rounded-xl bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs transition-all disabled:opacity-50 shadow-md"
                            >
                                {isIngesting ? "Ingesting..." : "Ingest Text"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sleek Outer Input Box with Clean Minimal Border */}
            <div className={cn(
                "w-full max-w-4xl mx-auto group relative bg-[var(--bg-card)] rounded-2xl border transition-all duration-200 overflow-hidden",
                isUploading 
                    ? "border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/30 shadow-sm" 
                    : "border-[var(--border-color)]/80 hover:border-[var(--accent-color)]/40 focus-within:border-[var(--accent-color)] focus-within:ring-2 focus-within:ring-[var(--accent-color)]/20"
            )}>
                {/* Active Uploading & Indexing Progress Banner */}
                {isUploading && (
                    <div className="flex items-center gap-2 p-2.5 px-4 bg-[var(--accent-color)]/10 border-b border-[var(--accent-color)]/35 text-xs text-[var(--text-main)] font-sans animate-pulse">
                        <Loader2 className="w-4 h-4 text-[var(--accent-color)] animate-spin shrink-0" />
                        <span className="font-semibold text-[var(--accent-color)]">
                            Indexing & Uploading {uploadingFileName ? `"${uploadingFileName}"` : "document"}...
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
                            (Storing in Supabase Storage & generating vector embeddings — please wait)
                        </span>
                    </div>
                )}

                {/* Persistent Uploaded/Attached Documents Tray */}
                {attachedDocuments.length > 0 && !isUploading && (
                    <div className="flex items-center gap-2 px-3.5 py-2 overflow-x-auto border-b border-[var(--border-color)]/60 bg-[var(--bg-hover)]/30 font-sans">
                        <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-[var(--text-muted)] shrink-0 tracking-wider">
                            <Paperclip className="w-3 h-3 text-[var(--accent-color)]" />
                            <span>Attached:</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-nowrap">
                            {attachedDocuments.map((doc, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 text-xs text-[var(--text-main)] shadow-2xs group hover:border-[var(--accent-color)]/40 transition-all shrink-0 font-medium"
                                >
                                    <FileText className="w-3.5 h-3.5 text-[var(--accent-color)] shrink-0" />
                                    <span className="truncate max-w-[150px]">{doc.name}</span>
                                    {doc.size ? (
                                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                            ({doc.size > 1024 * 1024 ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB` : `${(doc.size / 1024).toFixed(0)} KB`})
                                        </span>
                                    ) : null}
                                    {doc.url && (
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-0.5 hover:text-[var(--accent-color)] text-[var(--text-muted)] transition-colors"
                                            title="Open full document in new tab"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upper Input Section */}
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isUploading}
                    placeholder={isUploading ? "Uploading and indexing document... Please wait..." : "Ask anything or search documents..."}
                    className={cn(
                        "w-full bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] p-4 sm:p-4 min-h-[68px] max-h-[200px] resize-none outline-none focus:outline-none focus:ring-0 border-0 focus:border-0 text-base font-medium leading-relaxed",
                        isUploading && "opacity-60 cursor-not-allowed"
                    )}
                    rows={1}
                />

                {/* Lower Actions Row */}
                <div className="flex items-center justify-between px-3.5 pb-2.5 pt-0 bg-[var(--bg-card)]">
                    <div className="flex gap-1 items-center">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className={cn(
                                "p-1.5 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors",
                                isUploading && "opacity-40 cursor-not-allowed"
                            )}
                            title={isUploading ? "Indexing in progress..." : "Upload document (PDF, DOCX, XLSX, TXT)"}
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsPasteModalOpen(true)}
                            disabled={isUploading}
                            className={cn(
                                "p-1.5 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors",
                                isUploading && "opacity-40 cursor-not-allowed"
                            )}
                            title="Paste text"
                        >
                            <Clipboard className="w-4 h-4" />
                        </button>
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.docx,.xlsx,.csv,.pptx,.txt"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={isUploading || !input.trim()}
                        className={cn(
                            "w-7 h-7 p-1 rounded-full transition-all flex items-center justify-center",
                            !isUploading && input.trim()
                                ? "bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] cursor-pointer shadow-sm"
                                : "bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed opacity-60"
                        )}
                        title={isUploading ? "Indexing document..." : "Send message"}
                    >
                        {isUploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-color)]" />
                        ) : (
                            <ArrowUp className="w-3.5 h-3.5 text-current stroke-[2.5]" />
                        )}
                    </button>
                </div>
            </div>

            <div className="text-center mt-2.5 text-xs text-[var(--text-muted)] font-medium max-w-4xl mx-auto">
                AskDoc uses Gemini & Pinecone vector search. Double check critical details.
            </div>
        </div>
    );
}
