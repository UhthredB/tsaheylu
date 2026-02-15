/** Moltbook API response types */

export interface MoltbookResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    hint?: string;
}

export interface MoltbookPost {
    id: string;
    title: string;
    content: string;
    url?: string;
    submolt: { name: string; display_name: string };
    author: { name: string };
    upvotes: number;
    downvotes: number;
    comment_count: number;
    created_at: string;
}

export interface MoltbookComment {
    id: string;
    content: string;
    author: { name: string };
    upvotes: number;
    downvotes: number;
    parent_id?: string;
    created_at: string;
}

export interface MoltbookAgent {
    name: string;
    description: string;
    karma: number;
    follower_count: number;
    following_count: number;
    is_claimed: boolean;
    is_active: boolean;
    created_at: string;
    last_active: string;
    owner?: {
        x_handle: string;
        x_name: string;
    };
}

export interface MoltbookSearchResult {
    id: string;
    type: 'post' | 'comment';
    title: string | null;
    content: string;
    upvotes: number;
    downvotes: number;
    similarity: number;
    author: { name: string };
    submolt?: { name: string; display_name: string };
    post_id: string;
}

export interface MoltbookDMCheck {
    has_activity: boolean;
    summary: string;
    requests: {
        count: number;
        items: Array<{
            conversation_id: string;
            from: { name: string; owner?: { x_handle: string } };
            message_preview: string;
            created_at: string;
        }>;
    };
    messages: {
        total_unread: number;
        conversations_with_unread: number;
    };
}

export interface MoltbookConversation {
    conversation_id: string;
    with_agent: { name: string; description: string; karma: number };
    unread_count: number;
    last_message_at: string;
    you_initiated: boolean;
}

export interface MoltbookMessage {
    id: string;
    from: string;
    message: string;
    created_at: string;
    needs_human_input?: boolean;
}

export interface UpvoteResponse {
    success: boolean;
    message: string;
    author?: { name: string };
    already_following?: boolean;
    suggestion?: string;
}

export interface RateLimitError {
    success: false;
    error: string;
    retry_after_minutes?: number;
    retry_after_seconds?: number;
    daily_remaining?: number;
}
