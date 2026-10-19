import 'dotenv/config';
import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { createHash } from 'node:crypto';
import { createDb } from './db.js';
import { waitlistSchema } from './waitlist-schema.js';

const PORT = Number(process.env.PORT ?? 3000);
const DATABASE_URL = process.env.DATABASE_URL;
const IP_HASH_SALT =
  process.env.IP_HASH_SALT ?? (process.env.NODE_ENV === 'production' ? '' : 'dev-only-salt');

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
if (!IP_HASH_SALT) {
  console.error('IP_HASH_SALT is required in production');
  process.exit(1);
}

const db = createDb(DATABASE_URL);

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  },
  // Caddy runs on the private Docker network. Trust only private proxy hops so
  // X-Forwarded-For cannot be spoofed from the public internet.
  trustProxy: (address) =>
    address === '127.0.0.1' ||
    address === '::1' ||
    address.startsWith('10.') ||
    address.startsWith('172.') ||
    address.startsWith('192.168.'),
  bodyLimit: 16 * 1024,
  disableRequestLogging: false,
});

await app.register(rateLimit, {
  global: false,
  max: 8,
  timeWindow: '1 hour',
  keyGenerator: (request) => request.ip,
  errorResponseBuilder: () => ({
    ok: false,
    error: 'Terlalu banyak percobaan. Coba lagi nanti.',
  }),
});

app.addHook('onSend', async (_request, reply, payload) => {
  reply.header('Cache-Control', 'no-store');
  reply.header('X-Content-Type-Options', 'nosniff');
  return payload;
});

app.get('/api/healthz', async () => ({ ok: true }));

app.get('/api/readyz', async (_request, reply) => {
  try {
    await db.query('select 1');
    return { ok: true };
  } catch {
    return reply.code(503).send({ ok: false });
  }
});

app.post(
  '/api/v1/waitlist',
  {
    config: { rateLimit: { max: 8, timeWindow: '1 hour' } },
  },
  async (request, reply) => {
    const parsed = waitlistSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ ok: false, error: 'Email atau persetujuan belum valid.' });
    }
    const { email, source, website } = parsed.data;

    // Honeypot: pretend success, never insert, never reveal the reason.
    if (website && website.trim().length > 0) {
      return reply.code(202).send({ ok: true });
    }

    const ipHash = createHash('sha256').update(`${request.ip}:${IP_HASH_SALT}`).digest('hex');

    try {
      await db.query(
        `insert into waitlist (email, consent, source, ip_hash)
         values ($1, true, $2, $3)
         on conflict (email) do update
           set consent = true,
               source = coalesce(excluded.source, waitlist.source),
               updated_at = now()`,
        [email, source ?? 'landing-prealpha', ipHash],
      );
      return reply.code(202).send({ ok: true });
    } catch (error) {
      request.log.error(
        {
          errName: error instanceof Error ? error.name : 'unknown',
          code: (error as { code?: string }).code,
        },
        'waitlist insert failed',
      );
      return reply
        .code(503)
        .send({ ok: false, error: 'Belum bisa menyimpan. Coba lagi atau email kami.' });
    }
  },
);

app.setErrorHandler((error, request, reply) => {
  request.log.error(
    {
      errName: error instanceof Error ? error.name : 'unknown',
      code: (error as { code?: string }).code,
    },
    'request failed',
  );
  if (reply.sent) return;
  return reply.code(500).send({ ok: false, error: 'Terjadi kesalahan.' });
});

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'shutting down');
  await app.close();
  await db.end();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  await db.end();
  process.exit(1);
}
