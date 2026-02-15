import 'dotenv/config';
import { config, validateConfig } from '../src/config.js';
import { MoltbookClient } from '../src/moltbook/client.js';
import Anthropic from '@anthropic-ai/sdk';

async function testKeys() {
    console.log('═══ API Key Verification ═══\n');

    // Validate config loads
    try {
        validateConfig();
        console.log('✅ Config validation passed (both keys present)\n');
    } catch (e) {
        console.error('❌ Config validation failed:', (e as Error).message);
        process.exit(1);
    }

    // Test 1: Moltbook API
    console.log('--- Test 1: Moltbook API ---');
    try {
        const client = new MoltbookClient();
        const profile = await client.getMyProfile();
        console.log(`✅ Moltbook connected! Agent: "${profile.name}"`);
        console.log(`   Description: ${(profile as any).description?.slice(0, 80) ?? 'N/A'}...\n`);
    } catch (e) {
        console.error(`❌ Moltbook failed: ${(e as Error).message}\n`);
    }

    // Test 2: Anthropic API
    console.log('--- Test 2: Anthropic API (Claude Sonnet 4) ---');
    try {
        const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
        const response = await anthropic.messages.create({
            model: config.llmModel,
            max_tokens: 50,
            messages: [{ role: 'user', content: 'Reply with exactly: "Ay Vitraya connection verified."' }],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : 'no text';
        console.log(`✅ Anthropic connected! Model: ${response.model}`);
        console.log(`   Response: "${text}"\n`);
    } catch (e) {
        console.error(`❌ Anthropic failed: ${(e as Error).message}\n`);
    }

    console.log('═══ Done ═══');
}

testKeys();
