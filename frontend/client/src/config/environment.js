// Environment Configuration
const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000',
  
  // Application Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Flour Mill Management System',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Feature Flags
  ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  
  // External Services
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: import.meta.env.VITE_CLOUDINARY_API_KEY,
  
  // Development/Production flags
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
};

// Validate required configuration
const validateConfig = () => {
  const required = ['API_BASE_URL'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.warn('Missing required configuration:', missing);
  }
  
  return config;
};

export default validateConfig();

