export function getOrderStatusLabel(status?: string | null) {
  switch (status) {
    case 'COMPLETED':
    case 'DELIVERED':
      return 'Delivered';
    case 'PAID':
      return 'Paid';
    case 'SHIPPED':
      return 'Shipped';
    case 'RETURN_REQUESTED':
      return 'Return Requested';
    case 'RETURNED':
      return 'Returned';
    case 'PENDING':
      return 'In Transit';
    case 'CANCELLED':
      return 'Cancelled';
    case 'FAILED':
      return 'Failed';
    default:
      return 'Processing';
  }
}

export function isOrderSuccessful(status?: string | null) {
  return status === 'COMPLETED' || status === 'DELIVERED' || status === 'PAID' || status === 'SHIPPED';
}
