# Architecture

## Goal

The Integration Gateway accepts events from heterogeneous external systems, preserves the original payload, validates and normalizes source-specific data, and processes it asynchronously into a canonical internal model.

## Initial component boundaries

```text
External System
      |
      v
   API App
      |
      +---- PostgreSQL (raw event + state)
      |
      v
   Redis Queue
      |
      v
  Worker App
      |
      +---- Integration Adapter
      |
      +---- PostgreSQL (canonical data)
      |
      v
Downstream Delivery
```

The initial commit intentionally contains only the application boundaries and infrastructure. Event ingestion, queue processing, adapters, retries, and downstream delivery will be added incrementally.
