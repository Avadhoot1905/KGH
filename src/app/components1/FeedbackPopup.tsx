'use client';

import { useState } from 'react';
import './FeedbackPopup.css';
import { createFeedback } from '@/actions/feedbackAndReturns';
import { FeedbackType } from '@prisma/client';

interface FeedbackPopupProps {
  onClose: () => void;
  initialType?: FeedbackType;
}

export default function FeedbackPopup({ onClose, initialType }: FeedbackPopupProps) {
  const [formData, setFormData] = useState({
    type: (initialType || 'FEEDBACK') as FeedbackType,
    content: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.content.trim()) {
        throw new Error('Please enter some content.');
      }
      await createFeedback({
        type: formData.type,
        content: formData.content,
      });
      setSuccess(true);
      setFormData({ type: 'FEEDBACK', content: '' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-popup" onClick={(e) => e.stopPropagation()}>
        <button className="feedback-close" onClick={onClose} title="Close">
          ×
        </button>

        <h2 className="feedback-title">Share your Feedback / Complaint</h2>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {success ? (
          <div className="success-message">
            <p>✓ Thank you! Your submission has been received.</p>
            <button className="close-btn-success mt-4" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form className="feedback-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="feedback-type">Category</label>
              <select
                id="feedback-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as FeedbackType })}
                required
              >
                <option value="FEEDBACK">Feedback</option>
                <option value="COMPLAINT">Complaint / Issue</option>
                <option value="TESTIMONIAL">Testimonial</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="feedback-content">Details</label>
              <textarea
                id="feedback-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your feedback, complaint, or testimonial here..."
                rows={5}
                required
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
