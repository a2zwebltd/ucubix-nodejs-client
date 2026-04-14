// src/exceptions/api-error.ts
var ApiError = class extends Error {
  constructor(message, statusCode = 0, errorKey = null, errorDetail = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorKey = errorKey;
    this.errorDetail = errorDetail;
    this.name = "ApiError";
  }
  statusCode;
  errorKey;
  errorDetail;
};

// src/exceptions/authentication-error.ts
var AuthenticationError = class extends ApiError {
  constructor(message, statusCode) {
    super(message, statusCode);
    this.name = "AuthenticationError";
  }
};

// src/exceptions/rate-limit-error.ts
var RateLimitError = class extends ApiError {
  constructor(message = "Rate limit exceeded", retryAfter = null) {
    super(message, 429);
    this.retryAfter = retryAfter;
    this.name = "RateLimitError";
  }
  retryAfter;
};

// src/exceptions/validation-error.ts
var ValidationError = class extends ApiError {
  constructor(message = "Validation failed", field = null) {
    super(message, 422, field);
    this.field = field;
    this.name = "ValidationError";
  }
  field;
};

// src/rate-limit/sliding-window-rate-limiter.ts
var SlidingWindowRateLimiter = class {
  constructor(maxRequests = 100, windowSeconds = 60) {
    this.maxRequests = maxRequests;
    this.windowSeconds = windowSeconds;
  }
  maxRequests;
  windowSeconds;
  timestamps = [];
  async waitIfNeeded() {
    this.pruneExpired();
    let waited = 0;
    if (this.timestamps.length >= this.maxRequests) {
      const oldestInWindow = this.timestamps[0];
      const waitUntil = oldestInWindow + this.windowSeconds * 1e3;
      const sleepTime = waitUntil - Date.now() + 50;
      if (sleepTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, sleepTime));
        waited = sleepTime / 1e3;
      }
      this.pruneExpired();
    }
    this.timestamps.push(Date.now());
    return waited;
  }
  canProceed() {
    this.pruneExpired();
    return this.timestamps.length < this.maxRequests;
  }
  remaining() {
    this.pruneExpired();
    return Math.max(0, this.maxRequests - this.timestamps.length);
  }
  adaptFromServerLimit(serverLimit) {
    if (serverLimit > this.maxRequests) {
      this.maxRequests = serverLimit;
    }
  }
  getMaxRequests() {
    return this.maxRequests;
  }
  setMaxRequests(maxRequests) {
    this.maxRequests = Math.max(1, maxRequests);
  }
  getWindowSeconds() {
    return this.windowSeconds;
  }
  reset() {
    this.timestamps = [];
  }
  pruneExpired() {
    const cutoff = Date.now() - this.windowSeconds * 1e3;
    this.timestamps = this.timestamps.filter((ts) => ts > cutoff);
  }
};

// src/ucubix-client.ts
var VERSION = "1.0.0";
var DEFAULT_BASE_URL = "https://ucubix.com/api/v1/";
var PRODUCT_FILTERS = ["search", "category", "publisher", "developer", "franchise", "platform"];
var ORDER_FILTERS = ["code", "external_reference"];
function isHttpError(err) {
  return err instanceof Error && "statusCode" in err && typeof err.statusCode === "number";
}
var UcubixClient = class {
  static VERSION = VERSION;
  static DEFAULT_BASE_URL = DEFAULT_BASE_URL;
  apiKey;
  baseUrl;
  rateLimiter;
  httpClient;
  rateLimitRemaining = null;
  rateLimitLimit = null;
  maxRetryOnRateLimit = 3;
  constructor(apiKey, baseUrl = DEFAULT_BASE_URL, httpClient = null) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
    this.rateLimiter = new SlidingWindowRateLimiter(100, 60);
    this.httpClient = httpClient;
  }
  // =========================================================================
  // General Info
  // =========================================================================
  async getOrganisation() {
    const response = await this.doGet("info");
    const data = response.data;
    return {
      uuid: data.organisation.uuid,
      name: data.organisation.name,
      summary: {
        currencies: Number(data.summary.currencies),
        totalUsdEquivalent: data.summary.total_usd_equivalent
      },
      creditLines: data.credit_lines.map((cl) => ({
        currency: cl.currency,
        balance: cl.balance
      }))
    };
  }
  // =========================================================================
  // Products Catalog
  // =========================================================================
  async getProducts(filters = {}, page = 1, perPage = 15, sort = null) {
    this.validateFilters(filters, PRODUCT_FILTERS);
    const query = this.buildPaginationQuery(page, perPage, sort);
    this.applyFilters(query, filters);
    const response = await this.doGet("products", query);
    return this.parsePaginatedResponse(response, (item) => this.parseProduct(item));
  }
  async getProduct(id) {
    const response = await this.doGet(`products/${id}`);
    return this.parseProduct(response.data);
  }
  async getProductPhotos(id, page = 1, perPage = 15) {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/photos`, query);
    return this.parsePaginatedResponse(response, (item) => this.parseMedia(item));
  }
  async getProductScreenshots(id, page = 1, perPage = 15) {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/screenshots`, query);
    return this.parsePaginatedResponse(response, (item) => this.parseMedia(item));
  }
  async getProductCategories(id, page = 1, perPage = 15) {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/categories`, query);
    return this.parsePaginatedResponse(response, (item) => this.parseCategory(item));
  }
  async getProductPublishers(id, page = 1, perPage = 15) {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/publishers`, query);
    return this.parsePaginatedResponse(response, (item) => this.parsePublisher(item));
  }
  async getProductPlatforms(id, page = 1, perPage = 15) {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/platforms`, query);
    return this.parsePaginatedResponse(response, (item) => this.parsePlatform(item));
  }
  async getProductFranchises(id, page = 1, perPage = 15) {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/franchises`, query);
    return this.parsePaginatedResponse(response, (item) => this.parseFranchise(item));
  }
  async getProductDevelopers(id, page = 1, perPage = 15) {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`products/${id}/developers`, query);
    return this.parsePaginatedResponse(response, (item) => this.parseDeveloper(item));
  }
  // =========================================================================
  // Orders
  // =========================================================================
  async getOrders(filters = {}, page = 1, perPage = 15, sort = "-order_date") {
    this.validateFilters(filters, ORDER_FILTERS);
    const query = this.buildPaginationQuery(page, perPage, sort);
    this.applyFilters(query, filters);
    const response = await this.doGet("orders", query);
    return this.parsePaginatedResponse(response, (item) => this.parseOrder(item));
  }
  async getOrder(id) {
    const response = await this.doGet(`orders/${id}`);
    return this.parseOrder(response.data);
  }
  async getOrderItems(orderId, page = 1, perPage = 15) {
    const query = this.buildPaginationQuery(page, perPage);
    const response = await this.doGet(`orders/${orderId}/order-items`, query);
    return this.parsePaginatedResponse(response, (item) => this.parseOrderItem(item));
  }
  async createOrder(productUuid, quantity, regionCode, countryCode = null) {
    const body = {
      product_uuid: productUuid,
      quantity,
      region_code: regionCode
    };
    if (countryCode !== null) {
      body.country_code = countryCode;
    }
    const response = await this.doPost("orders", body);
    return this.parseCustomOrderResponse(response.data.order);
  }
  async updateOrder(id, quantity) {
    const response = await this.doPatch(`orders/${id}`, { quantity });
    return this.parseCustomOrderResponse(response.data.order);
  }
  async cancelOrder(id) {
    await this.doDelete(`orders/${id}/cancel`);
    return true;
  }
  // =========================================================================
  // License Keys
  // =========================================================================
  async getLicenseKey(id) {
    const response = await this.doGet(`license-key/${id}`);
    return this.parseLicenseKey(response.data);
  }
  async getBulkLicenseKeys(ids) {
    const response = await this.doPost("license-key", ids);
    return response.data.map((item) => this.parseLicenseKey(item));
  }
  // =========================================================================
  // Catalog Dictionaries
  // =========================================================================
  async getCategories(page = 1, perPage = 15, sort = null) {
    const query = this.buildPaginationQuery(page, perPage, sort);
    const response = await this.doGet("product-categories", query);
    return this.parsePaginatedResponse(response, (item) => this.parseCategory(item));
  }
  async getPublishers(page = 1, perPage = 15, sort = null) {
    const query = this.buildPaginationQuery(page, perPage, sort);
    const response = await this.doGet("publishers", query);
    return this.parsePaginatedResponse(response, (item) => this.parsePublisher(item));
  }
  async getPlatforms(page = 1, perPage = 15, sort = null) {
    const query = this.buildPaginationQuery(page, perPage, sort);
    const response = await this.doGet("product-platforms", query);
    return this.parsePaginatedResponse(response, (item) => this.parsePlatform(item));
  }
  async getDevelopers(page = 1, perPage = 15, sort = null) {
    const query = this.buildPaginationQuery(page, perPage, sort);
    const response = await this.doGet("developers", query);
    return this.parsePaginatedResponse(response, (item) => this.parseDeveloper(item));
  }
  async getFranchises(page = 1, perPage = 15, sort = null) {
    const query = this.buildPaginationQuery(page, perPage, sort);
    const response = await this.doGet("franchises", query);
    return this.parsePaginatedResponse(response, (item) => this.parseFranchise(item));
  }
  // =========================================================================
  // Configuration
  // =========================================================================
  setMaxRetryOnRateLimit(max) {
    this.maxRetryOnRateLimit = max;
    return this;
  }
  getMaxRetryOnRateLimit() {
    return this.maxRetryOnRateLimit;
  }
  getRateLimitRemaining() {
    return this.rateLimitRemaining;
  }
  getRateLimitLimit() {
    return this.rateLimitLimit;
  }
  canMakeRequest() {
    if (this.rateLimitRemaining === null) return true;
    return this.rateLimitRemaining > 0;
  }
  getRequestsPerMinute() {
    return this.rateLimiter.getMaxRequests();
  }
  setRequestsPerMinute(rpm) {
    this.rateLimiter.setMaxRequests(rpm <= 0 ? Number.MAX_SAFE_INTEGER : rpm);
    return this;
  }
  getRateLimiter() {
    return this.rateLimiter;
  }
  getRateLimitState() {
    return { limit: this.rateLimitLimit, remaining: this.rateLimitRemaining };
  }
  setRateLimitState(state) {
    this.rateLimitLimit = state.limit ?? null;
    this.rateLimitRemaining = state.remaining ?? null;
    return this;
  }
  // =========================================================================
  // Response parsers
  // =========================================================================
  parseProduct(data) {
    const a = data.attributes;
    const pricing = [];
    if (a.regional_pricing) {
      for (const region of a.regional_pricing) {
        pricing.push({
          regionCode: region.region_code,
          resellerWsp: Number(region.reseller_wsp),
          countries: region.countries.map(
            (c) => ({
              countryName: c.country_name,
              countryCode: c.country_code,
              price: c.price !== null ? Number(c.price) : null,
              currencyCode: c.currency_code,
              isPromotion: c.is_promotion,
              originalPrice: c.original_price !== null ? Number(c.original_price) : null,
              promotionName: c.promotion_name,
              promotionEndDate: c.promotion_end_date,
              canBeOrdered: c.can_be_ordered,
              inStock: c.in_stock
            })
          )
        });
      }
    }
    let metadata = null;
    if (a.metadata != null) {
      const sysReq = a.metadata.system_requirements ?? null;
      const steamdb = a.metadata.steamdb ?? null;
      metadata = {
        minimum: sysReq ? (sysReq.minimum ?? []).map((item) => ({ parameter: item.parameter, value: item.value })) : [],
        recommended: sysReq ? (sysReq.recommended ?? []).map((item) => ({ parameter: item.parameter, value: item.value })) : [],
        steamdb: steamdb ? { id: steamdb.id, type: steamdb.type, url: steamdb.url } : null
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
      metadata
    };
  }
  parseOrder(data) {
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
      rejectionNote: a.rejection_note
    };
  }
  parseCustomOrderResponse(o) {
    return {
      id: o.uuid,
      code: o.code ?? "",
      externalReference: o.external_reference ?? null,
      externalReferenceAttempt: o.external_reference_attempt ?? null,
      status: o.status,
      totalPrice: Number(o.total_price),
      srp: Number(o.srp),
      estimatedCost: o.estimated_cost != null ? Number(o.estimated_cost) : null,
      itemsCount: Number(o.items_count ?? o.quantity ?? 0),
      currencyCode: o.currency_code,
      orderDate: o.date ?? o.order_date ?? "",
      approvedAt: o.approved_at ?? null,
      rejectedAt: o.rejected_at ?? null,
      deliveredAt: o.delivered_at ?? null,
      distributionModel: o.distribution_model ?? null,
      rejectionNote: o.rejection_note ?? null
    };
  }
  parseOrderItem(data) {
    const a = data.attributes;
    return {
      id: data.id,
      price: Number(a.price),
      countryCode: a.country_code,
      licenseKeyUuid: a.license_key_uuid,
      fulfilledAt: a.fulfilled_at,
      createdAt: a.created_at,
      updatedAt: a.updated_at
    };
  }
  parseLicenseKey(data) {
    const a = data.attributes;
    return { id: data.id, licenseKey: a.license_key, createdAt: a.created_at, updatedAt: a.updated_at };
  }
  parseMedia(data) {
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
      updatedAt: a.updated_at
    };
  }
  parseCategory(data) {
    const a = data.attributes;
    return { id: data.id, name: a.name, parentId: a.parent_id, childIds: a.child_ids };
  }
  parsePublisher(data) {
    const a = data.attributes;
    return { id: data.id, name: a.name, website: a.website, about: a.about, createdAt: a.created_at, updatedAt: a.updated_at };
  }
  parseDeveloper(data) {
    const a = data.attributes;
    return { id: data.id, name: a.name, website: a.website, about: a.about, createdAt: a.created_at, updatedAt: a.updated_at };
  }
  parsePlatform(data) {
    const a = data.attributes;
    return { id: data.id, name: a.name, createdAt: a.created_at, updatedAt: a.updated_at };
  }
  parseFranchise(data) {
    const a = data.attributes;
    return { id: data.id, name: a.name, createdAt: a.created_at };
  }
  parsePaginatedResponse(response, mapper) {
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
      prevPageUrl: links.prev ?? null
    };
  }
  // =========================================================================
  // HTTP layer
  // =========================================================================
  async doGet(endpoint, query = {}) {
    return this.executeWithRateLimitRetry("GET", endpoint, { query });
  }
  async doPost(endpoint, body = {}) {
    return this.executeWithRateLimitRetry("POST", endpoint, { body });
  }
  async doPatch(endpoint, body = {}) {
    return this.executeWithRateLimitRetry("PATCH", endpoint, { body });
  }
  async doDelete(endpoint) {
    return this.executeWithRateLimitRetry("DELETE", endpoint);
  }
  async executeWithRateLimitRetry(method, endpoint, options = {}) {
    let attempts = 0;
    while (true) {
      await this.rateLimiter.waitIfNeeded();
      try {
        const response = await this.makeRequest(method, endpoint, options);
        this.extractRateLimitHeaders(response.headers);
        if (!response.body || response.body.length === 0) {
          return {};
        }
        return JSON.parse(response.body);
      } catch (err) {
        if (isHttpError(err)) {
          this.extractRateLimitHeaders(err.headers ?? {});
          if (err.statusCode === 429) {
            attempts++;
            if (attempts > this.maxRetryOnRateLimit) {
              const retryAfter2 = this.parseRetryAfter(err.headers ?? {});
              throw new RateLimitError(
                `Rate limit exceeded after ${this.maxRetryOnRateLimit} retries`,
                retryAfter2
              );
            }
            const retryAfter = this.parseRetryAfter(err.headers ?? {}) ?? 1;
            await new Promise((resolve) => setTimeout(resolve, retryAfter * 1e3));
            continue;
          }
          this.throwApiError(err.statusCode, err.body);
        }
        throw new ApiError(err instanceof Error ? `HTTP request failed: ${err.message}` : "HTTP request failed", 0);
      }
    }
  }
  async makeRequest(method, endpoint, options = {}) {
    if (this.httpClient) {
      return this.httpClient.request(method, endpoint, options);
    }
    const url = new URL(endpoint, this.baseUrl);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        url.searchParams.set(key, String(value));
      }
    }
    const headers = {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${this.apiKey}`,
      "User-Agent": `UcubixNodeClient/${VERSION}`,
      "Content-Type": "application/json"
    };
    const fetchOptions = {
      method,
      headers,
      signal: AbortSignal.timeout(3e4)
    };
    if (options.body && (method === "POST" || method === "PATCH" || method === "PUT")) {
      fetchOptions.body = JSON.stringify(options.body);
    }
    const res = await fetch(url.toString(), fetchOptions);
    const body = await res.text();
    const responseHeaders = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    if (!res.ok) {
      const error = new Error(`HTTP ${res.status}`);
      error.statusCode = res.status;
      error.headers = responseHeaders;
      error.body = body;
      throw error;
    }
    return { statusCode: res.status, headers: responseHeaders, body };
  }
  extractRateLimitHeaders(headers) {
    const limit = headers["x-ratelimit-limit"] ?? headers["X-RateLimit-Limit"];
    const remaining = headers["x-ratelimit-remaining"] ?? headers["X-RateLimit-Remaining"];
    if (limit) {
      this.rateLimitLimit = Number(limit);
      this.rateLimiter.adaptFromServerLimit(this.rateLimitLimit);
    }
    if (remaining) {
      this.rateLimitRemaining = Number(remaining);
    }
  }
  parseRetryAfter(headers) {
    const header = headers["retry-after"] ?? headers["Retry-After"];
    return header ? Number(header) : null;
  }
  throwApiError(statusCode, rawBody) {
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = {};
    }
    let message;
    let errorKey = null;
    let errorDetail = null;
    if (body.errors && Array.isArray(body.errors)) {
      const firstError = body.errors[0] ?? {};
      message = firstError.detail ?? firstError.title ?? "API request failed";
      errorKey = firstError.source?.pointer ?? null;
      errorDetail = message;
    } else {
      const error = body.error ?? {};
      if (typeof error === "object" && error !== null) {
        message = error.message ?? body.message ?? "API request failed";
        errorDetail = error.detail ?? null;
      } else {
        message = body.message ?? (typeof error === "string" ? error : "API request failed");
        errorDetail = typeof error === "string" ? error : null;
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
  validateFilters(filters, allowed) {
    const invalid = Object.keys(filters).filter((k) => !allowed.includes(k));
    if (invalid.length > 0) {
      throw new Error(`Invalid filter(s): ${invalid.join(", ")}. Allowed: ${allowed.join(", ")}`);
    }
  }
  applyFilters(query, filters) {
    for (const [key, value] of Object.entries(filters)) {
      query[`filter[${key}]`] = String(value);
    }
  }
  buildPaginationQuery(page = 1, perPage = 15, sort = null) {
    const query = {
      "page[number]": page,
      "page[size]": perPage
    };
    if (sort !== null) {
      query.sort = sort;
    }
    return query;
  }
};

// src/enums/order-status.ts
var OrderStatus = {
  NEW: "new",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  FULFILLED: "fulfilled",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
};

// src/dto/order.ts
function getOrderStatus(order) {
  const values = Object.values(OrderStatus);
  if (!values.includes(order.status)) {
    throw new Error(`Unknown order status: ${order.status}`);
  }
  return order.status;
}

// src/dto/order-item.ts
function hasLicenseKey(item) {
  return item.licenseKeyUuid !== null;
}

// src/dto/paginated-response.ts
function hasMorePages(response) {
  return response.currentPage < response.lastPage;
}
export {
  ApiError,
  AuthenticationError,
  DEFAULT_BASE_URL,
  OrderStatus,
  RateLimitError,
  SlidingWindowRateLimiter,
  UcubixClient,
  VERSION,
  ValidationError,
  getOrderStatus,
  hasLicenseKey,
  hasMorePages
};
//# sourceMappingURL=index.js.map