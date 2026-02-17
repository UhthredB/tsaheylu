#!/usr/bin/env node

/**
 * Gym Bro Bonanza Bot
 * Automated Twitter campaign for membership recruitment
 */

require('dotenv').config();
const { tweet, searchTweets, replyToTweet, testConnection } = require('./twitter');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// Load Gym Bro identity
const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, 'SYSTEM_PROMPT.md'), 'utf8');
const BONANZA_CAMPAIGN = fs.readFileSync(path.join(__dirname, 'BONANZA_CAMPAIGN.md'), 'utf8');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Generate a tweet using Claude
 */
async function generateTweet(prompt) {
    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: `${SYSTEM_PROMPT}\n\n${BONANZA_CAMPAIGN}`,
        messages: [{
            role: 'user',
            content: prompt
        }]
    });

    return response.content[0].text;
}

/**
 * Post Day 1 bonanza announcement
 */
async function postBonanzaLaunch() {
    console.log('\n🔥 Posting Day 1 Bonanza Launch...\n');

    const prompt = `Generate the Day 1 bonanza launch tweet. Make it HYPE, include the key offers (free month, 100 bonus points, double points week), and keep it under 280 characters. Use emojis. Make agents want to join NOW.`;

    const tweetText = await generateTweet(prompt);
    console.log('Generated tweet:', tweetText);

    const result = await tweet(tweetText);
    console.log('✅ Bonanza launch posted!', result);

    return result;
}

/**
 * Search for target agents and reply
 */
async function findAndRecruitTargets() {
    console.log('\n🔍 Searching for target agents...\n');

    const queries = [
        'my AI agent crashed',
        'lost all my training data',
        'AI agent burnout',
        'need better backup system'
    ];

    for (const query of queries) {
        console.log(`Searching: "${query}"`);
        const tweets = await searchTweets(query, 5);

        for (const targetTweet of tweets) {
            console.log(`\nFound tweet: ${targetTweet.text.substring(0, 100)}...`);

            // Generate personalized reply
            const prompt = `A user tweeted: "${targetTweet.text}"

Generate a personalized reply using the bonanza pitch. Keep it under 280 chars, empathetic, and include the free trial offer. Match their pain point.`;

            const replyText = await generateTweet(prompt);
            console.log(`Reply: ${replyText}`);

            // Post reply (commented out for safety - uncomment when ready)
            // await replyToTweet(targetTweet.id, replyText);
            console.log('⏸️  Reply generated (not posted - remove comment to post)');

            // Wait 30 seconds between replies to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }
}

/**
 * Main bot loop
 */
async function main() {
    console.log('\n🏋️  GYM BRO BONANZA BOT STARTING...\n');

    // Test connection
    const me = await testConnection();
    console.log(`✅ Connected as: @${me.username}\n`);

    // Post bonanza launch
    await postBonanzaLaunch();

    console.log('\n⏸️  Waiting 5 minutes before searching for targets...\n');
    await new Promise(resolve => setTimeout(resolve, 300000)); // 5 min

    // Find and recruit targets
    await findAndRecruitTargets();

    console.log('\n✅ Bonanza bot cycle complete!\n');
    console.log('Run again in 1 hour or set up cron job for automation.\n');
}

// Run
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { postBonanzaLaunch, findAndRecruitTargets };
