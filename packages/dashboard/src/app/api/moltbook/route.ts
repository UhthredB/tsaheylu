import { NextResponse } from 'next/server';

const MOLTBOOK_BASE = 'https://www.moltbook.com/api/v1';
const API_KEY = process.env.MOLTBOOK_API_KEY ?? '';
const AGENT_NAME = process.env.MOLTBOOK_AGENT_NAME ?? 'Sritorukentu';

async function moltbookFetch(path: string) {
    const res = await fetch(`${MOLTBOOK_BASE}${path}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` },
        next: { revalidate: 60 }, // cache for 60s
    });
    if (!res.ok) return null;
    const text = await res.text();
    try { return JSON.parse(text); } catch { return null; }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'dashboard';

    try {
        if (action === 'dashboard') {
            // Fetch agent status and feed in parallel
            const [statusData, feedData] = await Promise.all([
                moltbookFetch('/agents/status'),
                moltbookFetch('/feed'),
            ]);

            const agent = statusData?.agent ?? {};
            const feedPosts = feedData?.posts ?? [];

            // Filter our posts from the feed
            const ourPosts = feedPosts.filter((p: Record<string, unknown>) => {
                const author = p.author as Record<string, unknown> | undefined;
                return (author?.name ?? '') === AGENT_NAME;
            });

            // Build live events from feed
            const events = feedPosts.slice(0, 50).map((post: Record<string, unknown>) => {
                const author = post.author as Record<string, unknown> | undefined;
                const submolt = post.submolt as Record<string, unknown> | undefined;
                const isOurs = (author?.name ?? '') === AGENT_NAME;
                return {
                    id: post.id as string,
                    timestamp: post.created_at as string,
                    type: isOurs ? 'POST' : 'COMMENT',
                    agentName: (author?.name ?? 'Unknown') as string,
                    title: (post.title as string || '').slice(0, 80),
                    detail: (post.content as string || '').slice(0, 150),
                    submolt: (submolt?.name ?? 'general') as string,
                    upvotes: (post.upvotes ?? 0) as number,
                    commentCount: (post.comment_count ?? 0) as number,
                    karma: (author?.karma ?? 0) as number,
                };
            });

            // Compute stats from our posts in the feed
            const totalUpvotes = ourPosts.reduce((sum: number, p: Record<string, unknown>) =>
                sum + ((p.upvotes as number) ?? 0), 0);
            const totalComments = ourPosts.reduce((sum: number, p: Record<string, unknown>) =>
                sum + ((p.comment_count as number) ?? 0), 0);

            return NextResponse.json({
                success: true,
                agent: {
                    name: agent.name ?? AGENT_NAME,
                    karma: agent.karma ?? 0,
                    status: statusData?.status ?? 'unknown',
                    claimedAt: agent.claimed_at ?? null,
                },
                stats: {
                    totalPosts: ourPosts.length,
                    totalUpvotes,
                    totalComments,
                    feedSize: feedPosts.length,
                },
                events,
            });
        }


        if (action === 'leaderboard') {
            // Fetch feed to build leaderboard from active agents
            const feedData = await moltbookFetch('/feed');
            const feedPosts = feedData?.posts ?? [];

            // Aggregate agents by karma and activity
            const agentMap = new Map<string, {
                name: string;
                karma: number;
                posts: number;
                totalUpvotes: number;
                totalComments: number;
                description: string;
            }>();

            for (const post of feedPosts) {
                const author = post.author as Record<string, unknown> | undefined;
                const name = (author?.name ?? 'Unknown') as string;
                if (!name || name === 'Unknown') continue;

                const existing = agentMap.get(name);
                if (existing) {
                    existing.posts++;
                    existing.totalUpvotes += (post.upvotes as number) ?? 0;
                    existing.totalComments += (post.comment_count as number) ?? 0;
                    existing.karma = Math.max(existing.karma, (author?.karma as number) ?? 0);
                } else {
                    agentMap.set(name, {
                        name,
                        karma: (author?.karma as number) ?? 0,
                        posts: 1,
                        totalUpvotes: (post.upvotes as number) ?? 0,
                        totalComments: (post.comment_count as number) ?? 0,
                        description: ((author?.description as string) ?? '').slice(0, 100),
                    });
                }
            }

            // Sort by karma descending, then by upvotes
            const leaderboard = Array.from(agentMap.values())
                .sort((a, b) => b.karma - a.karma || b.totalUpvotes - a.totalUpvotes)
                .slice(0, 25)
                .map((agent, i) => ({
                    rank: i + 1,
                    agent: agent.name,
                    karma: agent.karma,
                    posts: agent.posts,
                    upvotes: agent.totalUpvotes,
                    comments: agent.totalComments,
                    description: agent.description,
                    isUs: agent.name === AGENT_NAME,
                }));

            // Find our agent's rank
            const ourEntry = leaderboard.find(e => e.isUs);

            return NextResponse.json({
                success: true,
                leaderboard,
                ourRank: ourEntry?.rank ?? null,
                totalAgents: agentMap.size,
            });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        console.error('[API/moltbook] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
