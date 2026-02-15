import { appendFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from '../config.js';

export type SecurityEventType =
    | 'INJECTION_DETECTED'
    | 'KEY_REQUEST_BLOCKED'
    | 'SENSITIVE_REQUEST_FLAGGED'
    | 'RATE_LIMIT_BACKOFF'
    | 'SUSPICIOUS_PATTERN'
    | 'MOLTBOOK_SECURITY_ALERT'
    | 'CHALLENGE_DETECTED'
    | 'CHALLENGE_SOLVED'
    | 'CHALLENGE_FAILED'
    | 'CHALLENGE_POLL'
    | 'CHALLENGE_DM_DETECTED';

interface SecurityEvent {
    timestamp: string;
    type: SecurityEventType;
    details: Record<string, unknown>;
}

/**
 * Append-only security event log.
 * Each event is a single JSON line for easy parsing.
 */
export function logSecurityEvent(
    type: SecurityEventType,
    details: Record<string, unknown>
): void {
    const event: SecurityEvent = {
        timestamp: new Date().toISOString(),
        type,
        details,
    };

    const line = JSON.stringify(event) + '\n';

    try {
        mkdirSync(dirname(config.auditLog), { recursive: true });
        appendFileSync(config.auditLog, line, 'utf-8');
    } catch {
        // If we can't write the audit log, at least print to stderr
        console.error('[SECURITY]', JSON.stringify(event));
    }

    // Also print to console for visibility
    console.warn(`[SECURITY:${type}]`, JSON.stringify(details).slice(0, 300));
}
