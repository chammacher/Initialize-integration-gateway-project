import type { CanonicalPerson } from '@integration-gateway/contracts';

export interface IntegrationAdapter<TInput> {
  validate(input: unknown): TInput;
  normalize(input: TInput): CanonicalPerson;
}

// Source-specific adapters will live in this package.
