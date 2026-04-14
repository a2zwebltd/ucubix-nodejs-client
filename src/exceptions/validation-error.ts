import { ApiError } from './api-error.js';

export class ValidationError extends ApiError {
  constructor(
    message: string = 'Validation failed',
    public readonly field: string | null = null,
  ) {
    super(message, 422, field);
    this.name = 'ValidationError';
  }
}
