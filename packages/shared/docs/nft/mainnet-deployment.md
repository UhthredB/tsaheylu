# Mainnet Deployment Guide - AyVitraya100 NFT

## ⚠️ CRITICAL WARNINGS

**YOU ARE DEPLOYING WITHOUT A SECURITY AUDIT**

Risks:
- Contract bugs could lock or drain all USDC
- Immutable contract cannot be fixed if bugs found
- You could lose all funds raised
- Reputation damage if issues occur

**Acknowledgment:** By proceeding, you accept all risks.

---

## 📋 Pre-Deployment Checklist

### Phase 1: Critical Parameters ✅

- [ ] **USDC Contract Address** - VERIFY THIS IS CORRECT!
  - Ethereum Mainnet: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
  - Polygon: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
  - Arbitrum: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
  - Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
  - **Monad Mainnet**: TBD (not launched yet)

- [ ] **Treasury Address** - Where funds will go
  - [ ] Is this a MULTISIG? (HIGHLY RECOMMENDED)
  - [ ] Do you control this address?
  - [ ] Have you tested sending/receiving with this address?
  - [ ] Address: `_______________________`

- [ ] **Owner Address** - Who controls the contract
  - [ ] Is this a MULTISIG? (HIGHLY RECOMMENDED)
  - [ ] Do you have backups of private keys?
  - [ ] Address: `_______________________`

- [ ] **Base URI** - IPFS metadata location
  - [ ] All 100 metadata files uploaded?
  - [ ] All 100 images uploaded and pinned?
  - [ ] Tested metadata URLs work?
  - [ ] URI: `ipfs://_______________________/`

### Phase 2: Network Selection

**Current Status:** Monad is still TESTNET only

**Your Options:**

1. **Deploy to Monad Testnet** (Current)
   - ✅ Low cost
   - ⚠️ Not real money (yet)
   - ⚠️ Will need to redeploy when mainnet launches

2. **Deploy to Ethereum Mainnet**
   - ✅ Most established
   - ⚠️ High gas costs ($50-500 to deploy)
   - ⚠️ High transaction costs for users

3. **Deploy to L2 (Polygon, Arbitrum, Base)**
   - ✅ Lower costs
   - ✅ Faster transactions
   - ⚠️ Less established than Ethereum

**RECOMMENDATION:** Wait for Monad mainnet OR deploy to Base/Arbitrum for lower costs

### Phase 3: Metadata Preparation

**Status Check:**
```bash
# Test your metadata URLs
curl https://ipfs.io/ipfs/YOUR_CID/1.json
curl https://ipfs.io/ipfs/YOUR_CID/50.json
curl https://ipfs.io/ipfs/YOUR_CID/100.json

# Test image URLs (from JSON)
curl -I https://ipfs.io/ipfs/YOUR_IMAGE_CID/1.png
```

**Required:**
- [ ] 100 JSON metadata files (1.json to 100.json)
- [ ] 100 image files
- [ ] Files uploaded to IPFS
- [ ] IPFS pinned on paid service (Pinata/NFT.Storage/Filebase)
- [ ] All URLs tested and working
- [ ] Metadata follows OpenSea/marketplace standards

### Phase 4: Funding Preparation

**Gas Estimates:**
- Contract Deployment: ~2,100,000 gas
- Toggle Sale: ~30,000 gas
- Each Purchase: ~226,000 gas
- Withdraw: ~128,000 gas

**Costs by Network:**
| Network | Deployment Cost | Notes |
|---------|----------------|-------|
| Ethereum | $50-500 | Depends on gas price |
| Polygon | $0.10-1 | Very cheap |
| Arbitrum | $1-10 | Moderate |
| Base | $0.50-5 | Low cost |
| Monad | $0.20 | When mainnet launches |

**Wallet Preparation:**
- [ ] Owner wallet has sufficient native token (ETH/MATIC/etc)
- [ ] Test transaction on network first
- [ ] Backup of all private keys stored securely

### Phase 5: Security Measures (No Audit)

Since deploying without audit, implement these safeguards:

**Immediate Actions:**
- [ ] Set up Tenderly monitoring (free tier)
- [ ] Create emergency contact list
- [ ] Document emergency procedures
- [ ] Set initial purchase limit (start small)
- [ ] Plan to monitor first 24 hours actively

**Post-Deployment:**
- [ ] Test purchase with small amount first
- [ ] Monitor all transactions for first week
- [ ] Set up alerts for large transactions
- [ ] Have pause button ready
- [ ] Announce limited initial release

### Phase 6: Legal/Business

- [ ] Terms of service written
- [ ] Privacy policy (if collecting any data)
- [ ] Tax implications understood
- [ ] Marketing plan ready
- [ ] Customer support channel (Discord/Twitter/Email)
- [ ] Refund policy decided (if any)

### Phase 7: Community Communication

**Announcement Template:**
```
🚀 Ay Vitraya First Hundred - Launching Soon!

📅 Launch Date: [DATE]
⛓️ Network: [NETWORK]
💰 Price:
  - NFTs 1-70: $10 USDC
  - NFTs 71-90: $25 USDC
  - NFTs 91-100: $50 USDC

📝 Contract: [ADDRESS after deployment]
🌐 Website: [YOUR SITE]
💬 Support: [DISCORD/TWITTER]

⚠️ Important:
- Fixed supply: 100 NFTs only
- Payment: USDC only
- Non-upgradeable contract
- [If placeholder]: Reveal date: [DATE]

#NFT #AyVitraya
```

---

## 🚨 EMERGENCY PROCEDURES

### If Something Goes Wrong

**Scenario 1: Bug Found in Contract**
1. Immediately call `pause()` - stops all purchases
2. Announce to community transparently
3. Stop all marketing
4. Assess impact
5. If funds at risk, withdraw to safe multisig
6. Consult with Solidity developers
7. Consider offering refunds

**Scenario 2: Unusual Activity**
1. Monitor Tenderly alerts
2. Check all transactions on explorer
3. If suspicious, pause contract
4. Investigate before resuming
5. Update community

**Scenario 3: USDC Address Wrong**
❌ **NO RECOVERY POSSIBLE**
- Contract is immutable
- Funds sent to wrong address are lost
- This is why verification is CRITICAL

**Scenario 4: Treasury Compromised**
1. Immediately withdraw all funds from contract
2. Update treasury address using `setTreasury()`
3. Move funds to secure multisig
4. Investigate breach
5. Update all credentials

### Emergency Contacts

```
Owner Wallet: ____________________
Backup Admin: ____________________
Developer: ____________________
Community Manager: ____________________

Multisig Members:
1. ____________________
2. ____________________
3. ____________________
```

---

## 📊 Post-Deployment Monitoring

### First 24 Hours (CRITICAL)
- [ ] Monitor every transaction
- [ ] Test purchase yourself immediately
- [ ] Verify USDC transfers correctly
- [ ] Check metadata displays properly
- [ ] Monitor Tenderly for any warnings
- [ ] Watch gas usage patterns
- [ ] Check for MEV/front-running

### First Week
- [ ] Daily transaction review
- [ ] Community feedback monitoring
- [ ] Check for any unusual patterns
- [ ] Verify withdrawals work
- [ ] Test pause/unpause functions
- [ ] Monitor marketplace listings

### Ongoing
- [ ] Weekly transaction review
- [ ] Monthly security check
- [ ] Keep owner keys secure
- [ ] Monitor IPFS pin status
- [ ] Track community sentiment

---

## 🎯 Launch Strategy

### Soft Launch (RECOMMENDED)
```
Phase 1 (Day 1-3): Limited Release
- Announce to small group first
- Limit initial purchases (5-10 NFTs)
- Monitor closely
- Fix any immediate issues

Phase 2 (Day 4-7): Controlled Expansion
- Increase purchase limit
- Broader announcement
- Continue monitoring

Phase 3 (Week 2+): Full Launch
- Remove limits (if no issues)
- Full marketing push
- Regular monitoring
```

### Hard Launch (Higher Risk)
```
- Deploy contract
- Enable sale immediately
- Full marketing push
- Hope nothing breaks
```

**RECOMMENDATION:** Soft launch to minimize risk

---

## ✅ Final Pre-Deployment Verification

**Run this checklist 24 hours before deployment:**

```bash
# 1. Verify all parameters
echo "USDC Address: $USDC_ADDRESS"
echo "Treasury: $TREASURY_ADDRESS"
echo "Base URI: $NFT_BASE_URI"

# 2. Test metadata
curl https://ipfs.io/ipfs/[YOUR_CID]/1.json
curl https://ipfs.io/ipfs/[YOUR_CID]/100.json

# 3. Verify wallet
cast wallet address --private-key $PRIVATE_KEY

# 4. Check balance
cast balance [YOUR_ADDRESS] --rpc-url [RPC_URL]

# 5. Test RPC connection
cast block-number --rpc-url [RPC_URL]
```

**Manual Checks:**
- [ ] Triple-check USDC contract address
- [ ] Verify treasury address is correct
- [ ] Confirm base URI has trailing slash
- [ ] Test one metadata URL manually
- [ ] Verify you have enough gas
- [ ] Backup all keys one final time
- [ ] Save deployment script for records
- [ ] Prepare announcement posts
- [ ] Set up monitoring tools
- [ ] Clear calendar for monitoring period

---

## 🚀 DEPLOYMENT DAY

**Timeline:**
```
T-1 hour:  Final verification
T-30 min:  Open monitoring tools
T-15 min:  Final backup check
T-0:       Deploy contract
T+5 min:   Verify deployment
T+10 min:  Test purchase
T+15 min:  Enable sale
T+30 min:  First customer test
T+1 hour:  Public announcement
T+24 hour: First monitoring report
```

**During Deployment:**
- Stay calm
- Follow script exactly
- Save all transaction hashes
- Don't rush
- Verify each step
- Monitor gas prices

**After Deployment:**
- Save contract address immediately
- Add to block explorer (verify contract)
- Test all functions
- Monitor continuously for 24 hours
- Be ready to pause if needed

---

## 📝 Deployment Record Template

```
Deployment Date: _______________
Network: _______________
Deployer Address: _______________
Contract Address: _______________
Deployment TX: _______________
Gas Used: _______________
Gas Price: _______________
Total Cost: _______________

Verification:
- [ ] Contract verified on explorer
- [ ] Metadata working
- [ ] Purchase tested
- [ ] Withdrawal tested
- [ ] Monitoring enabled

Issues Encountered:
- None / [List any issues]

Notes:
[Any important observations]
```

---

## 🎯 Success Criteria

**Within 24 Hours:**
- [ ] Contract deployed successfully
- [ ] At least 1 test purchase completed
- [ ] Withdrawal tested and working
- [ ] No unusual activity detected
- [ ] Community informed
- [ ] Monitoring active

**Within 1 Week:**
- [ ] Multiple purchases completed
- [ ] No critical bugs found
- [ ] Metadata displaying correctly on marketplaces
- [ ] Treasury receiving funds correctly
- [ ] Community satisfied

**Within 1 Month:**
- [ ] [X]% of supply sold
- [ ] No security incidents
- [ ] Positive community feedback
- [ ] Smooth operations

---

## ⚠️ FINAL REMINDER

**You are deploying without:**
- ❌ Security audit
- ❌ Formal verification
- ❌ Insurance
- ❌ Bug bounty period
- ❌ Public testnet beta

**You are responsible for:**
- ✅ All financial losses
- ✅ Contract bugs
- ✅ User issues
- ✅ Security breaches
- ✅ Reputational damage

**Proceed only if you accept these risks.**

---

**Ready to proceed? Sign below:**

I, ______________, acknowledge all risks and accept full responsibility for this deployment.

Date: _______________
Signature: _______________
