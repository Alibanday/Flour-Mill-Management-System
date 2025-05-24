import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaSave, FaTimes, FaPhone, FaWhatsapp, FaMapMarkerAlt, FaWallet } from "react-icons/fa";

export default function EditAccountForm() {
  const { id } = useParams(); // get account ID from route
  const navigate = useNavigate();

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
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const accountTypes = [
    { value: "Payable", label: "Payable" },
    { value: "Receivable", label: "Receivable" },
    { value: "Cash", label: "Cash" },
    { value: "Bank", label: "Bank" },
    { value: "Others", label: "Others" }
  ];

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8000/api/accounts/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch account data");

        const data = await res.json();
        setFormData({
          accountType: data.accountType || "",
          accountName: data.accountName || "",
          phoneNumber: data.phoneNumber || "",
          whatsappNumber: data.whatsappNumber || "",
          creditLimit: data.creditLimit || "",
          address: data.address || ""
        });
      } catch (error) {
        setApiError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
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
      const response = await fetch(`http://localhost:8000/api/accounts/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update account");
      }

      alert("Account updated successfully!");
      navigate("/prcenter"); // navigate back or list view

    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p className="text-center text-gray-600">Loading account data...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaWallet className="mr-2" />
          Edit Account
        </h2>
        <button
          onClick={() => navigate("/prcenter")}
          className="text-gray-500 hover:text-gray-700"
          type="button"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* (reuse form inputs from add form) */}
        {/* same form structure as AccountCreationForm — you can extract shared form fields into a component if you want DRY code */}

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

        {/* Phone and WhatsApp */}
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

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate("/prcenter")}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <FaSave className="mr-2" />
            {isSubmitting ? "Saving..." : "Update"}
          </button>
        </div>
      </form>
    </div>
  );
}
