export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
}

export interface PasswordPolicy {
  requirements: PasswordRequirements;
  maxAge: number; // days
  historySize: number; // prevent reuse of last N passwords
  lockoutAttempts: number;
  lockoutDuration: number; // minutes
}

export const defaultPasswordPolicy: PasswordPolicy = {
  requirements: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  maxAge: 90,
  historySize: 5,
  lockoutAttempts: 5,
  lockoutDuration: 15,
};

export class PasswordValidator {
  private policy: PasswordPolicy;

  constructor(policy: PasswordPolicy = defaultPasswordPolicy) {
    this.policy = policy;
  }

  validate(password: string): PasswordValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < this.policy.requirements.minLength) {
      errors.push(
        `Password must be at least ${this.policy.requirements.minLength} characters long`
      );
    } else {
      score += 20;
    }

    // Check for uppercase letters
    if (this.policy.requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
      suggestions.push('Add uppercase letters (A-Z)');
    } else if (/[A-Z]/.test(password)) {
      score += 20;
    }

    // Check for lowercase letters
    if (this.policy.requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
      suggestions.push('Add lowercase letters (a-z)');
    } else if (/[a-z]/.test(password)) {
      score += 20;
    }

    // Check for numbers
    if (this.policy.requirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
      suggestions.push('Add numbers (0-9)');
    } else if (/\d/.test(password)) {
      score += 20;
    }

    // Check for special characters
    if (
      this.policy.requirements.requireSpecialChars &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      errors.push('Password must contain at least one special character');
      suggestions.push('Add special characters (!@#$%^&*(),.?":{}|<>)');
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 20;
    }

    // Additional scoring for password complexity
    if (password.length > 12) score += 10;
    if (password.length > 16) score += 10;
    if (/[A-Z].*[A-Z]/.test(password)) score += 5; // Multiple uppercase
    if (/[a-z].*[a-z]/.test(password)) score += 5; // Multiple lowercase
    if (/\d.*\d/.test(password)) score += 5; // Multiple numbers
    if (/[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password))
      score += 5; // Multiple special chars

    // Cap the score at 100
    score = Math.min(score, 100);

    return {
      isValid: errors.length === 0,
      score,
      errors,
      suggestions,
    };
  }

  getStrengthText(score: number): string {
    if (score < 20) return 'Very Weak';
    if (score < 40) return 'Weak';
    if (score < 60) return 'Fair';
    if (score < 80) return 'Good';
    return 'Strong';
  }

  getStrengthColor(score: number): string {
    if (score < 20) return 'text-red-600';
    if (score < 40) return 'text-red-500';
    if (score < 60) return 'text-yellow-500';
    if (score < 80) return 'text-blue-500';
    return 'text-green-600';
  }
}
