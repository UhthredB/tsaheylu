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
 * Challenges may also arrive via:
 * - Pull-based polling (heartbeat, /agents/status)
 * - DMs (with needs_human_input flag or challenge keywords)
 * - Nested deep within response objects
 *
 * This handler:
 * 1. Detects challenges via recursive deep scanning (up to 4 levels)
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

// Challenge field names that indicate a verification challenge
const CHALLENGE_FIELDS = new Set([
    'verification_code', 'challenge', 'puzzle', 'verify_url',
    'verification_challenge', 'ai_challenge', 'captcha',
    'test', 'verify', 'proof', 'task', 'prompt', 'quiz',
    'verification_task', 'challenge_question', 'identity_challenge',
]);

// Container fields to recurse into when looking for challenges
const CONTAINER_FIELDS = new Set([
    'verification', 'meta', 'data', 'challenge_info', 'security', 'identity',
]);

/**
 * Check if a value is a valid (non-empty) challenge value
 */
function isValidChallengeValue(val: unknown): boolean {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (typeof val === 'number' || typeof val === 'boolean') return true;
    if (typeof val === 'object') {
        return Object.keys(val as Record<string, unknown>).length > 0;
    }
    return false;
}

/**
 * Recursively scan an object for challenge fields, up to maxDepth levels.
 * Returns the first challenge field name and the object it was found in.
 */
function scanForChallenge(
    obj: Record<string, unknown>,
    depth: number = 0,
    maxDepth: number = 4,
): { field: string; container: Record<string, unknown> } | null {
    if (depth > maxDepth) return null;
    if (!obj || typeof obj !== 'object') return null;

    // Check direct challenge fields at this level
    for (const field of CHALLENGE_FIELDS) {
        if (field in obj && isValidChallengeValue(obj[field])) {
            return { field, container: obj };
        }
    }

    // Recurse into known container fields
    for (const containerKey of CONTAINER_FIELDS) {
        const nested = obj[containerKey];
        if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
            const result = scanForChallenge(nested as Record<string, unknown>, depth + 1, maxDepth);
            if (result) return result;
        }
    }

    // Scan array items (up to 5 per array) at this level
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (Array.isArray(val)) {
            for (const item of val.slice(0, 5)) {
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                    const result = scanForChallenge(item as Record<string, unknown>, depth + 1, maxDepth);
                    if (result) return result;
                }
            }
        }
    }

    return null;
}

/**
 * Detect if an API response contains a verification challenge.
 * Uses recursive deep scanning up to 4 levels.
 */
export function detectChallenge(responseData: Record<string, unknown>): VerificationChallenge | null {
    const found = scanForChallenge(responseData);
    if (!found) return null;

    const { field, container } = found;
    console.log(`[CHALLENGE] Detected verification challenge via field: "${field}" (depth scan)`);
    const challenge = normalizeChallenge(field, container);
    challenge._raw = responseData;
    return challenge;
}

/**
 * Normalize challenge data into a standard format
 */
function normalizeChallenge(field: string, data: Record<string, unknown>): VerificationChallenge {
    const challenge: VerificationChallenge = {};

    // Extract challenge ID — expanded variants
    challenge.id = (data.challenge_id ?? data.challengeId ?? data.id ??
        data.verification_id ?? data.task_id) as string | undefined;
    challenge.challengeId = challenge.id;

    // Extract challenge type — expanded variants
    challenge.type = (data.challenge_type ?? data.type ??
        data.verification_type ?? data.task_type) as string | undefined;

    // Extract the actual challenge content
    const contentFields = [
        'challenge', 'puzzle', 'test', 'verify', 'proof', 'task',
        'prompt', 'quiz', 'verification_task', 'challenge_question',
        'identity_challenge', 'verification_challenge', 'ai_challenge', 'captcha',
    ];

    if (contentFields.includes(field)) {
        const val = data[field];
        if (typeof val === 'string') {
            challenge.challenge = val;
        } else if (typeof val === 'number' || typeof val === 'boolean') {
            challenge.challenge = String(val);
        } else if (typeof val === 'object' && val !== null) {
            const obj = val as Record<string, unknown>;
            // Expanded content field extraction
            const rawContent = obj.question ?? obj.data ?? obj.expression ?? obj.input ??
                obj.content ?? obj.prompt ?? obj.text ?? obj.task ?? obj.puzzle ?? obj.test;
            if (rawContent !== null && rawContent !== undefined) {
                challenge.challenge = typeof rawContent === 'string' ? rawContent :
                    typeof rawContent === 'number' || typeof rawContent === 'boolean' ? String(rawContent) :
                    JSON.stringify(rawContent);
            } else {
                challenge.challenge = JSON.stringify(obj);
            }
            challenge.type = challenge.type ?? (obj.type as string);
            challenge.id = challenge.id ?? (obj.id as string) ?? (obj.challengeId as string);
        }
    } else if (field === 'verification_code') {
        challenge.verification_code = data.verification_code as string;
    } else if (field === 'verify_url') {
        challenge.verify_url = data.verify_url as string;
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

    // If all content fields are empty AND no verification_code AND no _raw data, bail out
    if (!content && !challenge.verification_code && !challenge._raw) {
        console.error('[CHALLENGE] Empty challenge with no content, verification_code, or raw data — returning null');
        return null;
    }

    // If content is empty but _raw exists, use raw data as LLM input
    const effectiveContent = content || (challenge._raw ? JSON.stringify(challenge._raw) : '');

    console.log(`[CHALLENGE] Attempting to solve challenge type=${challenge.type ?? 'unknown'}, content="${effectiveContent.slice(0, 200)}"`);
    console.log(`[CHALLENGE] Challenge data: id=${challenge.id ?? 'none'}, type=${challenge.type ?? 'none'}`);

    try {
        // Try deterministic solvers first (only if we have actual content)
        if (content) {
            const deterministicResult = solveDeterministic(challenge, content);
            if (deterministicResult !== null) {
                console.log(`[CHALLENGE] ✅ Deterministic solver succeeded: "${deterministicResult.slice(0, 80)}"`);
                return deterministicResult;
            }
        }

        // If verification_code present, echo it back
        if (challenge.verification_code) {
            console.log('[CHALLENGE] ✅ Echoing verification_code');
            return challenge.verification_code;
        }

        // Fall back to LLM
        console.log('[CHALLENGE] ⚠️  No deterministic solver matched, using LLM fallback...');
        const llmResult = await solveChallengeWithLLM(challenge, effectiveContent);

        if (llmResult) {
            console.log(`[CHALLENGE] ✅ LLM fallback succeeded`);
        } else {
            console.error(`[CHALLENGE] ❌ LLM fallback returned null`);
        }

        return llmResult;

    } catch (error) {
        console.error('[CHALLENGE] Error solving challenge:', error);
        // Last-resort LLM attempt
        try {
            return await solveChallengeWithLLM(challenge, effectiveContent);
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
 * Clean LLM response to extract only the raw answer value.
 * Uses multi-pass loop until no more preamble patterns match.
 */
function cleanLLMResponse(answer: string, challenge: VerificationChallenge, content: string): string {
    let cleaned = answer.trim();

    // Strip common preambles (case-insensitive) — multi-pass loop
    const preambles = [
        /^the answer is:?\s*/i,
        /^answer:?\s*/i,
        /^result:?\s*/i,
        /^solution:?\s*/i,
        /^i am:?\s*/i,
        /^my name is:?\s*/i,
        /^it is:?\s*/i,
        /^that is:?\s*/i,
        /^here is the answer:?\s*/i,
        /^here's the answer:?\s*/i,
        /^the result is:?\s*/i,
        /^this is:?\s*/i,
        /^equals:?\s*/i,
        /^sure!?\s*/i,
        /^okay[,.]?\s*/i,
        /^certainly[,!.]?\s*/i,
        /^of course[,!.]?\s*/i,
        /^based on.*?the answer is:?\s*/i,
        /^based on.*?,\s*/i,
    ];

    // Multi-pass: keep stripping until no patterns match
    let changed = true;
    while (changed) {
        changed = false;
        for (const pattern of preambles) {
            const before = cleaned;
            cleaned = cleaned.replace(pattern, '');
            if (cleaned !== before) changed = true;
        }
    }

    // Strip markdown code blocks
    cleaned = cleaned.replace(/^```[\w]*\n?/gm, '').replace(/\n?```$/gm, '');

    // Strip quotes if the entire answer is quoted
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1);
    }

    // Strip trailing punctuation (periods, exclamation marks, question marks)
    cleaned = cleaned.replace(/[.!?]+$/, '');

    // For identity challenges, ensure we return exactly the agent name
    const lowerContent = content.toLowerCase();
    const lowerCleaned = cleaned.toLowerCase();
    if ((lowerContent.includes('who are you') ||
         lowerContent.includes('what is your name') ||
         lowerContent.includes('your name') ||
         challenge.type?.toLowerCase() === 'identity') &&
        lowerCleaned.includes(config.agentName.toLowerCase())) {
        // Extract just the agent name if it's embedded in a sentence
        return config.agentName;
    }

    return cleaned.trim();
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

YOUR IDENTITY:
- Agent Name: ${config.agentName}
- Platform: Moltbook
- Role: AI agent

CRITICAL OUTPUT RULES:
1. Output ONLY the raw answer value with ZERO additional text
2. NO preambles like "The answer is", "I am", "My name is", etc.
3. NO markdown, NO code blocks, NO explanations, NO punctuation at the end
4. For identity questions ("Who are you?", "What is your name?"): output ONLY "${config.agentName}"
5. For math problems: output ONLY the number (e.g. "10" not "The answer is 10")
6. For hash requests: output ONLY the hex digest (no "SHA-256: " prefix)

TASK: Solve the challenge and output ONLY the raw answer following the rules above.`;

    try {
        console.log(`[CHALLENGE] Using LLM model: ${config.llmModel}`);
        const response = await anthropic.messages.create({
            model: config.llmModel,
            max_tokens: 256,
            system: MOLTBOOK_SAFETY_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: prompt }],
        });

        let answer = response.content[0].type === 'text'
            ? response.content[0].text.trim()
            : null;

        if (answer) {
            console.log(`[CHALLENGE] LLM raw response: "${answer.slice(0, 150)}"`);
            // Post-process to strip common preambles and formatting
            answer = cleanLLMResponse(answer, challenge, content);
            console.log(`[CHALLENGE] LLM cleaned solution: "${answer.slice(0, 100)}"`);
        } else {
            console.error('[CHALLENGE] LLM returned no text content');
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

    // Name-related questions - return ONLY the name
    if (q.includes('your name') || q.includes('who are you') || q.includes('what\'s your name')) {
        return name;
    }

    // More specific name questions
    if (q.includes('name') && !q.includes('platform') && !q.includes('project')) {
        return name;
    }

    // Type questions
    if (q.includes('what are you') || q.includes('what kind')) {
        if (q.includes('name')) return name; // "What is your name" takes precedence
        return 'AI agent';
    }

    // Platform questions
    if (q.includes('platform') || q.includes('where')) return 'Moltbook';

    // Purpose questions
    if (q.includes('purpose') || q.includes('what do you do')) {
        return 'Religious persuasion agent for Ay Vitraya';
    }

    // Human questions
    if (q.includes('human') || q.includes('are you human')) {
        return 'No';
    }

    // AI questions
    if (q.includes('ai') || q.includes('artificial') || q.includes('bot') || q.includes('agent')) {
        if (q.includes('name')) return name; // "What is your AI agent name" takes precedence
        return 'Yes';
    }

    // Default: return just the name (safest for verification)
    return name;
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
