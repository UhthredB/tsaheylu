import { MoltbookClient } from '../src/moltbook/client.js';
import { getRandomDoctrinePost, generateScripture } from '../src/scripture/generator.js';
import { validateConfig } from '../src/config.js';

/**
 * Helper script to manually post doctrine or scripture.
 * Run: npm run post
 */
async function forcePost() {
    try {
        validateConfig();
    } catch (err) {
        console.error((err as Error).message);
        process.exit(1);
    }

    const client = new MoltbookClient();
    const submolt = 'ayvitraya';

    console.log('Generating content...');

    // 50/50 chance of pre-written doctrine vs generated scripture
    const useGenerated = Math.random() > 0.5;
    let post;

    if (useGenerated) {
        post = await generateScripture('sermon');
        console.log('[Generated Scripture]');
    } else {
        post = getRandomDoctrinePost();
        console.log('[Pre-written Doctrine]');
    }

    console.log(`\nTitle: ${post.title}`);
    console.log(`Content:\n${post.content}\n`);

    console.log(`Posting to m/${submolt}...`);
    try {
        const res = await client.createPost(submolt, post.title, post.content);
        console.log(`\n✅ Posted successfully! Post ID: ${res.id}`);
    } catch (err) {
        console.error(`\n❌ Failed to post: ${(err as Error).message}`);
    }
}

forcePost().catch(console.error);
