import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/users/${id}`);
      if (!response.data) {
        alert("User not found");
        return;
      }
      setUser(response.data);
    } catch (error) {
      console.error("Fetch user error: ", error);
      if (error.response && error.response.status === 404) {
        alert("User not found");
      } else {
        alert("Failed to load user details");
      }
    }
  };
  

  useEffect(() => {
    fetchUser();
  }, []);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`http://localhost:8000/api/users/${id}`);
      alert("User deleted successfully");
      navigate("/users"); // Redirect back to user list
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  if (!user) return <div className="text-center p-10 text-lg text-black">Loading user details...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-black">User Details</h1>

      <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-md text-black">
        <div className="flex flex-col items-center mb-6">
          <img
            src={user.profileImage || "https://via.placeholder.com/100"}
            alt="Profile"
            className="w-28 h-28 rounded-full object-cover mb-4"
          />
          <h2 className="text-2xl font-semibold">{user.firstName} {user.lastName}</h2>
          <p className="text-gray-600">{user.role}</p>
        </div>

        <div className="space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Mobile:</strong> {user.mobile || "-"}</p>
          <p><strong>CNIC:</strong> {user.cnic || "-"}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Link
            to={`/edit-user/${user._id}`}
            className="bg-white border border-black text-black px-6 py-2 rounded hover:bg-gray-100"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
