export interface PaginatedResponse<T> {
  readonly data: T[];
  readonly currentPage: number;
  readonly perPage: number;
  readonly total: number;
  readonly lastPage: number;
  readonly firstPageUrl: string | null;
  readonly lastPageUrl: string | null;
  readonly nextPageUrl: string | null;
  readonly prevPageUrl: string | null;
}

export function hasMorePages<T>(response: PaginatedResponse<T>): boolean {
  return response.currentPage < response.lastPage;
}
