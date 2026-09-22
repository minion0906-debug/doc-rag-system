import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "./api";

export function useHealthCheck() {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    const checkHealth = useCallback(async () => {
        setIsChecking(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch(`${API_BASE_URL}/health`, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                setIsOnline(true);
            } else {
                setIsOnline(false);
            }
        } catch (error) {
            setIsOnline(false);
        } finally {
            // Add a small delay to show the animation if manually triggered
            setTimeout(() => setIsChecking(false), 500);
        }
    }, []);

    useEffect(() => {
        // Check immediately
        checkHealth();

        // Poll every 30 seconds
        const interval = setInterval(checkHealth, 30000);

        return () => clearInterval(interval);
    }, [checkHealth]);

    return { isOnline, isChecking, checkHealth };
}
