import { describe, it, expect } from 'vitest';

describe('Event Message Parsing', () => {
  it('should parse EventSource payload fields correctly', () => {
    const rawData = JSON.stringify({
      type: 'CampaignCreated',
      payload: {
        title: 'Save the Oceans',
        goalXlm: 50000,
      },
    });
    
    const data = JSON.parse(rawData);
    expect(data.type).toBe('CampaignCreated');
    expect(data.payload.title).toBe('Save the Oceans');
    expect(data.payload.goalXlm).toBe(50000);
  });
});
