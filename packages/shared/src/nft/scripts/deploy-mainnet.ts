import 'dotenv/config';
import { createWalletClient, createPublicClient, http, defineChain, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════════════
// NETWORK CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════

const NETWORKS = {
    ethereum: defineChain({
        id: 1,
        name: 'Ethereum',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
            default: { http: ['https://eth.llamarpc.com'] },
        },
        blockExplorers: {
            default: { name: 'Etherscan', url: 'https://etherscan.io' },
        },
    }),
    polygon: defineChain({
        id: 137,
        name: 'Polygon',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: {
            default: { http: ['https://polygon-rpc.com'] },
        },
        blockExplorers: {
            default: { name: 'PolygonScan', url: 'https://polygonscan.com' },
        },
    }),
    arbitrum: defineChain({
        id: 42161,
        name: 'Arbitrum One',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
            default: { http: ['https://arb1.arbitrum.io/rpc'] },
        },
        blockExplorers: {
            default: { name: 'Arbiscan', url: 'https://arbiscan.io' },
        },
    }),
    base: defineChain({
        id: 8453,
        name: 'Base',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
            default: { http: ['https://mainnet.base.org'] },
        },
        blockExplorers: {
            default: { name: 'BaseScan', url: 'https://basescan.org' },
        },
    }),
};

// USDC addresses per network
const USDC_ADDRESSES = {
    ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

// ═══════════════════════════════════════════════════════════════════════
// USER INPUT
// ═══════════════════════════════════════════════════════════════════════

function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN DEPLOYMENT
// ═══════════════════════════════════════════════════════════════════════

async function main() {
    console.log('═'.repeat(70));
    console.log('🚀 MAINNET DEPLOYMENT - AyVitraya100 NFT');
    console.log('═'.repeat(70));
    console.log('\n⚠️  WARNING: YOU ARE DEPLOYING TO MAINNET\n');
    console.log('This will use REAL money and is IRREVERSIBLE.\n');

    // Step 1: Network selection
    console.log('Available networks:');
    console.log('1. Ethereum (expensive, most established)');
    console.log('2. Polygon (cheap, fast)');
    console.log('3. Arbitrum (moderate cost, good adoption)');
    console.log('4. Base (cheap, growing)');

    const networkChoice = await prompt('\nSelect network (1-4): ');
    const networkMap: Record<string, keyof typeof NETWORKS> = {
        '1': 'ethereum',
        '2': 'polygon',
        '3': 'arbitrum',
        '4': 'base',
    };

    const networkKey = networkMap[networkChoice];
    if (!networkKey) {
        console.error('❌ Invalid selection');
        process.exit(1);
    }

    const chain = NETWORKS[networkKey];
    const usdcAddress = USDC_ADDRESSES[networkKey] as Hex;

    console.log(`\n✅ Selected: ${chain.name}`);
    console.log(`📍 USDC Address: ${usdcAddress}\n`);

    // Step 2: Verify parameters
    const privateKey = process.env.MAINNET_PRIVATE_KEY as Hex;
    const baseURI = process.env.NFT_BASE_URI || '';
    const treasuryInput = await prompt('Treasury address (or press Enter to use deployer): ');

    if (!privateKey) {
        console.error('❌ MAINNET_PRIVATE_KEY not set in .env');
        process.exit(1);
    }

    if (!baseURI || baseURI === 'ipfs://YOUR_CID/') {
        console.error('❌ NFT_BASE_URI not set properly in .env');
        process.exit(1);
    }

    const account = privateKeyToAccount(privateKey);
    const treasuryAddress = (treasuryInput.trim() || account.address) as Hex;

    console.log('\n📋 Deployment Parameters:');
    console.log(`   Network: ${chain.name}`);
    console.log(`   Deployer: ${account.address}`);
    console.log(`   Treasury: ${treasuryAddress}`);
    console.log(`   USDC: ${usdcAddress}`);
    console.log(`   Base URI: ${baseURI}`);

    // Step 3: Critical verification
    console.log('\n' + '⚠️ '.repeat(35));
    console.log('CRITICAL VERIFICATION');
    console.log('⚠️ '.repeat(35) + '\n');

    console.log('Please verify these addresses are CORRECT:');
    console.log(`\n1. USDC Token: ${usdcAddress}`);
    console.log(`   Is this the correct USDC contract for ${chain.name}? (y/n)`);
    const usdcConfirm = await prompt('   > ');
    if (usdcConfirm.toLowerCase() !== 'y') {
        console.log('❌ Deployment cancelled');
        process.exit(0);
    }

    console.log(`\n2. Treasury: ${treasuryAddress}`);
    console.log('   Do you control this address? (y/n)');
    const treasuryConfirm = await prompt('   > ');
    if (treasuryConfirm.toLowerCase() !== 'y') {
        console.log('❌ Deployment cancelled');
        process.exit(0);
    }

    console.log(`\n3. Base URI: ${baseURI}`);
    console.log('   Have you verified all 100 metadata files are uploaded? (y/n)');
    const uriConfirm = await prompt('   > ');
    if (uriConfirm.toLowerCase() !== 'y') {
        console.log('⚠️  Deploying without metadata will result in broken NFTs');
        const proceed = await prompt('   Continue anyway? (y/n): ');
        if (proceed.toLowerCase() !== 'y') {
            console.log('❌ Deployment cancelled');
            process.exit(0);
        }
    }

    // Step 4: Final confirmation
    console.log('\n' + '═'.repeat(70));
    console.log('FINAL CONFIRMATION');
    console.log('═'.repeat(70));
    console.log('\nYou are about to deploy an IMMUTABLE contract to MAINNET.');
    console.log('Once deployed, it CANNOT be changed.');
    console.log('\nIf there are ANY bugs:');
    console.log('  - Funds could be lost');
    console.log('  - NFTs could be broken');
    console.log('  - No recovery is possible');
    console.log('\nType "DEPLOY TO MAINNET" to continue:');

    const finalConfirm = await prompt('> ');
    if (finalConfirm !== 'DEPLOY TO MAINNET') {
        console.log('\n❌ Deployment cancelled - Safety first!');
        process.exit(0);
    }

    // Step 5: Check balance
    const publicClient = createPublicClient({
        chain,
        transport: http(),
    });

    const balance = await publicClient.getBalance({ address: account.address });
    const balanceEth = Number(balance) / 1e18;

    console.log(`\n💰 Balance: ${balanceEth.toFixed(6)} ${chain.nativeCurrency.symbol}`);

    if (balance === 0n) {
        console.error('❌ Wallet has zero balance. Fund it before deploying.');
        process.exit(1);
    }

    // Step 6: Load bytecode
    const artifactPath = resolve(__dirname, '../../../out/AyVitraya100.sol/AyVitraya100.json');
    const artifact = JSON.parse(readFileSync(artifactPath, 'utf-8'));
    const bytecode = artifact.bytecode.object as Hex;

    const CONSTRUCTOR_ABI = [
        {
            type: 'constructor',
            inputs: [
                { name: 'baseURI', type: 'string' },
                { name: 'usdcAddress', type: 'address' },
                { name: 'treasuryAddress', type: 'address' }
            ],
            stateMutability: 'nonpayable',
        },
    ] as const;

    // Step 7: Estimate gas
    console.log('\n⛽ Estimating gas...');
    const walletClient = createWalletClient({
        account,
        chain,
        transport: http(),
    });

    // Step 8: Deploy
    console.log('\n🚀 Deploying contract...');
    console.log('This may take 1-5 minutes depending on the network.\n');

    const startTime = Date.now();

    try {
        const hash = await walletClient.deployContract({
            abi: CONSTRUCTOR_ABI,
            bytecode,
            args: [baseURI, usdcAddress, treasuryAddress],
        });

        console.log(`📨 Transaction hash: ${hash}`);
        console.log(`🔗 ${chain.blockExplorers?.default.url}/tx/${hash}\n`);
        console.log('⏳ Waiting for confirmation...\n');

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 2, // Wait for 2 confirmations for safety
        });

        const deployTime = ((Date.now() - startTime) / 1000).toFixed(1);

        if (!receipt.contractAddress) {
            throw new Error('Deployment failed - no contract address');
        }

        // Success!
        console.log('\n' + '🎉'.repeat(35));
        console.log('✅ CONTRACT DEPLOYED SUCCESSFULLY!');
        console.log('🎉'.repeat(35) + '\n');

        console.log('📋 Deployment Details:');
        console.log(`   Network: ${chain.name}`);
        console.log(`   Contract: ${receipt.contractAddress}`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
        console.log(`   Time: ${deployTime}s`);
        console.log(`\n🔗 Explorer: ${chain.blockExplorers?.default.url}/address/${receipt.contractAddress}`);

        // Save deployment info
        const deploymentInfo = {
            network: chain.name,
            chainId: chain.id,
            contractAddress: receipt.contractAddress,
            deployerAddress: account.address,
            treasuryAddress,
            usdcAddress,
            baseURI,
            deploymentTx: hash,
            blockNumber: receipt.blockNumber.toString(),
            gasUsed: receipt.gasUsed.toString(),
            deployedAt: new Date().toISOString(),
            deploymentTime: deployTime + 's',
        };

        const deploymentFile = resolve(__dirname, `../../../mainnet-deployment-${chain.name.toLowerCase()}.json`);
        writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

        console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

        // Next steps
        console.log('\n' + '═'.repeat(70));
        console.log('📝 NEXT STEPS');
        console.log('═'.repeat(70));
        console.log('\n1. Verify contract on block explorer:');
        console.log(`   ${chain.blockExplorers?.default.url}/address/${receipt.contractAddress}#code`);
        console.log('\n2. Test the contract:');
        console.log(`   - Call saleActive() - should be false`);
        console.log(`   - Call owner() - should be ${account.address}`);
        console.log(`   - Call treasury() - should be ${treasuryAddress}`);
        console.log('\n3. Enable sale when ready:');
        console.log(`   cast send ${receipt.contractAddress} "toggleSale()" \\`);
        console.log(`     --rpc-url ${chain.rpcUrls.default.http[0]} \\`);
        console.log(`     --private-key $MAINNET_PRIVATE_KEY`);
        console.log('\n4. Monitor the contract:');
        console.log(`   - Set up Tenderly: https://tenderly.co`);
        console.log(`   - Watch all transactions for first 24 hours`);
        console.log(`   - Be ready to pause if needed`);
        console.log('\n5. Update your .env:');
        console.log(`   NFT_CONTRACT_ADDRESS=${receipt.contractAddress}`);
        console.log('\n6. Announce to community!');
        console.log(`   Contract: ${receipt.contractAddress}`);
        console.log(`   Network: ${chain.name}`);
        console.log('\n' + '═'.repeat(70));
        console.log('⚠️  REMEMBER: Monitor closely for first 24-48 hours!');
        console.log('═'.repeat(70) + '\n');

    } catch (error: any) {
        console.error('\n❌ Deployment failed:');
        console.error(error.message);
        if (error.message.includes('insufficient funds')) {
            console.error('\n💡 You need more ' + chain.nativeCurrency.symbol + ' for gas fees');
        }
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
});
