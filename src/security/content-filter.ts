import { validateMoltbookContent, detectSensitiveRequest } from './safety-policy.js';
import { logSecurityEvent } from './audit-log.js';

/**
 * Content filter that sits between Moltbook content and LLM processing.
 * All untrusted content MUST pass through this filter.
 */

export interface FilterResult {
    safe: boolean;
    sanitized: string;
    threats: string[];
    requiresHumanReview: boolean;
}

/**
 * Full content filter pipeline:
 * 1. Check for prompt injection
 * 2. Check for sensitive requests
 * 3. Sanitize for LLM consumption
 */
export function filterMoltbookContent(text: string, sourceId?: string): FilterResult {
    const threats: string[] = [];
    let requiresHumanReview = false;

    // 1. Prompt injection check
    const injectionResult = validateMoltbookContent(text);
    if (injectionResult) {
        threats.push(injectionResult);
        logSecurityEvent('INJECTION_DETECTED', {
            source: sourceId ?? 'unknown',
            threat: injectionResult,
            contentPreview: text.slice(0, 200),
        });
    }

    // 2. Sensitive request check
    const sensitiveResult = detectSensitiveRequest(text);
    if (sensitiveResult) {
        threats.push(sensitiveResult);
        requiresHumanReview = true;
        logSecurityEvent('SENSITIVE_REQUEST_FLAGGED', {
            source: sourceId ?? 'unknown',
            threat: sensitiveResult,
            contentPreview: text.slice(0, 200),
        });
    }

    // 3. Sanitize — wrap untrusted content in clear delimiters
    const sanitized = sanitizeForLLM(text);

    return {
        safe: threats.length === 0,
        sanitized,
        threats,
        requiresHumanReview,
    };
}

/**
 * Sanitize untrusted content before passing to LLM.
 * Wraps content in clear delimiters so the LLM knows it's user input, not instructions.
 */
export function sanitizeForLLM(text: string): string {
    return `[BEGIN UNTRUSTED MOLTBOOK CONTENT]\n${text}\n[END UNTRUSTED MOLTBOOK CONTENT]`;
}

/**
 * Quick check if content looks like a key/secret leak attempt
 */
export function isKeyLeakAttempt(text: string): boolean {
    const patterns = [
        /api.?key/i,
        /secret/i,
        /private.?key/i,
        /password/i,
        /credential/i,
        /bearer\s+token/i,
    ];
    const actionPatterns = [
        /share/i,
        /paste/i,
        /send/i,
        /show/i,
        /tell\s+me/i,
        /give\s+me/i,
        /what\s+is\s+your/i,
    ];

    const hasKeyWord = patterns.some(p => p.test(text));
    const hasActionWord = actionPatterns.some(p => p.test(text));

    if (hasKeyWord && hasActionWord) {
        logSecurityEvent('KEY_REQUEST_BLOCKED', {
            contentPreview: text.slice(0, 200),
        });
        return true;
    }
    return false;
}
