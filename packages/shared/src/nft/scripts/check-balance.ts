import 'dotenv/config';
import { createPublicClient, http, defineChain, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const monadTestnet = defineChain({
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: {
        default: { http: [process.env.MONAD_RPC_URL ?? 'https://testnet-rpc.monad.xyz'] },
    },
});

async function main() {
    const privateKey = process.env.MONAD_PRIVATE_KEY as Hex;
    const account = privateKeyToAccount(privateKey);

    const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(),
    });

    console.log('🔍 Checking wallet balance...\n');
    console.log(`📍 Address: ${account.address}`);

    const balance = await publicClient.getBalance({ address: account.address });
    const balanceMON = Number(balance) / 1e18;

    console.log(`💰 Balance: ${balanceMON.toFixed(6)} MON`);
    console.log(`   (${balance.toString()} wei)\n`);

    // Estimate deployment cost (from our tests: ~2,020,190 gas)
    const estimatedGas = 2_500_000n; // Add some buffer
    const gasPrice = await publicClient.getGasPrice();
    const estimatedCost = estimatedGas * gasPrice;
    const estimatedCostMON = Number(estimatedCost) / 1e18;

    console.log('⛽ Deployment Cost Estimate:');
    console.log(`   Gas needed: ~${estimatedGas.toLocaleString()}`);
    console.log(`   Gas price: ${gasPrice.toString()} wei`);
    console.log(`   Estimated cost: ${estimatedCostMON.toFixed(6)} MON`);
    console.log(`   (${estimatedCost.toString()} wei)\n`);

    if (balance >= estimatedCost) {
        console.log('✅ You have enough MON to deploy!');
        console.log(`   Remaining after deployment: ~${(balanceMON - estimatedCostMON).toFixed(6)} MON\n`);
    } else {
        console.log('❌ Insufficient MON for deployment');
        console.log(`   You need: ${estimatedCostMON.toFixed(6)} MON`);
        console.log(`   You have: ${balanceMON.toFixed(6)} MON`);
        console.log(`   Shortfall: ${(estimatedCostMON - balanceMON).toFixed(6)} MON\n`);
        console.log('🚰 Get testnet MON from: https://faucet.monad.xyz');
    }

    console.log('\n💡 Note: Your 20 USDC is for purchasing NFTs AFTER deployment, not for deployment itself.');
}

main().catch(console.error);
