import { ApiError } from './api-error.js';

export class RateLimitError extends ApiError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter: number | null = null,
  ) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}
