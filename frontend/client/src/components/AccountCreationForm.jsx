import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSave, FaTimes, FaPhone, FaWhatsapp, FaMapMarkerAlt, FaWallet } from "react-icons/fa";

export default function AccountCreationForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    accountType: "",
    accountName: "",
    phoneNumber: "",
    whatsappNumber: "",
    creditLimit: "",
    address: ""
  });
  const [accountId, setAccountId] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate unique account ID on component mount
  useEffect(() => {
    generateAccountId();
  }, []);

  const generateAccountId = () => {
    // Generate a random 6-digit number
    const randomId = Math.floor(100000 + Math.random() * 900000);
    setAccountId(ACC-${randomId});
  };

  const accountTypes = [
    { value: "Payable", label: "Payable" },
    { value: "Receivable", label: "Receivable" },
    { value: "Cash", label: "Cash" },
    { value: "Bank", label: "Bank" },
    { value: "Others", label: "Others" }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      // Simulate API call
      setTimeout(() => {
        console.log("Account created:", { accountId, ...formData });
        setIsSubmitting(false);
        alert("Account created successfully!");
        navigate("/accounts");
      }, 1500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <FaWallet className="mr-2" />
        Create New Account
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account ID (read-only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account ID
            </label>
            <input
              type="text"
              value={accountId}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
            />
            <p className="text-xs text-gray-500 mt-1">Auto-generated account ID</p>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type <span className="text-red-500">*</span>
            </label>
            <select
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md ${
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
            className={`w-full px-4 py-2 border rounded-md ${
              errors.accountName ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.accountName && (
            <p className="text-red-500 text-xs mt-1">{errors.accountName}</p>
          )}
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
              className={`w-full px-4 py-2 border rounded-md ${
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
              className={`w-full px-4 py-2 border rounded-md ${
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
            className={`w-full px-4 py-2 border rounded-md ${
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate("/accounts")}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
          >
            <FaSave className="mr-2" />
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
}