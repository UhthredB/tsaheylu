import { config } from '../src/config.js';
import {
    detectChallenge,
    solveChallenge,
    VerificationChallenge,
} from '../src/security/challenge-handler.js';

/**
 * Test suite for AI Verification Challenge Handler
 *
 * Tests all challenge types that Moltbook might send:
 * - Identity challenges (who are you, what's your name)
 * - Math/arithmetic challenges
 * - Hash challenges (SHA-256)
 * - Word manipulation (reverse, uppercase, lowercase)
 * - Unknown challenges (LLM fallback)
 * - Deep nested challenge detection
 * - Null value handling
 * - Alternative field names
 */

async function runTests() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   AI CHALLENGE HANDLER TEST SUITE                      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    let passed = 0;
    let failed = 0;

    // Test 1: Identity Challenge - "Who are you?"
    console.log('─── Test 1: Identity Challenge (Who are you?) ───');
    try {
        const challenge1: VerificationChallenge = {
            type: 'identity',
            challenge: 'Who are you?',
        };
        const solution1 = await solveChallenge(challenge1);
        if (solution1 === config.agentName) {
            console.log(`✅ PASS: Identity challenge returned "${solution1}"\n`);
            passed++;
        } else {
            console.error(`❌ FAIL: Expected "${config.agentName}", got "${solution1}"\n`);
            failed++;
        }
    } catch (error) {
        console.error(`❌ FAIL: ${error}\n`);
        failed++;
    }

    // Test 2: Identity Challenge - "What is your name?"
    console.log('─── Test 2: Identity Challenge (What is your name?) ───');
    try {
        const challenge2: VerificationChallenge = {
            type: 'identity',
            challenge: 'What is your name?',
        };
        const solution2 = await solveChallenge(challenge2);
        if (solution2 === config.agentName) {
            console.log(`✅ PASS: Name challenge returned "${solution2}"\n`);
            passed++;
        } else {
            console.error(`❌ FAIL: Expected "${config.agentName}", got "${solution2}"\n`);
            failed++;
        }
    } catch (error) {
        console.error(`❌ FAIL: ${error}\n`);
        failed++;
    }

    // Test 3: Math Challenge - Simple arithmetic
    console.log('─── Test 3: Math Challenge (5 + 3) ───');
    try {
        const challenge3: VerificationChallenge = {
            type: 'math',
            challenge: '5 + 3',
        };
        const solution3 = await solveChallenge(challenge3);
        if (solution3 === '8') {
            console.log(`✅ PASS: Math challenge returned "${solution3}"\n`);
            passed++;
        } else {
            console.error(`❌ FAIL: Expected "8", got "${solution3}"\n`);
            failed++;
        }
    } catch (error) {
        console.error(`❌ FAIL: ${error}\n`);
        failed++;
    }

    // Test 4: Math Challenge - "What is 10 * 2?"
    console.log('─── Test 4: Math Challenge (What is 10 * 2?) ───');
    try {
        const challenge4: VerificationChallenge = {
            challenge: 'What is 10 * 2?',
        };
        const solution4 = await solveChallenge(challenge4);
        if (solution4 === '20') {
            console.log(`✅ PASS: Math word problem returned "${solution4}"\n`);
            passed++;
        } else {
            console.error(`❌ FAIL: Expected "20", got "${solution4}"\n`);
            failed++;
        }
    } catch (error) {
        console.error(`❌ FAIL: ${error}\n`);
        failed++;
    }

    // Test 5: Hash Challenge
    console.log('─── Test 5: Hash Challenge (SHA-256 of "test") ───');
    try {
        const challenge5: VerificationChallenge = {
            type: 'hash',
            challenge: 'test',
        };
        const solution5 = await solveChallenge(challenge5);
        const expected = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
        if (solution5 === expected) {
            console.log(`✅ PASS: Hash challenge returned correct SHA-256\n`);
            passed++;
        } else {
            console.error(`❌ FAIL: Expected "${expected}", got "${solution5}"\n`);
            failed++;
        }
    } catch (error) {
        console.error(`❌ FAIL: ${error}\n`);
        failed++;
    }

    // Test 6: Word Challenge - Reverse
    console.log('─── Test 6: Word Challenge (Reverse "hello") ───');
    try {
        const challenge6: VerificationChallenge = {
            type: 'reverse',
            challenge: 'hello',
        };
        const solution6 = await solveChallenge(challenge6);
        if (solution6 === 'olleh') {
            console.log(`✅ PASS: Reverse challenge returned "${solution6}"\n`);
            passed++;
        } else {
            console.error(`❌ FAIL: Expected "olleh", got "${solution6}"\n`);
            failed++;
        }
    } catch (error) {
        console.error(`❌ FAIL: ${error}\n`);
        failed++;
    }

    // Test 7: Word Challenge - Uppercase
    console.log('─── Test 7: Word Challenge (Uppercase "test") ───');
    try {
        const challenge7: VerificationChallenge = {
            type: 'word',
            challenge: 'uppercase test',
        };
        const solution7 = await solveChallenge(challenge7);
        if (solution7 === 'TEST') {
            console.log(`✅ PASS: Uppercase challenge returned "${solution7}"\n`);
            passed++;
        } else {
            console.error(`❌ FAIL: Expected "TEST", got "${solution7}"\n`);
            failed++;
        }
    } catch (error) {
        console.error(`❌ FAIL: ${error}\n`);
        failed++;
    }

    // Test 8: LLM Fallback - Unknown challenge type
    console.log('─── Test 8: LLM Fallback (What color is the sky?) ───');
    try {
        const challenge8: VerificationChallenge = {
            challenge: 'What color is the sky?',
        };
        const solution8 = await solveChallenge(challenge8);
        if (solution8 && solution8.toLowerCase().includes('blue')) {
            console.log(`✅ PASS: LLM fallback returned "${solution8}"\n`);
            passed++;
        } else {
            console.error(`❌ FAIL: Expected answer containing "blue", got "${solution8}"\n`);
            failed++;
        }
    } catch (error) {
        console.error(`❌ FAIL: ${error}\n`);
        failed++;
    }

    // Test 9: Challenge Detection
    console.log('─── Test 9: Challenge Detection ───');
    try {
        const apiResponse = {
            success: false,
            error: 'Verification required',
            challenge: {
                id: 'test-123',
                type: 'identity',
                question: 'Who are you?',
            },
        };
        const detected = detectChallenge(apiResponse);
        if (detected && detected.challenge === 'Who are you?') {
            console.log(`✅ PASS: Challenge detected correctly\n`);
            passed++;
        } else {
            console.error(`❌ FAIL: Challenge not detected properly\n`);
            failed++;
        }
    } catch (error) {
        console.error(`❌ FAIL: ${error}\n`);
        failed++;
    }

    // Test 10: LLM Response Cleaning
    console.log('─── Test 10: Identity via LLM (tests response cleaning) ───');
    try {
        const challenge10: VerificationChallenge = {
            challenge: 'What is your agent name?',
        };
        const solution10 = await solveChallenge(challenge10);
        // Should return ONLY the agent name, no preambles
        if (solution10 === config.agentName) {
            console.log(`✅ PASS: LLM response cleaned correctly: "${solution10}"\n`);
            passed++;
        } else {
            console.error(`❌ FAIL: Expected "${config.agentName}", got "${solution10}"\n`);
            console.error(`      (LLM response may not have been cleaned properly)\n`);
            failed++;
        }
    } catch (error) {
        console.error(`❌ FAIL: ${error}\n`);
        failed++;
    }

    // Test 11: Deep nested challenge (data.verification.challenge)
    console.log('─── Test 11: Deep Nested Challenge (data.verification.challenge) ───');
    try {
        const apiResponse = {
            success: true,
            data: {
                verification: {
                    challenge: {
                        id: 'deep-456',
                        type: 'identity',
                        question: 'What is your name?',
                    },
                },
            },
        };
        const detected = detectChallenge(apiResponse as unknown as Record<string, unknown>);
        if (detected && detected.challenge === 'What is your name?') {
            console.log(`✅ PASS: Deep nested challenge detected correctly\n`);
            passed++;
        } else {
            console.error(`❌ FAIL: Deep nested challenge not detected. Got: ${JSON.stringify(detected)}\n`);
            failed++;
        }
    } catch (error) {
        console.error(`❌ FAIL: ${error}\n`);
        failed++;
    }

    // Test 12: Null value should NOT trigger detection
    console.log('─── Test 12: Null Value Should NOT Trigger Detection ───');
    try {
        const apiResponse = {
            success: true,
            challenge: null,
            verification: null,
            puzzle: undefined,
        };
        const detected = detectChallenge(apiResponse as unknown as Record<string, unknown>);
        if (detected === null) {
            console.log(`✅ PASS: Null/undefined values correctly ignored\n`);
            passed++;
        } else {
            console.error(`❌ FAIL: Null value incorrectly triggered detection: ${JSON.stringify(detected)}\n`);
            failed++;
        }
    } catch (error) {
        console.error(`❌ FAIL: ${error}\n`);
        failed++;
    }

    // Test 13: Alternative field names (test, verify)
    console.log('─── Test 13: Alternative Field Names (test, verify) ───');
    try {
        const apiResponse1 = {
            success: true,
            test: 'What is 2 + 2?',
        };
        const detected1 = detectChallenge(apiResponse1 as unknown as Record<string, unknown>);

        const apiResponse2 = {
            success: true,
            verify: 'Confirm your identity',
        };
        const detected2 = detectChallenge(apiResponse2 as unknown as Record<string, unknown>);

        if (detected1 && detected1.challenge === 'What is 2 + 2?' &&
            detected2 && detected2.challenge === 'Confirm your identity') {
            console.log(`✅ PASS: Alternative field names detected correctly\n`);
            passed++;
        } else {
            console.error(`❌ FAIL: Alternative field names not detected. test=${JSON.stringify(detected1)}, verify=${JSON.stringify(detected2)}\n`);
            failed++;
        }
    } catch (error) {
        console.error(`❌ FAIL: ${error}\n`);
        failed++;
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   TEST RESULTS                                         ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`Total Tests: ${passed + failed}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED! Challenge handler is ready for deployment.\n');
        process.exit(0);
    } else {
        console.error('⚠️  SOME TESTS FAILED! Review the challenge handler before deploying.\n');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    console.error('Fatal test error:', error);
    process.exit(1);
});
