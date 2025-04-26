import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const usersPerPage = 6;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/api/users/all");
      setUsers(res.data.users);
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
    handleSearch();
  }, [searchTerm, users]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`http://localhost:8000/api/users/${id}`);
      alert("User deleted successfully");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const handleSearch = () => {
    const term = searchTerm.toLowerCase();
    const filtered = users.filter((user) =>
      user.email.toLowerCase().includes(term) ||
      user.mobile?.toLowerCase().includes(term) ||
      user.cnic?.toLowerCase().includes(term)
    );
    setDisplayedUsers(filtered);
    setCurrentPage(1);
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = displayedUsers.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(displayedUsers.length / usersPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  if (loading) return <div className="text-center p-10 text-lg text-black">Loading users...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-black">User List</h1>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Email, Mobile, or CNIC..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-black p-3 rounded w-full text-black placeholder-gray-500"
        />
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {currentUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => navigate(`/user/${user._id}`)}
            className="bg-white border border-gray-300 rounded-lg p-5 shadow-md flex flex-col items-center text-center cursor-pointer hover:bg-gray-100"
          >
            {/* User Image */}
            <img
              src={user.profileImage || "https://via.placeholder.com/100"}
              alt="User Profile"
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
            {/* User Info */}
            <h2 className="text-xl font-semibold text-black mb-1">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-600 text-sm mb-1">{user.role}</p>
            <p className="text-gray-600 text-sm mb-1">
              <span className="font-semibold text-black">Mobile:</span> {user.mobile || "-"}
            </p>
            <p className="text-gray-600 text-sm mb-3">
              <span className="font-semibold text-black">CNIC:</span> {user.cnic || "-"}
            </p>

            {/* Actions */}
            <div
              className="flex space-x-2"
              onClick={(e) => e.stopPropagation()} // prevent card click when clicking buttons
            >
              <Link
                to={`/edit-user/${user._id}`}
                className="bg-white border border-black text-black hover:bg-gray-100 px-4 py-2 rounded text-sm"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(user._id)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-8">
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-black">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
