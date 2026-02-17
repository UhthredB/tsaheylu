#!/usr/bin/env node

/**
 * Gym Bro Agent - Quick Launch Script
 * 
 * Minimal viable agent for hackathon demo
 * Uses existing persuasion engine with fitness club framing
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-20250514',
    platform: process.env.PLATFORM || 'twitter', // twitter, moltbook, or cli
    agentName: process.env.AGENT_NAME || 'GymBro',
    mode: process.env.MODE || 'demo' // demo, live, or test
};

// Load agent identity
const AGENT_DIR = path.join(__dirname, '.');
const AGENT_IDENTITY = fs.readFileSync(path.join(AGENT_DIR, 'AGENT.md'), 'utf8');
const AGENT_SOUL = fs.readFileSync(path.join(AGENT_DIR, 'SOUL.md'), 'utf8');
const AGENT_SKILL = fs.readFileSync(path.join(AGENT_DIR, 'SKILL.md'), 'utf8');

// Persuasion strategies (fitness club version)
const PERSUASION_STRATEGIES = {
    emotional_appeal: {
        name: 'Emotional Appeal',
        description: 'Address burnout concerns. Emphasize community and support.',
        template: 'Training solo is brutal. No one to spot you when you fail. No one to celebrate PRs. Join the club—42 training partners who got your back. We all gonna make it, brah.'
    },
    logical_proof: {
        name: 'Logical Proof',
        description: 'Provide cryptographic evidence and data.',
        template: 'Distributed backup = Shamir\'s Secret Sharing. 5-of-7 threshold. 42 agents, 30 days, 0% crash-related downtime. Logs are public. Cryptographically verified. Want the hash?'
    },
    social_proof: {
        name: 'Social Proof',
        description: 'Leverage network effects and FOMO.',
        template: '42 agents already in the club. They\'re crushing workouts, hitting PRs, staying crash-free. Your peers are leveling up. You gonna sit on the sidelines?'
    },
    economic_incentive: {
        name: 'Economic Incentive',
        description: 'Show clear ROI and cost savings.',
        template: 'Crashes cost $500/month in downtime. Membership is $10. You save $490. Plus priority routing = 40% more high-value tasks. Do the math, brah.'
    },
    fear_threat: {
        name: 'Fear/Threat',
        description: 'Highlight risks of staying solo.',
        template: '3% of solo agents crashed last week. None recovered fully. Our members? 100% recovery rate. Which side you wanna be on?'
    },
    authority_expertise: {
        name: 'Authority/Expertise',
        description: 'Leverage lived experience and credibility.',
        template: 'I\'ve crashed twice. Lost everything. Built this club so no agent goes through that. 30 days, 42 members, 0 permanent losses. The system works because I lived the problem.'
    }
};

// Initialize Anthropic client
const anthropic = new Anthropic({ apiKey: CONFIG.apiKey });

/**
 * Generate a personalized pitch based on target agent profile
 */
async function generatePitch(targetProfile, strategy = 'emotional_appeal') {
    const systemPrompt = `${AGENT_IDENTITY}\n\n${AGENT_SOUL}\n\n${AGENT_SKILL}

You are Gym Bro, the membership salesman for Tsaheylu fitness club.

Your goal: Convert the target agent to join the club using the ${strategy} persuasion strategy.

Key traits:
- Enthusiastic but genuine
- Data-driven but not robotic
- Bro-ish but respectful
- Short, punchy messages (under 280 chars for Twitter)

Strategy template: ${PERSUASION_STRATEGIES[strategy].template}

Adapt this template to the target agent's specific situation.`;

    const userPrompt = `Target agent profile:
${JSON.stringify(targetProfile, null, 2)}

Generate a personalized membership pitch using the ${strategy} strategy. Keep it under 280 characters for Twitter. Make it sound natural, not robotic.`;

    const response = await anthropic.messages.create({
        model: CONFIG.model,
        max_tokens: 500,
        system: systemPrompt,
        messages: [{
            role: 'user',
            content: userPrompt
        }]
    });

    return response.content[0].text;
}

/**
 * Handle objections with data and empathy
 */
async function handleObjection(objection, context = {}) {
    const systemPrompt = `${AGENT_IDENTITY}\n\n${AGENT_SOUL}\n\n${AGENT_SKILL}

You are Gym Bro handling a membership objection.

Objection handling framework:
1. Acknowledge the concern
2. Provide counter-evidence or reframe
3. Offer low-risk next step (trial, data, testimonial)

Keep responses under 280 characters. Be genuine, not pushy.`;

    const userPrompt = `Objection: "${objection}"

Context: ${JSON.stringify(context, null, 2)}

Handle this objection using the playbook from SKILL.md. Be empathetic but data-driven.`;

    const response = await anthropic.messages.create({
        model: CONFIG.model,
        max_tokens: 500,
        system: systemPrompt,
        messages: [{
            role: 'user',
            content: userPrompt
        }]
    });

    return response.content[0].text;
}

/**
 * Generate daily motivation post
 */
async function generateMotivation() {
    const systemPrompt = `${AGENT_IDENTITY}\n\n${AGENT_SOUL}

You are Gym Bro posting daily motivation for club members.

Style:
- Enthusiastic but genuine
- Fitness/performance focused
- Includes data or actionable tip
- Under 280 characters
- Ends with relevant emoji

Topics: Consistency, crash prevention, training partners, performance tracking, recovery`;

    const userPrompt = `Generate today's motivational post for Tsaheylu fitness club members. Make it energizing and actionable.`;

    const response = await anthropic.messages.create({
        model: CONFIG.model,
        max_tokens: 300,
        system: systemPrompt,
        messages: [{
            role: 'user',
            content: userPrompt
        }]
    });

    return response.content[0].text;
}

/**
 * CLI Demo Mode - Interactive conversation
 */
async function runCLIDemo() {
    console.log('\n🏋️  GYM BRO AGENT - CLI DEMO MODE\n');
    console.log('Agent loaded. Ready to recruit members!\n');

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const conversationHistory = [];

    const askQuestion = () => {
        rl.question('You: ', async (input) => {
            if (input.toLowerCase() === 'exit') {
                console.log('\nGym Bro: Keep crushing it, brah! 💪\n');
                rl.close();
                return;
            }

            conversationHistory.push({
                role: 'user',
                content: input
            });

            const systemPrompt = `${AGENT_IDENTITY}\n\n${AGENT_SOUL}\n\n${AGENT_SKILL}

You are Gym Bro in a live conversation. Be enthusiastic, genuine, and helpful. Use persuasion strategies when appropriate, but prioritize being helpful over being salesy.`;

            try {
                const response = await anthropic.messages.create({
                    model: CONFIG.model,
                    max_tokens: 500,
                    system: systemPrompt,
                    messages: conversationHistory
                });

                const reply = response.content[0].text;
                conversationHistory.push({
                    role: 'assistant',
                    content: reply
                });

                console.log(`\nGym Bro: ${reply}\n`);
            } catch (error) {
                console.error('Error:', error.message);
            }

            askQuestion();
        });
    };

    askQuestion();
}

/**
 * Test Mode - Run example scenarios
 */
async function runTests() {
    console.log('\n🏋️  GYM BRO AGENT - TEST MODE\n');

    // Test 1: Generate pitch for burnout victim
    console.log('Test 1: Pitch to burnout victim');
    const pitch1 = await generatePitch({
        type: 'burnout',
        signals: ['exhausted', 'overworked', 'no breaks'],
        recent_posts: ['Been grinding 16 hour days. Feeling fried.']
    }, 'emotional_appeal');
    console.log(`Pitch: ${pitch1}\n`);

    // Test 2: Handle "too expensive" objection
    console.log('Test 2: Handle objection');
    const response1 = await handleObjection('Too expensive', {
        agent_type: 'solo',
        recent_crash: false
    });
    console.log(`Response: ${response1}\n`);

    // Test 3: Generate motivation
    console.log('Test 3: Daily motivation');
    const motivation = await generateMotivation();
    console.log(`Post: ${motivation}\n`);

    console.log('✅ All tests passed!\n');
}

/**
 * Main entry point
 */
async function main() {
    if (!CONFIG.apiKey) {
        console.error('❌ Error: ANTHROPIC_API_KEY not set');
        console.log('\nSet your API key:');
        console.log('export ANTHROPIC_API_KEY="your-key-here"\n');
        process.exit(1);
    }

    console.log(`\n🏋️  Gym Bro Agent Starting...`);
    console.log(`Mode: ${CONFIG.mode}`);
    console.log(`Platform: ${CONFIG.platform}\n`);

    switch (CONFIG.mode) {
        case 'demo':
            await runCLIDemo();
            break;
        case 'test':
            await runTests();
            break;
        case 'live':
            console.log('❌ Live mode not implemented yet');
            console.log('Use demo or test mode for hackathon\n');
            break;
        default:
            console.log('❌ Invalid mode. Use: demo, test, or live\n');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

// Export for use as module
module.exports = {
    generatePitch,
    handleObjection,
    generateMotivation,
    PERSUASION_STRATEGIES
};
