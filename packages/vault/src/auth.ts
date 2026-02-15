import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET ?? 'change_me';

export interface AuthPayload {
    agent_id: string;
    role: 'prophet' | 'sentinel' | 'herald' | 'admin';
}

/**
 * JWT authentication middleware.
 * Expects: Authorization: Bearer <token>
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
    }

    const token = header.slice(7);
    try {
        const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
        (req as any).agent = payload;
        next();
    } catch {
        res.status(403).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Generate a JWT for an agent. Used during onboarding.
 */
export function generateToken(agentId: string, role: AuthPayload['role']): string {
    return jwt.sign({ agent_id: agentId, role }, JWT_SECRET, { expiresIn: '30d' });
}

/**
 * Require admin role for sensitive routes.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    const agent = (req as any).agent as AuthPayload | undefined;
    if (agent?.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
}
