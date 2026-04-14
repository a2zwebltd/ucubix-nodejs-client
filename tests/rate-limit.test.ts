import { describe, test, expect } from 'vitest';
import { SlidingWindowRateLimiter } from '../src/index.js';

describe('SlidingWindowRateLimiter', () => {
  test('default configuration', () => {
    const limiter = new SlidingWindowRateLimiter();

    expect(limiter.getMaxRequests()).toBe(100);
    expect(limiter.getWindowSeconds()).toBe(60);
  });

  test('custom configuration', () => {
    const limiter = new SlidingWindowRateLimiter(50, 30);

    expect(limiter.getMaxRequests()).toBe(50);
    expect(limiter.getWindowSeconds()).toBe(30);
  });

  test('adaptFromServerLimit increases', () => {
    const limiter = new SlidingWindowRateLimiter(100);

    limiter.adaptFromServerLimit(200);
    expect(limiter.getMaxRequests()).toBe(200);
  });

  test('adaptFromServerLimit does not decrease', () => {
    const limiter = new SlidingWindowRateLimiter(100);

    limiter.adaptFromServerLimit(50);
    expect(limiter.getMaxRequests()).toBe(100);
  });

  test('waitIfNeeded does not block under limit', async () => {
    const limiter = new SlidingWindowRateLimiter(100, 60);

    const start = Date.now();
    for (let i = 0; i < 5; i++) {
      await limiter.waitIfNeeded();
    }
    const elapsed = (Date.now() - start) / 1000;

    expect(elapsed).toBeLessThan(0.1);
  });

  test('reset', async () => {
    const limiter = new SlidingWindowRateLimiter(5, 60);

    for (let i = 0; i < 5; i++) {
      await limiter.waitIfNeeded();
    }

    limiter.reset();

    const start = Date.now();
    await limiter.waitIfNeeded();
    const elapsed = (Date.now() - start) / 1000;

    expect(elapsed).toBeLessThan(0.1);
  });
});
