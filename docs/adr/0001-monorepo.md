# ADR 0001: Use a monorepo for deployable apps and shared packages

## Status

Accepted

## Context

The gateway will contain multiple deployable processes that share contracts, database access, and integration abstractions.

## Decision

Use npm workspaces with separate `api` and `worker` applications and small shared packages.

## Consequences

- Shared contracts can be reused without publishing packages.
- API and worker remain independently deployable.
- Boundaries are explicit enough to split into separate repositories later if scale or ownership requires it.
