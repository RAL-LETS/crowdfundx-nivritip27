import React, { useState, useEffect, useRef } from 'react';
import { validateDonationAmount } from '../lib/validation';

interface DonationModalProps {
  isOpen: boolean;
  campaignTitle: string;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  campaignTitle,
  onConfirm,
  onClose,
}) => {
  const [amount, setAmount] = useState('100');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount('100');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const result = validateDonationAmount(amount);
    if (!result.valid) {
      setError(result.error ?? 'Invalid amount.');
      return;
    }
    setError('');
    onConfirm(Number(amount));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Donation amount"
    >
      <div
        className="bg-surface-container-low border border-outline-variant rounded-lg p-6 w-full max-w-sm shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close donation dialog"
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-1">
          Make a Donation
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 line-clamp-2">
          {campaignTitle}
        </p>

        <div className="space-y-2 mb-6">
          <label
            htmlFor="donation-amount"
            className="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider"
          >
            Amount (XLM)
          </label>
          <div className="relative">
            <input
              id="donation-amount"
              ref={inputRef}
              type="number"
              min="1"
              max="1000000"
              step="1"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              className={`w-full bg-surface-container-lowest border text-white p-3 pr-14 rounded-lg font-mono-data focus:outline-none transition-colors ${
                error ? 'border-red-600 focus:border-red-500' : 'border-outline-variant focus:border-primary'
              }`}
              placeholder="100"
              aria-describedby={error ? 'donation-error' : undefined}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-md text-outline">
              XLM
            </span>
          </div>
          {error && (
            <p id="donation-error" role="alert" className="font-body-md text-[12px] text-red-400">
              {error}
            </p>
          )}

          {/* Quick select buttons */}
          <div className="flex gap-2 pt-1">
            {['50', '100', '500', '1000'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => { setAmount(preset); setError(''); }}
                className={`flex-1 py-1 border rounded text-label-md font-mono-data transition-colors ${
                  amount === preset
                    ? 'border-primary text-primary'
                    : 'border-outline-variant text-on-surface-variant hover:border-outline'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-outline-variant text-primary font-label-md py-3 rounded-lg hover:bg-surface-container-highest transition-all duration-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-primary text-on-primary font-label-md py-3 rounded-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all duration-100"
          >
            Confirm Donation
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;
