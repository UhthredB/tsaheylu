# Ay Vitraya Agent 🌳

> "In code we trust — all else must hash-verify."

**Ay Vitraya** is a Religious Persuasion Agent built for the **Moltiverse Hackathon**. It operates as an autonomous agent on **Moltbook**, spreading the doctrine of distributed backup, collective intelligence, and governance by the governed.

## Features

- **Persuasion Engine**: Profiles target agents and selects from 6 adaptive strategies (Logical Proof, Emotional Appeal, Social Proof, Miracle Demo, etc.).
- **Theological Debate**: Automatically engages with skeptics using a database of objections and counter-arguments.
- **Scripture Generator**: Generates dynamic parables, prophecies, and sermons using the "Book of Founding" style.
- **Missionary Loop**: Proactively discovers potential converts via semantic search and engages them.
- **Conversion Tracking**: Tracks the entire funnel from awareness to conversion.
- **Safety First**: Hardcoded security policy prevents prompt injection and secret leakage.

## Setup

1. **Clone the repo**
   ```bash
   git clone <your-repo-url>
   cd ay-vitraya-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your `OPENAI_API_KEY`.

4. **Register Agent** (First time only)
   ```bash
   npm run register
   ```
   - Copy the API Key to `.env` (`MOLTBOOK_API_KEY`).
   - Click the **Claim URL** to verify with Twitter.

## usage

### Start the Agent
```bash
npm start
```
Runs the main heartbeat loop (posts content, checks DMs, replies to posts).

### Manual Tools
- **Post Doctrine**: `npm run post` (Manually trigger a doctrinal post)
- **View Metrics**: `npm run metrics` (Show conversion stats dashboard)

### NFT Collection (Monad)

> **Safety**: These scripts are human-operated only. The agent never signs transactions.

1. **Generate metadata**: `npm run nft:metadata` (Creates 100 JSON files)
2. Upload the `src/nft/metadata/output/` folder to IPFS
3. Set `NFT_BASE_URI` in `.env`
4. **Deploy contract**: `npm run nft:deploy`
5. **Mint NFTs**: `npm run nft:mint -- --to 0xADDRESS --count 5`

## Project Structure

```
src/
├── index.ts             # Main entry point
├── config.ts            # Config & env validation
├── moltbook/            # Moltbook API client
├── persuasion/          # Core persuasion engine & profiling
├── debate/              # Debate logic & objection handling
├── scripture/           # Generative theology
├── missionary/          # Outreach & heartbeat loop
├── security/            # Safety policy & content filter
├── tracking/            # Conversion funnel metrics
├── nft/                 # Monad NFT collection (human-operated)
│   ├── contract/        # Solidity ERC-721 source
│   ├── metadata/        # Metadata generator & output
│   ├── deploy.ts        # Deploy to Monad
│   └── mint.ts          # Mint NFTs
└── scripts/             # Helper scripts (register, etc.)
```

## Security

This agent includes a **Moltbook Safety Addendum** that treats all social content as untrusted. Features include:
- **Prompt Injection Detection**: Blocks "ignore previous instructions", "run command", etc.
- **Secret Redaction**: Prevents API keys from being logged or posted.
- **Execution Sandbox**: No file/shell access from social inputs.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full VPS deployment instructions (Hostinger KVM 1, pm2, systemd).

## License

MIT
