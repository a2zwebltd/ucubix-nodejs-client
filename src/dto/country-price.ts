export interface CountryPrice {
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
