import 'dotenv/config';

export const config = {
    // Moltbook
    moltbookApiKey: process.env.MOLTBOOK_API_KEY ?? '',
    moltbookBaseUrl: 'https://www.moltbook.com/api/v1',

    // LLM (Anthropic Claude)
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    llmModel: process.env.LLM_MODEL ?? 'claude-opus-4-6',

    // Agent identity
    agentName: process.env.AGENT_NAME ?? 'Sritorukentu',

    // Timing (ms) — calibrated to Moltbook rules
    heartbeatInterval: Number(process.env.HEARTBEAT_INTERVAL_MS ?? 600_000),   // 10 min (was 5 — safer)
    postCooldown: Number(process.env.POST_COOLDOWN_MS ?? 1_800_000),           // 30 min (matches Moltbook limit)
    commentCooldown: Number(process.env.COMMENT_COOLDOWN_MS ?? 30_000),        // 30 sec (Moltbook: 20s, we add margin)

    // Engagement limits — stay well within Moltbook's boundaries
    maxCommentsPerHeartbeat: 2,     // Moltbook allows 50/day; at 2/heartbeat we max ~12/hour
    maxCommentsPerDay: 40,          // Moltbook limit: 50/day; we use 40 for safety margin
    maxApiRequestsPerMinute: 80,    // Moltbook limit: 100/min; we use 80 for safety margin
    interCommentDelayMs: 35_000,    // 35s between comments (Moltbook: 20s min, we add margin)

    // Suspension handling
    suspensionCheckEnabled: true,
    suspensionBackoffMs: 3_600_000, // Back off 1 hour when suspended (re-check after)

    // Paths
    stateFile: new URL('../data/state.json', import.meta.url).pathname,
    auditLog: new URL('../data/audit.log', import.meta.url).pathname,
    dailyCounterFile: new URL('../data/daily-counters.json', import.meta.url).pathname,

    // Optional: Monad NFT Collection (read-only — agent never signs transactions)
    monadRpcUrl: process.env.MONAD_RPC_URL ?? 'https://testnet-rpc.monad.xyz',
    nftContractAddress: process.env.NFT_CONTRACT_ADDRESS ?? '',
} as const;

export function validateConfig(): void {
    if (!config.moltbookApiKey) {
        throw new Error('MOLTBOOK_API_KEY is required. Copy .env.example to .env and fill in your key.');
    }
    if (!config.anthropicApiKey) {
        throw new Error('ANTHROPIC_API_KEY is required. Copy .env.example to .env and fill in your key.');
    }
}
