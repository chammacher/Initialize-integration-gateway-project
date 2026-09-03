CREATE TABLE integration_sources (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  source_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incoming_events (
  id UUID PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES integration_sources(id),
  external_event_id TEXT,
  idempotency_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'received',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE (source_id, idempotency_key)
);

CREATE INDEX idx_incoming_events_status_received
  ON incoming_events (processing_status, received_at);
