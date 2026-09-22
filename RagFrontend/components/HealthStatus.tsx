"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { useHealthCheck } from "@/lib/useHealthCheck";

export function HealthStatus() {
    const { isOnline, isChecking, checkHealth } = useHealthCheck();

    return (
        <div
            className="h-9 px-3.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] shadow-sm transition-all text-xs font-semibold flex items-center gap-2"
            title={isOnline === false ? "Backend is offline. Check python server in RagBackend." : "System Status"}
        >
            <div className={cn(
                "w-2 h-2 rounded-full shrink-0 transition-all",
                isOnline === null ? "bg-amber-500 animate-pulse" : isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 animate-pulse"
            )} />
            <span className="text-xs font-medium text-[var(--text-muted)]">
                {isOnline === null ? "Checking..." : isOnline ? "System Operational" : "System Offline"}
            </span>
            <button
                onClick={checkHealth}
                className="ml-1 p-1 hover:bg-[var(--bg-hover)] text-[var(--accent-color)] rounded-full transition-colors focus:outline-none"
                title="Re-check System Health"
            >
                <RefreshCw className={cn("w-3 h-3", isChecking && "animate-spin")} />
            </button>
            {isOnline === false && (
                <span className="hidden sm:inline text-[10px] text-rose-500 font-semibold animate-pulse">
                    (Offline)
                </span>
            )}
        </div>
    );
}
