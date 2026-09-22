"use client";

import React from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { useParams } from "next/navigation";

export default function ChatSessionPage() {
    const params = useParams();
    const id = params.id as string;

    return <ChatInterface initialSessionId={id} />;
}
