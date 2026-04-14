import { describe, test, expect } from 'vitest';
import type { LicenseKey } from '../../src/index.js';

describe('LicenseKey', () => {
  test('properties', () => {
    const key: LicenseKey = { id: 'lk-uuid-123', licenseKey: 'ABCD-EFGH-IJKL-MNOP', createdAt: '2024-01-15T10:30:00.000000Z', updatedAt: '2024-01-15T10:30:00.000000Z' };

    expect(key.id).toBe('lk-uuid-123');
    expect(key.licenseKey).toBe('ABCD-EFGH-IJKL-MNOP');
  });
});
