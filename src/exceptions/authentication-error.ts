import { ApiError } from './api-error.js';

export class AuthenticationError extends ApiError {
  constructor(message: string, statusCode: number) {
    super(message, statusCode);
    this.name = 'AuthenticationError';
  }
}
