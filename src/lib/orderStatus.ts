export function getOrderStatusLabel(status?: string | null) {
  switch (status) {
    case 'COMPLETED':
      return 'Delivered';
    case 'PAID':
      return 'Paid';
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
  return status === 'COMPLETED' || status === 'PAID';
}
