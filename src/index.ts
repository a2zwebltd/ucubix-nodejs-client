// Client
export { UcubixClient, VERSION, DEFAULT_BASE_URL } from './ucubix-client.js';
export type { HttpClient, HttpResponse, RateLimitState } from './ucubix-client.js';

// DTOs
export type { Category } from './dto/category.js';
export type { CountryPrice } from './dto/country-price.js';
export type { CreditLine } from './dto/credit-line.js';
export type { Developer } from './dto/developer.js';
export type { Franchise } from './dto/franchise.js';
export type { LicenseKey } from './dto/license-key.js';
export type { Media } from './dto/media.js';
export type { Order } from './dto/order.js';
export { getOrderStatus } from './dto/order.js';
export type { OrderItem } from './dto/order-item.js';
export { hasLicenseKey } from './dto/order-item.js';
export type { Organisation } from './dto/organisation.js';
export type { OrganisationSummary } from './dto/organisation-summary.js';
export type { PaginatedResponse } from './dto/paginated-response.js';
export { hasMorePages } from './dto/paginated-response.js';
export type { Platform } from './dto/platform.js';
export type { Product } from './dto/product.js';
export type { ProductMetadata } from './dto/product-metadata.js';
export type { Publisher } from './dto/publisher.js';
export type { RegionalPricing } from './dto/regional-pricing.js';
export type { SteamdbInfo } from './dto/steamdb-info.js';
export type { SystemRequirement } from './dto/system-requirement.js';

// Enums
export { OrderStatus } from './enums/order-status.js';

// Exceptions
export { ApiError } from './exceptions/api-error.js';
export { AuthenticationError } from './exceptions/authentication-error.js';
export { RateLimitError } from './exceptions/rate-limit-error.js';
export { ValidationError } from './exceptions/validation-error.js';

// Rate Limiting
export { SlidingWindowRateLimiter } from './rate-limit/sliding-window-rate-limiter.js';
