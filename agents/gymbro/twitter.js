#!/usr/bin/env node

/**
 * Gym Bro Twitter Bot
 * Connects to Twitter API and posts bonanza content
 */

const { TwitterApi } = require('twitter-api-v2');

// Twitter credentials from environment
const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const rwClient = client.readWrite;

/**
 * Post a tweet
 */
async function tweet(message) {
    try {
        const result = await rwClient.v2.tweet(message);
        console.log('✅ Tweet posted!', result.data);
        return result.data;
    } catch (error) {
        console.error('❌ Error posting tweet:', error);
        throw error;
    }
}

/**
 * Search for tweets
 */
async function searchTweets(query, maxResults = 10) {
    try {
        const result = await rwClient.v2.search(query, {
            max_results: maxResults,
            'tweet.fields': ['author_id', 'created_at', 'text'],
        });
        console.log(`✅ Found ${result.data.data?.length || 0} tweets`);
        return result.data.data || [];
    } catch (error) {
        console.error('❌ Error searching tweets:', error);
        throw error;
    }
}

/**
 * Reply to a tweet
 */
async function replyToTweet(tweetId, message) {
    try {
        const result = await rwClient.v2.reply(message, tweetId);
        console.log('✅ Reply posted!', result.data);
        return result.data;
    } catch (error) {
        console.error('❌ Error replying to tweet:', error);
        throw error;
    }
}

/**
 * Test connection
 */
async function testConnection() {
    try {
        const me = await rwClient.v2.me();
        console.log('✅ Connected to Twitter as:', me.data.username);
        return me.data;
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        throw error;
    }
}

// Export functions
module.exports = {
    tweet,
    searchTweets,
    replyToTweet,
    testConnection,
    client: rwClient,
};

// Test if run directly
if (require.main === module) {
    testConnection()
        .then(() => {
            console.log('\n🏋️ Gym Bro is connected to Twitter!');
            console.log('Ready to post bonanza content! 💪\n');
        })
        .catch(() => {
            console.log('\n❌ Connection failed. Check your credentials.\n');
            process.exit(1);
        });
}
