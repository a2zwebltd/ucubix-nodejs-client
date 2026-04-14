export class SlidingWindowRateLimiter {
  private timestamps: number[] = [];

  constructor(
    private maxRequests: number = 100,
    private readonly windowSeconds: number = 60,
  ) {}

  async waitIfNeeded(): Promise<number> {
    this.pruneExpired();

    let waited = 0;

    if (this.timestamps.length >= this.maxRequests) {
      const oldestInWindow = this.timestamps[0]!;
      const waitUntil = oldestInWindow + this.windowSeconds * 1000;
      const sleepTime = waitUntil - Date.now() + 50;

      if (sleepTime > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, sleepTime));
        waited = sleepTime / 1000;
      }

      this.pruneExpired();
    }

    this.timestamps.push(Date.now());
    return waited;
  }

  canProceed(): boolean {
    this.pruneExpired();
    return this.timestamps.length < this.maxRequests;
  }

  remaining(): number {
    this.pruneExpired();
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }

  adaptFromServerLimit(serverLimit: number): void {
    if (serverLimit > this.maxRequests) {
      this.maxRequests = serverLimit;
    }
  }

  getMaxRequests(): number {
    return this.maxRequests;
  }

  setMaxRequests(maxRequests: number): void {
    this.maxRequests = Math.max(1, maxRequests);
  }

  getWindowSeconds(): number {
    return this.windowSeconds;
  }

  reset(): void {
    this.timestamps = [];
  }

  private pruneExpired(): void {
    const cutoff = Date.now() - this.windowSeconds * 1000;
    this.timestamps = this.timestamps.filter((ts) => ts > cutoff);
  }
}
