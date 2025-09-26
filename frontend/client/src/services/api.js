// API Configuration Service
import axios from 'axios';
import config from '../config/environment.js';

// Get API base URL from configuration
const API_BASE_URL = config.API_BASE_URL;

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: 'http://localhost:7000/api/auth/login',
    REGISTER: 'http://localhost:7000/api/auth/register',
    LOGOUT: 'http://localhost:7000/api/auth/logout',
    REFRESH: 'http://localhost:7000/api/auth/refresh',
  },
  
  // User management
  USERS: {
    CREATE: 'http://localhost:7000/api/users/create',
    GET_ALL: 'http://localhost:7000/api/users/all',
    GET_BY_ID: (id) => `http://localhost:7000/api/users/${id}`,
    UPDATE: (id) => `http://localhost:7000/api/users/${id}`,
    DELETE: (id) => `http://localhost:7000/api/users/${id}`,
  },
  
  // Warehouse management
  WAREHOUSES: {
    CREATE: 'http://localhost:7000/api/warehouses/create',
    GET_ALL: 'http://localhost:7000/api/warehouses/all',
    GET_BY_ID: (id) => `http://localhost:7000/api/warehouses/${id}`,
    UPDATE: (id) => `http://localhost:7000/api/warehouses/${id}`,
    DELETE: (id) => `http://localhost:7000/api/warehouses/${id}`,
    SEARCH: 'http://localhost:7000/api/warehouses/search',
  },
  
  // Inventory management
  INVENTORY: {
    CREATE: 'http://localhost:7000/api/inventory/create',
    GET_ALL: 'http://localhost:7000/api/inventory/all',
    GET_BY_ID: (id) => `http://localhost:7000/api/inventory/${id}`,
    UPDATE: (id) => `http://localhost:7000/api/inventory/${id}`,
    DELETE: (id) => `http://localhost:7000/api/inventory/${id}`,
    SUMMARY: 'http://localhost:7000/api/inventory/summary',
    LOW_STOCK: 'http://localhost:7000/api/inventory/low-stock',
    FIND_EXISTING: 'http://localhost:7000/api/inventory/find-existing',
    ADD_STOCK: (id) => `http://localhost:7000/api/inventory/${id}/add-stock`,
  },
  
        // Stock management
        STOCK: {
          ADD: 'http://localhost:7000/api/stock/add',
          GET_ALL: 'http://localhost:7000/api/stock/all',
          GET_BY_ID: (id) => `http://localhost:7000/api/stock/${id}`,
          UPDATE: (id) => `http://localhost:7000/api/stock/${id}`,
          DELETE: (id) => `http://localhost:7000/api/stock/${id}`,
          SEARCH: 'http://localhost:7000/api/stock/search',
          TRANSFER: 'http://localhost:7000/api/stock/transfer',
          TRANSFER_BETWEEN: 'http://localhost:7000/api/stock/transfer-between',
          UPDATE_QUANTITY: (id) => `http://localhost:7000/api/stock/quantity/${id}`,
          LOW_STOCK: 'http://localhost:7000/api/stock/low-stock',
          BY_CATEGORY: (category) => `http://localhost:7000/api/stock/category/${category}`,
          SUMMARY: 'http://localhost:7000/api/stock/summary',
          ALERTS: 'http://localhost:7000/api/stock/alerts',
        },
  
  // Production management
  PRODUCTION: {
    CREATE: 'http://localhost:7000/api/production/create',
    GET_ALL: 'http://localhost:7000/api/production/all',
    GET_BY_ID: (id) => `http://localhost:7000/api/production/${id}`,
    UPDATE: (id) => `http://localhost:7000/api/production/${id}`,
    DELETE: (id) => `http://localhost:7000/api/production/${id}`,
  },
  
  // Sales management
  SALES: {
    CREATE: 'http://localhost:7000/api/sales/create',
    GET_ALL: 'http://localhost:7000/api/sales/all',
    GET_BY_ID: (id) => `http://localhost:7000/api/sales/${id}`,
    UPDATE: (id) => `http://localhost:7000/api/sales/${id}`,
    DELETE: (id) => `http://localhost:7000/api/sales/${id}`,
  },
  
  // Purchase management
  PURCHASES: {
    CREATE: 'http://localhost:7000/api/purchases/create',
    GET_ALL: 'http://localhost:7000/api/purchases/all',
    GET_BY_ID: (id) => `http://localhost:7000/api/purchases/${id}`,
    UPDATE: (id) => `http://localhost:7000/api/purchases/${id}`,
    DELETE: (id) => `http://localhost:7000/api/purchases/${id}`,
  },
  
  // Financial management
  FINANCIAL: {
    ACCOUNTS: 'http://localhost:7000/api/financial/accounts',
    TRANSACTIONS: 'http://localhost:7000/api/financial/transactions',
    SALARIES: 'http://localhost:7000/api/financial/salaries',
  },
  
  // Supplier management
  SUPPLIERS: {
    CREATE: 'http://localhost:7000/api/suppliers/create',
    GET_ALL: 'http://localhost:7000/api/suppliers/all',
    GET_BY_ID: (id) => `http://localhost:7000/api/suppliers/${id}`,
    UPDATE: (id) => `http://localhost:7000/api/suppliers/${id}`,
    DELETE: (id) => `http://localhost:7000/api/suppliers/${id}`,
  },
  
  // Bag purchases
  BAG_PURCHASES: {
    CREATE: 'http://localhost:7000/api/bag-purchases/create',
    GET_ALL: 'http://localhost:7000/api/bag-purchases/all',
    GET_BY_ID: (id) => `http://localhost:7000/api/bag-purchases/${id}`,
    UPDATE: (id) => `http://localhost:7000/api/bag-purchases/${id}`,
    DELETE: (id) => `http://localhost:7000/api/bag-purchases/${id}`,
  },
  
  // Food purchases
  FOOD_PURCHASES: {
    CREATE: 'http://localhost:7000/api/food-purchases/create',
    GET_ALL: 'http://localhost:7000/api/food-purchases/all',
    GET_BY_ID: (id) => `http://localhost:7000/api/food-purchases/${id}`,
    UPDATE: (id) => `http://localhost:7000/api/food-purchases/${id}`,
    DELETE: (id) => `http://localhost:7000/api/food-purchases/${id}`,
  },
  
  // Gate pass
  GATE_PASS: {
    CREATE: 'http://localhost:7000/api/gate-pass/create',
    GET_ALL: 'http://localhost:7000/api/gate-pass/all',
    GET_BY_ID: (id) => `http://localhost:7000/api/gate-pass/${id}`,
    UPDATE: (id) => `http://localhost:7000/api/gate-pass/${id}`,
    DELETE: (id) => `http://localhost:7000/api/gate-pass/${id}`,
  },
  
  // Reports
  REPORTS: {
    SALES: 'http://localhost:7000/api/reports/sales',
    INVENTORY: 'http://localhost:7000/api/reports/inventory',
    PROFIT_LOSS: 'http://localhost:7000/api/reports/profit-loss',
    EXPENSE: 'http://localhost:7000/api/reports/expense',
    SALARY: 'http://localhost:7000/api/reports/salary',
    VENDOR_OUTSTANDING: 'http://localhost:7000/api/reports/vendor-outstanding',
  },
  
  // Notifications
  NOTIFICATIONS: {
    GET_ALL: 'http://localhost:7000/api/notifications/all',
    MARK_READ: (id) => `http://localhost:7000/api/notifications/${id}/read`,
    DELETE: (id) => `http://localhost:7000/api/notifications/${id}`,
  },
  
  // System config
  SYSTEM_CONFIG: {
    GET: 'http://localhost:7000/api/system-config',
    UPDATE: 'http://localhost:7000/api/system-config',
  },

  // Customer management
  CUSTOMERS: 'http://localhost:7000/api/customers',
  
  // Stock transfers
  STOCK_TRANSFERS: 'http://localhost:7000/api/stock-transfers',
  
  // Repacking
  REPACKING: 'http://localhost:7000/api/repacking',
  
  // Production costs
  PRODUCTION_COSTS: 'http://localhost:7000/api/production-costs',
};

// Export the configured axios instance
export default api;

// Helper functions for common API operations
export const apiHelpers = {
  // Generic CRUD operations
  create: (endpoint, data) => api.post(endpoint, data),
  getAll: (endpoint, params = {}) => api.get(endpoint, { params }),
  getById: (endpoint) => api.get(endpoint),
  update: (endpoint, data) => api.put(endpoint, data),
  delete: (endpoint) => api.delete(endpoint),
  
  // File upload
  upload: (endpoint, formData) => api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Download file
  download: (endpoint, params = {}) => api.get(endpoint, {
    params,
    responseType: 'blob'
  }),
};
