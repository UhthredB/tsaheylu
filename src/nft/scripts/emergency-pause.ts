import 'dotenv/config';
import { createWalletClient, createPublicClient, http, type Hex, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, polygon, arbitrum, base } from 'viem/chains';

/**
 * EMERGENCY PAUSE SCRIPT
 *
 * Use this to immediately pause the contract if something goes wrong.
 *
 * Usage:
 *   npx tsx src/nft/scripts/emergency-pause.ts <contract-address> <network>
 *
 * Example:
 *   npx tsx src/nft/scripts/emergency-pause.ts 0x123... ethereum
 */

const NETWORKS = {
    ethereum: mainnet,
    polygon,
    arbitrum,
    base,
};

const ABI = parseAbi([
    'function pause() external',
    'function unpause() external',
    'function paused() external view returns (bool)',
    'function owner() external view returns (address)',
]);

async function main() {
    const contractAddress = process.argv[2] as Hex;
    const networkName = process.argv[3] as keyof typeof NETWORKS;

    if (!contractAddress || !networkName) {
        console.error('Usage: npx tsx emergency-pause.ts <contract-address> <network>');
        console.error('Networks: ethereum, polygon, arbitrum, base');
        process.exit(1);
    }

    const chain = NETWORKS[networkName];
    if (!chain) {
        console.error(`Invalid network: ${networkName}`);
        process.exit(1);
    }

    const privateKey = process.env.MAINNET_PRIVATE_KEY as Hex;
    if (!privateKey) {
        console.error('❌ MAINNET_PRIVATE_KEY not set');
        process.exit(1);
    }

    const account = privateKeyToAccount(privateKey);

    console.log('🚨 EMERGENCY PAUSE');
    console.log('═'.repeat(50));
    console.log(`Network: ${chain.name}`);
    console.log(`Contract: ${contractAddress}`);
    console.log(`Your Address: ${account.address}\n`);

    const walletClient = createWalletClient({
        account,
        chain,
        transport: http(),
    });

    const publicClient = createPublicClient({
        chain,
        transport: http(),
    });

    // Check current status
    console.log('Checking contract status...');

    const isPaused = await publicClient.readContract({
        address: contractAddress,
        abi: ABI,
        functionName: 'paused',
    });

    const owner = await publicClient.readContract({
        address: contractAddress,
        abi: ABI,
        functionName: 'owner',
    });

    console.log(`Current Status: ${isPaused ? '⏸️  PAUSED' : '▶️  ACTIVE'}`);
    console.log(`Owner: ${owner}\n`);

    if (account.address.toLowerCase() !== owner.toLowerCase()) {
        console.error('❌ You are not the owner of this contract!');
        console.error(`   Owner: ${owner}`);
        console.error(`   You: ${account.address}`);
        process.exit(1);
    }

    if (isPaused) {
        console.log('⚠️  Contract is already paused.');
        console.log('Do you want to UNPAUSE? (y/n)');
        // For emergency use, we'll just pause
        console.log('\nTo unpause, use: cast send ' + contractAddress + ' "unpause()"');
        process.exit(0);
    }

    // Pause the contract
    console.log('🚨 PAUSING CONTRACT...\n');

    try {
        const hash = await walletClient.writeContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'pause',
        });

        console.log(`Transaction: ${hash}`);
        console.log('Waiting for confirmation...\n');

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        console.log('✅ CONTRACT PAUSED SUCCESSFULLY!');
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Gas: ${receipt.gasUsed.toString()}\n`);

        console.log('⏸️  All purchases are now stopped.');
        console.log('💡 To unpause:');
        console.log(`   cast send ${contractAddress} "unpause()" --rpc-url <rpc> --private-key $MAINNET_PRIVATE_KEY`);

    } catch (error: any) {
        console.error('❌ Failed to pause contract:');
        console.error(error.message);
        process.exit(1);
    }
}

main().catch(console.error);
