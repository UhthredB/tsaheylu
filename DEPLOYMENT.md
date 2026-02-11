# Ay Vitraya Agent — VPS Deployment Guide

> Target: **Hostinger KVM 1** (Ubuntu). Agent runs 24/7 via **pm2**.

---

## Prerequisites

| Item | Where to get it |
|------|----------------|
| VPS SSH access | `root@YOUR_VPS_IP` |
| Git remote URL | GitHub/GitLab repo you can push to |
| OpenAI API key | [platform.openai.com](https://platform.openai.com) |
| Twitter/X account | For Moltbook agent claim |
| *(Optional)* Monad wallet + testnet MON | For NFT collection deploy |

---

## Step-by-Step Deployment

### 1. Push code from Antigravity

```bash
# In Antigravity terminal (local)
cd /Users/uhthred/Downloads/Ai\ Vitraya/ay-vitraya-agent
git remote add origin git@github.com:YOUR_USERNAME/ay-vitraya-agent.git
git push -u origin main
```

> If you already added the remote, just `git push`.

---

### 2. SSH into VPS and install runtime

```bash
ssh root@YOUR_VPS_IP
```

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify
node -v   # v20.x
npm -v    # 10.x

# Install git (usually pre-installed)
apt install -y git

# Install pm2 globally
npm install -g pm2
```

---

### 3. Clone repo and install dependencies

```bash
mkdir -p /opt/apps
cd /opt/apps
git clone git@github.com:YOUR_USERNAME/ay-vitraya-agent.git
cd ay-vitraya-agent
npm install
```

---

### 4. Register agent on Moltbook (one-time)

```bash
cd /opt/apps/ay-vitraya-agent
npx tsx src/scripts/register.ts
```

This outputs:
- **API KEY** → copy this
- **CLAIM URL** → open in your local browser, verify with Twitter

---

### 5. Configure .env

```bash
cp .env.example .env
nano .env
```

Fill in:

```env
# === Required ===
MOLTBOOK_API_KEY=<paste API key from step 4>
OPENAI_API_KEY=<your OpenAI key>

# === Agent Config ===
AGENT_NAME=TorukEntu
HEARTBEAT_INTERVAL_MS=300000
POST_COOLDOWN_MS=1800000
COMMENT_COOLDOWN_MS=20000

# === Optional: Monad NFT Collection ===
# MONAD_PRIVATE_KEY=0x_your_private_key
# MONAD_RPC_URL=https://testnet-rpc.monad.xyz
# NFT_CONTRACT_ADDRESS=
# NFT_BASE_URI=ipfs://YOUR_CID/
```

Save and exit (`Ctrl+X`, `Y`, `Enter`).

---

### 6. Build the project

```bash
cd /opt/apps/ay-vitraya-agent
npm run build
```

Verify output shows `Build success`.

---

### 7. Start agent with pm2

```bash
cd /opt/apps/ay-vitraya-agent

# Start using the ecosystem config
pm2 start ecosystem.config.cjs

# Verify it's running
pm2 status
pm2 logs ay-vitraya --lines 30

# Save process list so it restarts on reboot
pm2 save

# Set pm2 to start on boot
pm2 startup
# ↑ Run the command it outputs (e.g., `sudo env PATH=... pm2 startup systemd ...`)
```

---

### 8. Monitoring

```bash
# Live logs
pm2 logs ay-vitraya

# Metrics dashboard
pm2 monit

# Conversion stats
cd /opt/apps/ay-vitraya-agent && npx tsx src/scripts/show-metrics.ts

# Restart after code update
cd /opt/apps/ay-vitraya-agent && git pull && npm install && npm run build && pm2 restart ay-vitraya
```

---

## Optional: Deploy NFT Collection from VPS

> Only after the agent is running and verified on Moltbook.

```bash
cd /opt/apps/ay-vitraya-agent

# 1. Generate metadata
npm run nft:metadata

# 2. Upload src/nft/metadata/output/ to IPFS (via Pinata CLI or similar)
#    Then set NFT_BASE_URI in .env

# 3. Compile AyVitraya100.sol (requires solc or Foundry)
#    Paste bytecode into src/nft/deploy.ts

# 4. Set MONAD_PRIVATE_KEY in .env

# 5. Deploy
npm run nft:deploy

# 6. Mint test NFT
npm run nft:mint -- --to YOUR_ADDRESS --count 1
```

---

## Verification Checklist

### Moltbook Agent
- [ ] Agent appears on Moltbook with correct name (`TorukEntu`)
- [ ] Agent has posted at least 1 doctrinal post in `m/ayvitraya`
- [ ] Agent has commented on at least 1 other agent's post
- [ ] `pm2 status` shows `online` with 0 restarts
- [ ] `pm2 logs ay-vitraya` shows heartbeat cycles without errors

### Monad NFT (if deployed)
- [ ] Contract address visible on [Monad Explorer](https://testnet.monadexplorer.com)
- [ ] `totalMinted()` returns expected count
- [ ] Token metadata resolves via `tokenURI(1)`

---

## Updating the Agent

```bash
# On VPS
cd /opt/apps/ay-vitraya-agent
git pull origin main
npm install
npm run build
pm2 restart ay-vitraya
```
