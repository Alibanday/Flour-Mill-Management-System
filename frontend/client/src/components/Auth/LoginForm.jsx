import React, { useState } from 'react';
import { FaSignInAlt, FaEye, FaEyeSlash, FaUser, FaLock, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Mock users for demonstration
  const mockUsers = [
    {
      email: 'admin@flourmill.com',
      password: 'admin123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'Admin',
      _id: 'admin-1'
    },
    {
      email: 'manager@flourmill.com',
      password: 'manager123',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'Manager',
      _id: 'manager-1'
    },
    {
      email: 'employee@flourmill.com',
      password: 'employee123',
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'Employee',
      _id: 'employee-1'
    },
    {
      email: 'cashier@flourmill.com',
      password: 'cashier123',
      firstName: 'Sarah',
      lastName: 'Wilson',
      role: 'Cashier',
      _id: 'cashier-1'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check against mock users first (for development)
      const mockUser = mockUsers.find(user => 
        user.email === formData.email && user.password === formData.password
      );

      if (mockUser) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create mock login result
        const mockResult = {
          success: true,
          user: mockUser,
          token: 'mock-jwt-token-' + Date.now(),
          message: 'Login successful'
        };
        
        // Store user data in localStorage for mock login
        localStorage.setItem('token', mockResult.token);
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('role', mockUser.role);
        
        // Redirect to dashboard
        navigate('/dashboard');
        
        // Show success message
        toast.success(`Welcome ${mockUser.firstName}! You're logged in as ${mockUser.role}`);
        return;
      }

      // Try real API login if not found in mock users
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Use the login function from useAuth to store the user data
          login(result.user, result.token);
          toast.success(`Welcome ${result.user.firstName}! You're logged in as ${result.user.role}`);
          navigate('/dashboard');
        } else {
          toast.error(result.message || 'Invalid email or password. Please try again.');
        }
      } catch (apiError) {
        console.error('API login error:', apiError);
        toast.error('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FaShieldAlt className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your FlourMill Pro account
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : (
                <div className="flex items-center">
                  <FaSignInAlt className="h-4 w-4 mr-2" />
                  Sign In
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Demo Accounts Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center mb-2">
            <FaShieldAlt className="h-4 w-4 text-blue-600 mr-2" />
            <h3 className="text-sm font-medium text-blue-800">Demo Accounts</h3>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <div><strong>Admin:</strong> admin@flourmill.com / admin123</div>
            <div><strong>Manager:</strong> manager@flourmill.com / manager123</div>
            <div><strong>Employee:</strong> employee@flourmill.com / employee123</div>
            <div><strong>Cashier:</strong> cashier@flourmill.com / cashier123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
