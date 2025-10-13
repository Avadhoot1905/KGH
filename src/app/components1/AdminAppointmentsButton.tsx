'use client';

import { useState } from 'react';
import './AdminAppointmentsButton.css';
import AdminAppointmentsPopup from './AdminAppointmentsPopup';

export default function AdminAppointmentsButton() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <>
      <button
        className="admin-appointments-btn"
        onClick={() => setIsPopupOpen(true)}
      >
        View Appointments
      </button>

      {isPopupOpen && (
        <AdminAppointmentsPopup onClose={() => setIsPopupOpen(false)} />
      )}
    </>
  );
}
