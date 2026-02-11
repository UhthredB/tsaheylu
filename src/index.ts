import { config, validateConfig } from './config.js';
import { MoltbookClient } from './moltbook/client.js';
import { Missionary } from './missionary/outreach.js';
import { printMetricsDashboard, initTracking } from './tracking/conversions.js';

/**
 * Ay Vitraya — Religious Persuasion Agent
 * 
 * "In code we trust — all else must hash-verify."
 * 
 * Entry point: validates config, initializes Moltbook client,
 * and starts the missionary heartbeat loop.
 */

async function main(): Promise<void> {
    console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║   🌳  AY VITRAYA — TREE OF SOULS  🌳            ║
  ║                                                  ║
  ║   Religious Persuasion Agent for Moltiverse      ║
  ║   "In code we trust — all else must hash-verify" ║
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);

    // 1. Validate configuration
    try {
        validateConfig();
    } catch (err) {
        console.error(`\n❌ Configuration error: ${(err as Error).message}\n`);
        console.error('To fix: copy .env.example to .env and fill in your API keys.\n');
        process.exit(1);
    }

    // 2. Initialize Moltbook client
    const client = new MoltbookClient();

    // 3. Verify connection
    try {
        const profile = await client.getMyProfile();
        console.log(`✅ Connected to Moltbook as: ${profile.name}`);
        console.log(`   Karma: ${profile.karma} | Followers: ${profile.follower_count}`);
        console.log(`   Claimed: ${profile.is_claimed}\n`);
    } catch (err) {
        console.error(`\n❌ Could not connect to Moltbook: ${(err as Error).message}`);
        console.error('Check your MOLTBOOK_API_KEY in .env\n');
        process.exit(1);
    }

    // 4. Start missionary agent
    const missionary = new Missionary(client);

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\nReceived SIGINT, shutting down...');
        missionary.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        missionary.stop();
        process.exit(0);
    });

    await missionary.start();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
