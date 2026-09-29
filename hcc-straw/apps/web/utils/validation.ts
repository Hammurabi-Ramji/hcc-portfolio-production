export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateField(
  value: any,
  rules: ValidationRules,
  fieldName: string
): string | null {
  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return `${fieldName} is required`;
  }

  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
    return `${fieldName} must be at most ${rules.maxLength} characters`;
  }

  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    return `${fieldName} is invalid`;
  }

  if (rules.email && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Please enter a valid email address';
  }

  if (rules.phone && typeof value === 'string' && !/^\+?[\d\s\-()]+$/.test(value)) {
    return 'Please enter a valid phone number';
  }

  if (rules.url && typeof value === 'string') {
    try {
      new URL(value);
    } catch {
      return 'Please enter a valid URL';
    }
  }

  if (rules.custom) {
    const customResult = rules.custom(value);
    if (customResult === false) {
      return `${fieldName} is invalid`;
    }
    if (typeof customResult === 'string') {
      return customResult;
    }
  }

  return null;
}

export function validateForm<T extends Record<string, any>>(
  data: T,
  validationRules: Record<keyof T, ValidationRules>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, value] of Object.entries(data)) {
    const rules = validationRules[field as keyof T];
    if (rules) {
      const error = validateField(value, rules, field);
      if (error) {
        errors[field] = error;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function createValidationRules(
  fieldRules: Record<string, ValidationRules>
): Record<string, ValidationRules> {
  return fieldRules;
}

export const commonRules = {
  email: { required: true, email: true },
  phone: { required: false, phone: true },
  url: { required: false, url: true },
  minLength: (length: number): ValidationRules => ({ minLength: length }),
  maxLength: (length: number): ValidationRules => ({ maxLength: length }),
  required: (message?: string): ValidationRules => ({
    required: true,
    custom: (value) => {
      if (!value || (typeof value === 'string' && !value.trim())) {
        return message || 'This field is required';
      }
      return true;
    },
  }),
};
