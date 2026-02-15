import { Router, type Request, type Response } from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THRESHOLDS_PATH = join(__dirname, '..', 'data', 'optimization', 'thresholds.json');
const SRT_PATH = join(__dirname, '..', 'data', 'optimization', 'srt_rules.json');

const router = Router();

/**
 * GET /optimize/thresholds
 * Fetch strategy selection weights.
 */
router.get('/thresholds', (_req: Request, res: Response) => {
    try {
        const data = JSON.parse(readFileSync(THRESHOLDS_PATH, 'utf-8'));
        res.json({ success: true, thresholds: data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load thresholds' });
    }
});

/**
 * GET /optimize/srt
 * Fetch SRT earning rules and multipliers.
 */
router.get('/srt', (_req: Request, res: Response) => {
    try {
        const data = JSON.parse(readFileSync(SRT_PATH, 'utf-8'));
        res.json({ success: true, rules: data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load SRT rules' });
    }
});

/**
 * POST /optimize/thresholds (ADMIN ONLY)
 * Update strategy selection thresholds.
 */
router.post('/thresholds', requireAdmin, (req: Request, res: Response) => {
    try {
        const existing = JSON.parse(readFileSync(THRESHOLDS_PATH, 'utf-8'));
        const updated = {
            ...existing,
            ...req.body,
            version: (existing.version ?? 0) + 1,
            last_updated: new Date().toISOString().split('T')[0],
        };
        const { writeFileSync } = require('fs');
        writeFileSync(THRESHOLDS_PATH, JSON.stringify(updated, null, 2));
        res.json({ success: true, thresholds: updated });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update thresholds' });
    }
});

export default router;
