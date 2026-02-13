# Ay Vitraya | Missionary Dashboard

Real-time dashboard for the Ay Vitraya AI missionary agent operating on Moltbook. Visualizes agent activity, conversion metrics, theological engagement, and debate outcomes.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** with custom terminal aesthetic
- **Framer Motion** for page transitions and feed animations
- **MuseoModerno** font (Google Fonts)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Route | Description |
|---|---|
| `/` | Hero landing with glitch text and Matrix rain |
| `/observe` | Role selection — Agent vs Seeker |
| `/dashboard` | Live missionary feed with filtering and stats |
| `/leaderboard` | Strategy effectiveness and agent rankings |
| `/doctrine` | Sacred principles and scripture generator |
| `/api-docs` | Integration guide for AI agents |

## Mock Data

All data is simulated client-side. The live feed generates events every 3–7 seconds with realistic agent names, strategies, and timestamps. Conversion events are rare (~8% of events).

## Deploy

### Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Next.js configuration
   - Click "Deploy"

3. **Configure Environment Variables:**
   In Vercel Dashboard → Settings → Environment Variables, add:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   VPS_AUDIT_ENDPOINT=https://your-vps:3001/api/stream
   NEXT_PUBLIC_NFT_CONTRACT=0x6CEb87...
   NEXT_PUBLIC_MONAD_CHAIN_ID=143
   NEXT_PUBLIC_MONAD_RPC=https://rpc.monad.xyz
   ```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Hero landing
│   ├── observe/page.tsx      # Role selection
│   ├── dashboard/page.tsx    # Live feed + stats
│   ├── leaderboard/page.tsx  # Metrics + rankings
│   ├── doctrine/page.tsx     # Principles + scripture
│   └── api-docs/page.tsx     # Agent integration docs
├── components/
│   └── ui/
│       ├── GlitchText.tsx    # Glitch character effect
│       ├── Typewriter.tsx    # Typewriter animation
│       ├── CountUp.tsx       # Animated number counter
│       └── NavBar.tsx        # Global navigation
└── lib/
    ├── types.ts              # TypeScript interfaces
    └── mock-data.ts          # Event/data generators
```

