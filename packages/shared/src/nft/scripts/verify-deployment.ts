import { createPublicClient, http, type Hex, parseAbi } from 'viem';
import { mainnet, polygon, arbitrum, base } from 'viem/chains';

/**
 * DEPLOYMENT VERIFICATION SCRIPT
 *
 * Verifies that a deployed contract is configured correctly
 *
 * Usage:
 *   npx tsx verify-deployment.ts <contract-address> <network>
 */

const NETWORKS = {
    ethereum: mainnet,
    polygon,
    arbitrum,
    base,
};

const USDC_ADDRESSES = {
    ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

const ABI = parseAbi([
    'function name() external view returns (string)',
    'function symbol() external view returns (string)',
    'function MAX_SUPPLY() external view returns (uint256)',
    'function owner() external view returns (address)',
    'function treasury() external view returns (address)',
    'function saleActive() external view returns (bool)',
    'function paused() external view returns (bool)',
    'function totalMinted() external view returns (uint256)',
    'function getCurrentPrice() external view returns (uint256)',
    'function getCurrentTier() external view returns (uint256)',
    'function TIER1_PRICE() external view returns (uint256)',
    'function TIER2_PRICE() external view returns (uint256)',
    'function TIER3_PRICE() external view returns (uint256)',
    'function USDC() external view returns (address)',
]);

async function main() {
    const contractAddress = process.argv[2] as Hex;
    const networkName = process.argv[3] as keyof typeof NETWORKS;

    if (!contractAddress || !networkName) {
        console.error('Usage: npx tsx verify-deployment.ts <contract-address> <network>');
        console.error('Networks: ethereum, polygon, arbitrum, base');
        process.exit(1);
    }

    const chain = NETWORKS[networkName];
    if (!chain) {
        console.error(`Invalid network: ${networkName}`);
        process.exit(1);
    }

    console.log('🔍 DEPLOYMENT VERIFICATION');
    console.log('═'.repeat(70));
    console.log(`Network: ${chain.name}`);
    console.log(`Contract: ${contractAddress}\n`);

    const publicClient = createPublicClient({
        chain,
        transport: http(),
    });

    let allPassed = true;
    const warnings: string[] = [];

    try {
        // Basic Info
        console.log('📋 Basic Information:');
        const name = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'name',
        });
        console.log(`   ✅ Name: ${name}`);

        const symbol = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'symbol',
        });
        console.log(`   ✅ Symbol: ${symbol}`);

        const maxSupply = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'MAX_SUPPLY',
        });
        console.log(`   ✅ Max Supply: ${maxSupply.toString()}`);

        // Configuration
        console.log('\n⚙️  Configuration:');

        const owner = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'owner',
        });
        console.log(`   ✅ Owner: ${owner}`);

        const treasury = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'treasury',
        });
        console.log(`   ✅ Treasury: ${treasury}`);

        const usdc = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'USDC',
        });
        console.log(`   USDC: ${usdc}`);

        // Verify USDC address
        const expectedUSDC = USDC_ADDRESSES[networkName];
        if (usdc.toLowerCase() === expectedUSDC.toLowerCase()) {
            console.log(`   ✅ USDC address is correct for ${chain.name}`);
        } else {
            console.log(`   ❌ WARNING: USDC address mismatch!`);
            console.log(`      Expected: ${expectedUSDC}`);
            console.log(`      Got: ${usdc}`);
            warnings.push('USDC address does not match standard address');
            allPassed = false;
        }

        // State
        console.log('\n📊 Current State:');

        const saleActive = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'saleActive',
        });
        console.log(`   Sale Active: ${saleActive ? '✅ YES' : '⏸️  NO'}`);

        const paused = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'paused',
        });
        console.log(`   Paused: ${paused ? '⚠️  YES' : '✅ NO'}`);

        const totalMinted = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'totalMinted',
        });
        console.log(`   Total Minted: ${totalMinted.toString()}/100`);

        const currentTier = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'getCurrentTier',
        });
        console.log(`   Current Tier: ${currentTier.toString()}`);

        const currentPrice = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'getCurrentPrice',
        });
        console.log(`   Current Price: $${Number(currentPrice) / 1e6} USDC`);

        // Pricing
        console.log('\n💰 Pricing Configuration:');

        const tier1Price = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'TIER1_PRICE',
        });
        console.log(`   Tier 1 (1-70): $${Number(tier1Price) / 1e6} USDC`);

        const tier2Price = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'TIER2_PRICE',
        });
        console.log(`   Tier 2 (71-90): $${Number(tier2Price) / 1e6} USDC`);

        const tier3Price = await publicClient.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'TIER3_PRICE',
        });
        console.log(`   Tier 3 (91-100): $${Number(tier3Price) / 1e6} USDC`);

        // Final Report
        console.log('\n' + '═'.repeat(70));
        if (allPassed && warnings.length === 0) {
            console.log('✅ ALL CHECKS PASSED');
        } else if (warnings.length > 0) {
            console.log('⚠️  WARNINGS DETECTED:');
            warnings.forEach(w => console.log(`   - ${w}`));
        }
        console.log('═'.repeat(70));

        // Recommendations
        console.log('\n💡 Recommendations:');
        if (!saleActive) {
            console.log('   - Enable sale when ready: toggleSale()');
        }
        if (paused) {
            console.log('   - Unpause contract: unpause()');
        }
        if (owner === treasury) {
            console.log('   ⚠️  Owner and treasury are the same - consider using separate addresses');
        }
        console.log('   - Set up monitoring on Tenderly');
        console.log('   - Test a small purchase before announcing');
        console.log('   - Verify contract source code on block explorer');

    } catch (error: any) {
        console.error('\n❌ Verification failed:');
        console.error(error.message);
        console.log('\nPossible issues:');
        console.log('  - Contract not deployed');
        console.log('  - Wrong network');
        console.log('  - RPC connection issue');
        process.exit(1);
    }
}

main().catch(console.error);
