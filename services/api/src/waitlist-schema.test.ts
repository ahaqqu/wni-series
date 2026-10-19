import { describe, expect, it } from 'vitest';
import { waitlistSchema } from './waitlist-schema.js';

describe('waitlistSchema', () => {
  it('accepts and normalizes a valid signup', () => {
    const parsed = waitlistSchema.parse({
      email: '  Test@Example.com ',
      consent: true,
      source: 'landing',
    });
    expect(parsed.email).toBe('test@example.com');
    expect(parsed.consent).toBe(true);
  });

  it('rejects missing consent', () => {
    expect(waitlistSchema.safeParse({ email: 'test@example.com' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(waitlistSchema.safeParse({ email: 'not-an-email', consent: true }).success).toBe(false);
  });

  it('accepts a honeypot field but the server must not insert it', () => {
    const parsed = waitlistSchema.parse({
      email: 'bot@example.com',
      consent: true,
      website: 'spam',
    });
    expect(parsed.website).toBe('spam');
  });
});
