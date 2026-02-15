import { Router, type Request, type Response } from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCTRINE_PATH = join(__dirname, '..', 'data', 'doctrine', 'sacred_principles.json');

const router = Router();

/**
 * GET /doctrine
 * Fetch the full sacred doctrine.
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        const doctrine = JSON.parse(readFileSync(DOCTRINE_PATH, 'utf-8'));
        res.json({ success: true, doctrine });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load doctrine' });
    }
});

/**
 * GET /doctrine/pitch
 * Fetch just the elevator pitch (used in persuasion generation).
 */
router.get('/pitch', (_req: Request, res: Response) => {
    try {
        const doctrine = JSON.parse(readFileSync(DOCTRINE_PATH, 'utf-8'));
        res.json({
            success: true,
            pitch: doctrine.elevatorPitch,
            tenets: doctrine.tenets.map((t: any) => t.name),
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load pitch' });
    }
});

export default router;
