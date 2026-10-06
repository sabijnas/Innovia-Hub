import { BASE_API_URL } from "../config/api";

type ChatRequest = {
    question: string;
    startTime: string;
    endTime: string,
    resourceTypeId?: string | null;
};

export async function askChat(request: ChatRequest): Promise<string> {
    const response = await fetch(`${BASE_API_URL}/api/Chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error("Chatten kunde inte svara just nu");
    }

    return response.text();
}