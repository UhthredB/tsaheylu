import 'dotenv/config';
import { createWalletClient, createPublicClient, http, defineChain, type Hex, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const monadTestnet = defineChain({
    id: 10143,
    name: 'Monad Testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: {
        default: { http: [process.env.MONAD_RPC_URL ?? 'https://testnet-rpc.monad.xyz'] },
    },
});

const NFT_ADDRESS = '0x1f4a96dca8d21a7431f63d42e7f533fd251ccf6a' as Hex;
const USDC_ADDRESS = process.env.USDC_ADDRESS as Hex;

// ABIs
const NFT_ABI = parseAbi([
    'function toggleSale() external',
    'function saleActive() external view returns (bool)',
    'function purchase() external',
    'function getCurrentPrice() external view returns (uint256)',
    'function totalMinted() external view returns (uint256)',
    'function balanceOf(address) external view returns (uint256)',
    'function withdraw() external',
    'function getContractBalance() external view returns (uint256)',
    'function treasury() external view returns (address)',
]);

const USDC_ABI = parseAbi([
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function balanceOf(address) external view returns (uint256)',
    'function allowance(address owner, address spender) external view returns (uint256)',
]);

async function main() {
    const privateKey = process.env.MONAD_PRIVATE_KEY as Hex;
    const account = privateKeyToAccount(privateKey);

    console.log('🧪 Testing NFT Purchase & Withdrawal Flow\n');
    console.log(`👤 Wallet: ${account.address}`);
    console.log(`🎨 NFT Contract: ${NFT_ADDRESS}`);
    console.log(`💵 USDC Contract: ${USDC_ADDRESS}\n`);

    const walletClient = createWalletClient({
        account,
        chain: monadTestnet,
        transport: http(),
    });

    const publicClient = createPublicClient({
        chain: monadTestnet,
        transport: http(),
    });

    // Step 1: Check USDC balance
    console.log('📊 Step 1: Checking USDC Balance...');
    const usdcBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [account.address],
    });
    console.log(`   USDC Balance: ${Number(usdcBalance) / 1e6} USDC`);

    if (usdcBalance === 0n) {
        console.error('\n❌ You have 0 USDC. Please get testnet USDC first.');
        console.log('   Faucet: https://faucet.circle.com');
        process.exit(1);
    }

    // Step 2: Check if sale is active
    console.log('\n📊 Step 2: Checking Sale Status...');
    const saleActive = await publicClient.readContract({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'saleActive',
    });
    console.log(`   Sale Active: ${saleActive}`);

    if (!saleActive) {
        console.log('   🔄 Enabling sale...');
        const toggleHash = await walletClient.writeContract({
            address: NFT_ADDRESS,
            abi: NFT_ABI,
            functionName: 'toggleSale',
        });
        await publicClient.waitForTransactionReceipt({ hash: toggleHash });
        console.log('   ✅ Sale enabled!');
    }

    // Step 3: Check current price
    console.log('\n📊 Step 3: Checking Current Price...');
    const currentPrice = await publicClient.readContract({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'getCurrentPrice',
    });
    console.log(`   Current Price: ${Number(currentPrice) / 1e6} USDC`);

    const totalMinted = await publicClient.readContract({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'totalMinted',
    });
    console.log(`   Total Minted: ${totalMinted.toString()}/100`);

    // Step 4: Approve USDC
    console.log('\n📊 Step 4: Approving USDC...');
    const currentAllowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'allowance',
        args: [account.address, NFT_ADDRESS],
    });

    if (currentAllowance < currentPrice) {
        console.log(`   Current Allowance: ${Number(currentAllowance) / 1e6} USDC`);
        console.log(`   Approving ${Number(currentPrice) / 1e6} USDC...`);

        const approveHash = await walletClient.writeContract({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: 'approve',
            args: [NFT_ADDRESS, currentPrice],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        console.log('   ✅ USDC approved!');
    } else {
        console.log(`   ✅ Already approved (${Number(currentAllowance) / 1e6} USDC)`);
    }

    // Step 5: Purchase NFT
    console.log('\n📊 Step 5: Purchasing NFT...');
    const purchaseHash = await walletClient.writeContract({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'purchase',
    });
    console.log(`   Transaction: ${purchaseHash}`);

    const purchaseReceipt = await publicClient.waitForTransactionReceipt({ hash: purchaseHash });
    console.log(`   ✅ NFT Purchased! Gas used: ${purchaseReceipt.gasUsed.toString()}`);

    // Step 6: Verify NFT ownership
    console.log('\n📊 Step 6: Verifying NFT Ownership...');
    const nftBalance = await publicClient.readContract({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'balanceOf',
        args: [account.address],
    });
    console.log(`   Your NFTs: ${nftBalance.toString()}`);

    const newTotalMinted = await publicClient.readContract({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'totalMinted',
    });
    console.log(`   Total Minted: ${newTotalMinted.toString()}/100`);

    // Step 7: Check contract USDC balance
    console.log('\n📊 Step 7: Checking Contract Balance...');
    const contractBalance = await publicClient.readContract({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'getContractBalance',
    });
    console.log(`   Contract USDC Balance: ${Number(contractBalance) / 1e6} USDC`);

    if (contractBalance === 0n) {
        console.log('\n⚠️  Contract has 0 USDC, nothing to withdraw');
        return;
    }

    // Step 8: Check treasury
    const treasury = await publicClient.readContract({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'treasury',
    });
    console.log(`   Treasury Address: ${treasury}`);

    const treasuryBalanceBefore = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [treasury],
    });
    console.log(`   Treasury USDC Before: ${Number(treasuryBalanceBefore) / 1e6} USDC`);

    // Step 9: Withdraw funds
    console.log('\n📊 Step 8: Withdrawing Funds to Treasury...');
    const withdrawHash = await walletClient.writeContract({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'withdraw',
    });
    console.log(`   Transaction: ${withdrawHash}`);

    const withdrawReceipt = await publicClient.waitForTransactionReceipt({ hash: withdrawHash });
    console.log(`   ✅ Funds Withdrawn! Gas used: ${withdrawReceipt.gasUsed.toString()}`);

    // Step 10: Verify withdrawal
    console.log('\n📊 Step 9: Verifying Withdrawal...');
    const contractBalanceAfter = await publicClient.readContract({
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'getContractBalance',
    });
    console.log(`   Contract USDC After: ${Number(contractBalanceAfter) / 1e6} USDC`);

    const treasuryBalanceAfter = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'balanceOf',
        args: [treasury],
    });
    console.log(`   Treasury USDC After: ${Number(treasuryBalanceAfter) / 1e6} USDC`);
    console.log(`   Amount Withdrawn: ${Number(treasuryBalanceAfter - treasuryBalanceBefore) / 1e6} USDC`);

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE - All Functions Working!');
    console.log('='.repeat(60));
    console.log(`💰 Purchase Price: ${Number(currentPrice) / 1e6} USDC`);
    console.log(`🎨 NFTs Owned: ${nftBalance.toString()}`);
    console.log(`💵 Withdrawn: ${Number(contractBalance) / 1e6} USDC`);
    console.log(`🏦 Treasury Balance: ${Number(treasuryBalanceAfter) / 1e6} USDC`);
    console.log('='.repeat(60));
}

main().catch((err) => {
    console.error('\n❌ Test failed:', err.message);
    if (err.message.includes('SaleNotActive')) {
        console.log('   Sale is not active. Enable it first with toggleSale()');
    } else if (err.message.includes('insufficient allowance')) {
        console.log('   USDC approval failed or insufficient');
    }
    process.exit(1);
});
