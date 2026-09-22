"use client";

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { motion } from "framer-motion";

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();

    const cycleTheme = () => {
        if (theme === "dark") setTheme("light");
        else if (theme === "light") setTheme("system");
        else setTheme("dark");
    };

    return (
        <button
            onClick={cycleTheme}
            className={`h-9 w-9 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center text-[var(--text-main)] shadow-sm ${className}`}
            title={`Current theme: ${theme}. Click to switch.`}
            aria-label="Toggle Theme"
        >
            <motion.div
                key={theme}
                initial={{ scale: 0.8, rotate: -30, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
            >
                {theme === "dark" && <Moon className="w-5 h-5 text-amber-400" />}
                {theme === "light" && <Sun className="w-5 h-5 text-amber-500" />}
                {theme === "system" && <Monitor className="w-5 h-5 text-blue-400" />}
            </motion.div>
            {showLabel && (
                <span className="text-sm font-medium capitalize select-none">
                    {theme} Mode
                </span>
            )}
        </button>
    );
}
