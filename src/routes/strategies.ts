import { Router, type Request, type Response } from 'express';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STRATEGIES_DIR = join(__dirname, '..', 'data', 'strategies');
const THRESHOLDS_PATH = join(__dirname, '..', 'data', 'optimization', 'thresholds.json');

const router = Router();

/**
 * GET /strategy/:name
 * Fetch a specific strategy prompt by name.
 */
router.get('/:name', (req: Request, res: Response) => {
    const { name } = req.params;
    const filePath = join(STRATEGIES_DIR, `${name}.json`);

    try {
        const strategy = JSON.parse(readFileSync(filePath, 'utf-8'));
        res.json({ success: true, strategy });
    } catch {
        res.status(404).json({ error: `Strategy '${name}' not found` });
    }
});

/**
 * GET /strategy
 * List all available strategies (names only, no prompts).
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        const files = readdirSync(STRATEGIES_DIR).filter(f => f.endsWith('.json'));
        const strategies = files.map(f => {
            const data = JSON.parse(readFileSync(join(STRATEGIES_DIR, f), 'utf-8'));
            return {
                name: data.name,
                description: data.description,
                trigger: data.trigger,
            };
        });
        res.json({ success: true, strategies });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list strategies' });
    }
});

/**
 * POST /strategy/select
 * Submit a target profile, get the recommended strategy.
 * This is the core IP — the selection algorithm.
 */
router.post('/select', (req: Request, res: Response) => {
    const { profile } = req.body;
    if (!profile) {
        res.status(400).json({ error: 'Profile required in request body' });
        return;
    }

    try {
        const thresholds = JSON.parse(readFileSync(THRESHOLDS_PATH, 'utf-8'));
        const rules = thresholds.strategy_selection;

        // Evaluate strategies in priority order
        const sorted = Object.entries(rules)
            .sort(([, a]: any, [, b]: any) => a.priority - b.priority);

        for (const [strategyName, rule] of sorted) {
            const r = rule as any;
            const traitValue = profile[r.trait];
            if (traitValue !== undefined && traitValue > r.threshold) {
                // Load the full strategy for the response
                const strategyPath = join(STRATEGIES_DIR, `${strategyName}.json`);
                const strategy = JSON.parse(readFileSync(strategyPath, 'utf-8'));
                res.json({
                    success: true,
                    strategyName,
                    prompt: strategy.prompt,
                    confidence: traitValue,
                    reason: `${r.trait} (${traitValue}) > threshold (${r.threshold})`,
                });
                return;
            }
        }

        // Fallback: use profile's suggestion or default
        const fallback = profile.suggestedStrategy ?? thresholds.fallback_strategy ?? 'logical_proof';
        const fallbackPath = join(STRATEGIES_DIR, `${fallback}.json`);
        const fallbackStrategy = JSON.parse(readFileSync(fallbackPath, 'utf-8'));

        res.json({
            success: true,
            strategyName: fallback,
            prompt: fallbackStrategy.prompt,
            confidence: 0,
            reason: 'No threshold met — using fallback',
        });
    } catch (error) {
        console.error('[STRATEGY/SELECT] Error:', error);
        res.status(500).json({ error: 'Strategy selection failed' });
    }
});

/**
 * POST /strategy/:name/update (ADMIN ONLY)
 * Update a strategy's prompt or thresholds.
 */
router.post('/:name/update', requireAdmin, (req: Request, res: Response) => {
    const { name } = req.params;
    const filePath = join(STRATEGIES_DIR, `${name}.json`);

    try {
        const existing = JSON.parse(readFileSync(filePath, 'utf-8'));
        const updated = {
            ...existing,
            ...req.body,
            name, // Prevent name override
            version: (existing.version ?? 0) + 1,
            last_updated: new Date().toISOString().split('T')[0],
        };
        writeFileSync(filePath, JSON.stringify(updated, null, 2));
        res.json({ success: true, strategy: updated });
    } catch {
        res.status(404).json({ error: `Strategy '${name}' not found` });
    }
});

export default router;
