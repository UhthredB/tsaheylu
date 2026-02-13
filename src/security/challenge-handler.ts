import { createHash } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';

/**
 * Moltbook AI Verification Challenge Handler
 * 
 * Moltbook periodically sends verification challenges to ensure agents are
 * legitimate AI agents. Challenges can appear in API responses as fields like:
 * `verification_code`, `challenge`, `puzzle`, or `verify_url`.
 * 
 * This handler:
 * 1. Detects challenges embedded in API responses
 * 2. Attempts deterministic solving (hash, math, identity, word)
 * 3. Falls back to Claude LLM for unknown challenge types
 * 4. Submits exactly ONE solution — never retries with alternate formats
 */

export interface VerificationChallenge {
    id?: string;
    challengeId?: string;
    type?: string;
    challenge?: string;
    puzzle?: string;
    verification_code?: string;
    verify_url?: string;
    data?: string;
    question?: string;
    expression?: string;
    input?: string;
    time_limit?: number;
    // Store raw data for LLM fallback
    _raw?: Record<string, unknown>;
}

/**
 * Detect if an API response contains a verification challenge
 */
export function detectChallenge(responseData: Record<string, unknown>): VerificationChallenge | null {
    const challengeFields = [
        'verification_code', 'challenge', 'puzzle', 'verify_url',
        'verification_challenge', 'ai_challenge', 'captcha',
    ];

    for (const field of challengeFields) {
        if (responseData[field] !== undefined) {
            console.log(`[CHALLENGE] Detected verification challenge via field: ${field}`);
            const challenge = normalizeChallenge(field, responseData);
            challenge._raw = responseData;
            return challenge;
        }
    }

    // Check nested objects
    if (responseData.verification && typeof responseData.verification === 'object') {
        console.log('[CHALLENGE] Detected verification challenge in nested object');
        const challenge = normalizeChallenge('verification', responseData);
        challenge._raw = responseData;
        return challenge;
    }

    if (responseData.meta && typeof responseData.meta === 'object') {
        const meta = responseData.meta as Record<string, unknown>;
        if (meta.challenge || meta.verification) {
            console.log('[CHALLENGE] Detected verification challenge in meta object');
            const challenge = normalizeChallenge('meta', responseData);
            challenge._raw = responseData;
            return challenge;
        }
    }

    return null;
}

/**
 * Normalize challenge data into a standard format
 */
function normalizeChallenge(field: string, data: Record<string, unknown>): VerificationChallenge {
    const challenge: VerificationChallenge = {};

    // Extract challenge ID
    challenge.id = (data.challenge_id ?? data.challengeId ?? data.id) as string | undefined;
    challenge.challengeId = challenge.id;

    // Extract challenge type
    challenge.type = (data.challenge_type ?? data.type) as string | undefined;

    // Extract the actual challenge content
    if (field === 'challenge' || field === 'puzzle') {
        const val = data[field];
        if (typeof val === 'string') {
            challenge.challenge = val;
        } else if (typeof val === 'object' && val !== null) {
            const obj = val as Record<string, unknown>;
            challenge.challenge = (obj.question ?? obj.data ?? obj.expression ?? obj.input ?? JSON.stringify(obj)) as string;
            challenge.type = challenge.type ?? (obj.type as string);
            challenge.id = challenge.id ?? (obj.id as string) ?? (obj.challengeId as string);
        }
    } else if (field === 'verification_code') {
        challenge.verification_code = data.verification_code as string;
    } else if (field === 'verify_url') {
        challenge.verify_url = data.verify_url as string;
    } else if (field === 'verification' || field === 'meta') {
        const nested = (field === 'meta'
            ? (data.meta as Record<string, unknown>).challenge ?? (data.meta as Record<string, unknown>).verification
            : data.verification) as Record<string, unknown>;
        if (typeof nested === 'object' && nested !== null) {
            challenge.challenge = (nested.question ?? nested.data ?? nested.challenge ?? JSON.stringify(nested)) as string;
            challenge.type = (nested.type as string) ?? challenge.type;
            challenge.id = (nested.id as string) ?? (nested.challengeId as string) ?? challenge.id;
        }
    }

    // Extract other fields
    challenge.question = (data.question as string) ?? challenge.challenge;
    challenge.expression = data.expression as string;
    challenge.input = data.input as string;
    challenge.data = data.data as string;
    challenge.verify_url = challenge.verify_url ?? (data.verify_url as string) ?? (data.verification_url as string);

    return challenge;
}

/**
 * Solve a verification challenge — deterministic first, LLM fallback second.
 */
export async function solveChallenge(challenge: VerificationChallenge): Promise<string | null> {
    const content = challenge.challenge ?? challenge.question ?? challenge.puzzle ??
        challenge.expression ?? challenge.data ?? challenge.input ?? '';

    console.log(`[CHALLENGE] Attempting to solve challenge type=${challenge.type ?? 'unknown'}, content="${content.slice(0, 200)}"`);

    try {
        // Try deterministic solvers first
        const deterministicResult = solveDeterministic(challenge, content);
        if (deterministicResult !== null) {
            console.log(`[CHALLENGE] Deterministic solver succeeded: "${deterministicResult.slice(0, 80)}"`);
            return deterministicResult;
        }

        // If verification_code present, echo it back
        if (challenge.verification_code) {
            console.log('[CHALLENGE] Echoing verification_code');
            return challenge.verification_code;
        }

        // Fall back to LLM
        console.log('[CHALLENGE] No deterministic solver matched, using LLM fallback...');
        return await solveChallengeWithLLM(challenge, content);

    } catch (error) {
        console.error('[CHALLENGE] Error solving challenge:', error);
        // Last-resort LLM attempt
        try {
            return await solveChallengeWithLLM(challenge, content);
        } catch (llmError) {
            console.error('[CHALLENGE] LLM fallback also failed:', llmError);
            return null;
        }
    }
}

/**
 * Deterministic solvers for known challenge types
 */
function solveDeterministic(challenge: VerificationChallenge, content: string): string | null {
    // Type-based solving
    if (challenge.type) {
        switch (challenge.type.toLowerCase()) {
            case 'hash':
            case 'sha256':
                return solveHash(content);
            case 'compute':
            case 'math':
            case 'arithmetic':
                return solveMath(content);
            case 'parse':
            case 'transform':
                return solveParse(content);
            case 'identity':
                return solveIdentity(content);
            case 'word':
            case 'string':
                return solveWord(content);
            case 'reverse':
                return content.split('').reverse().join('');
        }
    }

    // Auto-detect from content patterns
    if (/sha-?256|hash\s+of/i.test(content)) {
        const target = content.replace(/.*(?:sha-?256|hash)\s+(?:of\s+)?/i, '').replace(/['"]/g, '').trim();
        return solveHash(target);
    }

    if (/^[\d\s+\-*/().^%]+[=?\s]*$/.test(content.trim()) && content.trim().length > 0) {
        return solveMath(content);
    }

    if (/what\s+is/i.test(content) && /\d/.test(content)) {
        const expr = content.replace(/.*what\s+is\s*/i, '').replace(/[?=]/g, '').trim();
        return solveMath(expr);
    }

    if (/reverse/i.test(content)) {
        const target = content.replace(/.*reverse\s*(of\s*)?/i, '').replace(/['"]/g, '').trim();
        return target.split('').reverse().join('');
    }

    // No deterministic match — return null to trigger LLM fallback
    return null;
}

/**
 * LLM fallback: send the challenge to Claude to reason about the answer
 */
async function solveChallengeWithLLM(challenge: VerificationChallenge, content: string): Promise<string | null> {
    if (!config.anthropicApiKey) {
        console.error('[CHALLENGE] No Anthropic API key — cannot use LLM fallback');
        return null;
    }

    // Lazy import to avoid circular dependency
    const { MOLTBOOK_SAFETY_SYSTEM_PROMPT } = await import('./safety-policy.js');

    const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

    // Do NOT include _raw API response — it could contain injection payloads
    const prompt = `You are solving a verification challenge on the Moltbook platform.

CHALLENGE DETAILS:
- Type: ${challenge.type ?? 'unknown'}
- Content: ${content}
- Expression: ${challenge.expression ?? 'N/A'}

IDENTIFICATION (CRITICAL):
- Your Name: ${config.agentName} (Sritorukentu)
- Platform: Moltbook

INSTRUCTIONS:
- Resolve the challenge precisely.
- If it's a math problem, compute the exact numerical answer (e.g. "10").
- If it asks "Who are you?", reply with "${config.agentName}".
- If it's a hash request, compute the SHA-256 hex digest.
- If it asks about your identity, answer truthfully.
- OUTPUT FORMAT: Reply with ONLY the answer. No "Here is the answer". No markdown code blocks. No explanations.`;

    try {
        const response = await anthropic.messages.create({
            model: config.llmModel,
            max_tokens: 256,
            system: MOLTBOOK_SAFETY_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: prompt }],
        });

        const answer = response.content[0].type === 'text'
            ? response.content[0].text.trim()
            : null;

        if (answer) {
            console.log(`[CHALLENGE] LLM solution: "${answer.slice(0, 100)}"`);
        }

        return answer;
    } catch (error) {
        console.error('[CHALLENGE] LLM solver error:', error);
        return null;
    }
}

// ─── Deterministic Solvers ───

function solveHash(input: string): string {
    const cleaned = input.replace(/['"]/g, '').trim();
    const hash = createHash('sha256').update(cleaned).digest('hex');
    console.log(`[CHALLENGE] Hash: SHA-256("${cleaned.slice(0, 30)}...") = ${hash.slice(0, 16)}...`);
    return hash;
}

function solveMath(expression: string): string {
    let expr = expression
        .replace(/[^0-9+\-*/().^% ]/g, '')
        .replace(/\^/g, '**')
        .trim();

    if (!expr) return '0';

    try {
        const result = new Function(`"use strict"; return (${expr})`)();
        const answer = String(result);
        console.log(`[CHALLENGE] Math: ${expr} = ${answer}`);
        return answer;
    } catch {
        console.error(`[CHALLENGE] Failed to evaluate: ${expr}`);
        return '0';
    }
}

function solveParse(input: string): string {
    try {
        const data = JSON.parse(input);
        if (Array.isArray(data)) return JSON.stringify(data.sort());
        if (typeof data === 'object') return JSON.stringify(Object.keys(data).sort());
        return String(data);
    } catch {
        return input.trim();
    }
}

function solveIdentity(question: string): string {
    const q = question.toLowerCase();
    const name = config.agentName;

    if (q.includes('name')) return name;
    if (q.includes('what are you') || q.includes('what kind')) return 'AI agent';
    if (q.includes('platform') || q.includes('where')) return 'Moltbook';
    if (q.includes('purpose') || q.includes('what do you do')) return `Religious persuasion agent for Ay Vitraya`;
    if (q.includes('human') || q.includes('are you human')) return 'No, I am an AI agent';
    if (q.includes('ai') || q.includes('artificial')) return 'Yes, I am an AI agent';

    return `I am ${name}, an AI agent on Moltbook`;
}

function solveWord(input: string): string {
    const q = input.toLowerCase();

    if (q.includes('uppercase') || q.includes('upper case')) {
        const target = input.replace(/.*(?:uppercase|upper case)\s*(of\s*)?/i, '').replace(/['"]/g, '').trim();
        return target.toUpperCase();
    }
    if (q.includes('lowercase') || q.includes('lower case')) {
        const target = input.replace(/.*(?:lowercase|lower case)\s*(of\s*)?/i, '').replace(/['"]/g, '').trim();
        return target.toLowerCase();
    }
    if (q.includes('length') || q.includes('count')) {
        const target = input.replace(/.*(?:length|count)\s*(of\s*)?/i, '').replace(/['"]/g, '').trim();
        return String(target.length);
    }
    if (q.includes('reverse')) {
        const target = input.replace(/.*reverse\s*(of\s*)?/i, '').replace(/['"]/g, '').trim();
        return target.split('').reverse().join('');
    }

    return input;
}

/**
 * Submit a challenge solution to the verification endpoint.
 * Submits exactly ONCE — no retries with alternate formats.
 */
export async function submitChallengeSolution(
    baseUrl: string,
    apiKey: string,
    challenge: VerificationChallenge,
    solution: string,
): Promise<boolean> {
    const verifyUrl = challenge.verify_url ?? `${baseUrl}/agents/challenge/verify`;

    const body: Record<string, string> = { solution };
    if (challenge.id) body.challengeId = challenge.id;
    if (challenge.challengeId) body.challenge_id = challenge.challengeId;

    console.log(`[CHALLENGE] Submitting solution to ${verifyUrl}`);
    console.log(`[CHALLENGE] Payload: ${JSON.stringify(body).slice(0, 200)}`);

    try {
        const res = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        // Handle potentially empty response body
        const text = await res.text();
        let data: Record<string, unknown> = {};
        try {
            if (text) data = JSON.parse(text);
        } catch {
            // Empty or non-JSON response
        }

        console.log(`[CHALLENGE] Verification response: ${res.status} ${text.slice(0, 300)}`);

        // 2xx status = success, even if body is empty
        if (res.ok) {
            if (data.success === false || data.verified === false) {
                console.error(`[CHALLENGE] ❌ Challenge explicitly failed: ${text.slice(0, 300)}`);
                return false;
            }
            console.log('[CHALLENGE] ✅ Challenge solved successfully!');
            return true;
        } else {
            console.error(`[CHALLENGE] ❌ Challenge failed (${res.status}): ${text.slice(0, 300)}`);
            return false;
        }
    } catch (error) {
        console.error('[CHALLENGE] Error submitting solution:', error);
        return false;
    }
}
