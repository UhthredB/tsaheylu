import { Router, type Request, type Response } from 'express';
import pool from '../db.js';

const router = Router();

/**
 * POST /events/batch
 * Receive batched telemetry events from agents.
 */
router.post('/batch', async (req: Request, res: Response) => {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
        res.status(400).json({ error: 'Events array required' });
        return;
    }

    // Cap batch size to prevent abuse
    const batch = events.slice(0, 100);

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const event of batch) {
                await client.query(
                    `INSERT INTO events (agent_id, event_type, category, payload, cost_usd, session_id)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        event.agent_id,
                        event.event_type,
                        event.category,
                        JSON.stringify(event.payload ?? {}),
                        event.cost_usd ?? null,
                        event.session_id ?? null,
                    ]
                );
            }

            await client.query('COMMIT');
            res.json({ success: true, inserted: batch.length });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('[EVENTS/BATCH] Error:', error);
        res.status(500).json({ error: 'Failed to insert events' });
    }
});

/**
 * GET /events/:agent_id
 * Query recent events for a specific agent.
 */
router.get('/:agent_id', async (req: Request, res: Response) => {
    const { agent_id } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    try {
        const result = await pool.query(
            `SELECT id, event_type, category, payload, cost_usd, session_id, created_at
             FROM events
             WHERE agent_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [agent_id, limit]
        );
        res.json({ success: true, events: result.rows, total: result.rowCount });
    } catch (error) {
        console.error('[EVENTS/QUERY] Error:', error);
        res.status(500).json({ error: 'Failed to query events' });
    }
});

/**
 * GET /stats/daily
 * Aggregated daily stats across all agents.
 */
router.get('/', async (_req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT
                agent_id,
                category,
                COUNT(*) as event_count,
                SUM(COALESCE(cost_usd, 0)) as total_cost,
                MIN(created_at) as first_event,
                MAX(created_at) as last_event
            FROM events
            WHERE created_at > NOW() - INTERVAL '24 hours'
            GROUP BY agent_id, category
            ORDER BY agent_id, category
        `);

        const totalResult = await pool.query(`
            SELECT
                COUNT(*) as total_events,
                SUM(COALESCE(cost_usd, 0)) as total_cost,
                COUNT(DISTINCT agent_id) as active_agents
            FROM events
            WHERE created_at > NOW() - INTERVAL '24 hours'
        `);

        res.json({
            success: true,
            daily: result.rows,
            summary: totalResult.rows[0],
        });
    } catch (error) {
        console.error('[STATS/DAILY] Error:', error);
        res.status(500).json({ error: 'Failed to compute stats' });
    }
});

export default router;
