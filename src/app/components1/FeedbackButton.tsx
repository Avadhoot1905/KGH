'use client';

import { useState } from 'react';
import './FeedbackButton.css';
import FeedbackPopup from './FeedbackPopup';

export default function FeedbackButton() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <>
      <button
        className="feedback-floating-btn"
        onClick={() => setIsPopupOpen(true)}
        aria-label="Give Feedback"
        title="Feedback / Complaints / Testimonials"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="message-icon"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {isPopupOpen && (
        <FeedbackPopup onClose={() => setIsPopupOpen(false)} />
      )}
    </>
  );
}
