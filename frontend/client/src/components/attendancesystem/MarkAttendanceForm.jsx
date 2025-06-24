import React, { useState } from "react";
import axios from "axios";
import {
  FaTimes, FaUser, FaCalendarAlt, FaClock, FaMapMarkerAlt,
  FaStickyNote, FaSave, FaCheckCircle, FaExclamationTriangle
} from "react-icons/fa";

export default function MarkAttendanceForm({ onClose, onAttendanceMarked, employees }) {
  const [formData, setFormData] = useState({
    employeeId: "",
    date: new Date().toISOString().slice(0, 10),
    checkInTime: "",
    checkOutTime: "",
    status: "present",
    checkInLocation: "Office",
    checkOutLocation: "Office",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.employeeId) {
      setError("Please select an employee");
      return;
    }

    if (!formData.checkInTime) {
      setError("Please enter check-in time");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      const payload = {
        employeeId: formData.employeeId,
        date: formData.date,
        checkInTime: `${formData.date}T${formData.checkInTime}`,
        status: formData.status,
        checkInLocation: formData.checkInLocation,
        notes: formData.notes
      };

      if (formData.checkOutTime) {
        payload.checkOutTime = `${formData.date}T${formData.checkOutTime}`;
        payload.checkOutLocation = formData.checkOutLocation;
      }

      await axios.post("http://localhost:8000/api/attendance/mark", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess("Attendance marked successfully!");
      
      // Reset form
      setFormData({
        employeeId: "",
        date: new Date().toISOString().slice(0, 10),
        checkInTime: "",
        checkOutTime: "",
        status: "present",
        checkInLocation: "Office",
        checkOutLocation: "Office",
        notes: ""
      });

      // Call callback after a short delay
      setTimeout(() => {
        onAttendanceMarked();
      }, 1500);

    } catch (error) {
      console.error("Error marking attendance:", error);
      setError(error.response?.data?.message || "Failed to mark attendance");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800";
      case "absent": return "bg-red-100 text-red-800";
      case "late": return "bg-yellow-100 text-yellow-800";
      case "half-day": return "bg-orange-100 text-orange-800";
      case "leave": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Mark Attendance</h2>
            <p className="text-sm text-gray-500 mt-1">Record employee attendance for the selected date</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <FaExclamationTriangle className="text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <FaCheckCircle className="text-green-500 mr-3" />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaUser className="inline mr-2" />
              Employee *
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => handleInputChange("employeeId", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.name || emp.email} - {emp.role}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-2" />
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
                <option value="leave">Leave</option>
              </select>
            </div>
          </div>

          {/* Check-in Time and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaClock className="inline mr-2" />
                Check-in Time *
              </label>
              <input
                type="time"
                value={formData.checkInTime}
                onChange={(e) => handleInputChange("checkInTime", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaMapMarkerAlt className="inline mr-2" />
                Check-in Location
              </label>
              <input
                type="text"
                value={formData.checkInLocation}
                onChange={(e) => handleInputChange("checkInLocation", e.target.value)}
                placeholder="Office"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Check-out Time and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaClock className="inline mr-2" />
                Check-out Time (Optional)
              </label>
              <input
                type="time"
                value={formData.checkOutTime}
                onChange={(e) => handleInputChange("checkOutTime", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaMapMarkerAlt className="inline mr-2" />
                Check-out Location
              </label>
              <input
                type="text"
                value={formData.checkOutLocation}
                onChange={(e) => handleInputChange("checkOutLocation", e.target.value)}
                placeholder="Office"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaStickyNote className="inline mr-2" />
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any additional notes..."
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Status Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Status Preview</h4>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(formData.status)}`}>
                {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
              </span>
              <span className="text-sm text-gray-500">
                {formData.checkInTime && `Check-in: ${formData.checkInTime}`}
                {formData.checkOutTime && ` | Check-out: ${formData.checkOutTime}`}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 !bg-gray-100 hover:!bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 !bg-blue-600 text-white rounded-lg hover:!bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Mark Attendance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 