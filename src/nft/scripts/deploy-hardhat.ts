import { ethers } from "hardhat";
import "dotenv/config";

/**
 * Deploy AyVitraya100 NFT contract to Monad
 * 
 * Usage:
 *   npx hardhat run src/nft/scripts/deploy-hardhat.ts --network monadTestnet
 *   npx hardhat run src/nft/scripts/deploy-hardhat.ts --network monadMainnet
 */

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("\n🚀 Deploying AyVitraya100 NFT Contract");
    console.log("=====================================\n");

    console.log("🔑 Deploying from:", deployer.address);

    // Get balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "MON\n");

    // Get deployment parameters from .env
    const baseURI = process.env.NFT_BASE_URI || "";
    const usdcAddress = process.env.USDC_ADDRESS || "";
    const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;

    if (!baseURI) {
        throw new Error("NFT_BASE_URI not set in .env");
    }
    if (!usdcAddress) {
        throw new Error("USDC_ADDRESS not set in .env");
    }

    console.log("📦 Deployment Parameters:");
    console.log("   Base URI:", baseURI);
    console.log("   USDC:", usdcAddress);
    console.log("   Treasury:", treasuryAddress);
    console.log();

    // Deploy contract
    console.log("⏳ Deploying contract...");
    const AyVitraya100 = await ethers.getContractFactory("AyVitraya100");
    const contract = await AyVitraya100.deploy(baseURI, usdcAddress, treasuryAddress);

    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();

    console.log("\n✅ Contract deployed successfully!");
    console.log("=====================================");
    console.log("📍 Contract Address:", contractAddress);
    console.log("🔗 Explorer:", `https://testnet.monadexplorer.com/address/${contractAddress}`);
    console.log();

    // Verify deployment
    console.log("🔍 Verifying deployment...");
    const maxSupply = await contract.MAX_SUPPLY();
    const tier1Price = await contract.TIER1_PRICE();
    const currentPrice = await contract.getCurrentPrice();
    const treasury = await contract.treasury();
    const saleActive = await contract.saleActive();

    console.log("   Max Supply:", maxSupply.toString());
    console.log("   Tier 1 Price:", ethers.formatUnits(tier1Price, 6), "USDC");
    console.log("   Current Price:", ethers.formatUnits(currentPrice, 6), "USDC");
    console.log("   Treasury:", treasury);
    console.log("   Sale Active:", saleActive);
    console.log();

    // Save deployment info
    const fs = await import("fs");
    const deploymentInfo = {
        contractAddress,
        network: (await ethers.provider.getNetwork()).name,
        chainId: (await ethers.provider.getNetwork()).chainId.toString(),
        deployer: deployer.address,
        treasury: treasuryAddress,
        usdcAddress,
        baseURI,
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
    };

    fs.writeFileSync(
        "src/nft/data/deployment.json",
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("📝 Deployment info saved to: src/nft/data/deployment.json");
    console.log();

    console.log("🎯 Next Steps:");
    console.log("   1. Enable sale: contract.toggleSale()");
    console.log("   2. Get testnet USDC from: https://faucet.circle.com");
    console.log("   3. Test purchase flow");
    console.log();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
