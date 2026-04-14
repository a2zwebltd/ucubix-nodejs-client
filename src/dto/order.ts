import { OrderStatus } from '../enums/order-status.js';

export interface Order {
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

export function getOrderStatus(order: Order): OrderStatus {
  const values = Object.values(OrderStatus) as string[];
  if (!values.includes(order.status)) {
    throw new Error(`Unknown order status: ${order.status}`);
  }
  return order.status as OrderStatus;
}
