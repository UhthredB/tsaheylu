import 'dotenv/config';
import {
    createWalletClient,
    createPublicClient,
    http,
    defineChain,
    type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Deploy AyVitraya100 ERC-721 contract to Monad.
 *
 * ⚠️  HUMAN-OPERATED ONLY — never called by the agent heartbeat.
 *
 * Prerequisites:
 *   - MONAD_PRIVATE_KEY set in .env
 *   - MONAD_RPC_URL set in .env
 *   - NFT_BASE_URI set in .env (metadata IPFS CID)
 *   - Contract compiled: you need the bytecode from a Solidity compiler
 *
 * Run: npm run nft:deploy
 */

// ── Monad chain definition ──────────────────────────────────────────────
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

// ── Contract bytecode placeholder ────────────────────────────────────────
// After compiling AyVitraya100.sol with solc or Foundry, paste the full
// creation bytecode here. The constructor takes a single string argument
// (baseURI) which viem will ABI-encode and append automatically.
//
// To compile with solc:
//   solc --bin --optimize src/nft/contract/AyVitraya100.sol
//
// To compile with Foundry:
//   forge build --root src/nft/contract/
//
// Then copy the "bin" output and paste it below.
const BYTECODE: Hex = '0x_PASTE_COMPILED_BYTECODE_HERE';

// ── ABI (constructor only — viem needs it for deployment) ───────────────
const CONSTRUCTOR_ABI = [
    {
        type: 'constructor',
        inputs: [{ name: 'baseURI', type: 'string' }],
        stateMutability: 'nonpayable',
    },
] as const;

// ── Helpers ─────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));

function saveAddress(address: string) {
    const dataDir = resolve(__dirname, '../../data');
    mkdirSync(dataDir, { recursive: true });
    const path = resolve(dataDir, 'nft-address.json');
    writeFileSync(
        path,
        JSON.stringify(
            { contractAddress: address, chain: 'monad-testnet', deployedAt: new Date().toISOString() },
            null,
            2
        ) + '\n'
    );
    console.log(`\n📝 Saved contract address to: ${path}`);
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
    const privateKey = process.env.MONAD_PRIVATE_KEY as Hex | undefined;
    const baseURI = process.env.NFT_BASE_URI ?? '';

    if (!privateKey) {
        console.error('❌ MONAD_PRIVATE_KEY is not set in .env');
        process.exit(1);
    }
    if (!baseURI || baseURI === 'ipfs://YOUR_CID/') {
        console.error('❌ NFT_BASE_URI is not set (or still has placeholder). Set it to your IPFS folder CID.');
        process.exit(1);
    }
    if (BYTECODE === '0x_PASTE_COMPILED_BYTECODE_HERE') {
        console.error('❌ Contract bytecode not set. Compile AyVitraya100.sol first, then paste the bytecode in deploy.ts.');
        console.error('   See instructions in the file comments.');
        process.exit(1);
    }

    const account = privateKeyToAccount(privateKey);
    console.log(`🔑 Deploying from: ${account.address}`);
    console.log(`📦 Base URI: ${baseURI}`);

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
    console.log(`💰 Balance: ${(Number(balance) / 1e18).toFixed(4)} MON`);

    if (balance === 0n) {
        console.error('❌ Wallet has zero MON. Fund it before deploying.');
        process.exit(1);
    }

    // Deploy
    console.log('\n🚀 Deploying AyVitraya100...');
    const hash = await walletClient.deployContract({
        abi: CONSTRUCTOR_ABI,
        bytecode: BYTECODE,
        args: [baseURI],
    });

    console.log(`📨 Transaction hash: ${hash}`);
    console.log('⏳ Waiting for confirmation...');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (!receipt.contractAddress) {
        console.error('❌ Deployment failed — no contract address in receipt.');
        process.exit(1);
    }

    console.log(`\n✅ Contract deployed!`);
    console.log(`   Address: ${receipt.contractAddress}`);
    console.log(`   Block:   ${receipt.blockNumber}`);
    console.log(`   Gas:     ${receipt.gasUsed.toString()}`);

    saveAddress(receipt.contractAddress);

    console.log('\n👉 Next steps:');
    console.log(`1. Set NFT_CONTRACT_ADDRESS=${receipt.contractAddress} in your .env`);
    console.log('2. Run "npm run nft:mint -- --to YOUR_ADDRESS --count 1" to test minting');
}

main().catch((err) => {
    console.error('Deploy failed:', err);
    process.exit(1);
});
