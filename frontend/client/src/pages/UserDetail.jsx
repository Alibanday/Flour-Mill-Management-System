import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { API_ENDPOINTS } from "../services/api";
import { FaEdit, FaTrash, FaEnvelope, FaPhone, FaIdCard, FaGraduationCap, FaWallet, FaUserShield, FaHome } from "react-icons/fa";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.USERS.GET_BY_ID(id));
      const data = response.data?.data || response.data?.user || response.data;
      setUser(data || null);
    } catch (error) {
      console.error("Fetch user error: ", error);
      alert(error.response?.data?.message || "Failed to load user details");
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(API_ENDPOINTS.USERS.DELETE(id));
      alert("User deleted successfully");
      navigate("/users");
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-gray-50">
      <div className="text-center p-10 text-lg text-gray-700">
        Loading user details...
      </div>
    </div>
  );

  const fieldGroups = [
    {
      title: "Personal Information",
      icon: <FaUserShield className="text-gray-500" />,
      fields: [
        { label: "First Name", name: "firstName" },
        { label: "Last Name", name: "lastName" },
        { label: "Email", name: "email" },
        { label: "Password", name: "password", type: "password" },
        { label: "Status", name: "status" }
      ]
    },
    {
      title: "Contact Details",
      icon: <FaPhone className="text-gray-500" />,
      fields: [
        { label: "Mobile", name: "mobile", icon: <FaPhone /> },
        { label: "CNIC", name: "cnic", icon: <FaIdCard /> },
        { label: "Address", name: "address", icon: <FaHome /> },
      ]
    },
    {
      title: "Education & Employment",
      icon: <FaGraduationCap className="text-gray-500" />,
      fields: [
        { label: "Education", name: "education", icon: <FaGraduationCap /> },
        { label: "Salary", name: "salary" },
      ]
    },
    {
      title: "Financial Information",
      icon: <FaWallet className="text-gray-500" />,
      fields: [
        { label: "Bank Account", name: "bankAccount", icon: <FaWallet /> },
      ]
    },
    {
      title: "Emergency Contact",
      icon: <FaUserShield className="text-gray-500" />,
      fields: [
        { label: "Guardian Name", name: "guardianName" },
        { label: "Guardian Contact", name: "guardianContact" },
      ]
    }
  ];

  return (
    <div className="min-h-screen w-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <nav className="flex items-center text-sm text-gray-600 space-x-2 mb-2">
            <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
            <span>/</span>
            <Link to="/EmployeesPage" className="text-blue-600 hover:underline">Employees</Link>
            <span>/</span>
            <span className="text-gray-500">{user.firstName} {user.lastName}</span>
          </nav>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <img
              src={user.profileImage || "https://via.placeholder.com/150"}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{user.firstName} {user.lastName}</h1>
              <p className="text-gray-600 text-lg">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {fieldGroups.map((group, index) => (
            <div key={index} className={`mb-8 ${index !== fieldGroups.length - 1 ? 'pb-8 border-b border-gray-200' : ''}`}>
              <div className="flex items-center mb-6">
                <span className="mr-3 text-gray-500">{group.icon}</span>
                <h2 className="text-lg font-semibold text-gray-800">{group.title}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.fields.map((field, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    {field.icon && <span className="text-gray-500 mt-1">{field.icon}</span>}
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">{field.label}</p>
                      
                      {/* Special rendering for Status */}
                      {field.name === "status" ? (
                        <div className="flex items-center space-x-2">
                          <span
                            className={`h-3 w-3 rounded-full ${
                              user.status === "Active" ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></span>
                          <span className="text-gray-800 font-medium">
                            {user.status || "-"}
                          </span>
                        </div>
                      ) : (
                        <div className="text-gray-800 font-medium">
                          {field.type === 'password' ? '••••••••' : (user[field.name] || '-')}
                        </div>
                      )}
                      
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <Link
              to={`/edit-user/${user._id}`}
              className="px-4 py-2 !bg-gray-300 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaEdit className="inline mr-2" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="px-4 py-2 !bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <FaTrash className="inline mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
