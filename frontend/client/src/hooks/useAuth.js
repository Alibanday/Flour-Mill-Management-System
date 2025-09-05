import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  // Role-based permissions mapping
  const rolePermissions = {
    Admin: [
      'user.create', 'user.read', 'user.update', 'user.delete',
      'warehouse.create', 'warehouse.read', 'warehouse.update', 'warehouse.delete',
      'inventory.create', 'inventory.read', 'inventory.update', 'inventory.delete',
      'production.create', 'production.read', 'production.update', 'production.delete',
      'sales.create', 'sales.read', 'sales.update', 'sales.delete',
      'purchase.create', 'purchase.read', 'purchase.update', 'purchase.delete',
      'financial.create', 'financial.read', 'financial.update', 'financial.delete',
      'supplier.create', 'supplier.read', 'supplier.update', 'supplier.delete',
      'reports.read', 'reports.export',
      'system.config', 'system.admin'
    ],
    Manager: [
      'user.create', 'user.read', 'user.update',
      'warehouse.create', 'warehouse.read', 'warehouse.update',
      'inventory.create', 'inventory.read', 'inventory.update',
      'production.create', 'production.read', 'production.update',
      'sales.create', 'sales.read', 'sales.update',
      'purchase.create', 'purchase.read', 'purchase.update',
      'financial.create', 'financial.read', 'financial.update',
      'supplier.create', 'supplier.read', 'supplier.update',
      'reports.read', 'reports.export'
    ],
    Employee: [
      'warehouse.read',
      'inventory.read', 'inventory.update',
      'production.create', 'production.read', 'production.update',
      'gatepass.create', 'gatepass.read', 'gatepass.update'
    ],
    Cashier: [
      'sales.create', 'sales.read', 'sales.update',
      'purchase.read',
      'inventory.read'
    ]
  };

  // Validate token with backend
  const validateToken = useCallback(async (token) => {
    try {
      const response = await api.get('http://localhost:7000/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const userRole = localStorage.getItem('role');

      if (token && userData) {
        try {
          // Check if it's a mock token (for development)
          if (token.startsWith('mock-jwt-token-')) {
            const parsedUser = JSON.parse(userData);
            
            setUser(parsedUser);
            setRole(userRole);
            setIsAuthenticated(true);
            setPermissions(rolePermissions[userRole] || []);
          } else {
            // Validate real token with backend
            const validationResult = await validateToken(token);
            
            if (validationResult && validationResult.valid) {
              const parsedUser = JSON.parse(userData);
              
              setUser(parsedUser);
              setRole(userRole);
              setIsAuthenticated(true);
              setPermissions(rolePermissions[userRole] || []);
            } else {
              // Token is invalid, clear storage
              clearAuthData();
            }
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          // For mock tokens, don't clear on network errors
          if (!token.startsWith('mock-jwt-token-')) {
            clearAuthData();
          }
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, [validateToken]);

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    setPermissions([]);
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post('http://localhost:7000/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { user: userData, token } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('role', userData.role);
        
        setUser(userData);
        setRole(userData.role);
        setIsAuthenticated(true);
        setPermissions(rolePermissions[userData.role] || []);
        
        return { success: true, user: userData };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate token on server
      await api.post('http://localhost:7000/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post('http://localhost:7000/api/auth/refresh');
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthData();
    }
    return false;
  };

  // Enhanced role checking with permissions
  const isAdmin = () => role === 'Admin';
  const isManager = () => role === 'Manager';
  const isEmployee = () => role === 'Employee';
  const isCashier = () => role === 'Cashier';

  // Permission checking
  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList) => {
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (permissionList) => {
    return permissionList.every(permission => permissions.includes(permission));
  };

  // Role hierarchy checking
  const canAccess = (requiredRole) => {
    const roleHierarchy = ['Cashier', 'Employee', 'Manager', 'Admin'];
    const userRoleIndex = roleHierarchy.indexOf(role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    return userRoleIndex >= requiredRoleIndex;
  };

  return {
    user,
    role,
    isAuthenticated,
    loading,
    permissions,
    login,
    logout,
    refreshToken,
    isAdmin,
    isManager,
    isEmployee,
    isCashier,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess
  };
};
