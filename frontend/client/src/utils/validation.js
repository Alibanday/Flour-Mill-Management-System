// Comprehensive validation utilities
export const validationRules = {
  // Email validation
  email: {
    required: (value) => !value ? 'Email is required' : null,
    format: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !emailRegex.test(value) ? 'Please enter a valid email address' : null;
    }
  },

  // Password validation
  password: {
    required: (value) => !value ? 'Password is required' : null,
    minLength: (value, min = 6) => 
      value && value.length < min ? `Password must be at least ${min} characters` : null,
    strength: (value) => {
      if (!value) return null;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
        return 'Password must contain uppercase, lowercase, number, and special character';
      }
      return null;
    }
  },

  // Name validation
  name: {
    required: (value) => !value ? 'Name is required' : null,
    minLength: (value, min = 2) => 
      value && value.length < min ? `Name must be at least ${min} characters` : null,
    maxLength: (value, max = 50) => 
      value && value.length > max ? `Name must be less than ${max} characters` : null,
    format: (value) => {
      if (!value) return null;
      const nameRegex = /^[a-zA-Z\s'-]+$/;
      return !nameRegex.test(value) ? 'Name can only contain letters, spaces, hyphens, and apostrophes' : null;
    }
  },

  // Phone validation
  phone: {
    required: (value) => !value ? 'Phone number is required' : null,
    format: (value) => {
      if (!value) return null;
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return !phoneRegex.test(value.replace(/[\s\-\(\)]/g, '')) ? 'Please enter a valid phone number' : null;
    }
  },

  // CNIC validation (Pakistan)
  cnic: {
    required: (value) => !value ? 'CNIC is required' : null,
    format: (value) => {
      if (!value) return null;
      const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
      return !cnicRegex.test(value) ? 'CNIC must be in format: 12345-1234567-1' : null;
    }
  },

  // Number validation
  number: {
    required: (value) => value === null || value === undefined || value === '' ? 'Number is required' : null,
    positive: (value) => value !== null && value !== undefined && value <= 0 ? 'Number must be positive' : null,
    min: (value, min) => value !== null && value !== undefined && value < min ? `Value must be at least ${min}` : null,
    max: (value, max) => value !== null && value !== undefined && value > max ? `Value must be less than ${max}` : null,
    integer: (value) => value !== null && value !== undefined && !Number.isInteger(Number(value)) ? 'Value must be a whole number' : null
  },

  // Date validation
  date: {
    required: (value) => !value ? 'Date is required' : null,
    future: (value) => {
      if (!value) return null;
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date <= today ? 'Date must be in the future' : null;
    },
    past: (value) => {
      if (!value) return null;
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return date >= today ? 'Date must be in the past' : null;
    }
  },

  // Text validation
  text: {
    required: (value) => !value || value.trim() === '' ? 'This field is required' : null,
    minLength: (value, min) => 
      value && value.trim().length < min ? `Text must be at least ${min} characters` : null,
    maxLength: (value, max) => 
      value && value.trim().length > max ? `Text must be less than ${max} characters` : null
  },

  // Address validation
  address: {
    required: (value) => !value || value.trim() === '' ? 'Address is required' : null,
    minLength: (value, min = 10) => 
      value && value.trim().length < min ? `Address must be at least ${min} characters` : null
  },

  // File validation
  file: {
    required: (value) => !value ? 'File is required' : null,
    type: (value, allowedTypes) => {
      if (!value) return null;
      const fileType = value.type;
      return !allowedTypes.includes(fileType) ? `File type must be one of: ${allowedTypes.join(', ')}` : null;
    },
    size: (value, maxSizeMB) => {
      if (!value) return null;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      return value.size > maxSizeBytes ? `File size must be less than ${maxSizeMB}MB` : null;
    }
  }
};

// Validation helper functions
export const validateField = (value, rules) => {
  const errors = [];
  
  for (const [ruleName, ruleFunction] of Object.entries(rules)) {
    const error = ruleFunction(value);
    if (error) {
      errors.push(error);
    }
  }
  
  return errors;
};

export const validateForm = (formData, validationSchema) => {
  const errors = {};
  let isValid = true;

  for (const [fieldName, rules] of Object.entries(validationSchema)) {
    const fieldErrors = validateField(formData[fieldName], rules);
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors[0]; // Take first error
      isValid = false;
    }
  }

  return { errors, isValid };
};

// Common validation schemas
export const validationSchemas = {
  user: {
    firstName: {
      required: validationRules.name.required,
      minLength: (value) => validationRules.name.minLength(value, 2),
      maxLength: (value) => validationRules.name.maxLength(value, 50),
      format: validationRules.name.format
    },
    lastName: {
      required: validationRules.name.required,
      minLength: (value) => validationRules.name.minLength(value, 2),
      maxLength: (value) => validationRules.name.maxLength(value, 50),
      format: validationRules.name.format
    },
    email: {
      required: validationRules.email.required,
      format: validationRules.email.format
    },
    password: {
      required: validationRules.password.required,
      minLength: (value) => validationRules.password.minLength(value, 6),
      strength: validationRules.password.strength
    },
    phone: {
      required: validationRules.phone.required,
      format: validationRules.phone.format
    },
    cnic: {
      required: validationRules.cnic.required,
      format: validationRules.cnic.format
    },
    address: {
      required: validationRules.address.required,
      minLength: (value) => validationRules.address.minLength(value, 10)
    }
  },

  warehouse: {
    name: {
      required: validationRules.text.required,
      minLength: (value) => validationRules.text.minLength(value, 3),
      maxLength: (value) => validationRules.text.maxLength(value, 100)
    },
    address: {
      required: validationRules.address.required,
      minLength: (value) => validationRules.address.minLength(value, 10)
    },
    capacity: {
      required: validationRules.number.required,
      positive: validationRules.number.positive,
      integer: validationRules.number.integer
    }
  },

  inventory: {
    name: {
      required: validationRules.text.required,
      minLength: (value) => validationRules.text.minLength(value, 2),
      maxLength: (value) => validationRules.text.maxLength(value, 100)
    },
    quantity: {
      required: validationRules.number.required,
      positive: validationRules.number.positive,
      integer: validationRules.number.integer
    },
    price: {
      required: validationRules.number.required,
      positive: validationRules.number.positive
    },
    minStock: {
      required: validationRules.number.required,
      positive: validationRules.number.positive,
      integer: validationRules.number.integer
    }
  },

  production: {
    productName: {
      required: validationRules.text.required,
      minLength: (value) => validationRules.text.minLength(value, 2),
      maxLength: (value) => validationRules.text.maxLength(value, 100)
    },
    quantity: {
      required: validationRules.number.required,
      positive: validationRules.number.positive,
      integer: validationRules.number.integer
    },
    date: {
      required: validationRules.date.required,
      past: validationRules.date.past
    }
  },

  sales: {
    customerName: {
      required: validationRules.name.required,
      minLength: (value) => validationRules.name.minLength(value, 2),
      maxLength: (value) => validationRules.name.maxLength(value, 100)
    },
    totalAmount: {
      required: validationRules.number.required,
      positive: validationRules.number.positive
    },
    date: {
      required: validationRules.date.required,
      past: validationRules.date.past
    }
  }
};

// Real-time validation hook
export const useValidation = (initialData = {}, schema = {}) => {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (fieldName, value) => {
    const fieldSchema = schema[fieldName];
    if (!fieldSchema) return null;

    const fieldErrors = Object.values(fieldSchema)
      .map(rule => rule(value))
      .filter(error => error !== null);

    return fieldErrors.length > 0 ? fieldErrors[0] : null;
  };

  const handleChange = (fieldName, value) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
    
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, data[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    for (const fieldName of Object.keys(schema)) {
      const error = validateField(fieldName, data[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    setTouched(Object.keys(schema).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    
    return { errors: newErrors, isValid };
  };

  const reset = () => {
    setData(initialData);
    setErrors({});
    setTouched({});
  };

  return {
    data,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    reset,
    setData
  };
};

// Import useState for the hook
import { useState } from 'react';

