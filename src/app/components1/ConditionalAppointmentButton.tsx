'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AppointmentButton from './AppointmentButton';

export default function ConditionalAppointmentButton() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  
  // Hide the floating button on admin/mod pages
  if (pathname?.startsWith('/mod')) {
    return null;
  }

  // Only show the button if user is authenticated
  if (status === 'loading') {
    return null; // Don't show anything while checking auth status
  }

  if (!session?.user) {
    return null; // Hide if not authenticated
  }

  return <AppointmentButton />;
}
