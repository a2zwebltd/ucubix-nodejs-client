export interface OrderItem {
  readonly id: string;
  readonly price: number;
  readonly countryCode: string | null;
  readonly licenseKeyUuid: string | null;
  readonly fulfilledAt: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export function hasLicenseKey(item: OrderItem): boolean {
  return item.licenseKeyUuid !== null;
}
