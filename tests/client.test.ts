import { describe, test, expect } from 'vitest';
import {
  UcubixClient,
  ApiError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  hasLicenseKey,
} from '../src/index.js';
import { MockHttpClient, jsonResponse, paginatedMeta } from './mock-http-client.js';

function createClient(responses: Parameters<typeof MockHttpClient['prototype']['request']> extends never ? never : ConstructorParameters<typeof MockHttpClient>[0]) {
  const mock = new MockHttpClient(responses);
  return new UcubixClient('test-api-key', 'https://ucubix.com/api/v1/', mock);
}

// =========================================================================
// Organisation
// =========================================================================

describe('Organisation', () => {
  test('getOrganisation', async () => {
    const client = createClient([
      jsonResponse({
        data: {
          organisation: { uuid: 'org-uuid', name: 'My Organisation' },
          summary: { currencies: 2, total_usd_equivalent: '1000.00' },
          credit_lines: [{ currency: 'USD', balance: '500.00' }],
        },
      }),
    ]);

    const org = await client.getOrganisation();

    expect(org.uuid).toBe('org-uuid');
    expect(org.name).toBe('My Organisation');
    expect(org.summary.currencies).toBe(2);
    expect(org.summary.totalUsdEquivalent).toBe('1000.00');
    expect(org.creditLines).toHaveLength(1);
  });
});

// =========================================================================
// Products
// =========================================================================

describe('Products', () => {
  test('getProducts', async () => {
    const client = createClient([
      jsonResponse({
        data: [
          { id: 'p1', type: 'products', attributes: { name: 'Game 1', summary: null, description: null, release_date: null, type: 'Game', created_at: '2024-01-01T00:00:00.000000Z', regional_pricing: [], metadata: null } },
          { id: 'p2', type: 'products', attributes: { name: 'Game 2', summary: null, description: null, release_date: null, type: 'Game', created_at: '2024-01-01T00:00:00.000000Z', regional_pricing: [], metadata: null } },
        ],
        ...paginatedMeta(1, 15, 2),
      }),
    ]);

    const result = await client.getProducts();

    expect(result.data).toHaveLength(2);
    expect(result.data[0]!.name).toBe('Game 1');
    expect(result.total).toBe(2);
  });

  test('getProducts with filters', async () => {
    const client = createClient([
      jsonResponse({
        data: [
          { id: 'p1', type: 'products', attributes: { name: 'Filtered Game', summary: null, description: null, release_date: null, type: 'Game', created_at: '2024-01-01T00:00:00.000000Z', regional_pricing: [], metadata: null } },
        ],
        ...paginatedMeta(1, 10),
      }),
    ]);

    const result = await client.getProducts({ search: 'Game', category: 'cat-uuid' }, 1, 10, 'name');
    expect(result.data).toHaveLength(1);
  });

  test('getProducts invalid filter', async () => {
    const client = createClient([]);

    // @ts-expect-error testing invalid filter
    await expect(() => client.getProducts({ foo: 'bar' })).rejects.toThrow('Invalid filter(s): foo');
  });

  test('getOrders invalid filter', async () => {
    const client = createClient([]);

    // @ts-expect-error testing invalid filter
    await expect(() => client.getOrders({ status: 'new' })).rejects.toThrow('Invalid filter(s): status');
  });

  test('getProduct', async () => {
    const client = createClient([
      jsonResponse({
        data: {
          id: 'prod-uuid',
          type: 'products',
          attributes: {
            name: 'Test Game',
            summary: 'A short summary',
            description: 'A great game',
            release_date: '2024-03-15T00:00:00.000000Z',
            type: 'Game',
            created_at: '2024-01-01T00:00:00.000000Z',
            regional_pricing: [
              {
                region_code: 'NA',
                reseller_wsp: 75,
                countries: [
                  { country_name: 'US', country_code: 'us', price: 49.99, estimated_cost: 37.49, currency_code: 'USD', is_promotion: false, original_price: 49.99, promotion_name: null, promotion_end_date: null, can_be_ordered: true, in_stock: true },
                ],
              },
            ],
            metadata: null,
          },
        },
      }),
    ]);

    const product = await client.getProduct('prod-uuid');

    expect(product.id).toBe('prod-uuid');
    expect(product.regionalPricing).toHaveLength(1);
  });

  test('getProductPhotos', async () => {
    const client = createClient([
      jsonResponse({
        data: [{ id: 'ph1', attributes: { name: 'photo1.jpg', file_name: 'photo1.jpg', collection_name: 'photos', mime_type: 'image/jpeg', disk: 's3', size: 204800, order_column: 1, url: 'https://img.com/1.jpg', created_at: '2024-01-01T00:00:00.000000Z', updated_at: '2024-01-01T00:00:00.000000Z' } }],
        ...paginatedMeta(),
      }),
    ]);

    const result = await client.getProductPhotos('prod-uuid');
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.mimeType).toBe('image/jpeg');
  });

  test('getProductScreenshots', async () => {
    const client = createClient([
      jsonResponse({
        data: [{ id: 'ss1', attributes: { name: 'screenshot1.jpg', file_name: 'screenshot1.jpg', collection_name: 'screenshots', mime_type: 'image/jpeg', disk: 's3', size: 512000, order_column: 1, url: 'https://img.com/ss1.jpg', created_at: '2024-01-01T00:00:00.000000Z', updated_at: '2024-01-01T00:00:00.000000Z' } }],
        ...paginatedMeta(),
      }),
    ]);

    const result = await client.getProductScreenshots('prod-uuid');
    expect(result.data).toHaveLength(1);
  });

  test('getProductCategories', async () => {
    const client = createClient([
      jsonResponse({
        data: [{ id: 'cat1', attributes: { name: 'Action', parent_id: null, child_ids: [] } }],
        ...paginatedMeta(),
      }),
    ]);

    const result = await client.getProductCategories('prod-uuid');
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.name).toBe('Action');
  });

  test('getProductPublishers', async () => {
    const client = createClient([
      jsonResponse({
        data: [{ id: 'pub1', attributes: { name: 'Big Publisher', website: 'https://bigpublisher.com', about: 'A major publisher', created_at: '2024-01-01T00:00:00.000000Z', updated_at: '2024-06-01T00:00:00.000000Z' } }],
        ...paginatedMeta(),
      }),
    ]);

    const result = await client.getProductPublishers('prod-uuid');
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.name).toBe('Big Publisher');
  });

  test('getProductPlatforms', async () => {
    const client = createClient([
      jsonResponse({
        data: [{ id: 'plat1', attributes: { name: 'Steam', created_at: '2024-01-01T00:00:00.000000Z', updated_at: '2024-06-01T00:00:00.000000Z' } }],
        ...paginatedMeta(),
      }),
    ]);

    const result = await client.getProductPlatforms('prod-uuid');
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.name).toBe('Steam');
  });

  test('getProductFranchises', async () => {
    const client = createClient([
      jsonResponse({
        data: [{ id: 'f1', attributes: { name: 'Test Franchise', created_at: '2024-01-01T00:00:00.000000Z' } }],
        ...paginatedMeta(),
      }),
    ]);

    const result = await client.getProductFranchises('prod-uuid');
    expect(result.data).toHaveLength(1);
  });

  test('getProductDevelopers', async () => {
    const client = createClient([
      jsonResponse({
        data: [{ id: 'd1', attributes: { name: 'Dev Studio', website: 'https://devstudio.com', about: 'An indie studio', created_at: '2024-01-01T00:00:00.000000Z', updated_at: '2024-06-01T00:00:00.000000Z' } }],
        ...paginatedMeta(),
      }),
    ]);

    const result = await client.getProductDevelopers('prod-uuid');
    expect(result.data).toHaveLength(1);
  });
});

// =========================================================================
// Orders
// =========================================================================

describe('Orders', () => {
  test('getOrders', async () => {
    const client = createClient([
      jsonResponse({
        data: [
          {
            id: 'o1', type: 'orders', attributes: {
              code: 'ORD-001', external_reference: null, external_reference_attempt: null,
              status: 'pending', total_price: 100.00, srp: 100.00, estimated_cost: 80.00,
              items_count: 1, currency_code: 'USD', order_date: '2026-04-06T12:00:00.000000Z',
              approved_at: null, rejected_at: null, delivered_at: null,
              distribution_model: 'sale', rejection_note: null,
            },
          },
        ],
        ...paginatedMeta(),
      }),
    ]);

    const result = await client.getOrders();
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.code).toBe('ORD-001');
  });

  test('getOrder', async () => {
    const client = createClient([
      jsonResponse({
        data: {
          id: 'order-uuid',
          type: 'orders',
          attributes: {
            code: 'ORD-002', external_reference: null, external_reference_attempt: null,
            status: 'fulfilled', total_price: 199.90, srp: 199.90, estimated_cost: 150.00,
            items_count: 2, currency_code: 'USD', order_date: '2026-04-05T10:00:00.000000Z',
            approved_at: '2026-04-05T14:00:00.000000Z', rejected_at: null, delivered_at: null,
            distribution_model: 'sale', rejection_note: null,
          },
        },
      }),
    ]);

    const order = await client.getOrder('order-uuid');
    expect(order.id).toBe('order-uuid');
    expect(order.status).toBe('fulfilled');
    expect(order.srp).toBe(199.90);
  });

  test('getOrderItems', async () => {
    const client = createClient([
      jsonResponse({
        data: [
          { id: 'oi1', attributes: { price: 100.00, country_code: 'SG', license_key_uuid: 'lk1', fulfilled_at: '2026-04-07T12:00:00Z', created_at: '2026-04-07T10:00:00.000000Z', updated_at: '2026-04-07T12:00:00.000000Z' } },
          { id: 'oi2', attributes: { price: 99.90, country_code: 'SG', license_key_uuid: null, fulfilled_at: null, created_at: '2026-04-07T10:00:00.000000Z', updated_at: '2026-04-07T10:00:00.000000Z' } },
        ],
        ...paginatedMeta(1, 15, 2),
      }),
    ]);

    const result = await client.getOrderItems('order-uuid');
    expect(result.data).toHaveLength(2);
    expect(hasLicenseKey(result.data[0]!)).toBe(true);
    expect(hasLicenseKey(result.data[1]!)).toBe(false);
    expect(result.data[0]!.countryCode).toBe('SG');
  });

  test('createOrder', async () => {
    const client = createClient([
      jsonResponse({
        data: {
          order: {
            uuid: 'new-order-uuid', quantity: 3, total_price: 59.97, currency_code: 'USD',
            date: '2026-04-08T10:00:00.000000Z', status: 'new', external_reference: null,
            srp: 59.97, estimated_cost: 45.00,
          },
        },
        message: 'Order created successfully',
      }, 201),
    ]);

    const order = await client.createOrder('prod-uuid', 3, 'NA');
    expect(order.id).toBe('new-order-uuid');
    expect(order.status).toBe('new');
  });

  test('updateOrder', async () => {
    const client = createClient([
      jsonResponse({
        data: {
          order: {
            uuid: 'order-uuid', quantity: 100, total_price: 500.00, currency_code: 'USD',
            date: '2026-04-07T10:00:00.000000Z', status: 'new', external_reference: null,
            srp: 500.00, estimated_cost: 400.00,
          },
        },
      }),
    ]);

    const order = await client.updateOrder('order-uuid', 100);
    expect(order.status).toBe('new');
  });

  test('cancelOrder', async () => {
    const client = createClient([jsonResponse(null, 200)]);

    const result = await client.cancelOrder('order-uuid');
    expect(result).toBe(true);
  });
});

// =========================================================================
// License Keys
// =========================================================================

describe('License Keys', () => {
  test('getLicenseKey', async () => {
    const client = createClient([
      jsonResponse({
        data: {
          id: 'lk-uuid', type: 'license-keys',
          attributes: { license_key: 'ABCD-EFGH-IJKL-MNOP', created_at: '2024-01-15T10:30:00.000000Z', updated_at: '2024-01-15T10:30:00.000000Z' },
        },
      }),
    ]);

    const key = await client.getLicenseKey('lk-uuid');
    expect(key.licenseKey).toBe('ABCD-EFGH-IJKL-MNOP');
  });

  test('getBulkLicenseKeys', async () => {
    const client = createClient([
      jsonResponse({
        data: [
          { id: 'lk1', attributes: { license_key: 'KEY-1', created_at: '2024-01-15T10:30:00.000000Z', updated_at: '2024-01-15T10:30:00.000000Z' } },
          { id: 'lk2', attributes: { license_key: 'KEY-2', created_at: '2024-01-15T10:30:00.000000Z', updated_at: '2024-01-15T10:30:00.000000Z' } },
          { id: 'lk3', attributes: { license_key: 'KEY-3', created_at: '2024-01-15T10:30:00.000000Z', updated_at: '2024-01-15T10:30:00.000000Z' } },
        ],
      }),
    ]);

    const keys = await client.getBulkLicenseKeys(['lk1', 'lk2', 'lk3']);
    expect(keys).toHaveLength(3);
    expect(keys[0]!.licenseKey).toBe('KEY-1');
    expect(keys[2]!.licenseKey).toBe('KEY-3');
  });
});

// =========================================================================
// Catalog Dictionaries
// =========================================================================

describe('Catalog Dictionaries', () => {
  test('getCategories', async () => {
    const client = createClient([
      jsonResponse({
        data: [
          { id: 'c1', attributes: { name: 'Action', parent_id: null, child_ids: [] } },
          { id: 'c2', attributes: { name: 'RPG', parent_id: null, child_ids: [] } },
        ],
        ...paginatedMeta(1, 15, 2),
      }),
    ]);

    const result = await client.getCategories();
    expect(result.data).toHaveLength(2);
  });

  test('getPublishers', async () => {
    const client = createClient([
      jsonResponse({
        data: [{ id: 'p1', attributes: { name: 'Publisher 1', website: null, about: null, created_at: '2024-01-01T00:00:00.000000Z', updated_at: '2024-06-01T00:00:00.000000Z' } }],
        ...paginatedMeta(),
      }),
    ]);

    const result = await client.getPublishers();
    expect(result.data[0]!.name).toBe('Publisher 1');
  });

  test('getPlatforms', async () => {
    const client = createClient([
      jsonResponse({
        data: [{ id: 'pl1', attributes: { name: 'Steam', created_at: '2024-01-01T00:00:00.000000Z', updated_at: '2024-06-01T00:00:00.000000Z' } }],
        ...paginatedMeta(),
      }),
    ]);

    const result = await client.getPlatforms();
    expect(result.data[0]!.name).toBe('Steam');
  });

  test('getDevelopers', async () => {
    const client = createClient([
      jsonResponse({
        data: [{ id: 'd1', attributes: { name: 'Dev Studio', website: null, about: null, created_at: '2024-01-01T00:00:00.000000Z', updated_at: '2024-06-01T00:00:00.000000Z' } }],
        ...paginatedMeta(),
      }),
    ]);

    const result = await client.getDevelopers();
    expect(result.data[0]!.name).toBe('Dev Studio');
  });

  test('getFranchises', async () => {
    const client = createClient([
      jsonResponse({
        data: [{ id: 'f1', attributes: { name: 'Test Franchise', created_at: '2024-01-01T00:00:00.000000Z' } }],
        ...paginatedMeta(),
      }),
    ]);

    const result = await client.getFranchises();
    expect(result.data[0]!.name).toBe('Test Franchise');
  });
});

// =========================================================================
// Rate Limiting & Error Handling
// =========================================================================

describe('Rate Limiting & Error Handling', () => {
  test('rate limit headers extracted', async () => {
    const client = createClient([
      jsonResponse(
        { data: { organisation: { uuid: 'x', name: 'Test' }, summary: { currencies: 1, total_usd_equivalent: '500.00' }, credit_lines: [{ currency: 'USD', balance: '500.00' }] } },
        200,
        { 'X-RateLimit-Limit': '100', 'X-RateLimit-Remaining': '95' },
      ),
    ]);

    await client.getOrganisation();

    expect(client.getRateLimitLimit()).toBe(100);
    expect(client.getRateLimitRemaining()).toBe(95);
  });

  test('429 retry then success', async () => {
    const client = createClient([
      { statusCode: 429, headers: { 'Retry-After': '0' }, body: { message: 'Rate limited' } },
      jsonResponse({ data: { organisation: { uuid: 'x', name: 'Test' }, summary: { currencies: 1, total_usd_equivalent: '500.00' }, credit_lines: [{ currency: 'USD', balance: '500.00' }] } }),
    ]);

    const org = await client.getOrganisation();
    expect(org.name).toBe('Test');
  });

  test('429 retry exhaustion', async () => {
    const client = createClient([
      { statusCode: 429, headers: { 'Retry-After': '0' }, body: { message: 'Rate limited' } },
      { statusCode: 429, headers: { 'Retry-After': '0' }, body: { message: 'Rate limited' } },
      { statusCode: 429, headers: { 'Retry-After': '0' }, body: { message: 'Rate limited' } },
      { statusCode: 429, headers: { 'Retry-After': '0' }, body: { message: 'Rate limited' } },
    ]);

    await expect(client.getOrganisation()).rejects.toThrow(RateLimitError);
  });

  test('custom max retry', async () => {
    const client = createClient([
      { statusCode: 429, headers: { 'Retry-After': '0' }, body: { message: 'Rate limited' } },
      { statusCode: 429, headers: { 'Retry-After': '0' }, body: { message: 'Rate limited' } },
    ]);

    client.setMaxRetryOnRateLimit(1);
    expect(client.getMaxRetryOnRateLimit()).toBe(1);

    await expect(client.getOrganisation()).rejects.toThrow(RateLimitError);
  });

  test('401 throws AuthenticationError', async () => {
    const client = createClient([
      { statusCode: 401, body: { error: { message: 'Unauthorized' } } },
    ]);

    await expect(client.getOrganisation()).rejects.toThrow(AuthenticationError);
  });

  test('403 throws AuthenticationError', async () => {
    const client = createClient([
      { statusCode: 403, body: { message: 'Forbidden' } },
    ]);

    await expect(client.getOrganisation()).rejects.toThrow(AuthenticationError);
  });

  test('422 throws ValidationError', async () => {
    const client = createClient([
      { statusCode: 422, body: { message: 'Order creation failed', error: 'Pricing information not found', key: 'region' } },
    ]);

    await expect(client.createOrder('prod-uuid', 1, 'INVALID')).rejects.toThrow(ValidationError);
  });

  test('404 throws ApiError', async () => {
    const client = createClient([
      { statusCode: 404, body: { message: 'Not Found' } },
    ]);

    await expect(client.getOrder('non-existent-uuid')).rejects.toThrow(ApiError);
  });

  test('500 throws ApiError', async () => {
    const client = createClient([
      { statusCode: 500, body: { message: 'Internal Server Error' } },
    ]);

    await expect(client.getOrganisation()).rejects.toThrow(ApiError);
  });
});
