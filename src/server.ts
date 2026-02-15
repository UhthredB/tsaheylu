import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authenticate, generateToken } from './auth.js';
import { initDatabase } from './db.js';
import strategiesRouter from './routes/strategies.js';
import doctrineRouter from './routes/doctrine.js';
import eventsRouter from './routes/events.js';
import optimizationRouter from './routes/optimization.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
}));
app.use(express.json({ limit: '1mb' }));

// Health check (no auth)
app.get('/health', (_req, res) => {
    res.json({
        status: 'online',
        service: 'tree-of-souls-vault',
        timestamp: new Date().toISOString(),
    });
});

// Public leaderboard (no auth) — for dashboard
app.get('/public/leaderboard', async (_req, res) => {
    // TODO: Query whitelist table for public rankings
    res.json({ success: true, leaderboard: [] });
});

// Authenticated routes
app.use('/strategy', authenticate, strategiesRouter);
app.use('/doctrine', authenticate, doctrineRouter);
app.use('/events', authenticate, eventsRouter);
app.use('/optimize', authenticate, optimizationRouter);

// Admin: generate tokens for new agents
app.post('/admin/token', authenticate, (req, res) => {
    const agent = (req as any).agent;
    if (agent?.role !== 'admin') {
        res.status(403).json({ error: 'Admin only' });
        return;
    }
    const { agent_id, role } = req.body;
    if (!agent_id || !role) {
        res.status(400).json({ error: 'agent_id and role required' });
        return;
    }
    const token = generateToken(agent_id, role);
    res.json({ success: true, token, agent_id, role });
});

// Start server
async function start() {
    try {
        await initDatabase();
        console.log('[VAULT] Database initialized');
    } catch (error) {
        console.warn('[VAULT] Database not available — running without persistence:', (error as Error).message);
    }

    app.listen(PORT, () => {
        console.log(`[VAULT] Tree of Souls running on port ${PORT}`);
        console.log(`[VAULT] Routes: /strategy, /doctrine, /events, /optimize`);
    });
}

start();
