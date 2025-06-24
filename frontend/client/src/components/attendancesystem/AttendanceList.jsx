import React, { useState } from "react";
import axios from "axios";
import {
  FaEdit, FaTrash, FaEye, FaSearch, FaFilter, FaRedo,
  FaCheckCircle, FaTimes, FaClock, FaMapMarkerAlt, FaUser
} from "react-icons/fa";

export default function AttendanceList({ attendanceData, loading, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

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

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this attendance record?")) {
      return;
    }

    try {
      setDeleteLoading(id);
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8000/api/attendance/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh the list
      onRefresh();
    } catch (error) {
      console.error("Error deleting attendance:", error);
      alert("Failed to delete attendance record");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEdit = (attendance) => {
    setSelectedAttendance(attendance);
    setShowEditModal(true);
  };

  const handleView = (attendance) => {
    setSelectedAttendance(attendance);
    setShowViewModal(true);
  };

  const filteredData = attendanceData.filter(attendance => {
    const searchLower = searchTerm.toLowerCase();
    return (
      attendance.employee?.name?.toLowerCase().includes(searchLower) ||
      attendance.employee?.email?.toLowerCase().includes(searchLower) ||
      attendance.status?.toLowerCase().includes(searchLower) ||
      formatDate(attendance.date).toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading attendance records...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Attendance Records</h3>
          <p className="text-sm text-gray-500">Manage and view employee attendance</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center px-4 py-2 !bg-blue-600 text-white rounded-lg hover:!bg-blue-700 transition-colors"
        >
          <FaRedo className="mr-2" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by employee name, email, status, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <FaUser className="mx-auto text-4xl text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No attendance records found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((attendance) => (
                  <tr key={attendance._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaUser className="text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {attendance.employee?.name || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {attendance.employee?.email || "No email"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(attendance.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(attendance.status)}`}>
                        {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <FaClock className="text-gray-400 mr-1" />
                        {formatTime(attendance.checkIn?.time)}
                      </div>
                      {attendance.checkIn?.location && (
                        <div className="flex items-center text-xs text-gray-500">
                          <FaMapMarkerAlt className="mr-1" />
                          {attendance.checkIn.location}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.checkOut?.time ? (
                        <>
                          <div className="flex items-center">
                            <FaClock className="text-gray-400 mr-1" />
                            {formatTime(attendance.checkOut.time)}
                          </div>
                          {attendance.checkOut?.location && (
                            <div className="flex items-center text-xs text-gray-500">
                              <FaMapMarkerAlt className="mr-1" />
                              {attendance.checkOut.location}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.workHours ? `${attendance.workHours}h` : "-"}
                      {attendance.overtime > 0 && (
                        <div className="text-xs text-orange-600">
                          +{attendance.overtime}h OT
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(attendance)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleEdit(attendance)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(attendance._id)}
                          disabled={deleteLoading === attendance._id}
                          className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                          title="Delete"
                        >
                          {deleteLoading === attendance._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <FaTrash />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {filteredData.filter(a => a.status === "present").length}
            </div>
            <div className="text-sm text-gray-600">Present</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {filteredData.filter(a => a.status === "absent").length}
            </div>
            <div className="text-sm text-gray-600">Absent</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredData.filter(a => a.status === "late").length}
            </div>
            <div className="text-sm text-gray-600">Late</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {filteredData.length}
            </div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
        </div>
      </div>
    </div>
  );
} 