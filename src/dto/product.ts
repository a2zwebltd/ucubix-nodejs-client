import type { ProductMetadata } from './product-metadata.js';
import type { RegionalPricing } from './regional-pricing.js';

export interface Product {
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
