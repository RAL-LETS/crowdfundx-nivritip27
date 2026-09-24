import { describe, it, expect } from 'vitest';

describe('Donation Amount Validation', () => {
  it('should validate that donation amount is greater than zero', () => {
    const amount = 50;
    const isValid = amount > 0 && !isNaN(amount);
    expect(isValid).toBe(true);
  });

  it('should reject non-numeric or negative donation amounts', () => {
    const amount = -10;
    const isValid = amount > 0 && !isNaN(amount);
    expect(isValid).toBe(false);
  });
});
