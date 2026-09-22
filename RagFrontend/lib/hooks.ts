import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Session, Message, getSessions, getMessages } from "./api";

export function useSessions(isAuthenticated: boolean = true) {
    const queryClient = useQueryClient();

    const { data, error, isLoading } = useQuery<Session[]>({
        queryKey: ["sessions"],
        queryFn: getSessions,
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5, // 5 minutes stale time (no duplicate fetches)
        gcTime: 1000 * 60 * 15, // Keep cache for 15 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const mutate = async (
        updater?: Session[] | ((old: Session[] | undefined) => Session[] | undefined),
        options?: { revalidate?: boolean }
    ) => {
        if (typeof updater === "function") {
            queryClient.setQueryData(["sessions"], updater);
        } else if (updater !== undefined) {
            queryClient.setQueryData(["sessions"], updater);
        }
        if (!options || options.revalidate !== false) {
            await queryClient.invalidateQueries({ queryKey: ["sessions"] });
        }
    };

    return {
        sessions: data || [],
        isLoading,
        isError: error,
        mutate,
    };
}

export function useMessages(sessionId: string | null) {
    const queryClient = useQueryClient();

    const { data, error, isLoading } = useQuery<Message[]>({
        queryKey: ["messages", sessionId],
        queryFn: () => getMessages(sessionId!),
        enabled: !!sessionId,
        staleTime: 1000 * 60 * 10, // 10 minutes cache for session messages
        gcTime: 1000 * 60 * 30, // Keep in memory 30 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const mutate = async (
        updater?: Message[] | ((old: Message[] | undefined) => Message[] | undefined),
        options?: { revalidate?: boolean }
    ) => {
        if (typeof updater === "function") {
            queryClient.setQueryData(["messages", sessionId], updater);
        } else if (updater !== undefined) {
            queryClient.setQueryData(["messages", sessionId], updater);
        }
        if (!options || options.revalidate !== false) {
            await queryClient.invalidateQueries({ queryKey: ["messages", sessionId] });
        }
    };

    return {
        messages: data || [],
        isLoading,
        isError: error,
        mutate,
    };
}
