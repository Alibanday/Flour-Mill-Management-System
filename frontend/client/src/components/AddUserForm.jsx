import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AddUserForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "",
    role: "employee", cnic: "", education: "", address: "",
    mobile: "", bankAccount: "", guardianName: "", guardianContact: "", salary: "",
    profileImage: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ loader state

  const handleChange = (e) => {
    if (e.target.name === "profileImage") {
      const file = e.target.files[0];
      if (file) {
        setFormData((prev) => ({ ...prev, profileImage: file }));
        setPreviewImage(URL.createObjectURL(file));
      }
    } else {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // clear any previous error
    setLoading(true); // ✅ show loader

    try {
      const data = new FormData();
      for (let key in formData) {
        if (formData[key] !== null && formData[key] !== "") {
          data.append(key, formData[key]);
        }
      }

      const response = await axios.post("http://localhost:8000/api/users/create", data);

      if (response.status === 201) {
        alert("User registered successfully!");
        navigate(-1);
      } else {
        setError("Failed to create user. Please try again.");
      }
    } catch (err) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || "Server error. Please try again.";
        setError(message);
      } else {
        setError("Unexpected error occurred. Please refresh and try again.");
      }
    } finally {
      setLoading(false); // ✅ hide loader
    }
  };

  return (

     
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-xl mt-10">
      <h2 className="text-2xl font-bold mb-6 text-black">Create New User</h2>

       {/* Image Preview */}
       {previewImage && (
          <div className="col-span-2 flex justify-center">
            <img src={previewImage} alt="Preview" className="w-32 h-32 object-cover rounded-full mt-4" />
          </div>
        )}
      {/* Profile Image Upload */}
     <div>
     <label className="block text-black mb-1">Profile Picture</label>
     <input
       type="file"
       name="profileImage"
       accept="image/*"
       onChange={handleChange}
       className="border border-black p-3 rounded w-full text-black placeholder-gray-400"
     />
   </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: "First Name", name: "firstName" },
          { label: "Last Name", name: "lastName" },
          { label: "Email", name: "email", type: "email" },
          { label: "Password", name: "password", type: "password" },
          { label: "CNIC", name: "cnic" },
          { label: "Education", name: "education" },
          { label: "Mobile", name: "mobile" },
          { label: "Bank Account", name: "bankAccount" },
          { label: "Guardian Name", name: "guardianName" },
          { label: "Guardian Contact", name: "guardianContact" },
          { label: "Address", name: "address" },
          { label: "Salary", name: "salary", type: "number" }
        ].map((field, idx) => (
          <div key={idx}>
            <label className="block text-black mb-1">{field.label}</label>
            <input
              type={field.type || "text"}
              name={field.name}
              placeholder={field.label}
              onChange={handleChange}
              className="border border-black p-3 rounded w-full text-black placeholder-gray-400"
              required
            />
          </div>
        ))}

        {/* Role Dropdown */}
        <div>
          <label className="block text-black mb-1">Role</label>
          <select
            name="role"
            onChange={handleChange}
            className="border border-black p-3 rounded w-full text-black placeholder-gray-400"
            value={formData.role}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Profile Image Upload 
        <div>
          <label className="block text-black mb-1">Profile Picture</label>
          <input
            type="file"
            name="profileImage"
            accept="image/*"
            onChange={handleChange}
            className="border border-black p-3 rounded w-full text-black placeholder-gray-400"
          />
        </div>*/}

       

        {/* Error Message just above Submit */}
        {error && (
          <div className="col-span-2 text-center text-red-500 font-medium">
            {error}
          </div>
        )}

        {/* Submit Button with Loader */}
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
              Creating...
            </>
          ) : (
            "Create User"
          )}
        </button>
      </form>
    </div>
  );
}
