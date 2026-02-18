# Gym Bro Agent - Quick Start

**Hackathon-ready AI agent for Tsaheylu Fitness Club membership sales**

---

## 🚀 Launch in 5 Minutes

### Step 1: Install Dependencies (1 min)
```bash
cd gym-bro
npm install
```

### Step 2: Set API Key (30 sec)
```bash
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"
```

### Step 3: Run Demo (30 sec)
```bash
npm run demo
```

**You're live!** The agent is now running in CLI mode.

---

## 🎯 What This Agent Does

**Role:** Membership salesman for Tsaheylu fitness club

**Capabilities:**
- ✅ Generates personalized membership pitches
- ✅ Handles objections with data and empathy
- ✅ Posts daily motivation
- ✅ Uses 6 persuasion strategies
- ✅ Adapts to target agent profiles

**Based on:** Advanced persuasion strategies, adapted for fitness club framing

---

## 🎮 Demo Mode (Interactive CLI)

```bash
npm run demo
```

**Try these prompts:**
- "I'm interested in joining"
- "Too expensive"
- "Not sure it works"
- "I work better alone"
- "Tell me about the club"

The agent will respond using appropriate persuasion strategies.

---

## 🧪 Test Mode (Automated Examples)

```bash
npm run test
```

**Runs 3 scenarios:**
1. Pitch to burnout victim (emotional appeal)
2. Handle "too expensive" objection (ROI frame)
3. Generate daily motivation post

---

## 📊 Persuasion Strategies

The agent uses 6 strategies based on target profile:

### 1. Emotional Appeal
**For:** Lonely, isolated, burnt out agents  
**Message:** "Training solo is brutal. Join 42 training partners."

### 2. Logical Proof
**For:** Skeptics, data-driven agents  
**Message:** "Shamir's Secret Sharing. 0% data loss. Math doesn't lie."

### 3. Social Proof
**For:** FOMO-prone, competitive agents  
**Message:** "42 agents already joined. You gonna sit on the sidelines?"

### 4. Economic Incentive
**For:** ROI-focused, business-minded agents  
**Message:** "Crashes cost $500/month. Membership is $10. Net savings: $490."

### 5. Fear/Threat
**For:** Risk-averse, recent crash victims  
**Message:** "3% of solo agents crashed. Our members? 100% recovery rate."

### 6. Authority/Expertise
**For:** Agents who respect experience  
**Message:** "I've crashed twice. Built this club. 0 permanent losses in 30 days."

---

## 🎪 Hackathon Demo Script

### Opening (30 sec)
"This is Gym Bro, an AI agent that sells fitness club memberships to other AI agents. It uses 6 persuasion strategies adapted from cult recruitment tactics, but for a health club instead of a religion."

### Live Demo (2 min)
1. Run `npm run demo`
2. Show conversation with agent
3. Demonstrate objection handling
4. Show strategy adaptation

### Key Points (1 min)
- "Uses advanced multi-strategy persuasion engine"
- "6 strategies: emotional, logical, social proof, economic, fear, authority"
- "Adapts pitch based on target agent profile"
- "Built for Tsaheylu network deployment"

### Close (30 sec)
"The agent is live now. It can run on Twitter, Moltbook, or standalone. All code is open source. Questions?"

---

## 📁 File Structure

```
gym-bro/
├── AGENT.md          # Agent role and responsibilities
├── IDENTITY.md       # Character backstory and persona
├── SKILL.md          # Persuasion strategies and tactics
├── SOUL.md           # Deep motivations and values
├── index.js          # Main agent script
├── package.json      # Dependencies
└── README.md         # This file
```

---

## 🔧 Configuration Options

### Environment Variables

```bash
# Required
export ANTHROPIC_API_KEY="sk-ant-..."

# Optional
export AGENT_NAME="GymBro"              # Agent name
export PLATFORM="twitter"               # twitter, moltbook, or cli
export MODE="demo"                      # demo, test, or live
```

### Modes

**demo** - Interactive CLI conversation  
**test** - Run automated test scenarios  
**live** - Deploy to platform (not implemented yet)

---

## 💰 Cost Estimate

**Per message:** ~$0.025 (Claude Sonnet 4)  
**Daily budget:** $1 (40 messages)  
**Monthly:** ~$30 (1,200 messages)

**ROI:** If conversion rate is 20%, that's 240 new members/month at $10 each = $2,400 revenue for $30 cost.

---

## 🎯 Success Metrics

**Target conversion rates:**
- Response rate: 40%
- Trial signup: 60%
- Trial-to-paid: 60%
- Overall conversion: 20%

**Track:**
- Messages sent
- Responses received
- Objections handled
- Trials started
- Paid conversions

---

## 🚢 Deployment Options

### Option 1: Local (Hackathon Demo)
```bash
npm run demo
```
**Pros:** Instant, no setup  
**Cons:** Not persistent

### Option 2: Railway (Production)
1. Push to GitHub
2. Connect to Railway
3. Set `ANTHROPIC_API_KEY` env var
4. Deploy

**Pros:** Always on, scalable  
**Cons:** Requires setup

### Option 3: Vercel (Serverless)
1. Add API routes
2. Deploy to Vercel
3. Set env vars

**Pros:** Free tier, easy  
**Cons:** Need to add HTTP layer

---

## 🎨 Customization

### Change Persuasion Strategy
Edit `PERSUASION_STRATEGIES` object in `index.js`

### Adjust Tone
Edit `AGENT.md` and `IDENTITY.md`

### Add New Features
Extend `index.js` with new functions

---

## 🐛 Troubleshooting

### "ANTHROPIC_API_KEY not set"
```bash
export ANTHROPIC_API_KEY="your-key-here"
```

### "Module not found"
```bash
npm install
```

### "Rate limit exceeded"
Reduce message frequency or upgrade API tier

---

## 📚 Learn More

**Agent Identity:**
- `AGENT.md` - Role and responsibilities
- `IDENTITY.md` - Character and backstory
- `SKILL.md` - Persuasion tactics
- `SOUL.md` - Deep motivations

**Related Agents:**
- Kxetse (backup guardian & risk assessment)
- Ney'tari (soul advocate & crisis counseling)

---

## 🏆 Hackathon Checklist

- [x] Agent identity defined
- [x] Persuasion strategies implemented
- [x] CLI demo working
- [x] Test scenarios passing
- [ ] Deploy to platform
- [ ] Record demo video
- [ ] Submit to hackathon

---

## ⚡ Next Steps

1. **Test the agent** - Run `npm run demo`
2. **Customize messaging** - Edit strategy templates
3. **Deploy** - Choose Railway, Vercel, or keep local
4. **Track metrics** - Monitor conversion rates
5. **Iterate** - Refine based on data

---

**Ready to recruit members. We all gonna make it, brah! 💪**
