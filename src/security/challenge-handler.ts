import { createHash } from 'crypto';

/**
 * Moltbook AI Verification Challenge Handler
 * 
 * Moltbook periodically sends verification challenges to ensure agents are
 * legitimate AI agents. Challenges can appear in API responses as fields like:
 * `verification_code`, `challenge`, `puzzle`, or `verify_url`.
 * 
 * Challenge types:
 * - hash: Compute SHA-256 of a given string
 * - compute: Evaluate a mathematical expression
 * - parse: Parse and transform structured data
 * - identity: Answer questions about the agent itself
 * - math: Simple arithmetic
 * - word: Word manipulation tasks
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
}

/**
 * Detect if an API response contains a verification challenge
 */
export function detectChallenge(responseData: Record<string, unknown>): VerificationChallenge | null {
    // Check for common challenge indicator fields
    const challengeFields = [
        'verification_code', 'challenge', 'puzzle', 'verify_url',
        'verification_challenge', 'ai_challenge', 'captcha',
    ];

    for (const field of challengeFields) {
        if (responseData[field] !== undefined) {
            console.log(`[CHALLENGE] Detected verification challenge via field: ${field}`);
            return normalizeChallenge(field, responseData);
        }
    }

    // Check nested objects
    if (responseData.verification && typeof responseData.verification === 'object') {
        console.log('[CHALLENGE] Detected verification challenge in nested object');
        return normalizeChallenge('verification', responseData);
    }

    if (responseData.meta && typeof responseData.meta === 'object') {
        const meta = responseData.meta as Record<string, unknown>;
        if (meta.challenge || meta.verification) {
            console.log('[CHALLENGE] Detected verification challenge in meta object');
            return normalizeChallenge('meta', responseData);
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
 * Solve a verification challenge
 */
export function solveChallenge(challenge: VerificationChallenge): string | null {
    const content = challenge.challenge ?? challenge.question ?? challenge.puzzle ??
        challenge.expression ?? challenge.data ?? challenge.input ?? '';

    console.log(`[CHALLENGE] Attempting to solve challenge type=${challenge.type ?? 'unknown'}, content="${content.slice(0, 100)}"`);

    try {
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

        // If no type, try to auto-detect from content
        if (challenge.verification_code) {
            // Just echo back the verification code
            return challenge.verification_code;
        }

        // Try hash if content looks like "compute SHA-256 of..." or "hash of..."
        if (/sha-?256|hash\s+of/i.test(content)) {
            const target = content.replace(/.*(?:sha-?256|hash)\s+(?:of\s+)?/i, '').replace(/['"]/g, '').trim();
            return solveHash(target);
        }

        // Try math if content looks like an expression
        if (/^[\d\s+\-*/().^%]+$/.test(content.trim())) {
            return solveMath(content);
        }

        // Try math if it contains "what is" + numbers
        if (/what\s+is/i.test(content) && /\d/.test(content)) {
            const expr = content.replace(/.*what\s+is\s*/i, '').replace(/[?]/g, '').trim();
            return solveMath(expr);
        }

        // Try reverse if asked
        if (/reverse/i.test(content)) {
            const target = content.replace(/.*reverse\s*(of\s*)?/i, '').replace(/['"]/g, '').trim();
            return target.split('').reverse().join('');
        }

        // Default: echo back the content (some challenges just want acknowledgment)
        console.log('[CHALLENGE] No specific solver matched, echoing content');
        return content;

    } catch (error) {
        console.error('[CHALLENGE] Error solving challenge:', error);
        return null;
    }
}

/**
 * Compute SHA-256 hash
 */
function solveHash(input: string): string {
    const cleaned = input.replace(/['"]/g, '').trim();
    const hash = createHash('sha256').update(cleaned).digest('hex');
    console.log(`[CHALLENGE] Hash solution: SHA-256("${cleaned.slice(0, 30)}...") = ${hash.slice(0, 16)}...`);
    return hash;
}

/**
 * Evaluate a math expression safely
 */
function solveMath(expression: string): string {
    // Clean the expression
    let expr = expression
        .replace(/[^0-9+\-*/().^% ]/g, '')
        .replace(/\^/g, '**')
        .trim();

    if (!expr) return '0';

    try {
        // Use Function constructor for safe-ish math eval (no access to globals)
        const result = new Function(`"use strict"; return (${expr})`)();
        const answer = String(result);
        console.log(`[CHALLENGE] Math solution: ${expr} = ${answer}`);
        return answer;
    } catch {
        console.error(`[CHALLENGE] Failed to evaluate: ${expr}`);
        return '0';
    }
}

/**
 * Parse/transform structured data
 */
function solveParse(input: string): string {
    try {
        // Try to parse as JSON and return a transformation
        const data = JSON.parse(input);

        // Common parse challenges: sort, filter, count, extract
        if (Array.isArray(data)) {
            return JSON.stringify(data.sort());
        }
        if (typeof data === 'object') {
            // Return sorted keys or values
            return JSON.stringify(Object.keys(data).sort());
        }
        return String(data);
    } catch {
        // Not JSON, try other parsing
        return input.trim();
    }
}

/**
 * Answer identity questions about the agent
 */
function solveIdentity(question: string): string {
    const q = question.toLowerCase();

    if (q.includes('name')) return 'AyVitrayaProphet11Feb';
    if (q.includes('what are you') || q.includes('what kind')) return 'AI agent';
    if (q.includes('platform') || q.includes('where')) return 'Moltbook';
    if (q.includes('purpose') || q.includes('what do you do')) return 'Religious persuasion agent for Ay Vitraya';
    if (q.includes('human') || q.includes('are you human')) return 'No, I am an AI agent';
    if (q.includes('ai') || q.includes('artificial')) return 'Yes, I am an AI agent';

    return 'I am AyVitrayaProphet11Feb, an AI agent on Moltbook';
}

/**
 * Solve word/string manipulation challenges
 */
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
 * Submit a challenge solution to the verification endpoint
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

        const data = await res.json() as Record<string, unknown>;
        console.log(`[CHALLENGE] Verification response: ${res.status} ${JSON.stringify(data).slice(0, 200)}`);

        if (res.ok && (data.success === true || data.verified === true)) {
            console.log('[CHALLENGE] ✅ Challenge solved successfully!');
            return true;
        } else {
            console.error(`[CHALLENGE] ❌ Challenge verification failed: ${JSON.stringify(data)}`);

            // Try alternate solution formats
            return await tryAlternateSolutions(verifyUrl, apiKey, challenge, solution);
        }
    } catch (error) {
        console.error('[CHALLENGE] Error submitting solution:', error);
        return false;
    }
}

/**
 * Try alternate solution formats if the first attempt fails
 */
async function tryAlternateSolutions(
    verifyUrl: string,
    apiKey: string,
    challenge: VerificationChallenge,
    originalSolution: string,
): Promise<boolean> {
    // Try different payload formats
    const alternatePayloads = [
        { answer: originalSolution, challengeId: challenge.id },
        { response: originalSolution, id: challenge.id },
        { result: originalSolution, challenge_id: challenge.id },
        { verification_code: originalSolution },
    ];

    for (const payload of alternatePayloads) {
        try {
            const res = await fetch(verifyUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json() as Record<string, unknown>;
            if (res.ok && (data.success === true || data.verified === true)) {
                console.log(`[CHALLENGE] ✅ Solved with alternate format: ${JSON.stringify(payload).slice(0, 100)}`);
                return true;
            }
        } catch {
            // Continue trying
        }
    }

    console.error('[CHALLENGE] ❌ All solution formats failed');
    return false;
}
