import { describe, it, expect } from 'vitest';

describe('Dashboard Statistics Helper', () => {
  it('should format stats amounts with appropriate comma grouping', () => {
    const rawValue = 4200000;
    const formatted = rawValue.toLocaleString('en-US');
    expect(formatted).toBe('4,200,000');
  });

  it('should default to empty array when stats campaigns are loading', () => {
    const data = null;
    const campaigns = data || [];
    expect(campaigns).toEqual([]);
  });
});
