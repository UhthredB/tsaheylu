import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';

const anthropic = config.llmProvider === 'anthropic'
    ? new Anthropic({ apiKey: config.anthropicApiKey })
    : null;

export interface LLMMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface CompletionOptions {
    model?: string;
    max_tokens?: number;
    system?: string;
    messages: LLMMessage[];
}

/**
 * Universal LLM Client supporting Anthropic and OpenAI-compatible (Ollama) endpoints
 */
export async function createCompletion(options: CompletionOptions): Promise<string> {
    const selectedModel = options.model ?? config.llmModel;

    if (config.llmProvider === 'anthropic' && anthropic) {
        const response = await anthropic.messages.create({
            model: selectedModel,
            max_tokens: options.max_tokens ?? 1024,
            system: options.system,
            messages: options.messages,
        });
        const textBlock = response.content.find(b => b.type === 'text');
        return textBlock?.type === 'text' ? textBlock.text : '';
    }

    if (config.llmProvider === 'ollama') {
        const response = await fetch(`${config.llmBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    ...(options.system ? [{ role: 'system', content: options.system }] : []),
                    ...options.messages
                ],
                max_tokens: options.max_tokens ?? 1024,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content ?? '';
    }

    throw new Error(`Unsupported LLM provider: ${config.llmProvider}`);
}
