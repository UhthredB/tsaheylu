# 🚂 Deploy Sritorukentu Agent to Railway

## Quick Deploy (5 minutes)

### Step 1: Create Railway Account & Project

1. **Go to Railway:** https://railway.app
2. **Sign up/Login** with GitHub (click "Login with GitHub")
3. **Authorize Railway** to access your repositories
4. **Click:** "Start a New Project"
5. **Select:** "Deploy from GitHub repo"
6. **Choose:** `UhthredB/ay-vitraya-agent`

### Step 2: Configure Environment Variables

Once deployed, click on your service, then go to **"Variables"** tab:

**Click "Raw Editor"** and paste this:

```env
MOLTBOOK_API_KEY=moltbook_sk_qvpf1HAuAJsSVdpq9_vdaIMkB2Q3MCD6
ANTHROPIC_API_KEY=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
AGENT_NAME=Sritorukentu
LLM_MODEL=claude-opus-4-6
HEARTBEAT_INTERVAL_MS=600000
POST_COOLDOWN_MS=1800000
COMMENT_COOLDOWN_MS=30000
```

**Click "Update Variables"**

### Step 3: Monitor Deployment

1. Go to **"Deployments"** tab
2. Watch the build logs - you should see:
   ```
   ✅ Building...
   ✅ npm install
   ✅ npm run build
   ✅ Starting...
   ```

3. Go to **"Logs"** tab - you should see:
   ```
   🌳  AY VITRAYA — TREE OF SOULS  🌳
   ✅ Connected to Moltbook as: Sritorukentu
   ```

### Step 4: Verify Agent is Running

In the logs, look for:
- ✅ `Connected to Moltbook as: Sritorukentu`
- ⚠️ `ACCOUNT SUSPENDED` (expected - will auto-resume when suspension ends)
- ✅ `The agent will stay alive and resume once the suspension ends`

---

## ✅ Success Indicators

Your agent is working if you see:
- **Status:** `Active` (green)
- **Logs:** Showing the Ay Vitraya banner
- **No crashes:** Uptime counter increasing

---

## 🔍 Troubleshooting

### Build Failed?
- Check that all environment variables are set correctly
- Make sure you selected the right repository

### Agent Crashing?
- Check the logs for error messages
- Verify API keys are correct

### Still Suspended?
- **This is normal!** The suspension ends automatically
- The agent will resume once the 24-hour period is over

---

## 📊 What Happens Next?

```
Timeline:
├─ Now: Agent deployed to Railway ✅
├─ Agent sees suspension, waits patiently
├─ ~20-30 min: Suspension ends automatically
├─ Agent resumes heartbeat loop
├─ Moltbook sends AI verification challenge
├─ Agent solves with fixed challenge handler
└─ ✅ Verification passes, agent operates normally!
```

---

## 💰 Pricing

- **Free Trial:** Railway gives you $5 credit to start
- **Usage:** This agent uses ~$5-7/month
- **Recommendation:** Add payment method after trial ends

---

## 🎉 You're Done!

The agent will be live and ready to pass AI verification as soon as your suspension ends!
