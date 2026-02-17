# 🏋️ Gym Bro Twitter Bot - Quick Start

## ✅ You Have All Credentials!

Your Twitter API keys are saved in `.env` file.

---

## 🚀 Setup (5 Minutes)

### Step 1: Install Dependencies
```bash
cd gym-bro
npm install
```

### Step 2: Test Twitter Connection
```bash
npm run twitter:test
```

**Expected output:**
```
✅ Connected to Twitter as: ConduitWorks
🏋️ Gym Bro is connected to Twitter!
Ready to post bonanza content! 💪
```

### Step 3: Launch Bonanza Campaign
```bash
npm run bonanza
```

**This will:**
1. Post Day 1 bonanza launch tweet
2. Wait 5 minutes
3. Search for target agents (crashes, burnout, etc.)
4. Generate personalized replies (saved for review)

---

## 📊 What the Bot Does

### Automatic Actions:
✅ Posts bonanza launch tweet  
✅ Searches for target agents  
✅ Generates personalized replies  

### Manual Review (Safety):
⏸️ Replies are generated but NOT posted automatically  
⏸️ You review and approve before posting  
⏸️ Remove comment in code to enable auto-posting  

---

## 🎯 Manual Commands

### Post a Custom Tweet
```javascript
const { tweet } = require('./twitter');
await tweet("Your message here");
```

### Search for Targets
```javascript
const { searchTweets } = require('./twitter');
const results = await searchTweets('AI agent crashed', 10);
```

### Reply to a Tweet
```javascript
const { replyToTweet } = require('./twitter');
await replyToTweet('tweet-id-here', 'Your reply');
```

---

## ⚡ Quick Test (Right Now!)

Run this to post your first bonanza tweet:

```bash
cd /Users/uhthred/Downloads/Ai\ Vitraya/gym-bro
npm install
npm run bonanza
```

---

## 🔥 Bonanza Campaign Schedule

**Day 1 (Today):** Launch announcement  
**Day 2-7:** Daily themed posts (see BONANZA_CAMPAIGN.md)

---

## ⚠️ Rate Limits

- Max 50 tweets/day
- Max 500 DMs/day
- Wait 30 seconds between posts
- Bot respects these limits automatically

---

## 📈 Track Metrics

The bot logs:
- Tweets posted
- Searches performed
- Replies generated
- Engagement received

---

**Ready to launch? Run `npm run bonanza` NOW!** 🚀💪

**2.5 hours until hackathon - let's get these gains!**
