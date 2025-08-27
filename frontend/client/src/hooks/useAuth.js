import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const userRole = localStorage.getItem('role');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        
        setUser(parsedUser);
        setRole(userRole);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear data on error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      }
    }
    
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userData.role);
    
    setUser(userData);
    setRole(userData.role);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
  };

  // Simple role checking - no complex permissions
  const isAdmin = () => role === 'Admin';
  const isManager = () => role === 'Manager';
  const isEmployee = () => role === 'Employee';
  const isCashier = () => role === 'Cashier';

  return {
    user,
    role,
    isAuthenticated,
    loading,
    login,
    logout,
    isAdmin,
    isManager,
    isEmployee,
    isCashier
  };
};
