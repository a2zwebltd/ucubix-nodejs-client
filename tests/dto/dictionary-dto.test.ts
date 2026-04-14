import { describe, test, expect } from 'vitest';
import type { Category, Publisher, Developer, Platform, Franchise, Media } from '../../src/index.js';

describe('Dictionary DTOs', () => {
  test('Category', () => {
    const cat: Category = { id: 'cat-1', name: 'Players', parentId: null, childIds: ['c1', 'c2'] };

    expect(cat.id).toBe('cat-1');
    expect(cat.name).toBe('Players');
    expect(cat.parentId).toBeNull();
    expect(cat.childIds).toHaveLength(2);
  });

  test('Publisher', () => {
    const pub: Publisher = { id: 'p1', name: 'Big Publisher', website: 'https://pub.com', about: 'A publisher', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' };

    expect(pub.id).toBe('p1');
    expect(pub.name).toBe('Big Publisher');
    expect(pub.website).toBe('https://pub.com');
  });

  test('Developer', () => {
    const dev: Developer = { id: 'd1', name: 'Indie Studio', website: null, about: null, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' };

    expect(dev.id).toBe('d1');
    expect(dev.website).toBeNull();
  });

  test('Platform', () => {
    const plat: Platform = { id: 'pl1', name: 'Steam', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' };

    expect(plat.name).toBe('Steam');
  });

  test('Franchise', () => {
    const fr: Franchise = { id: 'f1', name: 'Test Franchise', createdAt: '2024-01-01T00:00:00Z' };

    expect(fr.id).toBe('f1');
  });

  test('Media', () => {
    const media: Media = { id: 'm1', name: 'cover.jpg', fileName: 'cover.jpg', collectionName: 'photos', mimeType: 'image/jpeg', disk: 's3', size: 102400, orderColumn: 1, url: 'https://img.com/cover.jpg', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z' };

    expect(media.id).toBe('m1');
    expect(media.mimeType).toBe('image/jpeg');
    expect(media.size).toBe(102400);
    expect(media.url).toBe('https://img.com/cover.jpg');
  });
});
