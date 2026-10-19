import pg from 'pg';

const { Pool } = pg;

export type Db = pg.Pool;

export function createDb(connectionString: string): Db {
  return new Pool({
    connectionString,
    max: 8,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 5_000,
  });
}
