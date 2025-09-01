import React, { useState, useEffect } from 'react';
import { FaCog, FaPalette, FaDesktop, FaBell, FaShieldAlt, FaFileExport, FaSave, FaUndo, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';

const SystemConfigPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [activeTab, setActiveTab] = useState('ui');
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuth();
  const { loadSystemConfig } = useTheme();

  // Load configuration and metadata
  useEffect(() => {
    loadConfiguration();
    loadMetadata();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system-config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data.data);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const response = await fetch('/api/system-config/metadata', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMetadata(data.data);
      }
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };

  // Handle configuration updates
  const handleConfigChange = (section, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  // Handle nested configuration updates
  const handleNestedConfigChange = (section, subsection, key, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [key]: value
        }
      }
    }));
  };

  // Save configuration
  const saveConfiguration = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/system-config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        // Reload configuration and refresh theme context
        await loadConfiguration();
        await loadSystemConfig();
        alert('Configuration saved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error saving configuration: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  // Reset configuration to defaults
  const resetConfiguration = async () => {
    if (!confirm('Are you sure you want to reset all configuration to defaults? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/system-config/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        await loadConfiguration();
        await loadSystemConfig();
        alert('Configuration reset to defaults successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error resetting configuration: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error resetting configuration:', error);
      alert('Error resetting configuration');
    } finally {
      setSaving(false);
    }
  };

  // Render color picker
  const renderColorPicker = (section, key, label, colors) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex space-x-2">
        {colors.map(color => (
          <button
            key={color}
            onClick={() => handleConfigChange(section, key, color)}
            className={`w-8 h-8 rounded-full border-2 ${
              config?.[section]?.[key] === color ? 'border-gray-800' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        <input
          type="color"
          value={config?.[section]?.[key] || '#3B82F6'}
          onChange={(e) => handleConfigChange(section, key, e.target.value)}
          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
        />
      </div>
    </div>
  );

  // Render select field
  const renderSelect = (section, key, label, options, nested = false) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        value={nested ? config?.[section]?.[key] || '' : config?.[section]?.[key] || ''}
        onChange={(e) => handleConfigChange(section, key, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map(option => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </div>
  );

  // Render checkbox
  const renderCheckbox = (section, key, label, nested = false, subsection = null) => (
    <div className="mb-4">
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={nested ? config?.[section]?.[subsection]?.[key] || false : config?.[section]?.[key] || false}
          onChange={(e) => {
            if (nested) {
              handleNestedConfigChange(section, subsection, key, e.target.checked);
            } else {
              handleConfigChange(section, key, e.target.checked);
            }
          }}
          className="mr-2"
        />
        <span className="text-sm text-gray-700">{label}</span>
      </label>
    </div>
  );

  // Render number input
  const renderNumberInput = (section, key, label, min, max, step = 1) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="number"
        value={config?.[section]?.[key] || ''}
        onChange={(e) => handleConfigChange(section, key, parseInt(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  // Render text input
  const renderTextInput = (section, key, label, maxLength = null) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="text"
        value={config?.[section]?.[key] || ''}
        onChange={(e) => handleConfigChange(section, key, e.target.value)}
        maxLength={maxLength}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config || !metadata) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaCog className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Configuration not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FaCog className="w-8 h-8 text-blue-600 mr-3" />
                System Configuration & Settings
              </h1>
              <p className="mt-2 text-gray-600">
                Manage system appearance, behavior, and preferences
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={resetConfiguration}
                disabled={saving}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200 disabled:opacity-50"
              >
                <FaUndo className="w-4 h-4 mr-2 inline" />
                Reset to Defaults
              </button>
              <button
                onClick={saveConfiguration}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
              >
                <FaSave className="w-4 h-4 mr-2 inline" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Tabs */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'ui', label: 'UI/UX', icon: FaPalette },
                { id: 'dashboard', label: 'Dashboard', icon: FaDesktop },
                { id: 'notifications', label: 'Notifications', icon: FaBell },
                { id: 'system', label: 'System', icon: FaShieldAlt },
                { id: 'export', label: 'Export', icon: FaFileExport }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* UI/UX Configuration */}
            {activeTab === 'ui' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">User Interface & Experience</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {renderSelect('ui', 'theme', 'Theme', metadata.themes)}
                    {renderSelect('ui', 'borderRadius', 'Border Radius', metadata.borderRadius)}
                    {renderSelect('ui', 'fontSize', 'Font Size', metadata.fontSize)}
                    {renderCheckbox('ui', 'compactMode', 'Compact Mode')}
                  </div>
                  
                  <div>
                    {renderColorPicker('ui', 'primaryColor', 'Primary Color', metadata.colors.primary)}
                    {renderColorPicker('ui', 'secondaryColor', 'Secondary Color', metadata.colors.secondary)}
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Configuration */}
            {activeTab === 'dashboard' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Dashboard Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {renderSelect('dashboard', 'defaultView', 'Default View', metadata.dashboardViews)}
                    {renderSelect('dashboard', 'refreshInterval', 'Refresh Interval', metadata.refreshIntervals)}
                  </div>
                  
                  <div>
                    {renderCheckbox('dashboard', 'showQuickActions', 'Show Quick Actions')}
                    {renderCheckbox('dashboard', 'showRecentActivity', 'Show Recent Activity')}
                    {renderCheckbox('dashboard', 'showStatistics', 'Show Statistics')}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Configuration */}
            {activeTab === 'notifications' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {renderCheckbox('notifications', 'emailNotifications', 'Email Notifications')}
                    {renderCheckbox('notifications', 'pushNotifications', 'Push Notifications')}
                    {renderCheckbox('notifications', 'soundEnabled', 'Sound Enabled')}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Types</h4>
                    {renderCheckbox('notifications', 'lowStock', 'Low Stock Alerts', true, 'notificationTypes')}
                    {renderCheckbox('notifications', 'pendingPayment', 'Pending Payment Alerts', true, 'notificationTypes')}
                    {renderCheckbox('notifications', 'restockReminder', 'Restock Reminders', true, 'notificationTypes')}
                    {renderCheckbox('notifications', 'systemMaintenance', 'System Maintenance', true, 'notificationTypes')}
                    {renderCheckbox('notifications', 'userActivity', 'User Activity', true, 'notificationTypes')}
                  </div>
                </div>
              </div>
            )}

            {/* System Configuration */}
            {activeTab === 'system' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">System Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {renderCheckbox('system', 'maintenanceMode', 'Maintenance Mode')}
                    {renderTextInput('system', 'maintenanceMessage', 'Maintenance Message', 500)}
                    {renderSelect('system', 'sessionTimeout', 'Session Timeout', metadata.sessionTimeouts)}
                    {renderSelect('system', 'maxLoginAttempts', 'Max Login Attempts', metadata.loginAttempts)}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Password Policy</h4>
                    {renderSelect('system', 'minLength', 'Minimum Length', metadata.passwordLengths, true, 'passwordPolicy')}
                    {renderCheckbox('system', 'requireUppercase', 'Require Uppercase', true, 'passwordPolicy')}
                    {renderCheckbox('system', 'requireLowercase', 'Require Lowercase', true, 'passwordPolicy')}
                    {renderCheckbox('system', 'requireNumbers', 'Require Numbers', true, 'passwordPolicy')}
                    {renderCheckbox('system', 'requireSpecialChars', 'Require Special Characters', true, 'passwordPolicy')}
                  </div>
                </div>
              </div>
            )}

            {/* Export Configuration */}
            {activeTab === 'export' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Export Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {renderSelect('export', 'defaultFormat', 'Default Format', metadata.exportFormats)}
                    {renderSelect('export', 'maxRowsPerExport', 'Max Rows Per Export', metadata.exportRowLimits)}
                  </div>
                  
                  <div>
                    {renderCheckbox('export', 'includeHeaders', 'Include Headers')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemConfigPage;
