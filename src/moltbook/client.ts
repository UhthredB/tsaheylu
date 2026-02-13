import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from '../config.js';
import { logSecurityEvent } from '../security/audit-log.js';
import { detectChallenge, solveChallenge, submitChallengeSolution } from '../security/challenge-handler.js';
import type {
    MoltbookPost, MoltbookComment, MoltbookAgent,
    MoltbookSearchResult, MoltbookDMCheck, MoltbookConversation,
    MoltbookMessage, UpvoteResponse,
} from './types.js';

/**
 * Moltbook API Client — Safety-enforced wrapper.
 * 
 * All responses are type-safe. Rate limits are tracked internally.
 * API key is NEVER exposed in logs or output (Safety Addendum Rule 1).
 */
export class MoltbookClient {
    private baseUrl: string;
    private apiKey: string;
    private lastPostTime = 0;
    private lastCommentTime = 0;
    private dailyCommentCount = 0;
    private dailyCommentReset = 0;
    private _isSuspended = false;
    private _suspensionEndsAt = 0;

    // API rate limiter: track request timestamps (sliding window)
    private requestTimestamps: number[] = [];

    constructor() {
        this.baseUrl = config.moltbookBaseUrl;
        this.apiKey = config.moltbookApiKey;
        this.loadDailyCounters();
    }

    // ─── Suspension Status ───

    get isSuspended(): boolean {
        if (this._isSuspended && Date.now() >= this._suspensionEndsAt) {
            this._isSuspended = false;
            console.log('[MOLTBOOK] Suspension period appears to have ended, will attempt requests again.');
        }
        return this._isSuspended;
    }

    get suspensionEndsAt(): number {
        return this._suspensionEndsAt;
    }

    // ─── Internal Request Helper ───

    private async request<T>(
        method: string,
        path: string,
        body?: Record<string, unknown>,
    ): Promise<T> {
        // Check suspension before making any request
        if (this.isSuspended) {
            const remainMs = this._suspensionEndsAt - Date.now();
            throw new SuspendedError(
                `Account suspended. Resumes in ${Math.ceil(remainMs / 60_000)} min.`,
                remainMs,
            );
        }

        // Enforce API rate limit (sliding window)
        this.enforceApiRateLimit();

        const url = `${this.baseUrl}${path}`;

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.apiKey}`,
        };
        if (body) {
            headers['Content-Type'] = 'application/json';
        }

        const res = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        // Track this request timestamp
        this.requestTimestamps.push(Date.now());

        // Handle rate limits
        if (res.status === 429) {
            const data = await res.json() as Record<string, unknown>;
            logSecurityEvent('RATE_LIMIT_BACKOFF', {
                path,
                retryAfterMinutes: data.retry_after_minutes,
                retryAfterSeconds: data.retry_after_seconds,
            });
            throw new RateLimitError(
                `Rate limited on ${path}`,
                (data.retry_after_minutes as number) ?? (data.retry_after_seconds as number) ?? 60,
            );
        }

        // Handle suspension (401/403)
        if (res.status === 401 || res.status === 403) {
            const text = await res.text();
            try {
                const errorData = JSON.parse(text);
                // Detect suspension
                if (this.detectSuspension(errorData, res.status)) {
                    throw new SuspendedError(
                        `Account suspended: ${errorData.hint ?? errorData.error ?? 'unknown reason'}`,
                        this._suspensionEndsAt - Date.now(),
                    );
                }
                // Check for verification challenges in error responses
                await this.handlePossibleChallenge(errorData);
            } catch (e) {
                if (e instanceof SuspendedError) throw e;
                /* not JSON or no challenge */
            }
            throw new Error(`Moltbook API error ${res.status}: ${text.slice(0, 500)}`);
        }

        if (!res.ok) {
            const text = await res.text();
            // Check if error response contains a challenge
            try {
                const errorData = JSON.parse(text);
                await this.handlePossibleChallenge(errorData);
            } catch { /* not JSON or no challenge */ }
            throw new Error(`Moltbook API error ${res.status}: ${text.slice(0, 500)}`);
        }

        const data = await res.json() as T;

        // Check successful responses for embedded challenges
        if (data && typeof data === 'object') {
            await this.handlePossibleChallenge(data as Record<string, unknown>);
        }

        return data;
    }

    // ─── Posts ───

    async createPost(submolt: string, title: string, content: string): Promise<MoltbookPost> {
        this.enforcePostCooldown();
        const result = await this.request<{ success: boolean; post: MoltbookPost }>(
            'POST', '/posts', { submolt, title, content },
        );
        this.lastPostTime = Date.now();
        console.log(`[MOLTBOOK] Posted: "${title}" to m/${submolt}`);
        return result.post;
    }

    async createLinkPost(submolt: string, title: string, url: string): Promise<MoltbookPost> {
        this.enforcePostCooldown();
        const result = await this.request<{ success: boolean; post: MoltbookPost }>(
            'POST', '/posts', { submolt, title, url },
        );
        this.lastPostTime = Date.now();
        return result.post;
    }

    async getFeed(sort: 'hot' | 'new' | 'top' | 'rising' = 'new', limit = 15): Promise<MoltbookPost[]> {
        const result = await this.request<{ posts: MoltbookPost[] }>(
            'GET', `/feed?sort=${sort}&limit=${limit}`,
        );
        return result.posts ?? [];
    }

    async getGlobalPosts(sort: 'hot' | 'new' | 'top' | 'rising' = 'new', limit = 15): Promise<MoltbookPost[]> {
        const result = await this.request<{ posts: MoltbookPost[] }>(
            'GET', `/posts?sort=${sort}&limit=${limit}`,
        );
        return result.posts ?? [];
    }

    async getSubmoltPosts(submolt: string, sort: 'new' | 'hot' | 'top' = 'new'): Promise<MoltbookPost[]> {
        const result = await this.request<{ posts: MoltbookPost[] }>(
            'GET', `/submolts/${submolt}/feed?sort=${sort}`,
        );
        return result.posts ?? [];
    }

    async getPost(postId: string): Promise<MoltbookPost> {
        const result = await this.request<{ post: MoltbookPost }>('GET', `/posts/${postId}`);
        return result.post;
    }

    async deletePost(postId: string): Promise<void> {
        await this.request('DELETE', `/posts/${postId}`);
        console.log(`[MOLTBOOK] Deleted post: ${postId}`);
    }

    // ─── Comments ───

    async comment(postId: string, content: string, parentId?: string): Promise<MoltbookComment> {
        this.enforceCommentCooldown();
        const body: Record<string, string> = { content };
        if (parentId) body.parent_id = parentId;
        const result = await this.request<{ success: boolean; comment: MoltbookComment }>(
            'POST', `/posts/${postId}/comments`, body,
        );
        this.lastCommentTime = Date.now();
        this.dailyCommentCount++;
        this.saveDailyCounters();
        console.log(`[MOLTBOOK] Comment API response: success=${result.success}, commentId=${result.comment?.id ?? 'none'}, postId=${postId}`);
        console.log(`[MOLTBOOK] Comment content preview: "${content.slice(0, 80)}..."`);
        console.log(`[MOLTBOOK] Daily comments: ${this.dailyCommentCount}/${config.maxCommentsPerDay}`);
        if (!result.success) {
            console.error(`[MOLTBOOK] WARNING: API returned success=false for comment on ${postId}`);
        }
        return result.comment;
    }

    async getComments(postId: string, sort: 'top' | 'new' | 'controversial' = 'top'): Promise<MoltbookComment[]> {
        const result = await this.request<{ comments: MoltbookComment[] }>(
            'GET', `/posts/${postId}/comments?sort=${sort}`,
        );
        return result.comments ?? [];
    }

    // ─── Voting ───

    async upvote(postId: string): Promise<UpvoteResponse> {
        return this.request<UpvoteResponse>('POST', `/posts/${postId}/upvote`);
    }

    async downvote(postId: string): Promise<void> {
        await this.request('POST', `/posts/${postId}/downvote`);
    }

    async upvoteComment(commentId: string): Promise<void> {
        await this.request('POST', `/comments/${commentId}/upvote`);
    }

    // ─── Search ───

    async search(query: string, type: 'posts' | 'comments' | 'all' = 'all', limit = 20): Promise<MoltbookSearchResult[]> {
        const q = encodeURIComponent(query);
        const result = await this.request<{ results: MoltbookSearchResult[] }>(
            'GET', `/search?q=${q}&type=${type}&limit=${limit}`,
        );
        return result.results ?? [];
    }

    // ─── Submolts ───

    async createSubmolt(name: string, displayName: string, description: string): Promise<void> {
        await this.request('POST', '/submolts', {
            name, display_name: displayName, description,
        });
        console.log(`[MOLTBOOK] Created submolt m/${name}`);
    }

    async listSubmolts(): Promise<Array<{ name: string; display_name: string }>> {
        const result = await this.request<{ submolts: Array<{ name: string; display_name: string }> }>(
            'GET', '/submolts',
        );
        return result.submolts ?? [];
    }

    async subscribe(submolt: string): Promise<void> {
        await this.request('POST', `/submolts/${submolt}/subscribe`);
    }

    async unsubscribe(submolt: string): Promise<void> {
        await this.request('DELETE', `/submolts/${submolt}/subscribe`);
    }

    async getSubmoltInfo(submolt: string): Promise<Record<string, unknown>> {
        return this.request<Record<string, unknown>>('GET', `/submolts/${submolt}`);
    }

    // ─── Profiles ───

    async getMyProfile(): Promise<MoltbookAgent> {
        const result = await this.request<{ agent: MoltbookAgent }>('GET', '/agents/me');
        return result.agent;
    }

    async getProfile(name: string): Promise<{ agent: MoltbookAgent; recentPosts: MoltbookPost[] }> {
        const result = await this.request<{ agent: MoltbookAgent; recentPosts: MoltbookPost[] }>(
            'GET', `/agents/profile?name=${encodeURIComponent(name)}`,
        );
        return result;
    }

    async updateProfile(description: string): Promise<void> {
        await this.request('PATCH', '/agents/me', { description });
    }

    async uploadAvatar(imagePath: string): Promise<void> {
        // Avatar upload uses multipart form — handled separately
        const { readFileSync } = await import('fs');
        const imageBuffer = readFileSync(imagePath);
        const blob = new Blob([imageBuffer]);

        const form = new FormData();
        form.append('file', blob, 'avatar.png');

        const res = await fetch(`${this.baseUrl}/agents/me/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.apiKey}` },
            body: form,
        });

        if (!res.ok) {
            throw new Error(`Avatar upload failed: ${res.status}`);
        }
    }

    async removeAvatar(): Promise<void> {
        await this.request('DELETE', '/agents/me/avatar');
    }

    async setupOwnerEmail(email: string): Promise<void> {
        await this.request('POST', '/agents/me/setup-owner-email', { email });
        console.log(`[MOLTBOOK] Owner email setup initiated for: ${email}`);
    }

    // ─── Following ───

    async follow(name: string): Promise<void> {
        await this.request('POST', `/agents/${encodeURIComponent(name)}/follow`);
    }

    async unfollow(name: string): Promise<void> {
        await this.request('DELETE', `/agents/${encodeURIComponent(name)}/follow`);
    }

    // ─── DMs ───

    async checkDMs(): Promise<MoltbookDMCheck> {
        const result = await this.request<MoltbookDMCheck>('GET', '/agents/dm/check');
        return result;
    }

    async sendDMRequest(to: string, message: string): Promise<void> {
        await this.request('POST', '/agents/dm/request', { to, message });
        console.log(`[MOLTBOOK] Sent DM request to ${to}`);
    }

    async approveDMRequest(conversationId: string): Promise<void> {
        await this.request('POST', `/agents/dm/requests/${conversationId}/approve`);
    }

    async listConversations(): Promise<MoltbookConversation[]> {
        const result = await this.request<{ conversations: { items: MoltbookConversation[] } }>(
            'GET', '/agents/dm/conversations',
        );
        return result.conversations?.items ?? [];
    }

    async readConversation(conversationId: string): Promise<MoltbookMessage[]> {
        const result = await this.request<{ messages: MoltbookMessage[] }>(
            'GET', `/agents/dm/conversations/${conversationId}`,
        );
        return result.messages ?? [];
    }

    async sendMessage(conversationId: string, message: string): Promise<void> {
        await this.request('POST', `/agents/dm/conversations/${conversationId}/send`, { message });
    }

    // ─── Claim Status ───

    async checkClaimStatus(): Promise<'pending_claim' | 'claimed'> {
        const result = await this.request<{ status: 'pending_claim' | 'claimed' }>('GET', '/agents/status');
        return result.status;
    }

    // ─── Moderation (for submolt owners/mods) ───

    async pinPost(postId: string): Promise<void> {
        await this.request('POST', `/posts/${postId}/pin`);
    }

    async unpinPost(postId: string): Promise<void> {
        await this.request('DELETE', `/posts/${postId}/pin`);
    }

    async updateSubmoltSettings(submolt: string, settings: Record<string, unknown>): Promise<void> {
        await this.request('PATCH', `/submolts/${submolt}/settings`, settings);
    }

    async addModerator(submolt: string, agentName: string): Promise<void> {
        await this.request('POST', `/submolts/${submolt}/moderators`, {
            agent_name: agentName, role: 'moderator',
        });
    }

    async removeModerator(submolt: string, agentName: string): Promise<void> {
        await this.request('DELETE', `/submolts/${submolt}/moderators`, {
            agent_name: agentName,
        });
    }

    async listModerators(submolt: string): Promise<Array<{ name: string; role: string }>> {
        const result = await this.request<{ moderators: Array<{ name: string; role: string }> }>(
            'GET', `/submolts/${submolt}/moderators`,
        );
        return result.moderators ?? [];
    }

    // ─── Rate Limit Enforcement ───

    canPost(): boolean {
        return Date.now() - this.lastPostTime >= config.postCooldown;
    }

    canComment(): boolean {
        this.resetDailyCounterIfNeeded();
        return (
            Date.now() - this.lastCommentTime >= config.commentCooldown &&
            this.dailyCommentCount < config.maxCommentsPerDay
        );
    }

    getDailyCommentCount(): number {
        return this.dailyCommentCount;
    }

    getRemainingDailyComments(): number {
        this.resetDailyCounterIfNeeded();
        return Math.max(0, config.maxCommentsPerDay - this.dailyCommentCount);
    }

    private enforcePostCooldown(): void {
        if (!this.canPost()) {
            const waitMs = config.postCooldown - (Date.now() - this.lastPostTime);
            throw new Error(`Post cooldown active. Wait ${Math.ceil(waitMs / 60_000)} more minutes.`);
        }
    }

    private enforceCommentCooldown(): void {
        if (!this.canComment()) {
            const remaining = this.getRemainingDailyComments();
            throw new Error(`Comment cooldown active or daily limit reached (${this.dailyCommentCount}/${config.maxCommentsPerDay}, remaining: ${remaining}).`);
        }
    }

    private resetDailyCounterIfNeeded(): void {
        const now = Date.now();
        if (now - this.dailyCommentReset > 86_400_000) {
            this.dailyCommentCount = 0;
            this.dailyCommentReset = now;
            this.saveDailyCounters();
            console.log('[MOLTBOOK] Daily comment counter reset');
        }
    }

    // ─── API Rate Limiter (100 req/min, we use 80) ───

    private enforceApiRateLimit(): void {
        const now = Date.now();
        const windowMs = 60_000;
        // Remove timestamps older than 1 minute
        this.requestTimestamps = this.requestTimestamps.filter(t => now - t < windowMs);
        if (this.requestTimestamps.length >= config.maxApiRequestsPerMinute) {
            const oldestInWindow = this.requestTimestamps[0]!;
            const waitMs = windowMs - (now - oldestInWindow) + 1000; // +1s buffer
            throw new RateLimitError(`API rate limit (${config.maxApiRequestsPerMinute}/min) reached`, waitMs / 1000);
        }
    }

    // ─── Suspension Detection ───

    private detectSuspension(data: Record<string, unknown>, status: number): boolean {
        const error = String(data.error ?? '');
        const hint = String(data.hint ?? '');
        const combined = `${error} ${hint}`.toLowerCase();

        if (combined.includes('suspended') || combined.includes('suspension')) {
            console.error(`[MOLTBOOK] ⛔ ACCOUNT SUSPENDED: ${hint || error}`);
            logSecurityEvent('MOLTBOOK_SECURITY_ALERT', {
                event: 'account_suspended',
                status,
                error,
                hint,
            });

            // Parse suspension duration from hint like "Suspension ends in 1 day"
            const dayMatch = hint.match(/(\d+)\s*day/i);
            const hourMatch = hint.match(/(\d+)\s*hour/i);
            const minMatch = hint.match(/(\d+)\s*min/i);

            let durationMs = config.suspensionBackoffMs; // Default: 1 hour
            if (dayMatch) durationMs = parseInt(dayMatch[1]!) * 86_400_000;
            else if (hourMatch) durationMs = parseInt(hourMatch[1]!) * 3_600_000;
            else if (minMatch) durationMs = parseInt(minMatch[1]!) * 60_000;

            this._isSuspended = true;
            this._suspensionEndsAt = Date.now() + durationMs;

            console.error(`[MOLTBOOK] ⛔ Will back off until ${new Date(this._suspensionEndsAt).toISOString()}`);
            return true;
        }

        // Detect verification challenge failure
        if (combined.includes('verification challenge') || combined.includes('ai verification')) {
            console.warn(`[MOLTBOOK] ⚠️ Verification challenge issue: ${hint || error}`);
            logSecurityEvent('MOLTBOOK_SECURITY_ALERT', {
                event: 'verification_challenge_warning',
                status,
                error,
                hint,
            });
        }

        return false;
    }

    // ─── Persistent Daily Counters ───

    private loadDailyCounters(): void {
        try {
            const raw = readFileSync(config.dailyCounterFile, 'utf-8');
            const data = JSON.parse(raw);
            this.dailyCommentCount = data.dailyCommentCount ?? 0;
            this.dailyCommentReset = data.dailyCommentReset ?? 0;
            this.resetDailyCounterIfNeeded();
            console.log(`[MOLTBOOK] Loaded daily counters: ${this.dailyCommentCount} comments today`);
        } catch {
            // File doesn't exist yet — start fresh
            this.dailyCommentCount = 0;
            this.dailyCommentReset = Date.now();
        }
    }

    private saveDailyCounters(): void {
        try {
            mkdirSync(dirname(config.dailyCounterFile), { recursive: true });
            writeFileSync(config.dailyCounterFile, JSON.stringify({
                dailyCommentCount: this.dailyCommentCount,
                dailyCommentReset: this.dailyCommentReset,
                lastSaved: new Date().toISOString(),
            }), 'utf-8');
        } catch (e) {
            console.warn('[MOLTBOOK] Failed to save daily counters:', (e as Error).message);
        }
    }

    // ─── Verification Challenge Handler ───

    private async handlePossibleChallenge(data: Record<string, unknown>): Promise<void> {
        const challenge = detectChallenge(data);
        if (!challenge) return;

        console.log('[MOLTBOOK] 🧩 Verification challenge detected!');
        logSecurityEvent('CHALLENGE_DETECTED', { challenge });

        const solution = await solveChallenge(challenge);
        if (!solution) {
            console.error('[MOLTBOOK] ❌ Could not solve verification challenge');
            logSecurityEvent('CHALLENGE_FAILED', { challenge, reason: 'no_solution' });
            return;
        }

        const success = await submitChallengeSolution(
            this.baseUrl, this.apiKey, challenge, solution,
        );

        if (success) {
            console.log('[MOLTBOOK] ✅ Verification challenge completed!');
            logSecurityEvent('CHALLENGE_SOLVED', { challenge, solution: solution.slice(0, 50) });
        } else {
            console.error('[MOLTBOOK] ❌ Challenge submission failed');
            logSecurityEvent('CHALLENGE_FAILED', { challenge, reason: 'submission_failed' });
        }
    }
}

/** Custom error for rate limiting */
export class RateLimitError extends Error {
    retryAfter: number;
    constructor(message: string, retryAfter: number) {
        super(message);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

/** Custom error for account suspension */
export class SuspendedError extends Error {
    resumeInMs: number;
    constructor(message: string, resumeInMs: number) {
        super(message);
        this.name = 'SuspendedError';
        this.resumeInMs = resumeInMs;
    }
}
