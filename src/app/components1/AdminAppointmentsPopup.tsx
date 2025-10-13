'use client';

import { useState, useEffect } from 'react';
import './AdminAppointmentsPopup.css';
import { getAllAppointments, approveAppointment, declineAppointment } from '@/actions/appointments';
import type { AppointmentData } from '@/actions/appointments';

interface AdminAppointmentsPopupProps {
  onClose: () => void;
}

// Contact details
const CONTACT_EMAIL = "kgh.appointments@example.com";
const CONTACT_PHONE = "+1 (555) 123-4567";

export default function AdminAppointmentsPopup({ onClose }: AdminAppointmentsPopupProps) {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'DECLINED'>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments');
      console.error('Error loading appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (appointmentId: string) => {
    try {
      setProcessingId(appointmentId);
      setError(null);
      const updated = await approveAppointment(appointmentId);
      setAppointments(prev => 
        prev.map(apt => apt.id === appointmentId ? updated : apt)
      );
    } catch (err: any) {
      setError(err.message || 'Failed to approve appointment');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (appointmentId: string) => {
    try {
      setProcessingId(appointmentId);
      setError(null);
      const updated = await declineAppointment(appointmentId);
      setAppointments(prev => 
        prev.map(apt => apt.id === appointmentId ? updated : apt)
      );
    } catch (err: any) {
      setError(err.message || 'Failed to decline appointment');
    } finally {
      setProcessingId(null);
    }
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

  const pendingCount = appointments.filter(apt => apt.status === 'PENDING').length;
  const approvedCount = appointments.filter(apt => apt.status === 'APPROVED').length;
  const declinedCount = appointments.filter(apt => apt.status === 'DECLINED').length;

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

        {error && (
          <div className="admin-error-message">
            <p>{error}</p>
            <button onClick={loadAppointments} className="retry-btn">Retry</button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({appointments.length})
          </button>
          <button
            className={`filter-tab ${filter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            Pending ({pendingCount})
          </button>
          <button
            className={`filter-tab ${filter === 'APPROVED' ? 'active' : ''}`}
            onClick={() => setFilter('APPROVED')}
          >
            Approved ({approvedCount})
          </button>
          <button
            className={`filter-tab ${filter === 'DECLINED' ? 'active' : ''}`}
            onClick={() => setFilter('DECLINED')}
          >
            Declined ({declinedCount})
          </button>
        </div>

        {/* Appointments List */}
        <div className="appointments-list">
          {isLoading ? (
            <div className="admin-loading-message">
              <p>Loading appointments...</p>
            </div>
          ) : (
            <>
          {filteredAppointments.length === 0 ? (
            <div className="no-appointments">
              <p>No {filter !== 'all' ? filter : ''} appointments found.</p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div key={appointment.id} className={`appointment-card ${appointment.status.toLowerCase()}`}>
                <div className="appointment-card-header">
                  <div className="user-info">
                    <h3>{appointment.user.name || 'Unknown User'}</h3>
                    <p className="user-email">{appointment.user.email}</p>
                  </div>
                  <span className={`status-badge ${appointment.status.toLowerCase()}`}>
                    {appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase()}
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

                {appointment.status === 'PENDING' && (
                  <div className="appointment-card-actions">
                    <button
                      className="action-btn approve-btn"
                      onClick={() => handleApprove(appointment.id)}
                      disabled={processingId === appointment.id}
                    >
                      {processingId === appointment.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      className="action-btn decline-btn"
                      onClick={() => handleDecline(appointment.id)}
                      disabled={processingId === appointment.id}
                    >
                      {processingId === appointment.id ? 'Processing...' : 'Decline'}
                    </button>
                  </div>
                )}

                {appointment.status === 'DECLINED' && (
                  <div className="declined-message">
                    <p><strong>Note:</strong> For further details, please contact us at:</p>
                    <p>Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
                    <p>Phone: <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}>{CONTACT_PHONE}</a></p>
                  </div>
                )}

                {appointment.status === 'APPROVED' && (
                  <div className="approved-message">
                    <p>✓ Appointment confirmed. Customer will be notified.</p>
                    <p className="contact-note">Contact: {CONTACT_EMAIL} | {CONTACT_PHONE}</p>
                  </div>
                )}
              </div>
            ))
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}
