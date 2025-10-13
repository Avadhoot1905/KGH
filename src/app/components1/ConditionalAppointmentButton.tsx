'use client';

import { usePathname } from 'next/navigation';
import AppointmentButton from './AppointmentButton';

export default function ConditionalAppointmentButton() {
  const pathname = usePathname();
  
  // Hide the floating button on admin/mod pages
  if (pathname?.startsWith('/mod')) {
    return null;
  }

  return <AppointmentButton />;
}
