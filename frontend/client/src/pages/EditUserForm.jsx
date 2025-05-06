import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EditUserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    status: "active",
    warehouse: "",
    cnic: "",
    education: "",
    address: "",
    mobile: "",
    bankAccount: "",
    guardianName: "",
    guardianContact: "",
    salary: "",
    profileImage: null
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [userRes, warehouseRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8000/api/warehouse/all"),
        ]);

        const user = userRes.data;

        setFormData((prev) => ({
          ...prev,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          role: user.role || "",
          status: user.status || "active",
          warehouse: user.warehouse?._id || "",
          cnic: user.cnic || "",
          education: user.education || "",
          address: user.address || "",
          mobile: user.mobile || "",
          bankAccount: user.bankAccount || "",
          guardianName: user.guardianName || "",
          guardianContact: user.guardianContact || "",
          salary: user.salary || "",
        }));

        setWarehouses(warehouseRes.data || []);
        if (user.profileImage) {
          setPreviewImage(user.profileImage);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load initial data.");
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profileImage" && files) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, profileImage: file }));
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (value !== null && value !== "") {
          data.append(key, typeof value === "string" ? value.toLowerCase() : value);
        }
      });

      const token = localStorage.getItem("token");
      const res = await axios.put(`http://localhost:8000/api/users/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        alert("User updated successfully!");
        navigate("/users");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-5xl p-8 bg-white shadow-lg rounded-xl">
        <h2 className="text-2xl font-bold mb-6 text-black">Edit User</h2>

        {previewImage && (
          <div className="col-span-2 flex justify-center">
            <img
              src={previewImage}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-full mt-4"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="col-span-2">
            <label className="block text-black mb-1">Profile Picture</label>
            <input
              type="file"
              name="profileImage"
              accept="image/*"
              onChange={handleChange}
              className="border border-black p-3 rounded w-full text-black placeholder-gray-400"
            />
          </div>

          {[
            { label: "First Name", name: "firstName" },
            { label: "Last Name", name: "lastName" },
            { label: "Email", name: "email", type: "email" },
            { label: "CNIC", name: "cnic" },
            { label: "Education", name: "education" },
            { label: "Mobile", name: "mobile" },
            { label: "Bank Account", name: "bankAccount" },
            { label: "Guardian Name", name: "guardianName" },
            { label: "Guardian Contact", name: "guardianContact" },
            { label: "Address", name: "address" },
            { label: "Salary", name: "salary", type: "number" },
          ].map((field, idx) => (
            <div key={idx}>
              <label className="block text-black mb-1">{field.label}</label>
              <input
                type={field.type || "text"}
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                className="border border-black p-3 rounded w-full text-black placeholder-gray-400"
              />
            </div>
          ))}

          <div className="col-span-2">
            <label className="block text-black mb-1">Warehouse</label>
            <select
              name="warehouse"
              value={formData.warehouse}
              onChange={handleChange}
              className="border border-black p-3 rounded w-full text-black"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} - {w.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-black mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="border border-black p-3 rounded w-full text-black"
            >
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="general manager">General Manager</option>
              <option value="production manager">Production Manager</option>
              <option value="sale manager">Sale Manager</option>
              <option value="warehouse manager">Warehouse Manager</option>
              <option value="labor">Labor</option>
            </select>
          </div>

          <div>
            <label className="block text-black mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="border border-black p-3 rounded w-full text-black"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {error && (
            <div className="col-span-2 text-center text-red-500 font-medium">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="col-span-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded mt-4 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Updating...
              </>
            ) : (
              "Update User"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditUserForm;
