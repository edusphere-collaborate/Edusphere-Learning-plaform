/**
 * EduSphere Form Validation System
 * Professional validation utilities with comprehensive error handling
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @description Production-ready form validation with type safety,
 *              custom rules, and user-friendly error messages
 */

import {
  ValidationResult,
  ValidationRules,
  FormSchema,
  ValidationError as ValidationErrorType,
} from '@/types/api';

/**
 * Built-in validation rules for common field types
 */
export class ValidationRules {
  /**
   * Check if value is required (not empty)
   * @param value - Value to validate
   * @returns boolean indicating if value is valid
   */
  static required(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  /**
   * Check if value meets minimum length requirement
   * @param min - Minimum length required
   * @returns Validation function
   */
  static minLength(min: number) {
    return (value: string): boolean => {
      if (!value) return true; // Let required rule handle empty values
      return value.length >= min;
    };
  }

  /**
   * Check if value doesn't exceed maximum length
   * @param max - Maximum length allowed
   * @returns Validation function
   */
  static maxLength(max: number) {
    return (value: string): boolean => {
      if (!value) return true; // Let required rule handle empty values
      return value.length <= max;
    };
  }

  /**
   * Check if value is a valid email address
   * @param value - Email value to validate
   * @returns boolean indicating if email is valid
   */
  static email(value: string): boolean {
    if (!value) return true; // Let required rule handle empty values
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Check if value matches a regular expression pattern
   * @param pattern - Regular expression pattern
   * @returns Validation function
   */
  static pattern(pattern: RegExp) {
    return (value: string): boolean => {
      if (!value) return true; // Let required rule handle empty values
      return pattern.test(value);
    };
  }

  /**
   * Check if value is a strong password
   * @param value - Password value to validate
   * @returns boolean indicating if password is strong
   */
  static strongPassword(value: string): boolean {
    if (!value) return true; // Let required rule handle empty values
    
    // At least 8 characters, one uppercase, one lowercase, one number, one special char
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(value);
  }

  /**
   * Check if value is a valid username
   * @param value - Username value to validate
   * @returns boolean indicating if username is valid
   */
  static username(value: string): boolean {
    if (!value) return true; // Let required rule handle empty values
    
    // 3-30 characters, alphanumeric and underscores only, no spaces
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(value);
  }

  /**
   * Check if value is a valid URL slug
   * @param value - Slug value to validate
   * @returns boolean indicating if slug is valid
   */
  static slug(value: string): boolean {
    if (!value) return true; // Let required rule handle empty values
    
    // Lowercase letters, numbers, and hyphens only
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(value);
  }

  /**
   * Check if value is a valid URL
   * @param value - URL value to validate
   * @returns boolean indicating if URL is valid
   */
  static url(value: string): boolean {
    if (!value) return true; // Let required rule handle empty values
    
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if value is a number within range
   * @param min - Minimum value (optional)
   * @param max - Maximum value (optional)
   * @returns Validation function
   */
  static numberRange(min?: number, max?: number) {
    return (value: number): boolean => {
      if (value === null || value === undefined) return true;
      
      const num = Number(value);
      if (isNaN(num)) return false;
      
      if (min !== undefined && num < min) return false;
      if (max !== undefined && num > max) return false;
      
      return true;
    };
  }

  /**
   * Check if value matches another field (for password confirmation)
   * @param otherValue - Value to match against
   * @returns Validation function
   */
  static matches(otherValue: any) {
    return (value: any): boolean => {
      return value === otherValue;
    };
  }
}

/**
 * Professional form validator with comprehensive error handling
 */
export class FormValidator {
  private rules: Map<string, (value: any) => boolean> = new Map();

  constructor() {
    // Register built-in validation rules
    this.registerRule('required', ValidationRules.required);
    this.registerRule('email', ValidationRules.email);
    this.registerRule('strongPassword', ValidationRules.strongPassword);
    this.registerRule('username', ValidationRules.username);
    this.registerRule('slug', ValidationRules.slug);
    this.registerRule('url', ValidationRules.url);
  }

  /**
   * Register a custom validation rule
   * @param name - Rule name
   * @param rule - Validation function
   */
  public registerRule(name: string, rule: (value: any) => boolean): void {
    this.rules.set(name, rule);
  }

  /**
   * Validate form data against schema
   * @param data - Form data to validate
   * @param schema - Validation schema
   * @returns Validation result with errors
   */
  public validate(data: Record<string, any>, schema: FormSchema): ValidationResult {
    const errors: Record<string, string> = {};

    // Validate each field in the schema
    for (const [fieldName, fieldRules] of Object.entries(schema)) {
      const fieldValue = data[fieldName];
      const fieldError = this.validateField(fieldValue, fieldRules, data);
      
      if (fieldError) {
        errors[fieldName] = fieldError;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Validate a single field against its rules
   * @param value - Field value to validate
   * @param rules - Validation rules for the field
   * @param allData - All form data (for cross-field validation)
   * @returns Error message or null if valid
   */
  private validateField(
    value: any,
    rules: ValidationRules,
    allData: Record<string, any>
  ): string | null {
    // Check required rule first
    if (rules.required && !ValidationRules.required(value)) {
      return rules.message || 'This field is required';
    }

    // Skip other validations if field is empty and not required
    if (!rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return null;
    }

    // Check minLength rule
    if (rules.minLength && !ValidationRules.minLength(rules.minLength)(value)) {
      return rules.message || `Must be at least ${rules.minLength} characters`;
    }

    // Check maxLength rule
    if (rules.maxLength && !ValidationRules.maxLength(rules.maxLength)(value)) {
      return rules.message || `Must be no more than ${rules.maxLength} characters`;
    }

    // Check email rule
    if (rules.email && !ValidationRules.email(value)) {
      return rules.message || 'Must be a valid email address';
    }

    // Check pattern rule
    if (rules.pattern && !ValidationRules.pattern(rules.pattern)(value)) {
      return rules.message || 'Invalid format';
    }

    // Check custom rule
    if (rules.custom && !rules.custom(value)) {
      return rules.message || 'Invalid value';
    }

    // Check built-in rules by name
    for (const [ruleName, ruleValue] of Object.entries(rules)) {
      if (ruleName === 'message' || ruleName === 'required' || 
          ruleName === 'minLength' || ruleName === 'maxLength' || 
          ruleName === 'email' || ruleName === 'pattern' || ruleName === 'custom') {
        continue;
      }

      const rule = this.rules.get(ruleName);
      if (rule && ruleValue && !rule(value)) {
        return rules.message || `Invalid ${ruleName}`;
      }
    }

    return null;
  }

  /**
   * Validate a single field (useful for real-time validation)
   * @param fieldName - Name of the field
   * @param value - Field value
   * @param rules - Validation rules
   * @param allData - All form data
   * @returns Error message or null if valid
   */
  public validateSingleField(
    fieldName: string,
    value: any,
    rules: ValidationRules,
    allData: Record<string, any> = {}
  ): string | null {
    return this.validateField(value, rules, allData);
  }
}

// ============================================================================
// PREDEFINED VALIDATION SCHEMAS
// ============================================================================

/**
 * User registration validation schema
 */
export const userRegistrationSchema: FormSchema = {
  username: {
    required: true,
    username: true,
    minLength: 3,
    maxLength: 30,
    message: 'Username must be 3-30 characters, alphanumeric and underscores only',
  },
  firstName: {
    maxLength: 50,
    message: 'First name must be no more than 50 characters',
  },
  lastName: {
    maxLength: 50,
    message: 'Last name must be no more than 50 characters',
  },
  email: {
    required: true,
    email: true,
    maxLength: 50,
    message: 'Must be a valid email address (max 50 characters)',
  },
  password: {
    required: true,
    minLength: 6,
    message: 'Password must be at least 6 characters',
  },
};

/**
 * User login validation schema
 */
export const userLoginSchema: FormSchema = {
  identifier: {
    required: true,
    message: 'Email or username is required',
  },
  password: {
    required: true,
    message: 'Password is required',
  },
};

/**
 * Room creation validation schema
 */
export const roomCreationSchema: FormSchema = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
    message: 'Room name is required (max 100 characters)',
  },
  description: {
    maxLength: 255,
    message: 'Description must be no more than 255 characters',
  },
  slug: {
    slug: true,
    maxLength: 100,
    message: 'Slug must contain only lowercase letters, numbers, and hyphens (max 100 characters)',
  },
  creatorId: {
    required: true,
    message: 'Creator ID is required',
  },
};

/**
 * Message validation schema
 */
export const messageSchema: FormSchema = {
  content: {
    required: true,
    minLength: 1,
    maxLength: 2000,
    message: 'Message content is required (max 2000 characters)',
  },
  userId: {
    required: true,
    message: 'User ID is required',
  },
};

/**
 * Media upload validation schema
 */
export const mediaUploadSchema: FormSchema = {
  url: {
    required: true,
    url: true,
    message: 'Valid URL is required',
  },
  type: {
    required: true,
    custom: (value: string) => ['IMAGE', 'VIDEO'].includes(value),
    message: 'Type must be IMAGE or VIDEO',
  },
  userId: {
    required: true,
    message: 'User ID is required',
  },
  roomId: {
    required: true,
    message: 'Room ID is required',
  },
};

/**
 * AI query validation schema
 */
export const aiQuerySchema: FormSchema = {
  query: {
    required: true,
    minLength: 1,
    maxLength: 1000,
    message: 'Query is required (max 1000 characters)',
  },
  userId: {
    required: true,
    message: 'User ID is required',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a default form validator instance
 */
export const formValidator = new FormValidator();

/**
 * Quick validation function for common use cases
 * @param data - Data to validate
 * @param schema - Validation schema
 * @returns Validation result
 */
export function validateForm(data: Record<string, any>, schema: FormSchema): ValidationResult {
  return formValidator.validate(data, schema);
}

/**
 * Validate single field with schema
 * @param fieldName - Field name
 * @param value - Field value
 * @param schema - Form schema
 * @param allData - All form data
 * @returns Error message or null
 */
export function validateField(
  fieldName: string,
  value: any,
  schema: FormSchema,
  allData: Record<string, any> = {}
): string | null {
  const fieldRules = schema[fieldName];
  if (!fieldRules) return null;

  return formValidator.validateSingleField(fieldName, value, fieldRules, allData);
}

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Generate a URL-friendly slug from text
 * @param text - Text to convert to slug
 * @returns URL-friendly slug
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check password strength and return feedback
 * @param password - Password to check
 * @returns Strength assessment
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  if (!password) {
    return { score: 0, feedback: ['Password is required'], isStrong: false };
  }

  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 2;
  } else if (password.length >= 6) {
    score += 1;
    feedback.push('Use at least 8 characters for better security');
  } else {
    feedback.push('Password must be at least 6 characters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }

  // Special character check
  if (/[@$!%*?&]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters (@$!%*?&)');
  }

  // Common patterns check
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeating characters');
  }

  if (/123|abc|qwe/i.test(password)) {
    score -= 1;
    feedback.push('Avoid common patterns');
  }

  const isStrong = score >= 5 && feedback.length === 0;

  return {
    score: Math.max(0, Math.min(5, score)),
    feedback,
    isStrong,
  };
}

/**
 * Debounce function for real-time validation
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
