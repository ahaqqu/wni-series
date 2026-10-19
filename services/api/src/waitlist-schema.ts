import { z } from 'zod';

export const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  consent: z.literal(true),
  source: z.string().trim().max(64).optional(),
  website: z.string().max(200).optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
