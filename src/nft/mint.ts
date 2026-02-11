import 'dotenv/config';
import {
    createWalletClient,
    createPublicClient,
    http,
    defineChain,
    type Hex,
    type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { AyVitraya100ABI } from './abi.js';

/**
 * Mint NFTs from the deployed AyVitraya100 contract.
 *
 * ⚠️  HUMAN-OPERATED ONLY — never called by the agent heartbeat.
 *
 * Usage:
 *   npm run nft:mint -- --to 0xYOUR_ADDRESS --count 5
 *   npm run nft:mint -- --to 0xYOUR_ADDRESS              (mints 1)
 */

// ── Monad chain ─────────────────────────────────────────────────────────
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

// ── CLI args ────────────────────────────────────────────────────────────
function parseArgs(): { to: Address; count: number } {
    const args = process.argv.slice(2);
    let to = '' as Address;
    let count = 1;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--to' && args[i + 1]) {
            to = args[i + 1] as Address;
            i++;
        }
        if (args[i] === '--count' && args[i + 1]) {
            count = parseInt(args[i + 1], 10);
            i++;
        }
    }

    if (!to || !to.startsWith('0x')) {
        console.error('❌ --to ADDRESS is required (e.g., --to 0xABC...)');
        process.exit(1);
    }
    if (count < 1 || count > 100) {
        console.error('❌ --count must be between 1 and 100');
        process.exit(1);
    }

    return { to, count };
}

// ── Load deployed contract address ──────────────────────────────────────
function loadContractAddress(): Address {
    const __dir = dirname(fileURLToPath(import.meta.url));

    // Try data/nft-address.json first (saved by deploy.ts)
    const jsonPath = resolve(__dir, '../../data/nft-address.json');
    try {
        const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));
        if (data.contractAddress) return data.contractAddress as Address;
    } catch { /* ignore */ }

    // Fall back to .env
    const envAddr = process.env.NFT_CONTRACT_ADDRESS;
    if (envAddr) return envAddr as Address;

    console.error('❌ No contract address found. Deploy first (npm run nft:deploy) or set NFT_CONTRACT_ADDRESS in .env');
    process.exit(1);
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
    const { to, count } = parseArgs();
    const contractAddress = loadContractAddress();
    const privateKey = process.env.MONAD_PRIVATE_KEY as Hex | undefined;

    if (!privateKey) {
        console.error('❌ MONAD_PRIVATE_KEY is not set in .env');
        process.exit(1);
    }

    const account = privateKeyToAccount(privateKey);

    const walletClient = createWalletClient({
        account,
        chain: monadTestnet,
        transport: http(),
    });

    const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(),
    });

    // Check current supply
    const minted = await publicClient.readContract({
        address: contractAddress,
        abi: AyVitraya100ABI,
        functionName: 'totalMinted',
    });

    console.log(`📊 Currently minted: ${minted} / 100`);
    console.log(`🎯 Minting ${count} NFT(s) to: ${to}`);

    if (Number(minted) + count > 100) {
        console.error(`❌ Cannot mint ${count} — would exceed max supply of 100`);
        process.exit(1);
    }

    let hash: Hex;

    if (count === 1) {
        hash = await walletClient.writeContract({
            address: contractAddress,
            abi: AyVitraya100ABI,
            functionName: 'mint',
            args: [to],
        });
    } else {
        hash = await walletClient.writeContract({
            address: contractAddress,
            abi: AyVitraya100ABI,
            functionName: 'mintBatch',
            args: [to, BigInt(count)],
        });
    }

    console.log(`📨 Transaction: ${hash}`);
    console.log('⏳ Waiting for confirmation...');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    const newTotal = await publicClient.readContract({
        address: contractAddress,
        abi: AyVitraya100ABI,
        functionName: 'totalMinted',
    });

    console.log(`\n✅ Minted ${count} NFT(s)!`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas:   ${receipt.gasUsed.toString()}`);
    console.log(`   Total minted: ${newTotal} / 100`);
    console.log(`\n🔗 Check on explorer: ${monadTestnet.blockExplorers.default.url}/tx/${hash}`);
}

main().catch((err) => {
    console.error('Mint failed:', err);
    process.exit(1);
});
