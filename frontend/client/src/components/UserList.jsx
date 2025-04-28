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

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/users/all");
      setUsers(res.data.users);
      setDisplayedUsers(res.data.users);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch users");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cnic?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setDisplayedUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, users]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/users/${id}`);
      fetchUsers();
      alert("User deleted successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = displayedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(displayedUsers.length / usersPerPage);

  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Employee Directory</h1>
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
      <div className="grid grid-cols-1 gap-4 mb-8">
        {currentUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => navigate(`/user/${user._id}`)}
            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 p-6 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <img
                  src={user.profileImage || "https://via.placeholder.com/100"}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    {user.mobile && <span className="flex items-center space-x-1">
                      <FaSearch className="text-gray-400" /> {/* Replace with phone icon */}
                      {user.mobile}
                    </span>}
                    {user.cnic && <span className="flex items-center space-x-1">
                      <FaSearch className="text-gray-400" /> {/* Replace with ID icon */}
                      {user.cnic}
                    </span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  to={`/edit-user/${user._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-black hover:text-blue-600 !bg-white hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <FaEdit className="text-xl" />
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(user._id);
                  }}
                  className="p-2 text-black hover:text-red-600 !bg-white hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FaTrash className="text-xl" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 space-y-4 sm:space-y-0">
        <div className="text-sm text-gray-600">
          Showing {indexOfFirstUser + 1} - {Math.min(indexOfLastUser, displayedUsers.length)} of {displayedUsers.length}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="flex items-center px-5 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
          >
            <FaChevronLeft className="mr-2" />
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="flex items-center px-5 py-2.5 bg-blue-50 border border-gray-300 rounded-xl hover:bg-blue-50 disabled:opacity-50 !hover:bg-white transition-colors"
          >
            Next
            <FaChevronRight className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}