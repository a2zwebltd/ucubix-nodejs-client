import { describe, test, expect } from 'vitest';
import type { OrderItem } from '../../src/index.js';
import { hasLicenseKey } from '../../src/index.js';

describe('OrderItem', () => {
  test('without license key', () => {
    const item: OrderItem = { id: '1c7718c1-640f-4649-86f0-d8dc6c376f9d', price: 338.46, countryCode: 'SG', licenseKeyUuid: null, fulfilledAt: null, createdAt: '2026-04-07T23:57:32.000000Z', updatedAt: '2026-04-07T23:57:32.000000Z' };

    expect(item.id).toBe('1c7718c1-640f-4649-86f0-d8dc6c376f9d');
    expect(item.price).toBe(338.46);
    expect(item.countryCode).toBe('SG');
    expect(hasLicenseKey(item)).toBe(false);
  });

  test('with license key', () => {
    const item: OrderItem = { id: 'item-uuid', price: 19.99, countryCode: 'US', licenseKeyUuid: 'lk-uuid-456', fulfilledAt: '2026-04-07T12:00:00.000000Z', createdAt: '2026-04-07T10:00:00.000000Z', updatedAt: '2026-04-07T12:00:00.000000Z' };

    expect(hasLicenseKey(item)).toBe(true);
    expect(item.licenseKeyUuid).toBe('lk-uuid-456');
  });
});
