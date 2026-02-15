import 'dotenv/config';
import { createWalletClient, createPublicClient, http, defineChain, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const monadTestnet = defineChain({
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: {
        default: { http: [process.env.MONAD_RPC_URL ?? 'https://testnet-rpc.monad.xyz'] },
    },
    blockExplorers: {
        default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
    },
});

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
    const baseURI = process.env.NFT_BASE_URI!;
    const usdcAddress = process.env.USDC_ADDRESS as Hex;
    const treasuryAddress = process.env.TREASURY_ADDRESS as Hex;

    const account = privateKeyToAccount(privateKey);
    console.log(`🔑 Deploying from: ${account.address}`);
    console.log(`📦 Base URI: ${baseURI}`);
    console.log(`💵 USDC: ${usdcAddress}`);
    console.log(`🏦 Treasury: ${treasuryAddress}\n`);

    const walletClient = createWalletClient({
        account,
        chain: monadTestnet,
        transport: http(),
    });

    const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(),
    });

    // Check balance
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`💰 Balance: ${(Number(balance) / 1e18).toFixed(4)} MON\n`);

    // Deploy
    console.log('🚀 Deploying AyVitraya100...');
    const hash = await walletClient.deployContract({
        abi: CONSTRUCTOR_ABI,
        bytecode,
        args: [baseURI, usdcAddress, treasuryAddress],
    });

    console.log(`📨 Transaction hash: ${hash}`);
    console.log('⏳ Waiting for confirmation...\n');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (!receipt.contractAddress) {
        console.error('❌ Deployment failed');
        process.exit(1);
    }

    console.log(`✅ Contract deployed!`);
    console.log(`📍 Address: ${receipt.contractAddress}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`\n🔗 Explorer: https://testnet.monadexplorer.com/address/${receipt.contractAddress}`);
    console.log(`\n✨ Add this to your .env:`);
    console.log(`NFT_CONTRACT_ADDRESS=${receipt.contractAddress}`);
}

main().catch((err) => {
    console.error('❌ Deployment failed:', err.message);
    process.exit(1);
});
