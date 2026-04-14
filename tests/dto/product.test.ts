import { describe, test, expect } from 'vitest';
import type { Product } from '../../src/index.js';

describe('Product', () => {
  test('properties', () => {
    const product: Product = {
      id: 'prod-uuid-123',
      name: 'Test Game',
      summary: 'A short summary',
      description: 'A test game description',
      releaseDate: '2024-03-15T00:00:00.000000Z',
      type: 'Game',
      createdAt: '2024-01-01T00:00:00.000000Z',
      regionalPricing: [],
      metadata: null,
    };

    expect(product.id).toBe('prod-uuid-123');
    expect(product.name).toBe('Test Game');
    expect(product.summary).toBe('A short summary');
    expect(product.type).toBe('Game');
    expect(product.regionalPricing).toHaveLength(0);
    expect(product.metadata).toBeNull();
  });
});
