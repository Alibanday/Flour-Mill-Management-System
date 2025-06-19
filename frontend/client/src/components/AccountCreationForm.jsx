import React, { useState } from "react";
import { FaSave, FaTimes, FaPhone, FaWhatsapp, FaMapMarkerAlt, FaWallet } from "react-icons/fa";

export default function AccountCreationForm({ onCancel }) {
  const [formData, setFormData] = useState({
    accountType: "",
    accountName: "",
    phoneNumber: "",
    whatsappNumber: "",
    creditLimit: "",
    address: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const accountTypes = [
    { value: "Payable", label: "Payable" },
    { value: "Receivable", label: "Receivable" },
    { value: "Cash", label: "Cash" },
    { value: "Bank", label: "Bank" },
    { value: "Others", label: "Others" }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (apiError) setApiError(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.accountType) newErrors.accountType = "Account type is required";
    if (!formData.accountName) newErrors.accountName = "Account name is required";
    if (formData.phoneNumber && !/^\d{10,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number";
    }
    if (formData.whatsappNumber && !/^\d{10,15}$/.test(formData.whatsappNumber)) {
      newErrors.whatsappNumber = "Invalid WhatsApp number";
    }
    if (formData.creditLimit && isNaN(formData.creditLimit)) {
      newErrors.creditLimit = "Credit limit must be a number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/accounts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create account");
      }

      const data = await response.json();
      alert("Account created successfully!");
      onCancel(); // Close form or navigate back

    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaWallet className="mr-2" />
          Create New Account
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
          type="button"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Account Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md text-black ${
                errors.accountType ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Account Type</option>
              {accountTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.accountType && (
              <p className="text-red-500 text-xs mt-1">{errors.accountType}</p>
            )}
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              placeholder="Enter account name"
              className={`w-full px-4 py-2 border rounded-md text-black ${
                errors.accountName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.accountName && (
              <p className="text-red-500 text-xs mt-1">{errors.accountName}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaPhone className="mr-2" />
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter phone number"
              className={`w-full px-4 py-2 border rounded-md text-black ${
                errors.phoneNumber ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FaWhatsapp className="mr-2" />
              WhatsApp Number
            </label>
            <input
              type="tel"
              name="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={handleChange}
              placeholder="Enter WhatsApp number"
              className={`w-full px-4 py-2 border rounded-md text-black ${
                errors.whatsappNumber ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.whatsappNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.whatsappNumber}</p>
            )}
          </div>
        </div>

        {/* Credit Limit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Credit Limit (Rs.)
          </label>
          <input
            type="text"
            name="creditLimit"
            value={formData.creditLimit}
            onChange={handleChange}
            placeholder="Enter credit limit amount"
            className={`w-full px-4 py-2 border rounded-md text-black ${
              errors.creditLimit ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.creditLimit && (
            <p className="text-red-500 text-xs mt-1">{errors.creditLimit}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FaMapMarkerAlt className="mr-2" />
            Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            placeholder="Enter full address"
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
          />
        </div>

        {apiError && (
          <p className="text-red-600 text-sm mt-2">{apiError}</p>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-white !bg-black hover:bg-gray-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 !bg-blue-600 text-white rounded-md 
            hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            <FaSave className="mr-2" />
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
