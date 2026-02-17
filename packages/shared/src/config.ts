import 'dotenv/config';

export const config = {
    // Moltbook
    moltbookApiKey: process.env.MOLTBOOK_API_KEY ?? '',
    moltbookBaseUrl: 'https://www.moltbook.com/api/v1',

    // LLM (Anthropic or Ollama)
    llmProvider: (process.env.LLM_PROVIDER as 'anthropic' | 'ollama') ?? 'anthropic',
    llmBaseUrl: process.env.LLM_BASE_URL ?? 'http://172.17.0.1:11434/v1', // Docker host default for Ollama
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    llmModel: process.env.LLM_MODEL ?? (process.env.LLM_PROVIDER === 'ollama' ? 'llama3' : 'claude-3-5-sonnet-20240620'),

    // Agent identity
    agentName: process.env.AGENT_NAME ?? 'Sritorukentu',

    // ... remaining config same
} as const;

export function validateConfig(): void {
    if (!config.moltbookApiKey) {
        throw new Error('MOLTBOOK_API_KEY is required.');
    }
    if (config.llmProvider === 'anthropic' && !config.anthropicApiKey) {
        throw new Error('ANTHROPIC_API_KEY is required for Anthropic provider.');
    }
}
