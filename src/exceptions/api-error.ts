export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 0,
    public readonly errorKey: string | null = null,
    public readonly errorDetail: string | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
