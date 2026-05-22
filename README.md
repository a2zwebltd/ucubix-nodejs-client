# UCubix Node.js Client

Node.js/TypeScript client for the [UCubix Distribution API](https://ucubix.com) with built-in rate limiting, typed DTOs, and full endpoint coverage.

## Requirements

- Node.js 18+
- Zero runtime dependencies (uses native `fetch`)

## Installation

```bash
npm install ucubix-node-client
```

## Quick Start

```ts
import { UcubixClient, hasLicenseKey } from 'ucubix-node-client';

const client = new UcubixClient('YOUR_API_KEY');

// Find a product
const products = await client.getProducts({ search: 'Cyberpunk' });
const product = await client.getProduct(products.data[0].id);

// Check regional pricing
for (const region of product.regionalPricing) {
  console.log(`${region.regionCode} (${region.resellerWsp}% WSP)`);
  for (const country of region.countries) {
    console.log(`  ${country.countryName}: ${country.price} ${country.currencyCode}`);
  }
}

// Create an order
const order = await client.createOrder(
  product.id,
  1,
  product.regionalPricing[0].regionCode,
  product.regionalPricing[0].countries[0].countryCode,
);

console.log(`Order ${order.id} — status: ${order.status}`);

// Get license keys when order is fulfilled
const items = await client.getOrderItems(order.id);
for (const item of items.data) {
  if (hasLicenseKey(item)) {
    const key = await client.getLicenseKey(item.licenseKeyUuid!);
    console.log(`Key: ${key.licenseKey}`);
  }
}
```

## Configuration

```ts
const client = new UcubixClient(
  'YOUR_API_KEY',
  'https://ucubix.com/api/v1/',  // default
);
```

---

## API Methods

### Organisation Info

| Method | Returns |
|---|---|
| `getOrganisation()` | [`Organisation`](#organisation) |

```ts
const org = await client.getOrganisation();
console.log(org.summary.totalUsdEquivalent);
```

### Products

| Method | Returns |
|---|---|
| `getProducts(filters?, page?, perPage?, sort?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Product`](#product)`>` |
| `getProduct(id)` | [`Product`](#product) |
| `getProductPhotos(id, page?, perPage?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Media`](#media)`>` |
| `getProductScreenshots(id, page?, perPage?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Media`](#media)`>` |
| `getProductCategories(id, page?, perPage?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Category`](#category)`>` |
| `getProductPublishers(id, page?, perPage?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Publisher`](#publisher--developer)`>` |
| `getProductPlatforms(id, page?, perPage?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Platform`](#platform)`>` |
| `getProductFranchises(id, page?, perPage?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Franchise`](#franchise)`>` |
| `getProductDevelopers(id, page?, perPage?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Developer`](#publisher--developer)`>` |

**`getProducts()` filters** (validated, throws `Error` on unknown keys):

| Key | Type | Description |
|---|---|---|
| `search` | `string` | Full-text search |
| `category` | `string` | Category UUID |
| `publisher` | `string` | Publisher UUID |
| `developer` | `string` | Developer UUID |
| `franchise` | `string` | Franchise UUID |
| `platform` | `string` | Platform UUID |

**Sort options:** `name`, `-name`, `created_at`, `-created_at`

```ts
const products = await client.getProducts(
  { search: 'Game', platform: 'platform-uuid' },
  1,    // page
  15,   // perPage
  'name',
);

const product = await client.getProduct('product-uuid');
const photos  = await client.getProductPhotos('product-uuid');
```

### Orders

| Method | Returns |
|---|---|
| `getOrders(filters?, page?, perPage?, sort?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Order`](#order)`>` |
| `getOrder(id)` | [`Order`](#order) |
| `getOrderItems(orderId, page?, perPage?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`OrderItem`](#orderitem)`>` |
| `createOrder(productUuid, quantity, regionCode, countryCode?, externalReference?)` | [`Order`](#order) |
| `updateOrder(id, quantity)` | [`Order`](#order) |
| `cancelOrder(id)` | `boolean` |

**`getOrders()` filters** (validated, throws `Error` on unknown keys):

| Key | Type | Description |
|---|---|---|
| `code` | `string` | Filter by order code |
| `external_reference` | `string` | Filter by external reference |

**Sort options** (default: `-order_date`): `code`, `status`, `total_price`, `srp`, `currency_code`, `order_date`, `approved_at`, `rejected_at`, `delivered_at`, `distribution_model`

```ts
const orders = await client.getOrders({ code: 'ORD-001' }, 1, 15, '-order_date');
const order  = await client.getOrder('order-uuid');
const items  = await client.getOrderItems('order-uuid');

const order = await client.createOrder('product-uuid', 5, 'NorthAmerica', 'us');
const order = await client.updateOrder('order-uuid', 10);
await client.cancelOrder('order-uuid');
```

### License Keys

| Method | Returns |
|---|---|
| `getLicenseKey(id)` | [`LicenseKey`](#licensekey) |
| `getBulkLicenseKeys(ids)` | [`LicenseKey[]`](#licensekey) |

```ts
const key  = await client.getLicenseKey('license-key-uuid');
const keys = await client.getBulkLicenseKeys(['uuid-1', 'uuid-2']); // up to 1000
```

### Catalog Dictionaries

| Method | Returns |
|---|---|
| `getCategories(page?, perPage?, sort?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Category`](#category)`>` |
| `getPublishers(page?, perPage?, sort?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Publisher`](#publisher--developer)`>` |
| `getPlatforms(page?, perPage?, sort?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Platform`](#platform)`>` |
| `getDevelopers(page?, perPage?, sort?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Developer`](#publisher--developer)`>` |
| `getFranchises(page?, perPage?, sort?)` | [`PaginatedResponse`](#paginatedresponse)`<`[`Franchise`](#franchise)`>` |

```ts
const categories = await client.getCategories(1, 15, 'name');
const publishers = await client.getPublishers();
const platforms  = await client.getPlatforms();
const developers = await client.getDevelopers();
const franchises = await client.getFranchises();
```

---

## Pagination

All list endpoints return [`PaginatedResponse<T>`](#paginatedresponse):

```ts
import { hasMorePages } from 'ucubix-node-client';

let page = 1;
do {
  const orders = await client.getOrders({}, page, 50);

  for (const order of orders.data) {
    // process order
  }

  page++;
} while (hasMorePages(orders));
```

---

## Types

All types are exported as TypeScript interfaces with `readonly` properties.

### Product

| Property | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `name` | `string` | |
| `summary` | `string \| null` | |
| `description` | `string \| null` | |
| `releaseDate` | `string \| null` | ISO 8601 |
| `type` | `string \| null` | e.g. `"Game"` |
| `createdAt` | `string \| null` | ISO 8601 |
| `regionalPricing` | [`RegionalPricing[]`](#regionalpricing) | Only on single-resource requests |
| `metadata` | [`ProductMetadata`](#productmetadata)` \| null` | System requirements, SteamDB |

### RegionalPricing

| Property | Type |
|---|---|
| `regionCode` | `string` |
| `resellerWsp` | `number` |
| `countries` | [`CountryPrice[]`](#countryprice) |

### CountryPrice

| Property | Type |
|---|---|
| `countryName` | `string` |
| `countryCode` | `string` |
| `price` | `number \| null` |
| `estimatedCost` | `number \| null` |
| `currencyCode` | `string \| null` |
| `isPromotion` | `boolean` |
| `originalPrice` | `number \| null` |
| `promotionName` | `string \| null` |
| `promotionEndDate` | `string \| null` |
| `canBeOrdered` | `boolean` |
| `inStock` | `boolean` |

### ProductMetadata

| Property | Type |
|---|---|
| `minimum` | [`SystemRequirement[]`](#systemrequirement) |
| `recommended` | [`SystemRequirement[]`](#systemrequirement) |
| `steamdb` | [`SteamdbInfo`](#steamdbinfo)` \| null` |

### SystemRequirement

| Property | Type |
|---|---|
| `parameter` | `string \| null` |
| `value` | `string \| null` |

### SteamdbInfo

| Property | Type |
|---|---|
| `id` | `number` |
| `type` | `string` |
| `url` | `string` |

### Order

| Property | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `code` | `string` | |
| `externalReference` | `string \| null` | |
| `externalReferenceAttempt` | `number \| null` | |
| `status` | `string` | See [`OrderStatus`](#orderstatus) |
| `totalPrice` | `number` | |
| `srp` | `number` | |
| `estimatedCost` | `number \| null` | |
| `itemsCount` | `number` | |
| `currencyCode` | `string \| null` | ISO 4217 |
| `orderDate` | `string` | ISO 8601 |
| `approvedAt` | `string \| null` | |
| `rejectedAt` | `string \| null` | |
| `deliveredAt` | `string \| null` | |
| `distributionModel` | `string \| null` | `"sale"`, `"consignment"` |
| `rejectionNote` | `string \| null` | |

Helper: `getOrderStatus(order)` returns `OrderStatus`.

### OrderItem

| Property | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `price` | `number` | |
| `countryCode` | `string \| null` | ISO 3166-1 alpha-2 |
| `licenseKeyUuid` | `string \| null` | Only when order is fulfilled/delivered |
| `fulfilledAt` | `string \| null` | |
| `createdAt` | `string \| null` | |
| `updatedAt` | `string \| null` | |

Helper: `hasLicenseKey(item)` returns `boolean`.

### LicenseKey

| Property | Type |
|---|---|
| `id` | `string` |
| `licenseKey` | `string` |
| `createdAt` | `string \| null` |
| `updatedAt` | `string \| null` |

### Organisation

| Property | Type |
|---|---|
| `uuid` | `string` |
| `name` | `string` |
| `summary` | [`OrganisationSummary`](#organisationsummary) |
| `creditLines` | [`CreditLine[]`](#creditline) |

### OrganisationSummary

| Property | Type |
|---|---|
| `currencies` | `number` |
| `totalUsdEquivalent` | `string` |

### CreditLine

| Property | Type |
|---|---|
| `currency` | `string` |
| `balance` | `string` |

### Category

| Property | Type |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `parentId` | `string \| null` |
| `childIds` | `string[]` |

### Publisher / Developer

| Property | Type |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `website` | `string \| null` |
| `about` | `string \| null` |
| `createdAt` | `string \| null` |
| `updatedAt` | `string \| null` |

### Platform

| Property | Type |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `createdAt` | `string \| null` |
| `updatedAt` | `string \| null` |

### Franchise

| Property | Type |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `createdAt` | `string \| null` |

### Media

| Property | Type |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `fileName` | `string` |
| `collectionName` | `string` |
| `mimeType` | `string` |
| `disk` | `string` |
| `size` | `number` |
| `orderColumn` | `number \| null` |
| `url` | `string` |
| `createdAt` | `string \| null` |
| `updatedAt` | `string \| null` |

### PaginatedResponse

| Property | Type |
|---|---|
| `data` | `T[]` |
| `currentPage` | `number` |
| `perPage` | `number` |
| `total` | `number` |
| `lastPage` | `number` |
| `firstPageUrl` | `string \| null` |
| `lastPageUrl` | `string \| null` |
| `nextPageUrl` | `string \| null` |
| `prevPageUrl` | `string \| null` |

Helper: `hasMorePages(response)` returns `boolean`.

---

## Enums

### OrderStatus

```ts
import { OrderStatus } from 'ucubix-node-client';

OrderStatus.NEW;        // 'new'
OrderStatus.PENDING;    // 'pending'
OrderStatus.APPROVED;   // 'approved'
OrderStatus.REJECTED;   // 'rejected'
OrderStatus.FULFILLED;  // 'fulfilled'
OrderStatus.DELIVERED;  // 'delivered'
OrderStatus.CANCELLED;  // 'cancelled'
```

---

## Error Handling

All API errors throw typed exceptions:

```ts
import {
  ApiError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
} from 'ucubix-node-client';

try {
  const order = await client.createOrder(uuid, 5, 'InvalidRegion');
} catch (err) {
  if (err instanceof AuthenticationError) {
    // 401 Unauthorized or 403 Forbidden
    console.log(err.message);
    console.log(err.statusCode); // 401 or 403

  } else if (err instanceof ValidationError) {
    // 422 Unprocessable Entity
    console.log(err.message); // e.g. "Quantity must not be greater than 1."
    console.log(err.field);   // field name if provided

  } else if (err instanceof RateLimitError) {
    // 429 Too Many Requests (after all retries exhausted)
    console.log(err.retryAfter); // seconds to wait

  } else if (err instanceof ApiError) {
    // All other errors (400, 404, 500, etc.)
    console.log(err.message);
    console.log(err.statusCode);
    console.log(err.errorKey);
    console.log(err.errorDetail);
  }
}
```

### Exception Hierarchy

```
ApiError
  ├── AuthenticationError  (401, 403)
  ├── RateLimitError       (429)
  └── ValidationError      (422)
```

---

## Rate Limiting

The client has a dual-layer rate limiting system.

### 1. Client-side Sliding Window

Proactive throttling: the client tracks request timestamps in a sliding window and blocks (via `setTimeout` + 50ms buffer) before exceeding the configured requests per minute. This prevents hitting the server limit.

```ts
// Check/configure requests per minute (default: 100)
client.getRequestsPerMinute();   // 100
client.setRequestsPerMinute(50); // slow down
client.setRequestsPerMinute(0);  // disable client-side throttling

// Direct access to the rate limiter
const limiter = client.getRateLimiter();
limiter.canProceed();  // non-blocking check
limiter.remaining();   // slots left in current window
```

### 2. Server-side 429 Retry

Reactive handling: if the server returns `429 Too Many Requests`, the client automatically retries up to 3 times, respecting the `Retry-After` header.

```ts
// Configure max retries (default: 3)
client.setMaxRetryOnRateLimit(5);
```

### 3. Server Header Tracking

After every response, the client reads `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers.

```ts
client.getRateLimitLimit();     // e.g. 100
client.getRateLimitRemaining(); // e.g. 87
client.canMakeRequest();        // true if remaining > 0
```

### 4. Server-side Limit Adaptation

If the server reports a higher limit via `X-RateLimit-Limit` header, the client automatically adapts its sliding window upward (one-way ratchet — never decreases).

### 5. State Persistence

Export/restore rate limit state for caching across requests:

```ts
// Export
const state = client.getRateLimitState();
// { limit: 100, remaining: 87 }

// Restore (e.g. from Redis/session)
client.setRateLimitState(state);
```

### API Rate Limits

- **100 requests per minute** per API key

---

## Authentication

The API uses Bearer Token authentication with IP whitelisting:

```
Authorization: Bearer YOUR_API_KEY
Accept: application/vnd.api+json
Content-Type: application/json
```

Requests from non-whitelisted IPs receive a `403 Forbidden` error.

---

## Testing

```bash
npm install
npm test
```

## License

MIT. See [LICENSE](LICENSE).
