import { describe, it, expect } from 'vitest';
import { 
  validateCampaignTitle, 
  validateDescription, 
  validateGoalAmount, 
  validateDonationAmount, 
  validateWalletAddress, 
  sanitizeInput 
} from '../lib/validation';

describe('Input Validation & Security Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should strip HTML tags', () => {
      expect(sanitizeInput('<script>alert("hack")</script>Hello')).toBe('alert(&quot;hack&quot;)Hello');
      expect(sanitizeInput('<div>Test</div>')).toBe('Test');
    });

    it('should escape HTML characters', () => {
      expect(sanitizeInput('Hello & World')).toBe('Hello &amp; World');
      expect(sanitizeInput('Hello < World')).toBe('Hello &lt; World');
    });
  });

  describe('validateCampaignTitle', () => {
    it('should fail for empty titles', () => {
      expect(validateCampaignTitle('   ').valid).toBe(false);
    });

    it('should fail for too short or too long titles', () => {
      expect(validateCampaignTitle('ABC').valid).toBe(false);
      expect(validateCampaignTitle('A'.repeat(101)).valid).toBe(false);
    });

    it('should pass for valid titles', () => {
      expect(validateCampaignTitle('Quantum Mesh Grid').valid).toBe(true);
    });
  });

  describe('validateDescription', () => {
    it('should fail for short descriptions', () => {
      expect(validateDescription('Too short').valid).toBe(false);
    });

    it('should pass for valid descriptions', () => {
      expect(validateDescription('This is a valid long description for a Stellar crowdfunding campaign.').valid).toBe(true);
    });
  });

  describe('validateGoalAmount', () => {
    it('should fail for invalid numbers', () => {
      expect(validateGoalAmount('abc').valid).toBe(false);
      expect(validateGoalAmount('-100').valid).toBe(false);
    });

    it('should fail for excessively large goals', () => {
      expect(validateGoalAmount('20000000').valid).toBe(false);
    });

    it('should pass for valid goals', () => {
      expect(validateGoalAmount('5000').valid).toBe(true);
    });
  });

  describe('validateDonationAmount', () => {
    it('should fail for sub-1 XLM values', () => {
      expect(validateDonationAmount('0').valid).toBe(false);
      expect(validateDonationAmount('0.5').valid).toBe(false);
    });

    it('should pass for valid donation values', () => {
      expect(validateDonationAmount('100').valid).toBe(true);
    });
  });

  describe('validateWalletAddress', () => {
    it('should fail for non-Stellar or invalid length addresses', () => {
      expect(validateWalletAddress('ABC').valid).toBe(false);
      expect(validateWalletAddress('G'.repeat(55)).valid).toBe(false);
      expect(validateWalletAddress('G' + '1'.repeat(55)).valid).toBe(false); // 1 is invalid in Base32 (Stellar addresses use uppercase alphabets and 2-7)
    });

    it('should pass for valid Stellar testnet addresses', () => {
      expect(validateWalletAddress('GDCVCUVLIQR36YTCL4AHWHMDNHIFBUVE4VKMQPCZAQEMHO62XIYOAXQB').valid).toBe(true);
    });
  });
});
