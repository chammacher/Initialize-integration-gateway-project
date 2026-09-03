import { z } from 'zod';

export const EventStatusSchema = z.enum([
  'received',
  'queued',
  'processing',
  'completed',
  'failed',
  'dead_letter',
]);

export type EventStatus = z.infer<typeof EventStatusSchema>;

export const CanonicalPersonSchema = z.object({
  externalId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export type CanonicalPerson = z.infer<typeof CanonicalPersonSchema>;

export const IncomingEventStatus = {
  RECEIVED: 'received',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  QUEUE_FAILED: 'queue_failed',
} as const;

export type IncomingEventStatus = typeof IncomingEventStatus[keyof typeof IncomingEventStatus];
