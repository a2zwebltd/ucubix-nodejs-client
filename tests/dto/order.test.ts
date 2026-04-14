import { describe, test, expect } from 'vitest';
import type { Order } from '../../src/index.js';
import { OrderStatus, getOrderStatus } from '../../src/index.js';

function makeOrder(status = 'delivered'): Order {
  return {
    id: '03dacf06-3776-41bf-b937-a8f6219458c5',
    code: 'IC69848708',
    externalReference: null,
    externalReferenceAttempt: null,
    status,
    totalPrice: 812.04,
    srp: 812.04,
    estimatedCost: 700.63,
    itemsCount: 2,
    currencyCode: 'SGD',
    orderDate: '2026-04-06T12:08:49.000000Z',
    approvedAt: '2026-04-06T16:08:49.000000Z',
    rejectedAt: null,
    deliveredAt: '2026-04-06T19:08:49.000000Z',
    distributionModel: 'sale',
    rejectionNote: null,
  };
}

describe('Order', () => {
  test('properties', () => {
    const order = makeOrder();

    expect(order.id).toBe('03dacf06-3776-41bf-b937-a8f6219458c5');
    expect(order.code).toBe('IC69848708');
    expect(order.status).toBe('delivered');
    expect(order.totalPrice).toBe(812.04);
    expect(order.srp).toBe(812.04);
    expect(order.estimatedCost).toBe(700.63);
    expect(order.itemsCount).toBe(2);
    expect(order.currencyCode).toBe('SGD');
    expect(order.distributionModel).toBe('sale');
    expect(order.rejectedAt).toBeNull();
    expect(order.rejectionNote).toBeNull();
  });

  test('getOrderStatus', () => {
    const order = makeOrder('fulfilled');
    expect(getOrderStatus(order)).toBe(OrderStatus.FULFILLED);
  });

  test('all order statuses', () => {
    for (const status of ['pending', 'approved', 'rejected', 'fulfilled', 'delivered', 'cancelled'] as const) {
      const order = makeOrder(status);
      expect(order.status).toBe(status);
      expect(getOrderStatus(order)).toBe(status);
    }
  });
});
