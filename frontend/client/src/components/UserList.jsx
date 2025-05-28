import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaChevronLeft, FaChevronRight, FaSearch } from "react-icons/fa";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const usersPerPage = 6;

  // Fetch users from the API
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not authenticated!");
        setLoading(false);
        return;
      }
  
      const res = await axios.get("http://localhost:8000/api/users/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      // Log the full API response to check the structure
      console.log("API response:", res);
  
      // Check if the response contains the users in the 'data' field
      if (res.data && Array.isArray(res.data)) {
        setUsers(res.data); // Set users to the data array directly
        setDisplayedUsers(res.data);
      } else {
        setError("No users found in the response.");
        setLoading(false);
      }
  
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users");
      setLoading(false);
    }
  };
  

  // Handle search and update displayed users
  useEffect(() => {
    const filtered = users.filter((user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cnic?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setDisplayedUsers(filtered);
    setCurrentPage(1); // Reset to first page after filter
  }, [searchTerm, users]);

  // Handle user deletion
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
  
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8000/api/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchUsers();
      alert("User deleted successfully");
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message || "Failed to delete user. Please try again."
      );
    }
  };
  

  // Pagination calculations
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = displayedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(displayedUsers.length / usersPerPage);

  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-cent *:er h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-screen text-red-500">
      {error}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Employee Directory</h2>
          <p className="text-gray-600 text-lg">
            {displayedUsers.length} {displayedUsers.length === 1 ? "employee" : "employees"}
          </p>
        </div>
        
        <div className="relative w-full md:w-96">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder-gray-400"
          />
        </div>
      </div>

      {/* User List */}
      <div className="grid grid-cols-1 gap-4 mb-8 max-w-3xl mx-auto">
        {currentUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => navigate(`/user/${user._id}`)}
            className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 p-4 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={user.profileImage || "https://via.placeholder.com/100"}
                  alt="Profile"
                  className="w-14 h-14 rounded-full object-cover border border-gray-300 shadow-sm"
                />
                <div className="max-w-xs">
                  <h2 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    {user.mobile && (
                      <span className="flex items-center gap-1">
                        📞 {user.mobile}
                      </span>
                    )}
                    {user.cnic && (
                      <span className="flex items-center gap-1">
                        🆔 {user.cnic}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/edit-user/${user._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-black hover:text-blue-600 !bg-white hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FaEdit className="text-base" />
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(user._id);
                  }}
                  className="p-2 text-black hover:text-red-600 !bg-white hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FaTrash className="text-base" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-2">
        <button
          onClick={prevPage}
          className="px-3 py-1 !bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Previous
        </button>
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx + 1}
            onClick={() => setCurrentPage(idx + 1)}
            className={`px-3 py-1 rounded ${currentPage === idx + 1 ? "!bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
          >
            {idx + 1}
          </button>
        ))}
        <button
          onClick={nextPage}
          className="px-3 py-1 !bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
}
