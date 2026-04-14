import { describe, test, expect } from 'vitest';
import type { PaginatedResponse, Franchise } from '../../src/index.js';
import { hasMorePages } from '../../src/index.js';

describe('PaginatedResponse', () => {
  test('properties and hasMorePages', () => {
    const items: Franchise[] = [
      { id: 'f1', name: 'Franchise 1', createdAt: '2024-01-01T00:00:00Z' },
      { id: 'f2', name: 'Franchise 2', createdAt: '2024-01-01T00:00:00Z' },
    ];

    const paginated: PaginatedResponse<Franchise> = {
      data: items,
      currentPage: 1,
      perPage: 15,
      total: 50,
      lastPage: 4,
      firstPageUrl: 'http://localhost/api/v1/franchises?page[number]=1',
      lastPageUrl: 'http://localhost/api/v1/franchises?page[number]=4',
      nextPageUrl: 'http://localhost/api/v1/franchises?page[number]=2',
      prevPageUrl: null,
    };

    expect(paginated.data).toHaveLength(2);
    expect(paginated.currentPage).toBe(1);
    expect(paginated.total).toBe(50);
    expect(paginated.lastPage).toBe(4);
    expect(hasMorePages(paginated)).toBe(true);
    expect(paginated.prevPageUrl).toBeNull();
  });

  test('last page has no more pages', () => {
    const paginated: PaginatedResponse<Franchise> = {
      data: [],
      currentPage: 4,
      perPage: 15,
      total: 50,
      lastPage: 4,
      firstPageUrl: 'http://localhost/page1',
      lastPageUrl: 'http://localhost/page4',
      nextPageUrl: null,
      prevPageUrl: 'http://localhost/page3',
    };

    expect(hasMorePages(paginated)).toBe(false);
  });
});
