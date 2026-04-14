import { describe, test, expect } from 'vitest';
import type { Organisation, OrganisationSummary, CreditLine } from '../../src/index.js';

describe('Organisation', () => {
  test('properties', () => {
    const summary: OrganisationSummary = { currencies: 3, totalUsdEquivalent: '32336389.65' };
    const creditLines: CreditLine[] = [
      { currency: 'USD', balance: '17179869.18' },
      { currency: 'SGD', balance: '17179869.18' },
    ];

    const org: Organisation = {
      uuid: '1f132dd6-8c2b-6ac6-ad8a-3e1e6bb58a9c',
      name: 'EpicSoft Asia Pte. Ltd.',
      summary,
      creditLines,
    };

    expect(org.uuid).toBe('1f132dd6-8c2b-6ac6-ad8a-3e1e6bb58a9c');
    expect(org.name).toBe('EpicSoft Asia Pte. Ltd.');
    expect(org.summary.currencies).toBe(3);
    expect(org.summary.totalUsdEquivalent).toBe('32336389.65');
    expect(org.creditLines).toHaveLength(2);
    expect(org.creditLines[0]!.currency).toBe('USD');
  });
});
