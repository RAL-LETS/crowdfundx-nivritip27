/**
 * validation.ts
 * Pure, side-effect-free validation and sanitisation helpers.
 * All functions return { valid: boolean; error?: string }.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Strip HTML tags and dangerous characters to prevent XSS
export function sanitizeInput(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/[<>&"'`]/g, (c) => {     // escape remaining dangerous chars
      const map: Record<string, string> = {
        '<': '&lt;', '>': '&gt;',
        '&': '&amp;', '"': '&quot;',
        "'": '&#x27;', '`': '&#x60;',
      };
      return map[c] ?? c;
    })
    .trim();
}

export function validateCampaignTitle(title: string): ValidationResult {
  const trimmed = title.trim();
  if (!trimmed) return { valid: false, error: 'Campaign title is required.' };
  if (trimmed.length < 5) return { valid: false, error: 'Title must be at least 5 characters.' };
  if (trimmed.length > 100) return { valid: false, error: 'Title must be 100 characters or fewer.' };
  if (/<[^>]*>/.test(trimmed)) return { valid: false, error: 'Title must not contain HTML.' };
  return { valid: true };
}

export function validateDescription(description: string): ValidationResult {
  const trimmed = description.trim();
  if (!trimmed) return { valid: false, error: 'Description is required.' };
  if (trimmed.length < 20) return { valid: false, error: 'Description must be at least 20 characters.' };
  if (trimmed.length > 2000) return { valid: false, error: 'Description must be 2000 characters or fewer.' };
  if (/<script/i.test(trimmed)) return { valid: false, error: 'Description contains invalid content.' };
  return { valid: true };
}

export function validateGoalAmount(goalStr: string): ValidationResult {
  const trimmed = goalStr.trim();
  if (!trimmed) return { valid: false, error: 'Funding goal is required.' };
  const value = Number(trimmed);
  if (isNaN(value)) return { valid: false, error: 'Funding goal must be a number.' };
  if (value <= 0) return { valid: false, error: 'Funding goal must be greater than 0.' };
  if (value > 10_000_000) return { valid: false, error: 'Funding goal cannot exceed 10,000,000 XLM.' };
  if (!Number.isFinite(value)) return { valid: false, error: 'Funding goal is not a valid number.' };
  return { valid: true };
}

export function validateDonationAmount(amountStr: string): ValidationResult {
  const trimmed = amountStr.trim();
  if (!trimmed) return { valid: false, error: 'Donation amount is required.' };
  const value = Number(trimmed);
  if (isNaN(value)) return { valid: false, error: 'Donation amount must be a number.' };
  if (value < 1) return { valid: false, error: 'Minimum donation is 1 XLM.' };
  if (value > 1_000_000) return { valid: false, error: 'Donation cannot exceed 1,000,000 XLM.' };
  if (!Number.isFinite(value)) return { valid: false, error: 'Donation amount is not valid.' };
  return { valid: true };
}

export function validateWalletAddress(address: string): ValidationResult {
  const trimmed = address.trim();
  if (!trimmed) return { valid: false, error: 'Wallet address is required.' };
  if (!trimmed.startsWith('G')) return { valid: false, error: 'Stellar address must start with G.' };
  if (trimmed.length !== 56) return { valid: false, error: 'Stellar address must be 56 characters long.' };
  if (!/^[A-Z2-7]+$/.test(trimmed)) return { valid: false, error: 'Stellar address contains invalid characters.' };
  return { valid: true };
}
