# 🚀 Mainnet Deployment - Quick Start

## Prerequisites Checklist

- [ ] **Metadata uploaded to IPFS** (all 100 files)
- [ ] **IPFS pinned** on paid service (Pinata/NFT.Storage)
- [ ] **MAINNET_PRIVATE_KEY** set in .env
- [ ] **Treasury address** decided (preferably multisig)
- [ ] **Network selected** and funded with gas
- [ ] **Read MAINNET_DEPLOYMENT.md** completely

## 5-Minute Deploy (If everything ready)

### Step 1: Final Verification (2 min)
```bash
cd "/Users/uhthred/Downloads/Ai Vitraya/ay-vitraya-agent"

# Test metadata exists
curl https://ipfs.io/ipfs/YOUR_CID/1.json
curl https://ipfs.io/ipfs/YOUR_CID/100.json

# Verify you have gas
# (Check wallet on block explorer)
```

### Step 2: Deploy (3 min)
```bash
# Set environment variables
export MAINNET_PRIVATE_KEY="0x..."  # Your private key
export NFT_BASE_URI="ipfs://YOUR_CID/"  # Must end with /

# Run deployment script
npx tsx src/nft/scripts/deploy-mainnet.ts

# Follow prompts:
# 1. Select network (1-4)
# 2. Enter treasury address
# 3. Verify all parameters
# 4. Type "DEPLOY TO MAINNET"
# 5. Wait for confirmation
```

### Step 3: Verify (<1 min)
```bash
# Verify deployment (replace with your contract address)
npx tsx src/nft/scripts/verify-deployment.ts <CONTRACT_ADDRESS> <NETWORK>

# Example:
npx tsx src/nft/scripts/verify-deployment.ts 0x123... ethereum
```

### Step 4: Enable Sale
```bash
# When ready to start selling
cast send <CONTRACT_ADDRESS> "toggleSale()" \
  --rpc-url <RPC_URL> \
  --private-key $MAINNET_PRIVATE_KEY

# Check sale is active
cast call <CONTRACT_ADDRESS> "saleActive()" --rpc-url <RPC_URL>
# Should return: true
```

### Step 5: Test Purchase
```bash
# Test with your own wallet first
# 1. Approve USDC
cast send <USDC_ADDRESS> "approve(address,uint256)" \
  <CONTRACT_ADDRESS> 10000000 \
  --rpc-url <RPC_URL> \
  --private-key $MAINNET_PRIVATE_KEY

# 2. Purchase NFT
cast send <CONTRACT_ADDRESS> "purchase()" \
  --rpc-url <RPC_URL> \
  --private-key $MAINNET_PRIVATE_KEY
```

## Emergency Commands

### Pause Contract (If something goes wrong)
```bash
npx tsx src/nft/scripts/emergency-pause.ts <CONTRACT_ADDRESS> <NETWORK>
```

### Withdraw Funds
```bash
cast send <CONTRACT_ADDRESS> "withdraw()" \
  --rpc-url <RPC_URL> \
  --private-key $MAINNET_PRIVATE_KEY
```

### Update Metadata (If needed)
```bash
cast send <CONTRACT_ADDRESS> "setBaseURI(string)" \
  "ipfs://NEW_CID/" \
  --rpc-url <RPC_URL> \
  --private-key $MAINNET_PRIVATE_KEY
```

## RPC URLs

### Mainnets
- **Ethereum**: `https://eth.llamarpc.com`
- **Polygon**: `https://polygon-rpc.com`
- **Arbitrum**: `https://arb1.arbitrum.io/rpc`
- **Base**: `https://mainnet.base.org`

### USDC Addresses
- **Ethereum**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **Polygon**: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- **Arbitrum**: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- **Base**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## Post-Deployment Checklist

- [ ] Contract address saved
- [ ] Verified on block explorer
- [ ] Test purchase completed
- [ ] Monitoring setup (Tenderly)
- [ ] Community announcement prepared
- [ ] Emergency procedures documented
- [ ] Watching transactions actively

## 🚨 If Something Goes Wrong

1. **PAUSE IMMEDIATELY**: `npx tsx src/nft/scripts/emergency-pause.ts ...`
2. **Assess the situation**
3. **Contact community**
4. **Withdraw funds if at risk**
5. **Investigate before resuming**

## 📱 Monitoring Tools

- **Tenderly**: https://tenderly.co (Free tier available)
- **Block Explorer**: Check transactions manually
- **Discord/Twitter**: Monitor community feedback

## Support

If you need help:
1. Check MAINNET_DEPLOYMENT.md
2. Review test results from testnet
3. Consult Solidity documentation
4. Seek help from community (after deployment)

---

**Remember**: This deploys an IMMUTABLE contract to MAINNET with REAL MONEY at stake.

**Triple-check everything before proceeding.**
