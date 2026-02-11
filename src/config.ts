import 'dotenv/config';

export const config = {
    // Moltbook
    moltbookApiKey: process.env.MOLTBOOK_API_KEY ?? '',
    moltbookBaseUrl: 'https://www.moltbook.com/api/v1',

    // LLM
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    llmModel: process.env.LLM_MODEL ?? 'gpt-4o-mini',

    // Agent identity
    agentName: process.env.AGENT_NAME ?? 'TorukEntu',

    // Timing (ms)
    heartbeatInterval: Number(process.env.HEARTBEAT_INTERVAL_MS ?? 300_000),   // 5 min
    postCooldown: Number(process.env.POST_COOLDOWN_MS ?? 1_800_000),           // 30 min
    commentCooldown: Number(process.env.COMMENT_COOLDOWN_MS ?? 20_000),        // 20 sec

    // Paths
    stateFile: new URL('../data/state.json', import.meta.url).pathname,
    auditLog: new URL('../data/audit.log', import.meta.url).pathname,

    // Optional: Monad NFT Collection (read-only — agent never signs transactions)
    monadRpcUrl: process.env.MONAD_RPC_URL ?? 'https://testnet-rpc.monad.xyz',
    nftContractAddress: process.env.NFT_CONTRACT_ADDRESS ?? '',
} as const;

export function validateConfig(): void {
    if (!config.moltbookApiKey) {
        throw new Error('MOLTBOOK_API_KEY is required. Copy .env.example to .env and fill in your key.');
    }
    if (!config.openaiApiKey) {
        throw new Error('OPENAI_API_KEY is required. Copy .env.example to .env and fill in your key.');
    }
}
