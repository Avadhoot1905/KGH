'use client';

import { useState, useEffect } from 'react';
import './AppointmentPopup.css';

interface AppointmentData {
  date: string;
  time: string;
  reason: string;
  status: 'pending' | 'approved' | 'declined';
  bookedAt: string;
}

interface AppointmentPopupProps {
  onClose: () => void;
}

// Contact details
const CONTACT_EMAIL = "kgh.appointments@example.com";
const CONTACT_PHONE = "+1 (555) 123-4567";

export default function AppointmentPopup({ onClose }: AppointmentPopupProps) {
  const [existingAppointment, setExistingAppointment] = useState<AppointmentData | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load existing appointment from localStorage
    const stored = localStorage.getItem('appointment');
    if (stored) {
      setExistingAppointment(JSON.parse(stored));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const appointment: AppointmentData = {
        ...formData,
        status: 'pending',
        bookedAt: new Date().toISOString(),
      };

      localStorage.setItem('appointment', JSON.stringify(appointment));
      setExistingAppointment(appointment);
      
      // Also add to admin appointments list
      const adminAppointments = JSON.parse(localStorage.getItem('admin_appointments') || '[]');
      const newAdminAppointment = {
        id: Date.now().toString(),
        userName: 'Guest User', // In production, get from session
        userEmail: 'user@example.com', // In production, get from session
        date: formData.date,
        time: formData.time,
        reason: formData.reason,
        status: 'pending',
        bookedAt: new Date().toISOString(),
      };
      adminAppointments.push(newAdminAppointment);
      localStorage.setItem('admin_appointments', JSON.stringify(adminAppointments));
      
      setIsSubmitting(false);
      setFormData({ date: '', time: '', reason: '' });
    }, 500);
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      localStorage.removeItem('appointment');
      setExistingAppointment(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="appointment-overlay" onClick={onClose}>
      <div className="appointment-popup" onClick={(e) => e.stopPropagation()}>
        <button className="appointment-close" onClick={onClose}>
          ×
        </button>

        <h2 className="appointment-title">
          {existingAppointment ? 'Your Appointment' : 'Book an Appointment'}
        </h2>

        {existingAppointment ? (
          <div className="appointment-details">
            <div className="appointment-info">
              <div className="info-content">
                <label>Date</label>
                <p>{formatDate(existingAppointment.date)}</p>
              </div>
            </div>

            <div className="appointment-info">
              <div className="info-content">
                <label>Time</label>
                <p>{formatTime(existingAppointment.time)}</p>
              </div>
            </div>

            <div className="appointment-info">
              <div className="info-content">
                <label>Reason</label>
                <p>{existingAppointment.reason}</p>
              </div>
            </div>

            <div className="appointment-status">
              <span className="status-label">Status:</span>
              <span className={`status-badge ${existingAppointment.status}`}>
                {existingAppointment.status === 'pending' ? 'Pending' : 
                 existingAppointment.status === 'approved' ? 'Approved' : 'Declined'}
              </span>
            </div>

            {existingAppointment.status === 'declined' && (
              <div className="declined-notice">
                <p><strong>Your appointment request was declined.</strong></p>
                <p>For further details, please contact us:</p>
                <p>Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
                <p>Phone: <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}>{CONTACT_PHONE}</a></p>
              </div>
            )}

            {existingAppointment.status === 'approved' && (
              <div className="approved-notice">
                <p>✓ Your appointment has been confirmed!</p>
                <p>We'll contact you at: {CONTACT_EMAIL} | {CONTACT_PHONE}</p>
              </div>
            )}

            <button className="cancel-btn" onClick={handleCancel}>
              Cancel Appointment
            </button>
          </div>
        ) : (
          <form className="appointment-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="date">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                min={getTodayDate()}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">
                Time
              </label>
              <input
                type="time"
                id="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reason">
                Reason for Visit
              </label>
              <textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Please describe the reason for your appointment..."
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
