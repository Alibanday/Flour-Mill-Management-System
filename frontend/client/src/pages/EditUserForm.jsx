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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [userRes, warehouseRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8000/api/warehouse/all",{
            headers: { Authorization: `Bearer ${token}` },
          }),
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
      } finally {
        setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-y-auto">
      <div className="min-h-full p-4 md:p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden h-full">
          <div className="p-6 md:p-8 h-full">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Edit User</h1>
                  <p className="text-gray-600">Update the user details below</p>
                </div>
                <button
                  onClick={() => navigate("/users")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {previewImage && (
                    <div className="col-span-2 flex justify-center">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-full"
                      />
                    </div>
                  )}

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                    <input
                      type="file"
                      name="profileImage"
                      accept="image/*"
                      onChange={handleChange}
                      className="border border-black p-3 rounded w-full text-black placeholder-gray-500"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleChange}
                        className="border border-black p-3 rounded w-full text-black placeholder-gray-500"
                      />
                    </div>
                  ))}

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                    <select
                      name="warehouse"
                      value={formData.warehouse}
                      onChange={handleChange}
                      className="border border-black p-3 rounded w-full text-black"
                    >
                      <option value="">Select Warehouse</option>
                      {warehouses?.warehouses && warehouses?.warehouses.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.name} - {w.location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
                </div>

                {error && (
                  <div className="col-span-2 text-center text-red-500 font-medium mb-6">{error}</div>
                )}

                <div className="flex justify-end space-x-4 mt-auto">
                  <button
                    type="button"
                    onClick={() => navigate("/users")}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2"
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
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserForm;