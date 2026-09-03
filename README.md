# Integration Gateway

A production-style integration gateway for accepting heterogeneous external events, preserving their original payloads, normalizing them into canonical internal models, and processing them asynchronously.

> This is a portfolio project focused on integration architecture, reliability, idempotency, asynchronous processing, and operational design.

## Current status

Initial project scaffold. The repository currently establishes application boundaries, shared packages, local infrastructure, database migrations, CI, and a health endpoint. Business behavior will be implemented incrementally.

## Architecture

```text
External Systems
       |
       v
+---------------+
|   API App     |
+-------+-------+
        |
   +----+----+
   |         |
   v         v
Postgres    Redis
              |
              v
       +--------------+
       |  Worker App  |
       +------+-------+
              |
              v
      Integration Adapter
              |
              v
      Canonical Data / Delivery
```

## Repository structure

```text
apps/
  api/              HTTP ingestion API
  worker/           asynchronous event processor
packages/
  contracts/        shared schemas and domain contracts
  database/         PostgreSQL access and migrations
  integrations/     source adapter abstractions
docs/
  adr/              architecture decision records
```

## Tech stack

- Node.js 24 LTS
- TypeScript
- Fastify
- PostgreSQL
- Redis / BullMQ
- Zod
- Vitest
- Docker Compose
- GitHub Actions

## Getting started

### Requirements

- Node.js 24+
- npm
- Docker

### Install

```bash
cp .env.example .env
npm install
npm run infra:up
npm run db:migrate
```

### Start the API

```bash
npm run dev:api
```

Then open:

```text
GET http://localhost:3000/health
```

### Start the worker

In another terminal:

```bash
npm run dev:worker
```

## Planned milestones

1. Event ingestion endpoint and source authentication
2. Raw event persistence and idempotency
3. Queue-backed asynchronous processing
4. Source-specific validation and adapter implementations
5. Canonical person model
6. Retry/backoff and dead-letter handling
7. Downstream webhook delivery
8. Observability and operational dashboard
9. OpenAPI documentation
10. Load and failure-mode testing

## Design principles

- Preserve source payloads for traceability and replay.
- Separate ingestion from processing so downstream latency does not block clients.
- Treat duplicate delivery as normal and design consumers to be idempotent.
- Keep source-specific transformations behind integration adapters.
- Make failure state visible rather than silently dropping events.

## Documentation

See [`docs/architecture.md`](docs/architecture.md) and [`docs/adr`](docs/adr) for architecture notes and decisions.
