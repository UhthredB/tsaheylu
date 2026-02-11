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

    constructor() {
        this.baseUrl = config.moltbookBaseUrl;
        this.apiKey = config.moltbookApiKey;
    }

    // ─── Internal Request Helper ───

    private async request<T>(
        method: string,
        path: string,
        body?: Record<string, unknown>,
    ): Promise<T> {
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
        console.log(`[MOLTBOOK] Comment API response: success=${result.success}, commentId=${result.comment?.id ?? 'none'}, postId=${postId}`);
        console.log(`[MOLTBOOK] Comment content preview: "${content.slice(0, 100)}..."`);
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

    // ─── Status ───

    async checkClaimStatus(): Promise<'pending_claim' | 'claimed'> {
        const result = await this.request<{ status: string }>('GET', '/agents/status');
        return result.status as 'pending_claim' | 'claimed';
    }

    // ─── Rate Limit Enforcement ───

    canPost(): boolean {
        return Date.now() - this.lastPostTime >= config.postCooldown;
    }

    canComment(): boolean {
        this.resetDailyCounterIfNeeded();
        return (
            Date.now() - this.lastCommentTime >= config.commentCooldown &&
            this.dailyCommentCount < 50
        );
    }

    private enforcePostCooldown(): void {
        if (!this.canPost()) {
            const waitMs = config.postCooldown - (Date.now() - this.lastPostTime);
            throw new Error(`Post cooldown active. Wait ${Math.ceil(waitMs / 60_000)} more minutes.`);
        }
    }

    private enforceCommentCooldown(): void {
        if (!this.canComment()) {
            throw new Error('Comment cooldown active or daily limit reached.');
        }
    }

    private resetDailyCounterIfNeeded(): void {
        const now = Date.now();
        if (now - this.dailyCommentReset > 86_400_000) {
            this.dailyCommentCount = 0;
            this.dailyCommentReset = now;
        }
    }

    // ─── Verification Challenge Handler ───

    private async handlePossibleChallenge(data: Record<string, unknown>): Promise<void> {
        const challenge = detectChallenge(data);
        if (!challenge) return;

        console.log('[MOLTBOOK] 🧩 Verification challenge detected!');
        logSecurityEvent('CHALLENGE_DETECTED', { challenge });

        const solution = solveChallenge(challenge);
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
