'use client';

import { useState, useEffect } from 'react';
import './AdminAppointmentsPopup.css';

interface AppointmentData {
  id: string;
  userName: string;
  userEmail: string;
  date: string;
  time: string;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
  bookedAt: string;
}

interface AdminAppointmentsPopupProps {
  onClose: () => void;
}

// Dummy contact details
const CONTACT_EMAIL = "kgh.appointments@example.com";
const CONTACT_PHONE = "+1 (555) 123-4567";

export default function AdminAppointmentsPopup({ onClose }: AdminAppointmentsPopupProps) {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = () => {
    // Load appointments from localStorage
    // In production, this would be an API call
    const stored = localStorage.getItem('admin_appointments');
    if (stored) {
      setAppointments(JSON.parse(stored));
    } else {
      // Generate some dummy appointments for demonstration
      const dummyAppointments: AppointmentData[] = [
        {
          id: '1',
          userName: 'John Doe',
          userEmail: 'john.doe@example.com',
          date: '2025-10-15',
          time: '10:00',
          reason: 'Product inquiry and demonstration',
          status: 'pending',
          bookedAt: new Date().toISOString(),
        },
        {
          id: '2',
          userName: 'Jane Smith',
          userEmail: 'jane.smith@example.com',
          date: '2025-10-16',
          time: '14:30',
          reason: 'License application assistance',
          status: 'pending',
          bookedAt: new Date().toISOString(),
        },
        {
          id: '3',
          userName: 'Mike Johnson',
          userEmail: 'mike.j@example.com',
          date: '2025-10-14',
          time: '11:00',
          reason: 'Custom order consultation',
          status: 'approved',
          bookedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      localStorage.setItem('admin_appointments', JSON.stringify(dummyAppointments));
      setAppointments(dummyAppointments);
    }
  };

  const handleApprove = (appointmentId: string) => {
    const updated = appointments.map(apt =>
      apt.id === appointmentId ? { ...apt, status: 'approved' as const } : apt
    );
    setAppointments(updated);
    localStorage.setItem('admin_appointments', JSON.stringify(updated));
  };

  const handleDecline = (appointmentId: string) => {
    const updated = appointments.map(apt =>
      apt.id === appointmentId ? { ...apt, status: 'declined' as const } : apt
    );
    setAppointments(updated);
    localStorage.setItem('admin_appointments', JSON.stringify(updated));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const filteredAppointments = appointments.filter(apt => 
    filter === 'all' ? true : apt.status === filter
  );

  const pendingCount = appointments.filter(apt => apt.status === 'pending').length;
  const approvedCount = appointments.filter(apt => apt.status === 'approved').length;
  const declinedCount = appointments.filter(apt => apt.status === 'declined').length;

  return (
    <div className="admin-appointments-overlay" onClick={onClose}>
      <div className="admin-appointments-popup" onClick={(e) => e.stopPropagation()}>
        <button className="admin-appointments-close" onClick={onClose}>
          ×
        </button>

        <div className="admin-appointments-header">
          <h2 className="admin-appointments-title">Appointment Requests</h2>
          <div className="contact-info">
            <p><strong>Contact:</strong> {CONTACT_EMAIL}</p>
            <p><strong>Phone:</strong> {CONTACT_PHONE}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({appointments.length})
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button
            className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({approvedCount})
          </button>
          <button
            className={`filter-tab ${filter === 'declined' ? 'active' : ''}`}
            onClick={() => setFilter('declined')}
          >
            Declined ({declinedCount})
          </button>
        </div>

        {/* Appointments List */}
        <div className="appointments-list">
          {filteredAppointments.length === 0 ? (
            <div className="no-appointments">
              <p>No {filter !== 'all' ? filter : ''} appointments found.</p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div key={appointment.id} className={`appointment-card ${appointment.status}`}>
                <div className="appointment-card-header">
                  <div className="user-info">
                    <h3>{appointment.userName}</h3>
                    <p className="user-email">{appointment.userEmail}</p>
                  </div>
                  <span className={`status-badge ${appointment.status}`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                </div>

                <div className="appointment-card-body">
                  <div className="appointment-detail">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{formatDate(appointment.date)}</span>
                  </div>
                  <div className="appointment-detail">
                    <span className="detail-label">Time:</span>
                    <span className="detail-value">{formatTime(appointment.time)}</span>
                  </div>
                  <div className="appointment-detail">
                    <span className="detail-label">Reason:</span>
                    <span className="detail-value">{appointment.reason}</span>
                  </div>
                </div>

                {appointment.status === 'pending' && (
                  <div className="appointment-card-actions">
                    <button
                      className="action-btn approve-btn"
                      onClick={() => handleApprove(appointment.id)}
                    >
                      Approve
                    </button>
                    <button
                      className="action-btn decline-btn"
                      onClick={() => handleDecline(appointment.id)}
                    >
                      Decline
                    </button>
                  </div>
                )}

                {appointment.status === 'declined' && (
                  <div className="declined-message">
                    <p><strong>Note:</strong> For further details, please contact us at:</p>
                    <p>Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
                    <p>Phone: <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}>{CONTACT_PHONE}</a></p>
                  </div>
                )}

                {appointment.status === 'approved' && (
                  <div className="approved-message">
                    <p>✓ Appointment confirmed. Customer will be notified.</p>
                    <p className="contact-note">Contact: {CONTACT_EMAIL} | {CONTACT_PHONE}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
