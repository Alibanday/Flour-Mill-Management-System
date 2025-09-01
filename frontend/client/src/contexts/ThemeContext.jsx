import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [systemConfig, setSystemConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
    
    // Also check for system preference
    if (savedTheme === 'auto') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      applyTheme(systemTheme);
    }
  }, []);

  // Load system configuration
  useEffect(() => {
    if (user) {
      loadSystemConfig();
    }
  }, [user]);

  // Listen for system theme changes when using 'auto' theme
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        applyTheme(newSystemTheme);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Apply theme to document
  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add new theme class
    root.classList.add(newTheme);
    
    // Update CSS custom properties based on theme
    if (newTheme === 'dark') {
      root.style.setProperty('--bg-primary', '#1f2937');
      root.style.setProperty('--bg-secondary', '#374151');
      root.style.setProperty('--text-primary', '#f9fafb');
      root.style.setProperty('--text-secondary', '#d1d5db');
      root.style.setProperty('--border-color', '#4b5563');
      
      // Add dark mode classes to body
      document.body.classList.add('dark');
    } else {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f9fafb');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#6b7280');
      root.style.setProperty('--border-color', '#e5e7eb');
      
      // Remove dark mode classes from body
      document.body.classList.remove('dark');
    }
  };

  // Load system configuration
  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system-config/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemConfig(data.data);
        
        // Apply system theme if available
        if (data.data.ui?.theme && data.data.ui.theme !== 'auto') {
          setTheme(data.data.ui.theme);
          applyTheme(data.data.ui.theme);
        }
      }
    } catch (error) {
      console.error('Error loading system configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  // Change theme
  const changeTheme = async (newTheme) => {
    try {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);

      // Update system configuration if user is authenticated
      if (user) {
        await fetch('/api/system-config/theme', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ theme: newTheme })
        });
      }
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  };

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    changeTheme(newTheme);
  };

  // Get current theme configuration
  const getThemeConfig = () => {
    if (!systemConfig) return null;
    
    return {
      theme: systemConfig.ui?.theme || 'light',
      primaryColor: systemConfig.ui?.primaryColor || '#3B82F6',
      secondaryColor: systemConfig.ui?.secondaryColor || '#6B7280',
      borderRadius: systemConfig.ui?.borderRadius || 'md',
      fontSize: systemConfig.ui?.fontSize || 'base',
      compactMode: systemConfig.ui?.compactMode || false
    };
  };

  // Get dashboard configuration
  const getDashboardConfig = () => {
    if (!systemConfig) return null;
    
    return {
      defaultView: systemConfig.dashboard?.defaultView || 'grid',
      showQuickActions: systemConfig.dashboard?.showQuickActions ?? true,
      showRecentActivity: systemConfig.dashboard?.showRecentActivity ?? true,
      showStatistics: systemConfig.dashboard?.showStatistics ?? true,
      refreshInterval: systemConfig.dashboard?.refreshInterval || 30000
    };
  };

  // Get notification configuration
  const getNotificationConfig = () => {
    if (!systemConfig) return null;
    
    return {
      emailNotifications: systemConfig.notifications?.emailNotifications ?? true,
      pushNotifications: systemConfig.notifications?.pushNotifications ?? true,
      soundEnabled: systemConfig.notifications?.soundEnabled ?? true,
      notificationTypes: systemConfig.notifications?.notificationTypes || {}
    };
  };

  // Get system configuration
  const getSystemConfig = () => {
    if (!systemConfig) return null;
    
    return {
      maintenanceMode: systemConfig.system?.maintenanceMode || false,
      maintenanceMessage: systemConfig.system?.maintenanceMessage || '',
      sessionTimeout: systemConfig.system?.sessionTimeout || 3600000,
      maxLoginAttempts: systemConfig.system?.maxLoginAttempts || 5,
      passwordPolicy: systemConfig.system?.passwordPolicy || {}
    };
  };

  // Get export configuration
  const getExportConfig = () => {
    if (!systemConfig) return null;
    
    return {
      defaultFormat: systemConfig.export?.defaultFormat || 'pdf',
      includeHeaders: systemConfig.export?.includeHeaders ?? true,
      maxRowsPerExport: systemConfig.export?.maxRowsPerExport || 10000
    };
  };

  // Check if system is in maintenance mode
  const isMaintenanceMode = () => {
    return systemConfig?.system?.maintenanceMode || false;
  };

  const value = {
    theme,
    systemConfig,
    loading,
    changeTheme,
    toggleTheme,
    getThemeConfig,
    getDashboardConfig,
    getNotificationConfig,
    getSystemConfig,
    getExportConfig,
    isMaintenanceMode,
    loadSystemConfig
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
