import type { CountryPrice } from './country-price.js';

export interface RegionalPricing {
  readonly regionCode: string;
  readonly resellerWsp: number;
  readonly countries: CountryPrice[];
}
