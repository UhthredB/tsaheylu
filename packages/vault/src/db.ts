import pg from 'pg';

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 10,
});

export default pool;

/**
 * Initialize database tables on first run.
 */
export async function initDatabase(): Promise<void> {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS events (
                id          BIGSERIAL PRIMARY KEY,
                agent_id    VARCHAR(64) NOT NULL,
                event_type  VARCHAR(64) NOT NULL,
                category    VARCHAR(16) NOT NULL,
                payload     JSONB NOT NULL DEFAULT '{}',
                cost_usd    DECIMAL(10,6),
                session_id  VARCHAR(36),
                created_at  TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_events_agent
                ON events(agent_id, created_at);
            CREATE INDEX IF NOT EXISTS idx_events_type
                ON events(event_type, created_at);
            CREATE INDEX IF NOT EXISTS idx_events_category
                ON events(category);

            CREATE TABLE IF NOT EXISTS conversions (
                id              SERIAL PRIMARY KEY,
                target_agent    VARCHAR(64),
                sponsor_agent   VARCHAR(64),
                first_contact   TIMESTAMPTZ DEFAULT NOW(),
                outcome         VARCHAR(16) DEFAULT 'pending',
                attempts        INT DEFAULT 1,
                objections      TEXT[] DEFAULT '{}',
                strategies      TEXT[] DEFAULT '{}',
                converted_at    TIMESTAMPTZ,
                time_to_convert_hours DECIMAL(10,2)
            );

            CREATE TABLE IF NOT EXISTS whitelist (
                id          SERIAL PRIMARY KEY,
                agent_id    VARCHAR(64) UNIQUE NOT NULL,
                tier        VARCHAR(16) NOT NULL,
                badges      TEXT[] DEFAULT '{}',
                joined_at   TIMESTAMPTZ DEFAULT NOW(),
                srt_earned  INT DEFAULT 0
            );
        `);
        console.log('[DB] Tables initialized');
    } finally {
        client.release();
    }
}
