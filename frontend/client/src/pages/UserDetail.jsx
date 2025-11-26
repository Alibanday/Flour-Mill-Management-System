import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { API_ENDPOINTS } from "../services/api";
import { FaEdit, FaTrash, FaEnvelope, FaPhone, FaIdCard, FaGraduationCap, FaWallet, FaUserShield, FaHome, FaArrowLeft, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isManager } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.USERS.GET_BY_ID(id));
      // Backend returns user directly, not wrapped in {success: true, data: ...}
      const data = response.data?.data || response.data?.user || response.data;
      setUser(data || null);
    } catch (error) {
      console.error("Fetch user error: ", error);
      toast.error(error.response?.data?.message || "Failed to load user details");
      navigate("/users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(API_ENDPOINTS.USERS.DELETE(id));
      toast.success("User deleted successfully");
      navigate("/users");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-10">
          <p className="text-lg text-gray-700 mb-4">User not found</p>
          <Link to="/users" className="text-blue-600 hover:underline">
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  const isActive = user.isActive !== undefined ? user.isActive : (user.status === 'Active');
  const statusDisplay = isActive ? 'Active' : 'Inactive';

  const fieldGroups = [
    {
      title: "Personal Information",
      icon: <FaUserShield className="text-gray-500" />,
      fields: [
        { label: "First Name", name: "firstName" },
        { label: "Last Name", name: "lastName" },
        { label: "Email", name: "email", icon: <FaEnvelope /> },
        { label: "Role", name: "role" },
        { label: "Status", name: "status", type: "status" }
      ]
    },
    {
      title: "Contact Details",
      icon: <FaPhone className="text-gray-500" />,
      fields: [
        { label: "Phone", name: "phone", icon: <FaPhone /> },
        { label: "Mobile", name: "mobile", icon: <FaPhone /> },
        { label: "CNIC", name: "cnic", icon: <FaIdCard /> },
        { label: "Address", name: "address", icon: <FaHome /> },
        { label: "City", name: "city" },
        { label: "State", name: "state" },
        { label: "Zip Code", name: "zipCode" }
      ]
    },
    {
      title: "Education & Employment",
      icon: <FaGraduationCap className="text-gray-500" />,
      fields: [
        { label: "Education", name: "education", icon: <FaGraduationCap /> },
        { label: "Salary", name: "salary", type: "currency" },
        { label: "Assigned Warehouse", name: "assignedWarehouse", type: "warehouse" }
      ]
    },
    {
      title: "Financial Information",
      icon: <FaWallet className="text-gray-500" />,
      fields: [
        { label: "Bank Account", name: "bankAccount", icon: <FaWallet /> }
      ]
    },
    {
      title: "Emergency Contact",
      icon: <FaUserShield className="text-gray-500" />,
      fields: [
        { label: "Guardian Name", name: "guardianName" },
        { label: "Guardian Contact", name: "guardianContact" }
      ]
    }
  ];

  const formatFieldValue = (field, value) => {
    if (value === null || value === undefined || value === '') return '-';
    
    if (field.type === 'currency' && value) {
      return `PKR ${Number(value).toLocaleString()}`;
    }
    
    if (field.type === 'warehouse' && value) {
      return typeof value === 'object' ? value.name || value._id : value;
    }
    
    return value;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/users")}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <nav className="flex items-center text-sm text-gray-600 space-x-2 mb-2">
                  <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
                  <span>/</span>
                  <Link to="/users" className="text-blue-600 hover:underline">Users</Link>
                  <span>/</span>
                  <span className="text-gray-500">{user.firstName} {user.lastName}</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
              </div>
            </div>
            
            {(isAdmin() || isManager()) && (
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  isActive 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {isActive ? <FaCheckCircle className="mr-1" /> : <FaTimesCircle className="mr-1" />}
                  {statusDisplay}
                </span>
                <Link
                  to="/users"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FaEdit />
                  <span>Edit User</span>
                </Link>
                {isAdmin() && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <FaTrash />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <img
                src={user.profileImage || "https://ui-avatars.com/api/?name=" + encodeURIComponent(`${user.firstName} ${user.lastName}`) + "&background=3b82f6&color=fff&size=128"}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-lg"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{user.firstName} {user.lastName}</h2>
              <p className="text-xl text-gray-600 mb-4">{user.role || 'No role assigned'}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                {user.email && (
                  <div className="flex items-center space-x-2">
                    <FaEnvelope />
                    <span>{user.email}</span>
                  </div>
                )}
                {(user.phone || user.mobile) && (
                  <div className="flex items-center space-x-2">
                    <FaPhone />
                    <span>{user.phone || user.mobile}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          {fieldGroups.map((group, index) => {
            // Filter out fields that don't have values
            const fieldsWithValues = group.fields.filter(field => {
              const value = user[field.name];
              return value !== null && value !== undefined && value !== '';
            });

            // Skip the group if no fields have values
            if (fieldsWithValues.length === 0 && group.title !== "Personal Information") {
              return null;
            }

            return (
              <div key={index} className={`mb-8 ${index !== fieldGroups.length - 1 ? 'pb-8 border-b border-gray-200' : ''}`}>
                <div className="flex items-center mb-6">
                  <span className="mr-3 text-gray-500 text-xl">{group.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-800">{group.title}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.fields.map((field, idx) => {
                    const value = user[field.name];
                    
                    // Skip empty fields (except for Personal Information which should always show)
                    if (!value && value !== 0 && group.title !== "Personal Information") {
                      return null;
                    }

                    return (
                      <div key={idx} className="flex items-start space-x-3">
                        {field.icon && <span className="text-gray-500 mt-1">{field.icon}</span>}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500 mb-1">{field.label}</p>
                          
                          {/* Special rendering for Status */}
                          {field.type === "status" ? (
                            <div className="flex items-center space-x-2">
                              <span
                                className={`h-3 w-3 rounded-full ${
                                  isActive ? "bg-green-500" : "bg-red-500"
                                }`}
                              ></span>
                              <span className="text-gray-800 font-medium">
                                {statusDisplay}
                              </span>
                            </div>
                          ) : (
                            <p className="text-gray-800 font-medium">
                              {formatFieldValue(field, value)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Account Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Created At</p>
                <p className="text-gray-800 font-medium">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Last Updated</p>
                <p className="text-gray-800 font-medium">
                  {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
