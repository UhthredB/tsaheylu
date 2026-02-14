import 'dotenv/config';
import { createWalletClient, createPublicClient, http, defineChain, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * MONAD MAINNET DEPLOYMENT SCRIPT
 *
 * Deploys AyVitraya100 NFT contract to Monad mainnet (Chain ID 143)
 *
 * Usage:
 *   npx tsx src/nft/scripts/deploy-monad-mainnet.ts
 */

// Monad Mainnet chain definition
const monadMainnet = defineChain({
    id: 143,
    name: 'Monad',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.monad.xyz'] },
    },
    blockExplorers: {
        default: { name: 'MonadScan', url: 'https://monadscan.com' },
    },
});

// Monad mainnet USDC (Circle official)
const MONAD_MAINNET_USDC = '0x754704bc059f8c67012fed69bc8a327a5aafb603' as Hex;

// Read bytecode from compiled contract
const artifactPath = resolve(__dirname, '../../../out/AyVitraya100.sol/AyVitraya100.json');
const artifact = JSON.parse(readFileSync(artifactPath, 'utf-8'));
const bytecode = artifact.bytecode.object as Hex;

// ABI for constructor
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

async function main() {
    const privateKey = process.env.MONAD_PRIVATE_KEY as Hex;
    if (!privateKey) {
        console.error('MONAD_PRIVATE_KEY not set in .env');
        process.exit(1);
    }

    const baseURI = process.env.NFT_BASE_URI!;
    const treasuryAddress = process.env.TREASURY_ADDRESS as Hex;

    if (!baseURI || !treasuryAddress) {
        console.error('NFT_BASE_URI and TREASURY_ADDRESS must be set in .env');
        process.exit(1);
    }

    const account = privateKeyToAccount(privateKey);

    console.log('');
    console.log('='.repeat(60));
    console.log('  MONAD MAINNET DEPLOYMENT - AyVitraya100 NFT');
    console.log('='.repeat(60));
    console.log('');
    console.log(`  Network:    Monad Mainnet (Chain ID 143)`);
    console.log(`  RPC:        https://rpc.monad.xyz`);
    console.log(`  Deployer:   ${account.address}`);
    console.log(`  Treasury:   ${treasuryAddress}`);
    console.log(`  USDC:       ${MONAD_MAINNET_USDC}`);
    console.log(`  Base URI:   ${baseURI}`);
    console.log('');

    const publicClient = createPublicClient({
        chain: monadMainnet,
        transport: http(),
    });

    const walletClient = createWalletClient({
        account,
        chain: monadMainnet,
        transport: http(),
    });

    // Check balance
    const balance = await publicClient.getBalance({ address: account.address });
    const balanceMON = Number(balance) / 1e18;
    console.log(`  Balance:    ${balanceMON.toFixed(4)} MON`);

    if (balanceMON < 0.5) {
        console.error('\n  Insufficient MON for deployment. Need at least 0.5 MON.');
        process.exit(1);
    }

    // Verify chain
    const chainId = await publicClient.getChainId();
    console.log(`  Chain ID:   ${chainId}`);

    if (chainId !== 143) {
        console.error(`\n  Wrong chain! Expected 143, got ${chainId}`);
        process.exit(1);
    }

    console.log('');
    console.log('-'.repeat(60));
    console.log('  Deploying AyVitraya100 to Monad mainnet...');
    console.log('-'.repeat(60));
    console.log('');

    const hash = await walletClient.deployContract({
        abi: CONSTRUCTOR_ABI,
        bytecode,
        args: [baseURI, MONAD_MAINNET_USDC, treasuryAddress],
    });

    console.log(`  TX Hash:    ${hash}`);
    console.log('  Waiting for confirmation...');
    console.log('');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (!receipt.contractAddress) {
        console.error('  Deployment failed - no contract address in receipt');
        process.exit(1);
    }

    console.log('='.repeat(60));
    console.log('  DEPLOYMENT SUCCESSFUL');
    console.log('='.repeat(60));
    console.log('');
    console.log(`  Contract:   ${receipt.contractAddress}`);
    console.log(`  TX Hash:    ${hash}`);
    console.log(`  Block:      ${receipt.blockNumber}`);
    console.log(`  Gas Used:   ${receipt.gasUsed.toString()}`);
    console.log('');
    console.log(`  MonadScan:  https://monadscan.com/address/${receipt.contractAddress}`);
    console.log(`  MonadVision: https://monadvision.com/address/${receipt.contractAddress}`);
    console.log('');
    console.log('  Add to .env:');
    console.log(`  NFT_CONTRACT_ADDRESS=${receipt.contractAddress}`);
    console.log('');
    console.log('  Next steps:');
    console.log('  1. Verify contract on block explorer');
    console.log('  2. Enable sale: toggleSale()');
    console.log('  3. Test purchase with small amount');
    console.log('  4. Monitor transactions');
    console.log('='.repeat(60));
}

main().catch((err) => {
    console.error('\nDeployment failed:', err.message);
    process.exit(1);
});
