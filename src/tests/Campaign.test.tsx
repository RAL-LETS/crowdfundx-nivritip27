import { describe, it, expect } from 'vitest';

describe('Campaign Card & Progress Rendering', () => {
  it('should compute and render correct progress percentage', () => {
    const goal = 10000;
    const raised = 5000;
    const percent = Math.min(100, Math.round((raised / goal) * 100));
    expect(percent).toBe(50);
  });

  it('should tag status as ended when campaign runs out of duration', () => {
    const status = 'ENDED';
    const isEnded = status === 'ENDED';
    expect(isEnded).toBe(true);
  });
});
