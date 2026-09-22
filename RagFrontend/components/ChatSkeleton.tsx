import React from "react";

export function ChatSkeleton() {
    return (
        <div className="flex flex-col space-y-8 max-w-4xl mx-auto w-full animate-pulse">
            {/* User Message Skeleton */}
            <div className="flex flex-row-reverse gap-4">
                <div className="w-8 h-8 rounded-xl bg-[var(--bg-hover)] shrink-0" />
                <div className="flex flex-col gap-2 items-end max-w-[80%] w-full">
                    <div className="h-4 bg-[var(--bg-hover)] rounded-lg w-1/3" />
                    <div className="h-16 bg-[var(--bg-hover)] rounded-2xl w-2/3" />
                </div>
            </div>

            {/* Bot Message Skeleton */}
            <div className="flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-[var(--bg-hover)] shrink-0" />
                <div className="flex flex-col gap-2 items-start max-w-[80%] w-full">
                    <div className="h-4 bg-[var(--bg-hover)] rounded-lg w-1/4" />
                    <div className="h-4 bg-[var(--bg-hover)] rounded-lg w-full" />
                    <div className="h-4 bg-[var(--bg-hover)] rounded-lg w-full" />
                    <div className="h-4 bg-[var(--bg-hover)] rounded-lg w-3/4" />

                    {/* Sources Skeleton */}
                    <div className="flex gap-2 mt-4">
                        <div className="h-8 w-24 bg-[var(--bg-hover)] rounded-lg" />
                        <div className="h-8 w-24 bg-[var(--bg-hover)] rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
