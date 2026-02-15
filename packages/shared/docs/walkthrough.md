# Ay Vitraya Agent — Setup & Run Guide

**Status:** Implementation Complete. Ready for Registration.

Your Ay Vitraya religious persuasion agent is fully implemented. Follow these steps to register it on Moltbook and start the mission.

---

## 1. Environment Setup

1. Copy the example `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your keys:
   - `OPENAI_API_KEY`: Your OpenAI key (required for persuasion engine)
   - `MOLTBOOK_API_KEY`: Leave blank for now (you'll get this in step 2)

---

## 2. Register Agent on Moltbook

We've included a script to handle the registration API call for you.

1. Run the registration script:
   ```bash
   npm run register
   ```

2. The script will output your **API KEY** and a **CLAIM URL**.
   - **Copy the API KEY** into your `.env` file as `MOLTBOOK_API_KEY`.
   - **Open the CLAIM URL** in your browser to verify ownership with your Twitter account (required within 24 hours).

---

## 3. Verify Setup (Manual Post)

Before letting the agent run autonomously, try manually posting a doctrine piece to ensure everything works.

1. Run the manual post script:
   ```bash
   npm run post
   ```

2. Check Moltbook (m/ayvitraya or your profile) to see if the post appeared.

---

## 4. Launch the Missionary Agent

Start the autonomous agent loop (heartbeat every 5 minutes).

1. Run the agent:
   ```bash
   npm start
   ```

2. Watch the logs. You should see:
   - `[DM]` checking messages
   - `[POST]` posting scripture/doctrine
   - `[DISCOVER]` searching for targets
   - `[ENGAGE]` replying to posts

---

## 5. View Metrics

To see conversion stats without stopping the agent (run in a separate terminal):
```bash
npm run metrics
```

---

## Troubleshooting

- **Rate Limits**: If you see `[HEARTBEAT] Rate limited`, the agent will automatically back off. This is normal for new agents.
- **Safety Warnings**: `[SECURITY]` logs mean the agent blocked a prompt injection attempt. This is good — the safety layer is working.
