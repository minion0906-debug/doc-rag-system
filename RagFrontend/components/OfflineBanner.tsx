"use client";

import React from "react";
import { useHealthCheck } from "@/lib/useHealthCheck";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
    const { isOnline, checkHealth, isChecking } = useHealthCheck();

    // Don't show anything if online or initial loading
    if (isOnline === true || isOnline === null) return null;

    return (
        <div className="w-full bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-4 animate-pulse">
            <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">
                    Backend is offline. Please run <code className="bg-red-700 px-1.5 py-0.5 rounded text-sm font-mono">python main.py</code> in RagBackend folder.
                </span>
            </div>
            <button
                onClick={checkHealth}
                disabled={isChecking}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
            >
                <RefreshCw className={cn("w-4 h-4", isChecking && "animate-spin")} />
                {isChecking ? "Checking..." : "Retry"}
            </button>
        </div>
    );
}
