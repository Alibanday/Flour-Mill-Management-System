import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  // Role-based helper functions
  const role = user?.role || 'Employee';
  
  const isAdmin = () => {
    return role === 'Admin';
  };

  const isManager = () => {
    return role === 'Manager';
  };

  const isEmployee = () => {
    return role === 'Employee';
  };

  const isCashier = () => {
    return role === 'Cashier';
  };

  const isSales = () => {
    return role === 'Sales';
  };

  // Permission-based helper functions
  const hasAnyPermission = (requiredPermissions) => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Define role-based permissions
    const rolePermissions = {
      'Admin': [
        'system.admin',
        'user.create', 'user.read', 'user.update', 'user.delete',
        'warehouse.create', 'warehouse.read', 'warehouse.update', 'warehouse.delete',
        'inventory.create', 'inventory.read', 'inventory.update', 'inventory.delete',
        'reports.read', 'reports.create',
        'sales.create', 'sales.read', 'sales.update',
        'purchase.create', 'purchase.read', 'purchase.update',
        'production.create', 'production.read', 'production.update',
        'gatepass.create', 'gatepass.read', 'gatepass.update',
        'financial.create', 'financial.read', 'financial.update'
      ],
      'Manager': [
        'user.create', 'user.read', 'user.update',
        'warehouse.create', 'warehouse.read', 'warehouse.update',
        'inventory.create', 'inventory.read', 'inventory.update',
        'reports.read', 'reports.create',
        'sales.create', 'sales.read', 'sales.update',
        'purchase.create', 'purchase.read', 'purchase.update',
        'production.create', 'production.read', 'production.update',
        'gatepass.create', 'gatepass.read', 'gatepass.update',
        'financial.create', 'financial.read', 'financial.update'
      ],
      'Employee': [
        'warehouse.read', 'inventory.read',
        'production.create', 'production.read',
        'gatepass.create', 'gatepass.read'
      ],
      'Cashier': [
        'sales.create', 'sales.read', 'sales.update',
        'purchase.read',
        'inventory.read'
      ],
      'Sales': [
        'sales.create', 'sales.read', 'sales.update',
        'customer.create', 'customer.read', 'customer.update',
        'inventory.read',
        'reports.read'
      ]
    };

    const userPermissions = rolePermissions[role] || [];
    
    // Check if user has any of the required permissions
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  };

  const hasAllPermissions = (requiredPermissions) => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const rolePermissions = {
      'Admin': [
        'system.admin',
        'user.create', 'user.read', 'user.update', 'user.delete',
        'warehouse.create', 'warehouse.read', 'warehouse.update', 'warehouse.delete',
        'inventory.create', 'inventory.read', 'inventory.update', 'inventory.delete',
        'reports.read', 'reports.create',
        'sales.create', 'sales.read', 'sales.update',
        'purchase.create', 'purchase.read', 'purchase.update',
        'production.create', 'production.read', 'production.update',
        'gatepass.create', 'gatepass.read', 'gatepass.update',
        'financial.create', 'financial.read', 'financial.update'
      ],
      'Manager': [
        'user.create', 'user.read', 'user.update',
        'warehouse.create', 'warehouse.read', 'warehouse.update',
        'inventory.create', 'inventory.read', 'inventory.update',
        'reports.read', 'reports.create',
        'sales.create', 'sales.read', 'sales.update',
        'purchase.create', 'purchase.read', 'purchase.update',
        'production.create', 'production.read', 'production.update',
        'gatepass.create', 'gatepass.read', 'gatepass.update',
        'financial.create', 'financial.read', 'financial.update'
      ],
      'Employee': [
        'warehouse.read', 'inventory.read',
        'production.create', 'production.read',
        'gatepass.create', 'gatepass.read'
      ],
      'Cashier': [
        'sales.create', 'sales.read', 'sales.update',
        'purchase.read',
        'inventory.read'
      ],
      'Sales': [
        'sales.create', 'sales.read', 'sales.update',
        'customer.create', 'customer.read', 'customer.update',
        'inventory.read',
        'reports.read'
      ]
    };

    const userPermissions = rolePermissions[role] || [];
    
    // Check if user has all of the required permissions
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  };

  return {
    user,
    role,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isManager,
    isEmployee,
    isCashier,
    isSales,
    hasAnyPermission,
    hasAllPermissions
  };
};