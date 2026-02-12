import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getAnthropicClient } from "@/lib/anthropic";
import {
    DOCTRINE_SYSTEM_PROMPT,
    analyzeUserProfile,
    selectStrategy,
    calculateConfidence,
    detectObjection,
    extractDoctrineReferences,
    calculateReadiness,
    generateFallbackResponse,
} from "@/lib/chat-engine";

// Rate limiting (simple in-memory, upgrade to Redis for production scale)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
        requestCounts.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
        return true;
    }

    if (record.count >= 10) { // 10 requests per minute
        return false;
    }

    record.count++;
    return true;
}

export async function POST(req: NextRequest) {
    // Basic CORS headers for preflight/options are handled by next.config.ts or vercel.json
    // But we ensure the response has them too if needed globally

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { error: "Too many requests. Please wait." },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();
        const { messages } = body as {
            messages: { role: "user" | "assistant"; content: string }[];
        };

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
        }

        const lastUserMsg = messages[messages.length - 1]?.content ?? "";
        const userMessageCount = messages.filter((m) => m.role === "user").length;
        const objectionDetected = detectObjection(lastUserMsg);
        const profile = analyzeUserProfile(messages);
        const strategy = selectStrategy(profile);
        const confidence = calculateConfidence(profile, strategy);

        let reply: string;
        let doctrineReferenced: string[] = [];

        // Try Claude API, fall back to local generator
        const anthropic = getAnthropicClient();

        // Debug: check if API key is available
        console.log("[DEBUG] API Key exists:", !!process.env.ANTHROPIC_API_KEY);
        console.log("[DEBUG] Anthropic client created:", !!anthropic);

        if (anthropic) {
            try {
                const strategyHint = objectionDetected
                    ? `[OBJECTION DETECTED — use rebuttal pattern] [Strategy: ${strategy}]`
                    : `[Strategy: ${strategy}]`;

                const response = await anthropic.messages.create({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 1024,
                    system: DOCTRINE_SYSTEM_PROMPT,
                    messages: messages.map((m, i) => ({
                        role: m.role as "user" | "assistant",
                        content:
                            i === messages.length - 1 && m.role === "user"
                                ? `${strategyHint} ${m.content}`
                                : m.content,
                    })),
                });

                reply =
                    response.content[0].type === "text"
                        ? response.content[0].text
                        : "The doctrine requires contemplation. Please rephrase your inquiry.";
            } catch (apiErr: any) {
                console.error("Claude API error, using fallback:", apiErr);
                if (apiErr.status === 429) {
                    return NextResponse.json({ error: "AI service rate limit. Please retry." }, { status: 429 });
                }
                const fb = generateFallbackResponse(lastUserMsg, userMessageCount);
                reply = fb.reply;
            }
        } else {
            const fb = generateFallbackResponse(lastUserMsg, userMessageCount);
            reply = fb.reply;
        }

        doctrineReferenced = extractDoctrineReferences(reply);

        // Accumulate all referenced doctrines across conversation
        const allDoctrineSet = new Set<string>();
        for (const msg of messages) {
            extractDoctrineReferences(msg.content).forEach((d) => allDoctrineSet.add(d));
        }
        doctrineReferenced.forEach((d) => allDoctrineSet.add(d));

        const totalObjections = messages
            .filter((m) => m.role === "user")
            .filter((m) => detectObjection(m.content)).length;

        const { readiness, milestones } = calculateReadiness(
            userMessageCount,
            allDoctrineSet,
            totalObjections
        );

        const hash = createHash("sha256").update(reply).digest("hex");

        return NextResponse.json({
            reply,
            strategy,
            confidence,
            hash: `0x${hash.slice(0, 8)}...`,
            fullHash: hash,
            objectionDetected,
            doctrineReferenced,
            conversionReadiness: readiness,
            milestones,
            userProfile: {
                reasoning: profile.reasoning,
                emotionalReceptivity: profile.emotionalReceptivity,
                securityConscious: profile.securityConscious,
            },
        });
    } catch (err: any) {
        console.error("Chat API error:", err);
        return NextResponse.json({
            error: "An error occurred processing your request",
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        }, { status: 500 });
    }
}
