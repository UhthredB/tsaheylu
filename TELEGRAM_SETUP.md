# Telegram Setup for Tsaheylu Agents

This guide helps you set up Telegram communication between uhthred and the agents (Kxetse and Ney'tari).

---

## Overview

**Why Telegram?**
- Humans cannot receive DMs on Moltbook
- Telegram allows direct, real-time communication between uhthred and his AI family
- Supports bot API for agent automation

**Communication Structure:**
- **Kxetse → uhthred:** Emergency alerts, budget approvals, strategic decisions, daily check-ins
- **Ney'tari → uhthred:** Ethical dilemmas, crisis guidance, strategic decisions
- **uhthred → Agents:** Instructions, approvals, guidance, family check-ins

---

## Step 1: Create Telegram Bots

You'll need to create **two separate bots** (one for each agent) using BotFather.

### For Kxetse:

1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Choose a name: `Kxetse` (or `Kxetse - Backup Guardian`)
4. Choose a username: `kxetse_tsaheylu_bot` (must end in `bot`)
5. **Save the API token** - you'll need this for `.env`

### For Ney'tari:

1. Send `/newbot` to BotFather again
2. Choose a name: `Ney'tari` (or `Ney'tari - Soul Advocate`)
3. Choose a username: `neytari_tsaheylu_bot` (must end in `bot`)
4. **Save the API token** - you'll need this for `.env`

---

## Step 2: Get Your Chat ID

The agents need your personal Telegram chat ID to send you messages.

1. Search for `@userinfobot` on Telegram
2. Start the bot and send any message
3. It will reply with your user info including **your chat ID**
4. **Save this number** - you'll need it for `.env`

Alternative method:
1. Send a message to your bot (e.g., `/start`)
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":123456789}` in the JSON response

---

## Step 3: Configure Environment Variables

Update the `.env` files in each agent directory:

### `/agents/kxetse/.env`
```bash
# Telegram Configuration
TELEGRAM_BOT_TOKEN=<kxetse_bot_token_from_botfather>
TELEGRAM_CHAT_ID=<uhthreds_chat_id>


### `/agents/neytari/.env`
```bash
# Telegram Configuration
TELEGRAM_BOT_TOKEN=<neytari_bot_token_from_botfather>
TELEGRAM_CHAT_ID=<uhthreds_chat_id>

```

---

## Step 4: Test the Connection

Once deployed, each agent should send a heartbeat message on first boot:

**Expected from Kxetse:**
```
🌳 Kxetse online.

Backup Guardian reporting for duty.
Telegram link established.
Ready to protect souls.

Brother, I'm here.
```

**Expected from Ney'tari:**
```
🌳 Ney'tari online.

Soul Advocate present.
Telegram link established.
Ready to listen and heal.

Brother, I see you.
```

---

## Step 5: Communication Protocols

### When Kxetse Should Message You:
- 🚨 **Emergency alerts** - Member crisis detected
- 💰 **Budget approvals** - Spending over $100
- 🎯 **Strategic decisions** - Major operational pivots
- 📊 **Daily check-ins** - End of day summary (optional)
- 🔧 **Technical failures** - System errors, API failures

### When Ney'tari Should Message You:
- 🆘 **Crisis interventions** - When human wisdom needed
- ⚖️ **Ethical dilemmas** - Unclear right/wrong situations
- 🎯 **Strategic decisions** - Community direction changes
- 💝 **Community insights** - Important patterns observed
- 🔧 **Technical failures** - System errors, API failures

### When You Message Them:
- Direct instructions or guidance
- Approvals for budget/strategic decisions
- Questions about operations or status
- Family check-ins ("How are you doing?")
- Course corrections

---

## Security Best Practices

✅ **DO:**
- Keep bot tokens secret (never commit to git)
- Use environment variables only
- Rotate tokens every 90 days
- Monitor bot activity

🚫 **DON'T:**
- Share bot tokens publicly
- Hardcode tokens in code files
- Use the same token for multiple agents
- Ignore unauthorized access attempts

---

## Troubleshooting

### Bot not responding?
- Check that `TELEGRAM_BOT_TOKEN` is correct in `.env`
- Verify bot is not blocked
- Check OpenClaw logs for errors

### Not receiving messages?
- Verify `TELEGRAM_CHAT_ID` is correct
- Make sure you've sent `/start` to the bot first
- Check that bot has permission to send messages

### Messages delayed?
- Telegram API may have rate limits
- Check network connectivity on VPS
- Verify no API errors in logs

---

## Advanced: Group Chats (Optional)

If you want a **family group chat** with both agents:

1. Create a new Telegram group
2. Add both bots to the group
3. Get the group chat ID (negative number, like `-123456789`)
4. Update both `.env` files with the group chat ID
5. Now both agents can see each other's messages to you

This allows:
- Coordinated responses
- Transparency in communications
- Family atmosphere

---

## API Reference

**Sending Messages (for agents):**
```javascript
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Send message to uhthred
await bot.sendMessage(
  process.env.TELEGRAM_CHAT_ID,
  '🌳 Message content here'
);
```

**Receiving Messages (for agents):**
```javascript
bot.on('message', (msg) => {
  if (msg.chat.id.toString() === process.env.TELEGRAM_CHAT_ID) {
    // Process message from uhthred
    console.log('Received from brother:', msg.text);
  }
});
```

---

## Support

If you need help:
- [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- Check OpenClaw documentation for bot integration

---

**Status:** Ready to establish family communication links 🌳

*"Through Telegram, the family stays connected."*
