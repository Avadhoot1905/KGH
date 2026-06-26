import test from 'node:test';
import assert from 'node:assert/strict';
import { getOrderStatusLabel, isOrderSuccessful } from '../src/lib/orderStatus';

test('shows paid orders as paid instead of cancelled', () => {
  assert.equal(getOrderStatusLabel('PAID'), 'Paid');
  assert.equal(isOrderSuccessful('PAID'), true);
});

test('keeps cancelled orders as cancelled', () => {
  assert.equal(getOrderStatusLabel('CANCELLED'), 'Cancelled');
  assert.equal(isOrderSuccessful('CANCELLED'), false);
});
