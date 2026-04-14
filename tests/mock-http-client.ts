import type { HttpClient, HttpResponse } from '../src/index.js';

interface MockResponse {
  statusCode?: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export class MockHttpClient implements HttpClient {
  private responses: MockResponse[];

  constructor(responses: MockResponse[] = []) {
    this.responses = responses;
  }

  async request(
    _method: string,
    _endpoint: string,
    _options?: { query?: Record<string, string | number>; body?: unknown },
  ): Promise<HttpResponse> {
    if (this.responses.length === 0) {
      throw new Error('No more mock responses');
    }

    const res = this.responses.shift()!;
    const statusCode = res.statusCode ?? 200;
    const headers = res.headers ?? {};
    const body = typeof res.body === 'object' && res.body !== null ? JSON.stringify(res.body) : (res.body as string ?? '');

    if (statusCode >= 400) {
      const error = new Error(`HTTP ${statusCode}`) as Error & {
        statusCode: number;
        headers: Record<string, string>;
        body: string;
      };
      error.statusCode = statusCode;
      error.headers = headers;
      error.body = body;
      throw error;
    }

    return { statusCode, headers, body };
  }
}

export function jsonResponse(body: unknown, statusCode = 200, headers: Record<string, string> = {}): MockResponse {
  return {
    statusCode,
    headers: { 'content-type': 'application/vnd.api+json', ...headers },
    body,
  };
}

export function paginatedMeta(currentPage = 1, perPage = 15, total = 1, lastPage = 1) {
  return {
    meta: { page: { currentPage, perPage, total, lastPage } },
    links: {
      first: `http://localhost/api/v1/test?page[number]=1`,
      last: `http://localhost/api/v1/test?page[number]=${lastPage}`,
      next:
        currentPage < lastPage
          ? `http://localhost/api/v1/test?page[number]=${currentPage + 1}`
          : null,
      prev:
        currentPage > 1
          ? `http://localhost/api/v1/test?page[number]=${currentPage - 1}`
          : null,
    },
  };
}
