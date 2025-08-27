import React from 'react';
import UserList from '../components/UserManagement/UserList';
import { useAuth } from '../hooks/useAuth';
import { FaUsers, FaUserCog, FaShieldAlt, FaPlus, FaCog } from 'react-icons/fa';

export default function UserManagementPage() {
  const { user, role, isAdmin, isManager } = useAuth();

  // Check if user has permission to access user management
  if (!isAdmin() && !isManager()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center border border-gray-200">
          <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <FaShieldAlt className="h-10 w-10 text-red-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            You don't have permission to access User Management. This feature requires Admin or Manager role.
          </p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Your current role:</strong> 
              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
                role === 'Admin' ? 'bg-red-100 text-red-800' :
                role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                role === 'Employee' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {role || 'Unknown'}
              </span>
            </p>
          </div>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FaUsers className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="mt-2 text-lg text-gray-600">
                  Manage system users, roles, and permissions
                </p>
              </div>
            </div>
            
            {/* Role-based header info */}
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Logged in as</p>
                <p className="text-lg font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                  role === 'Admin' ? 'bg-red-100 text-red-800 border border-red-200' :
                  role === 'Manager' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  <FaShieldAlt className="h-4 w-4 mr-2" />
                  {role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role-based feature summary */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <FaCog className="h-5 w-5 mr-3 text-blue-600" />
                Your Permissions & Capabilities
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Access Granted</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* User Management Permissions */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center mb-2">
                  <FaUsers className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-blue-900">User Management</h4>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  {(isAdmin() || isManager()) && <li>✓ Create new users</li>}
                  {(isAdmin() || isManager()) && <li>✓ View user list</li>}
                  {(isAdmin() || isManager()) && <li>✓ Edit user profiles</li>}
                  {isAdmin() && <li>✓ Delete users</li>}
                </ul>
              </div>

              {/* Role-based capabilities */}
              {role === 'Admin' && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center mb-2">
                    <FaShieldAlt className="h-5 w-5 text-red-600 mr-2" />
                    <h4 className="font-semibold text-red-900">Admin Privileges</h4>
                  </div>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>✓ Full system access</li>
                    <li>✓ Manage all users</li>
                    <li>✓ System configuration</li>
                    <li>✓ Override permissions</li>
                  </ul>
                </div>
              )}

              {role === 'Manager' && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center mb-2">
                    <FaUserCog className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-blue-900">Manager Capabilities</h4>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Manage team members</li>
                    <li>✓ View user reports</li>
                    <li>✓ Assign roles</li>
                    <li>✓ Limited admin access</li>
                  </ul>
                </div>
              )}

              {/* General permissions */}
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center mb-2">
                  <FaShieldAlt className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-semibold text-green-900">General Access</h4>
                </div>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>✓ View dashboard</li>
                  <li>✓ Manage own profile</li>
                  <li>✓ Access assigned modules</li>
                  <li>✓ View reports (if permitted)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* User List Component */}
        <UserList />
      </div>
    </div>
  );
}
