interface Category {
    readonly id: string;
    readonly name: string;
    readonly parentId: string | null;
    readonly childIds: string[];
}

interface Developer {
    readonly id: string;
    readonly name: string;
    readonly website: string | null;
    readonly about: string | null;
    readonly createdAt: string | null;
    readonly updatedAt: string | null;
}

interface Franchise {
    readonly id: string;
    readonly name: string;
    readonly createdAt: string | null;
}

interface LicenseKey {
    readonly id: string;
    readonly licenseKey: string;
    readonly createdAt: string | null;
    readonly updatedAt: string | null;
}

interface Media {
    readonly id: string;
    readonly name: string;
    readonly fileName: string;
    readonly collectionName: string;
    readonly mimeType: string;
    readonly disk: string;
    readonly size: number;
    readonly orderColumn: number | null;
    readonly url: string;
    readonly createdAt: string | null;
    readonly updatedAt: string | null;
}

declare const OrderStatus: {
    readonly NEW: "new";
    readonly PENDING: "pending";
    readonly APPROVED: "approved";
    readonly REJECTED: "rejected";
    readonly FULFILLED: "fulfilled";
    readonly DELIVERED: "delivered";
    readonly CANCELLED: "cancelled";
};
type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

interface Order {
    readonly id: string;
    readonly code: string;
    readonly externalReference: string | null;
    readonly externalReferenceAttempt: number | null;
    readonly status: string;
    readonly totalPrice: number;
    readonly srp: number;
    readonly estimatedCost: number | null;
    readonly itemsCount: number;
    readonly currencyCode: string | null;
    readonly orderDate: string;
    readonly approvedAt: string | null;
    readonly rejectedAt: string | null;
    readonly deliveredAt: string | null;
    readonly distributionModel: string | null;
    readonly rejectionNote: string | null;
}
declare function getOrderStatus(order: Order): OrderStatus;

interface OrderItem {
    readonly id: string;
    readonly price: number;
    readonly countryCode: string | null;
    readonly licenseKeyUuid: string | null;
    readonly fulfilledAt: string | null;
    readonly createdAt: string | null;
    readonly updatedAt: string | null;
}
declare function hasLicenseKey(item: OrderItem): boolean;

interface CreditLine {
    readonly currency: string;
    readonly balance: string;
}

interface OrganisationSummary {
    readonly currencies: number;
    readonly totalUsdEquivalent: string;
}

interface Organisation {
    readonly uuid: string;
    readonly name: string;
    readonly summary: OrganisationSummary;
    readonly creditLines: CreditLine[];
}

interface PaginatedResponse<T> {
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
declare function hasMorePages<T>(response: PaginatedResponse<T>): boolean;

interface Platform {
    readonly id: string;
    readonly name: string;
    readonly createdAt: string | null;
    readonly updatedAt: string | null;
}

interface SteamdbInfo {
    readonly id: number;
    readonly type: string;
    readonly url: string;
}

interface SystemRequirement {
    readonly parameter: string | null;
    readonly value: string | null;
}

interface ProductMetadata {
    readonly minimum: SystemRequirement[];
    readonly recommended: SystemRequirement[];
    readonly steamdb: SteamdbInfo | null;
}

interface CountryPrice {
    readonly countryName: string;
    readonly countryCode: string;
    readonly price: number | null;
    readonly currencyCode: string | null;
    readonly isPromotion: boolean;
    readonly originalPrice: number | null;
    readonly promotionName: string | null;
    readonly promotionEndDate: string | null;
    readonly canBeOrdered: boolean;
    readonly inStock: boolean;
}

interface RegionalPricing {
    readonly regionCode: string;
    readonly resellerWsp: number;
    readonly countries: CountryPrice[];
}

interface Product {
    readonly id: string;
    readonly name: string;
    readonly summary: string | null;
    readonly description: string | null;
    readonly releaseDate: string | null;
    readonly type: string | null;
    readonly createdAt: string | null;
    readonly regionalPricing: RegionalPricing[];
    readonly metadata: ProductMetadata | null;
}

interface Publisher {
    readonly id: string;
    readonly name: string;
    readonly website: string | null;
    readonly about: string | null;
    readonly createdAt: string | null;
    readonly updatedAt: string | null;
}

declare class SlidingWindowRateLimiter {
    private maxRequests;
    private readonly windowSeconds;
    private timestamps;
    constructor(maxRequests?: number, windowSeconds?: number);
    waitIfNeeded(): Promise<number>;
    canProceed(): boolean;
    remaining(): number;
    adaptFromServerLimit(serverLimit: number): void;
    getMaxRequests(): number;
    setMaxRequests(maxRequests: number): void;
    getWindowSeconds(): number;
    reset(): void;
    private pruneExpired;
}

declare const VERSION = "1.0.0";
declare const DEFAULT_BASE_URL = "https://ucubix.com/api/v1/";
declare const PRODUCT_FILTERS: readonly ["search", "category", "publisher", "developer", "franchise", "platform"];
declare const ORDER_FILTERS: readonly ["code", "external_reference"];
type ProductFilter = (typeof PRODUCT_FILTERS)[number];
type OrderFilter = (typeof ORDER_FILTERS)[number];
interface HttpResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
}
interface HttpClient {
    request(method: string, endpoint: string, options?: {
        query?: Record<string, string | number>;
        body?: unknown;
    }): Promise<HttpResponse>;
}
interface RateLimitState {
    limit: number | null;
    remaining: number | null;
}
declare class UcubixClient {
    static readonly VERSION = "1.0.0";
    static readonly DEFAULT_BASE_URL = "https://ucubix.com/api/v1/";
    private readonly apiKey;
    private readonly baseUrl;
    private readonly rateLimiter;
    private readonly httpClient;
    private rateLimitRemaining;
    private rateLimitLimit;
    private maxRetryOnRateLimit;
    constructor(apiKey: string, baseUrl?: string, httpClient?: HttpClient | null);
    getOrganisation(): Promise<Organisation>;
    getProducts(filters?: Partial<Record<ProductFilter, string>>, page?: number, perPage?: number, sort?: string | null): Promise<PaginatedResponse<Product>>;
    getProduct(id: string): Promise<Product>;
    getProductPhotos(id: string, page?: number, perPage?: number): Promise<PaginatedResponse<Media>>;
    getProductScreenshots(id: string, page?: number, perPage?: number): Promise<PaginatedResponse<Media>>;
    getProductCategories(id: string, page?: number, perPage?: number): Promise<PaginatedResponse<Category>>;
    getProductPublishers(id: string, page?: number, perPage?: number): Promise<PaginatedResponse<Publisher>>;
    getProductPlatforms(id: string, page?: number, perPage?: number): Promise<PaginatedResponse<Platform>>;
    getProductFranchises(id: string, page?: number, perPage?: number): Promise<PaginatedResponse<Franchise>>;
    getProductDevelopers(id: string, page?: number, perPage?: number): Promise<PaginatedResponse<Developer>>;
    getOrders(filters?: Partial<Record<OrderFilter, string>>, page?: number, perPage?: number, sort?: string): Promise<PaginatedResponse<Order>>;
    getOrder(id: string): Promise<Order>;
    getOrderItems(orderId: string, page?: number, perPage?: number): Promise<PaginatedResponse<OrderItem>>;
    createOrder(productUuid: string, quantity: number, regionCode: string, countryCode?: string | null): Promise<Order>;
    updateOrder(id: string, quantity: number): Promise<Order>;
    cancelOrder(id: string): Promise<boolean>;
    getLicenseKey(id: string): Promise<LicenseKey>;
    getBulkLicenseKeys(ids: string[]): Promise<LicenseKey[]>;
    getCategories(page?: number, perPage?: number, sort?: string | null): Promise<PaginatedResponse<Category>>;
    getPublishers(page?: number, perPage?: number, sort?: string | null): Promise<PaginatedResponse<Publisher>>;
    getPlatforms(page?: number, perPage?: number, sort?: string | null): Promise<PaginatedResponse<Platform>>;
    getDevelopers(page?: number, perPage?: number, sort?: string | null): Promise<PaginatedResponse<Developer>>;
    getFranchises(page?: number, perPage?: number, sort?: string | null): Promise<PaginatedResponse<Franchise>>;
    setMaxRetryOnRateLimit(max: number): this;
    getMaxRetryOnRateLimit(): number;
    getRateLimitRemaining(): number | null;
    getRateLimitLimit(): number | null;
    canMakeRequest(): boolean;
    getRequestsPerMinute(): number;
    setRequestsPerMinute(rpm: number): this;
    getRateLimiter(): SlidingWindowRateLimiter;
    getRateLimitState(): RateLimitState;
    setRateLimitState(state: RateLimitState): this;
    private parseProduct;
    private parseOrder;
    private parseCustomOrderResponse;
    private parseOrderItem;
    private parseLicenseKey;
    private parseMedia;
    private parseCategory;
    private parsePublisher;
    private parseDeveloper;
    private parsePlatform;
    private parseFranchise;
    private parsePaginatedResponse;
    private doGet;
    private doPost;
    private doPatch;
    private doDelete;
    private executeWithRateLimitRetry;
    private makeRequest;
    private extractRateLimitHeaders;
    private parseRetryAfter;
    private throwApiError;
    private validateFilters;
    private applyFilters;
    private buildPaginationQuery;
}

declare class ApiError extends Error {
    readonly statusCode: number;
    readonly errorKey: string | null;
    readonly errorDetail: string | null;
    constructor(message: string, statusCode?: number, errorKey?: string | null, errorDetail?: string | null);
}

declare class AuthenticationError extends ApiError {
    constructor(message: string, statusCode: number);
}

declare class RateLimitError extends ApiError {
    readonly retryAfter: number | null;
    constructor(message?: string, retryAfter?: number | null);
}

declare class ValidationError extends ApiError {
    readonly field: string | null;
    constructor(message?: string, field?: string | null);
}

export { ApiError, AuthenticationError, type Category, type CountryPrice, type CreditLine, DEFAULT_BASE_URL, type Developer, type Franchise, type HttpClient, type HttpResponse, type LicenseKey, type Media, type Order, type OrderItem, OrderStatus, type Organisation, type OrganisationSummary, type PaginatedResponse, type Platform, type Product, type ProductMetadata, type Publisher, RateLimitError, type RateLimitState, type RegionalPricing, SlidingWindowRateLimiter, type SteamdbInfo, type SystemRequirement, UcubixClient, VERSION, ValidationError, getOrderStatus, hasLicenseKey, hasMorePages };
