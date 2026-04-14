import type { CreditLine } from './credit-line.js';
import type { OrganisationSummary } from './organisation-summary.js';

export interface Organisation {
  readonly uuid: string;
  readonly name: string;
  readonly summary: OrganisationSummary;
  readonly creditLines: CreditLine[];
}
