import { z } from 'zod';

// Common weak passwords to reject
const WEAK_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
  'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
  'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael',
  'football', 'password1', 'welcome', 'admin', 'user', 'test'
]);

export interface PasswordStrength {
  score: number; // 0-4 (0=very weak, 4=very strong)
  label: 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong';
  feedback: string[];
  isValid: boolean;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    notCommon: boolean;
  };
}

export const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" });

export const checkPasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
    notCommon: !WEAK_PASSWORDS.has(password.toLowerCase())
  };

  // Calculate score
  let score = 0;
  if (checks.minLength) score++;
  if (checks.hasUppercase && checks.hasLowercase) score++;
  if (checks.hasNumber) score++;
  if (checks.hasSpecial) score++;
  if (checks.notCommon) score++;

  // Bonus for length
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Cap at 4
  score = Math.min(4, score);

  // Generate feedback
  if (!checks.minLength) feedback.push("Use at least 8 characters");
  if (!checks.hasUppercase) feedback.push("Add uppercase letters");
  if (!checks.hasLowercase) feedback.push("Add lowercase letters");
  if (!checks.hasNumber) feedback.push("Add numbers");
  if (!checks.hasSpecial) feedback.push("Add special characters (!@#$%^&*)");
  if (!checks.notCommon) feedback.push("Avoid common passwords");

  // Determine label
  let label: PasswordStrength['label'];
  if (score === 0) label = 'very weak';
  else if (score === 1) label = 'weak';
  else if (score === 2) label = 'medium';
  else if (score === 3) label = 'strong';
  else label = 'very strong';

  const isValid = Object.values(checks).every(check => check);

  return {
    score,
    label,
    feedback,
    isValid,
    checks
  };
};

/**
 * Check if password has been compromised using HaveIBeenPwned API
 * Uses k-anonymity model (only sends first 5 chars of hash)
 * @param password - The password to check
 * @returns Promise<boolean> - true if password is compromised
 */
export const checkPasswordBreach = async (password: string): Promise<boolean> => {
  try {
    // Hash the password using SHA-1
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Send only first 5 characters to API (k-anonymity)
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true' // Adds padding to prevent attacks
      }
    });

    if (!response.ok) {
      console.warn('Failed to check password breach, allowing password');
      return false; // Fail open - don't block user if API is down
    }

    const text = await response.text();
    const hashes = text.split('\n');
    
    // Check if our suffix appears in the results
    for (const line of hashes) {
      const [hashSuffix] = line.split(':');
      if (hashSuffix === suffix) {
        return true; // Password found in breach database
      }
    }

    return false; // Password not found in breaches
  } catch (error) {
    console.error('Error checking password breach:', error);
    return false; // Fail open - don't block user if check fails
  }
};
