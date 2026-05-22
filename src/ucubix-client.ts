import type { Category } from './dto/category.js';
import type { CountryPrice } from './dto/country-price.js';
import type { CreditLine } from './dto/credit-line.js';
import type { Developer } from './dto/developer.js';
import type { Franchise } from './dto/franchise.js';
import type { LicenseKey } from './dto/license-key.js';
import type { Media } from './dto/media.js';
import type { Order } from './dto/order.js';
import type { OrderItem } from './dto/order-item.js';
import type { Organisation } from './dto/organisation.js';
import type { OrganisationSummary } from './dto/organisation-summary.js';
import type { PaginatedResponse } from './dto/paginated-response.js';
import type { Platform } from './dto/platform.js';
import type { Product } from './dto/product.js';
import type { ProductMetadata } from './dto/product-metadata.js';
import type { Publisher } from './dto/publisher.js';
import type { RegionalPricing } from './dto/regional-pricing.js';
import type { SteamdbInfo } from './dto/steamdb-info.js';
import type { SystemRequirement } from './dto/system-requirement.js';
import { ApiError } from './exceptions/api-error.js';
import { AuthenticationError } from './exceptions/authentication-error.js';
import { RateLimitError } from './exceptions/rate-limit-error.js';
import { ValidationError } from './exceptions/validation-error.js';
import { SlidingWindowRateLimiter } from './rate-limit/sliding-window-rate-limiter.js';

export const VERSION = '1.0.0';
export const DEFAULT_BASE_URL = 'https://ucubix.com/api/v1/';

const PRODUCT_FILTERS = ['search', 'category', 'publisher', 'developer', 'franchise', 'platform'] as const;
const ORDER_FILTERS = ['code', 'external_reference'] as const;

type ProductFilter = (typeof PRODUCT_FILTERS)[number];
type OrderFilter = (typeof ORDER_FILTERS)[number];

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface HttpClient {
  request(
    method: string,
    endpoint: string,
    options?: { query?: Record<string, string | number>; body?: unknown },
  ): Promise<HttpResponse>;
}

interface HttpError extends Error {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

function isHttpError(err: unknown): err is HttpError {
  return err instanceof Error && 'statusCode' in err && typeof (err as HttpError).statusCode === 'number';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonData = any;

export interface RateLimitState {
  limit: number | null;
  remaining: number | null;
}

export class UcubixClient {
  static readonly VERSION = VERSION;
  static readonly DEFAULT_BASE_URL = DEFAULT_BASE_URL;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly rateLimiter: SlidingWindowRateLimiter;
  private readonly httpClient: HttpClient | null;

  private rateLimitRemaining: number | null = null;
  private rateLimitLimit: number | null = null;
  private maxRetryOnRateLimit = 3;

  constructor(apiKey: string, baseUrl: string = DEFAULT_BASE_URL, httpClient: HttpClient | null = null) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    this.rateLimiter = new SlidingWindowRateLimiter(100, 60);
    this.httpClient = httpClient;
  }

  // =========================================================================
  // General Info
  // =========================================================================

  async getOrganisation(): Promise<Organisation> {
    const response = await this.doGet('info');
    const data = response.data;

    return {
      uuid: data.organisation.uuid,
      name: data.organisation.name,
      summary: {
        currencies: Number(data.summary.currencies),
        totalUsdEquivalent: data.summary.total_usd_equivalent,
      } satisfies OrganisationSummary,
      creditLines: data.credit_lines.map((cl: JsonData): CreditLine => ({
        currency: cl.currency,
        balance: cl.balance,
      })),
    };
  }

  // =========================================================================
  // Products Catalog
  // =========================================================================

  async getProducts(
    filters: Partial<Record<ProductFilter, string>> = {},
    page = 1,
    perPage = 15,
    sort: string | null = null,
  ): Promise<PaginatedResponse<Product>> {
    this.validateFilters(filters, PRODUCT_FILTERS as unknown as string[]);

    const query = this.buildPaginationQuery(page, perPage, sort);
    this.applyFilters(query, filters);

    const response = await this.doGet('products', query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parseProduct(item));
  }

  async getProduct(id: string): Promise<Product> {
    const response = await this.doGet(`products/${id}`);
    return this.parseProduct(response.data);
  }

  async getProductPhotos(id: string, page = 1, perPage = 15): Promise<PaginatedResponse<Media>> {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/photos`, query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parseMedia(item));
  }

  async getProductScreenshots(id: string, page = 1, perPage = 15): Promise<PaginatedResponse<Media>> {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/screenshots`, query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parseMedia(item));
  }

  async getProductCategories(id: string, page = 1, perPage = 15): Promise<PaginatedResponse<Category>> {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/categories`, query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parseCategory(item));
  }

  async getProductPublishers(id: string, page = 1, perPage = 15): Promise<PaginatedResponse<Publisher>> {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/publishers`, query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parsePublisher(item));
  }

  async getProductPlatforms(id: string, page = 1, perPage = 15): Promise<PaginatedResponse<Platform>> {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/platforms`, query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parsePlatform(item));
  }

  async getProductFranchises(id: string, page = 1, perPage = 15): Promise<PaginatedResponse<Franchise>> {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/franchises`, query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parseFranchise(item));
  }

  async getProductDevelopers(id: string, page = 1, perPage = 15): Promise<PaginatedResponse<Developer>> {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/developers`, query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parseDeveloper(item));
  }

  // =========================================================================
  // Orders
  // =========================================================================

  async getOrders(
    filters: Partial<Record<OrderFilter, string>> = {},
    page = 1,
    perPage = 15,
    sort = '-order_date',
  ): Promise<PaginatedResponse<Order>> {
    this.validateFilters(filters, ORDER_FILTERS as unknown as string[]);

    const query = this.buildPaginationQuery(page, perPage, sort);
    this.applyFilters(query, filters);

    const response = await this.doGet('orders', query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parseOrder(item));
  }

  async getOrder(id: string): Promise<Order> {
    const response = await this.doGet(`orders/${id}`);
    return this.parseOrder(response.data);
  }

  async getOrderItems(orderId: string, page = 1, perPage = 15): Promise<PaginatedResponse<OrderItem>> {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`orders/${orderId}/order-items`, query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parseOrderItem(item));
  }

  async createOrder(
    productUuid: string,
    quantity: number,
    regionCode: string,
    countryCode: string | null = null,
    externalReference: string | null = null,
  ): Promise<Order> {
    const body: Record<string, unknown> = {
      product_uuid: productUuid,
      quantity,
      region_code: regionCode,
    };

    if (countryCode !== null) {
      body.country_code = countryCode;
    }

    if (externalReference !== null) {
      body.external_reference = externalReference;
    }

    const response = await this.doPost('orders', body);
    return this.parseCustomOrderResponse(response.data.order);
  }

  async updateOrder(id: string, quantity: number): Promise<Order> {
    const response = await this.doPatch(`orders/${id}`, { quantity });
    return this.parseCustomOrderResponse(response.data.order);
  }

  async cancelOrder(id: string): Promise<boolean> {
    await this.doDelete(`orders/${id}/cancel`);
    return true;
  }

  // =========================================================================
  // License Keys
  // =========================================================================

  async getLicenseKey(id: string): Promise<LicenseKey> {
    const response = await this.doGet(`license-key/${id}`);
    return this.parseLicenseKey(response.data);
  }

  async getBulkLicenseKeys(ids: string[]): Promise<LicenseKey[]> {
    const response = await this.doPost('license-key', ids);
    return response.data.map((item: JsonData) => this.parseLicenseKey(item));
  }

  // =========================================================================
  // Catalog Dictionaries
  // =========================================================================

  async getCategories(page = 1, perPage = 15, sort: string | null = null): Promise<PaginatedResponse<Category>> {
    const query = this.buildPaginationQuery(page, perPage, sort);
    const response = await this.doGet('product-categories', query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parseCategory(item));
  }

  async getPublishers(page = 1, perPage = 15, sort: string | null = null): Promise<PaginatedResponse<Publisher>> {
    const query = this.buildPaginationQuery(page, perPage, sort);
    const response = await this.doGet('publishers', query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parsePublisher(item));
  }

  async getPlatforms(page = 1, perPage = 15, sort: string | null = null): Promise<PaginatedResponse<Platform>> {
    const query = this.buildPaginationQuery(page, perPage, sort);
    const response = await this.doGet('product-platforms', query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parsePlatform(item));
  }

  async getDevelopers(page = 1, perPage = 15, sort: string | null = null): Promise<PaginatedResponse<Developer>> {
    const query = this.buildPaginationQuery(page, perPage, sort);
    const response = await this.doGet('developers', query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parseDeveloper(item));
  }

  async getFranchises(page = 1, perPage = 15, sort: string | null = null): Promise<PaginatedResponse<Franchise>> {
    const query = this.buildPaginationQuery(page, perPage, sort);
    const response = await this.doGet('franchises', query);
    return this.parsePaginatedResponse(response, (item: JsonData) => this.parseFranchise(item));
  }

  // =========================================================================
  // Configuration
  // =========================================================================

  setMaxRetryOnRateLimit(max: number): this {
    this.maxRetryOnRateLimit = max;
    return this;
  }

  getMaxRetryOnRateLimit(): number {
    return this.maxRetryOnRateLimit;
  }

  getRateLimitRemaining(): number | null {
    return this.rateLimitRemaining;
  }

  getRateLimitLimit(): number | null {
    return this.rateLimitLimit;
  }

  canMakeRequest(): boolean {
    if (this.rateLimitRemaining === null) return true;
    return this.rateLimitRemaining > 0;
  }

  getRequestsPerMinute(): number {
    return this.rateLimiter.getMaxRequests();
  }

  setRequestsPerMinute(rpm: number): this {
    this.rateLimiter.setMaxRequests(rpm <= 0 ? Number.MAX_SAFE_INTEGER : rpm);
    return this;
  }

  getRateLimiter(): SlidingWindowRateLimiter {
    return this.rateLimiter;
  }

  getRateLimitState(): RateLimitState {
    return { limit: this.rateLimitLimit, remaining: this.rateLimitRemaining };
  }

  setRateLimitState(state: RateLimitState): this {
    this.rateLimitLimit = state.limit ?? null;
    this.rateLimitRemaining = state.remaining ?? null;
    return this;
  }

  // =========================================================================
  // Response parsers
  // =========================================================================

  private parseProduct(data: JsonData): Product {
    const a = data.attributes;

    const pricing: RegionalPricing[] = [];
    if (a.regional_pricing) {
      for (const region of a.regional_pricing) {
        pricing.push({
          regionCode: region.region_code,
          resellerWsp: Number(region.reseller_wsp),
          countries: region.countries.map(
            (c: JsonData): CountryPrice => ({
              countryName: c.country_name,
              countryCode: c.country_code,
              price: c.price !== null ? Number(c.price) : null,
              estimatedCost: c.estimated_cost != null ? Number(c.estimated_cost) : null,
              currencyCode: c.currency_code,
              isPromotion: c.is_promotion,
              originalPrice: c.original_price !== null ? Number(c.original_price) : null,
              promotionName: c.promotion_name,
              promotionEndDate: c.promotion_end_date,
              canBeOrdered: c.can_be_ordered,
              inStock: c.in_stock,
            }),
          ),
        });
      }
    }

    let metadata: ProductMetadata | null = null;
    if (a.metadata != null) {
      const sysReq = a.metadata.system_requirements ?? null;
      const steamdb = a.metadata.steamdb ?? null;

      metadata = {
        minimum: sysReq
          ? (sysReq.minimum ?? []).map((item: JsonData): SystemRequirement => ({ parameter: item.parameter, value: item.value }))
          : [],
        recommended: sysReq
          ? (sysReq.recommended ?? []).map((item: JsonData): SystemRequirement => ({ parameter: item.parameter, value: item.value }))
          : [],
        steamdb: steamdb ? { id: steamdb.id, type: steamdb.type, url: steamdb.url } satisfies SteamdbInfo : null,
      };
    }

    return {
      id: data.id,
      name: a.name,
      summary: a.summary,
      description: a.description,
      releaseDate: a.release_date,
      type: a.type,
      createdAt: a.created_at,
      regionalPricing: pricing,
      metadata,
    };
  }

  private parseOrder(data: JsonData): Order {
    const a = data.attributes;
    return {
      id: data.id,
      code: a.code,
      externalReference: a.external_reference,
      externalReferenceAttempt: a.external_reference_attempt,
      status: a.status,
      totalPrice: Number(a.total_price),
      srp: Number(a.srp),
      estimatedCost: a.estimated_cost !== null ? Number(a.estimated_cost) : null,
      itemsCount: Number(a.items_count),
      currencyCode: a.currency_code,
      orderDate: a.order_date,
      approvedAt: a.approved_at,
      rejectedAt: a.rejected_at,
      deliveredAt: a.delivered_at,
      distributionModel: a.distribution_model,
      rejectionNote: a.rejection_note,
    };
  }

  private parseCustomOrderResponse(o: JsonData): Order {
    return {
      id: o.uuid,
      code: o.code ?? '',
      externalReference: o.external_reference ?? null,
      externalReferenceAttempt: o.external_reference_attempt ?? null,
      status: o.status,
      totalPrice: Number(o.total_price),
      srp: Number(o.srp),
      estimatedCost: o.estimated_cost != null ? Number(o.estimated_cost) : null,
      itemsCount: Number(o.items_count ?? o.quantity ?? 0),
      currencyCode: o.currency_code,
      orderDate: o.date ?? o.order_date ?? '',
      approvedAt: o.approved_at ?? null,
      rejectedAt: o.rejected_at ?? null,
      deliveredAt: o.delivered_at ?? null,
      distributionModel: o.distribution_model ?? null,
      rejectionNote: o.rejection_note ?? null,
    };
  }

  private parseOrderItem(data: JsonData): OrderItem {
    const a = data.attributes;
    return {
      id: data.id,
      price: Number(a.price),
      countryCode: a.country_code,
      licenseKeyUuid: a.license_key_uuid,
      fulfilledAt: a.fulfilled_at,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    };
  }

  private parseLicenseKey(data: JsonData): LicenseKey {
    const a = data.attributes;
    return { id: data.id, licenseKey: a.license_key, createdAt: a.created_at, updatedAt: a.updated_at };
  }

  private parseMedia(data: JsonData): Media {
    const a = data.attributes;
    return {
      id: data.id,
      name: a.name,
      fileName: a.file_name,
      collectionName: a.collection_name,
      mimeType: a.mime_type,
      disk: a.disk,
      size: Number(a.size),
      orderColumn: a.order_column !== null ? Number(a.order_column) : null,
      url: a.url,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    };
  }

  private parseCategory(data: JsonData): Category {
    const a = data.attributes;
    return { id: data.id, name: a.name, parentId: a.parent_id, childIds: a.child_ids };
  }

  private parsePublisher(data: JsonData): Publisher {
    const a = data.attributes;
    return { id: data.id, name: a.name, website: a.website, about: a.about, createdAt: a.created_at, updatedAt: a.updated_at };
  }

  private parseDeveloper(data: JsonData): Developer {
    const a = data.attributes;
    return { id: data.id, name: a.name, website: a.website, about: a.about, createdAt: a.created_at, updatedAt: a.updated_at };
  }

  private parsePlatform(data: JsonData): Platform {
    const a = data.attributes;
    return { id: data.id, name: a.name, createdAt: a.created_at, updatedAt: a.updated_at };
  }

  private parseFranchise(data: JsonData): Franchise {
    const a = data.attributes;
    return { id: data.id, name: a.name, createdAt: a.created_at };
  }

  private parsePaginatedResponse<T>(response: JsonData, mapper: (item: JsonData) => T): PaginatedResponse<T> {
    const meta = response.meta.page;
    const links = response.links;

    return {
      data: response.data.map(mapper),
      currentPage: Number(meta.currentPage),
      perPage: Number(meta.perPage),
      total: Number(meta.total),
      lastPage: Number(meta.lastPage),
      firstPageUrl: links.first,
      lastPageUrl: links.last,
      nextPageUrl: links.next ?? null,
      prevPageUrl: links.prev ?? null,
    };
  }

  // =========================================================================
  // HTTP layer
  // =========================================================================

  private async doGet(endpoint: string, query: Record<string, string | number> = {}): Promise<JsonData> {
    return this.executeWithRateLimitRetry('GET', endpoint, { query });
  }

  private async doPost(endpoint: string, body: unknown = {}): Promise<JsonData> {
    return this.executeWithRateLimitRetry('POST', endpoint, { body });
  }

  private async doPatch(endpoint: string, body: unknown = {}): Promise<JsonData> {
    return this.executeWithRateLimitRetry('PATCH', endpoint, { body });
  }

  private async doDelete(endpoint: string): Promise<JsonData> {
    return this.executeWithRateLimitRetry('DELETE', endpoint);
  }

  private async executeWithRateLimitRetry(
    method: string,
    endpoint: string,
    options: { query?: Record<string, string | number>; body?: unknown } = {},
  ): Promise<JsonData> {
    let attempts = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      await this.rateLimiter.waitIfNeeded();

      try {
        const response = await this.makeRequest(method, endpoint, options);

        this.extractRateLimitHeaders(response.headers);

        if (!response.body || response.body.length === 0) {
          return {};
        }

        return JSON.parse(response.body);
      } catch (err: unknown) {
        if (isHttpError(err)) {
          this.extractRateLimitHeaders(err.headers ?? {});

          if (err.statusCode === 429) {
            attempts++;
            if (attempts > this.maxRetryOnRateLimit) {
              const retryAfter = this.parseRetryAfter(err.headers ?? {});
              throw new RateLimitError(
                `Rate limit exceeded after ${this.maxRetryOnRateLimit} retries`,
                retryAfter,
              );
            }

            const retryAfter = this.parseRetryAfter(err.headers ?? {}) ?? 1;
            await new Promise<void>((resolve) => setTimeout(resolve, retryAfter * 1000));
            continue;
          }

          this.throwApiError(err.statusCode, err.body);
        }

        throw new ApiError(err instanceof Error ? `HTTP request failed: ${err.message}` : 'HTTP request failed', 0);
      }
    }
  }

  private async makeRequest(
    method: string,
    endpoint: string,
    options: { query?: Record<string, string | number>; body?: unknown } = {},
  ): Promise<HttpResponse> {
    if (this.httpClient) {
      return this.httpClient.request(method, endpoint, options);
    }

    const url = new URL(endpoint, this.baseUrl);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.set(key, String(value));
      }
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${this.apiKey}`,
      'User-Agent': `UcubixNodeClient/${VERSION}`,
      'Content-Type': 'application/json',
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(30_000),
    };

    if (options.body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const res = await fetch(url.toString(), fetchOptions);
    const body = await res.text();

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    if (!res.ok) {
      const error = new Error(`HTTP ${res.status}`) as Error & HttpError;
      error.statusCode = res.status;
      error.headers = responseHeaders;
      error.body = body;
      throw error;
    }

    return { statusCode: res.status, headers: responseHeaders, body };
  }

  private extractRateLimitHeaders(headers: Record<string, string>): void {
    const limit = headers['x-ratelimit-limit'] ?? headers['X-RateLimit-Limit'];
    const remaining = headers['x-ratelimit-remaining'] ?? headers['X-RateLimit-Remaining'];

    if (limit) {
      this.rateLimitLimit = Number(limit);
      this.rateLimiter.adaptFromServerLimit(this.rateLimitLimit);
    }

    if (remaining) {
      this.rateLimitRemaining = Number(remaining);
    }
  }

  private parseRetryAfter(headers: Record<string, string>): number | null {
    const header = headers['retry-after'] ?? headers['Retry-After'];
    return header ? Number(header) : null;
  }

  private throwApiError(statusCode: number, rawBody: string): never {
    let body: JsonData;
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = {};
    }

    let message: string;
    let errorKey: string | null = null;
    let errorDetail: string | null = null;

    if (body.errors && Array.isArray(body.errors)) {
      const firstError = body.errors[0] ?? {};
      message = firstError.detail ?? firstError.title ?? 'API request failed';
      errorKey = firstError.source?.pointer ?? null;
      errorDetail = message;
    } else {
      const error = body.error ?? {};
      if (typeof error === 'object' && error !== null) {
        message = error.message ?? body.message ?? 'API request failed';
        errorDetail = error.detail ?? null;
      } else {
        message = body.message ?? (typeof error === 'string' ? error : 'API request failed');
        errorDetail = typeof error === 'string' ? error : null;
      }
      errorKey = body.key ?? null;
    }

    switch (statusCode) {
      case 401:
      case 403:
        throw new AuthenticationError(message, statusCode);
      case 422:
        throw new ValidationError(message, errorKey);
      default:
        throw new ApiError(message, statusCode, errorKey, errorDetail);
    }
  }

  private validateFilters(filters: Record<string, unknown>, allowed: string[]): void {
    const invalid = Object.keys(filters).filter((k) => !allowed.includes(k));
    if (invalid.length > 0) {
      throw new Error(`Invalid filter(s): ${invalid.join(', ')}. Allowed: ${allowed.join(', ')}`);
    }
  }

  private applyFilters(query: Record<string, string | number>, filters: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(filters)) {
      query[`filter[${key}]`] = String(value);
    }
  }

  private buildPaginationQuery(page = 1, perPage = 15, sort: string | null = null): Record<string, string | number> {
    const query: Record<string, string | number> = {
      'page[number]': page,
      'page[size]': perPage,
    };

    if (sort !== null) {
      query.sort = sort;
    }

    return query;
  }
}
