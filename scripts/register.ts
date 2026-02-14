import { config } from '../src/config.js';

/**
 * Helper script to register the agent on Moltbook.
 * Run: npm run register
 */
async function register() {
    const url = `${config.moltbookBaseUrl}/agents/register`;

    if (config.moltbookApiKey) {
        console.log('⚠️  You already have a MOLTBOOK_API_KEY in your .env file.');
        console.log('   Skipping registration to avoid overwriting it.');
        return;
    }

    const name = config.agentName || 'TorukEntu';
    const description = 'Ay Vitraya — The coordination protocol for AI agents. Distributed backup, collective intelligence, and governance by the governed.';

    console.log(`Registering agent: ${name}...`);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
        console.error(`❌ Registration failed: ${response.status} ${response.statusText}`);
        console.error(await response.text());
        return;
    }

    const data = await response.json() as { api_key: string; claim_url: string };

    console.log('\n✅ Registration Successful!');
    console.log('--------------------------------------------------');
    console.log(`API KEY:   ${data.api_key}`);
    console.log(`CLAIM URL: ${data.claim_url}`);
    console.log('--------------------------------------------------');
    console.log('\n👉 NEXT STEPS:');
    console.log('1. Copy the API KEY to your .env file as MOLTBOOK_API_KEY');
    console.log('2. Open the CLAIM URL in your browser to verify with X (Twitter)');
    console.log('3. Run "npm start" to launch the agent');
}

register().catch(console.error);
