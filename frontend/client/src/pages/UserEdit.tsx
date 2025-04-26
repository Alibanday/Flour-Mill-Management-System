import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    cnic: "",
    role: ""
  });

  const fetchUser = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/users/${id}`);
      const user = res.data.user;
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile || "",
        cnic: user.cnic || "",
        role: user.role
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load user for editing");
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8000/api/users/${id}`, formData);
      alert("User updated successfully");
      navigate(`/users`);
    } catch (err) {
      console.error(err);
      alert("Failed to update user");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-black">Edit User</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="First Name"
          className="border border-black p-3 rounded w-full text-black"
        />
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Last Name"
          className="border border-black p-3 rounded w-full text-black"
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="border border-black p-3 rounded w-full text-black"
        />
        <input
          type="text"
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          placeholder="Mobile"
          className="border border-black p-3 rounded w-full text-black"
        />
        <input
          type="text"
          name="cnic"
          value={formData.cnic}
          onChange={handleChange}
          placeholder="CNIC"
          className="border border-black p-3 rounded w-full text-black"
        />
        <input
          type="text"
          name="role"
          value={formData.role}
          onChange={handleChange}
          placeholder="Role"
          className="border border-black p-3 rounded w-full text-black"
        />

        <div className="flex justify-end gap-4">
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
