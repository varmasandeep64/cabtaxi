'use client';

import { useState } from 'react';
import { StarIcon } from './ui/Icons';

const LABELS = ['', 'Poor', 'Not great', 'Okay', 'Good', 'Excellent'];

// onSubmitRating({ rating, feedback }) should return a Promise; throw to show an error.
export default function RatingModal({ onSubmitRating, driverName }) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (onSubmitRating) await onSubmitRating({ rating, feedback });
    } catch (err) {
      setError(err.message || 'Rating was not saved. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-center">
      <div>
        <h3 className="font-display text-xl font-bold">How was your ride{driverName ? ` with ${driverName.split(' ')[0]}` : ''}?</h3>
        <p className="mt-1 text-sm text-road">{LABELS[rating]}</p>
      </div>
      <div className="flex justify-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => setRating(star)}
            className={`p-1 transition active:scale-90 ${star <= rating ? 'text-taxi-deep' : 'text-surface-2'}`}
          >
            <StarIcon size={38} filled />
          </button>
        ))}
      </div>
      <label htmlFor="feedback" className="sr-only">Feedback</label>
      <textarea
        id="feedback"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Anything to add? (optional)"
        maxLength={500}
        rows={2}
        className="field resize-none"
      />
      {error && <p className="text-sm text-stop">{error}</p>}
      <button type="submit" disabled={saving} className="btn-dark w-full">
        {saving ? 'Saving…' : 'Submit rating'}
      </button>
    </form>
  );
}
