import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUser, FaCheck, FaBan, FaCalendar, FaClock, FaUserCheck,
  FaUserTimes, FaUserMinus, FaHourglassHalf, FaBolt, FaSave,
  FaExclamationTriangle, FaCheckCircle, FaSpinner, FaSearch,
  FaFilter, FaEye, FaEdit
} from "react-icons/fa";

export default function QuickMarkAttendance({ employees, attendanceData, onAttendanceMarked, loading }) {
  const [markedEmployees, setMarkedEmployees] = useState(new Set());
  const [employeeStatus, setEmployeeStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    // Initialize employee status from existing attendance data
    const statusMap = {};
    const markedSet = new Set();
    
    attendanceData.forEach(att => {
      if (att.date.slice(0, 10) === today) {
        statusMap[att.employee._id] = att.status;
        markedSet.add(att.employee._id);
      }
    });

    setEmployeeStatus(statusMap);
    setMarkedEmployees(markedSet);
  }, [attendanceData, today]);

  const getStatusColor = (status) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800 border-green-200";
      case "absent": return "bg-red-100 text-red-800 border-red-200";
      case "late": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "leave": return "bg-purple-100 text-purple-800 border-purple-200";
      case "half-day": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present": return <FaUserCheck className="text-green-600" />;
      case "absent": return <FaUserTimes className="text-red-600" />;
      case "late": return <FaClock className="text-yellow-600" />;
      case "leave": return <FaCalendar className="text-purple-600" />;
      case "half-day": return <FaHourglassHalf className="text-orange-600" />;
      default: return <FaUser className="text-gray-600" />;
    }
  };

  const handleMarkAttendance = async (employeeId, status) => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const currentTime = new Date().toISOString();

      const payload = {
        employeeId,
        date: today,
        checkInTime: `${today}T${new Date().toLocaleTimeString('en-US', { hour12: false })}`,
        status,
        checkInLocation: "Office",
        notes: `Marked as ${status} via quick mark`
      };

      // If marking as present, add check-out time for 8 hours later
      if (status === "present") {
        const checkOutTime = new Date();
        checkOutTime.setHours(checkOutTime.getHours() + 8);
        payload.checkOutTime = `${today}T${checkOutTime.toLocaleTimeString('en-US', { hour12: false })}`;
        payload.checkOutLocation = "Office";
      }

      await axios.post("http://localhost:8000/api/attendance/mark", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEmployeeStatus(prev => ({ ...prev, [employeeId]: status }));
      setMarkedEmployees(prev => new Set([...prev, employeeId]));
      
      setMessage({ type: "success", text: `Marked ${employees.find(emp => emp._id === employeeId)?.name} as ${status}` });
      
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      
      // Call parent callback to refresh data
      if (onAttendanceMarked) {
        onAttendanceMarked();
      }

    } catch (error) {
      console.error("Error marking attendance:", error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Failed to mark attendance" 
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAllAbsent = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const unmarkedEmployees = employees.filter(emp => !markedEmployees.has(emp._id));
      
      if (unmarkedEmployees.length === 0) {
        setMessage({ type: "info", text: "All employees have already been marked" });
        return;
      }

      const promises = unmarkedEmployees.map(emp => {
        const payload = {
          employeeId: emp._id,
          date: today,
          checkInTime: `${today}T${new Date().toLocaleTimeString('en-US', { hour12: false })}`,
          status: "absent",
          checkInLocation: "Office",
          notes: "Automatically marked as absent"
        };

        return axios.post("http://localhost:8000/api/attendance/mark", payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      });

      await Promise.all(promises);

      // Update local state
      const newStatus = { ...employeeStatus };
      const newMarked = new Set([...markedEmployees]);
      
      unmarkedEmployees.forEach(emp => {
        newStatus[emp._id] = "absent";
        newMarked.add(emp._id);
      });

      setEmployeeStatus(newStatus);
      setMarkedEmployees(newMarked);

      setMessage({ 
        type: "success", 
        text: `Marked ${unmarkedEmployees.length} employees as absent` 
      });
      
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);

      if (onAttendanceMarked) {
        onAttendanceMarked();
      }

    } catch (error) {
      console.error("Error marking all absent:", error);
      setMessage({ 
        type: "error", 
        text: "Failed to mark employees as absent" 
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                         (emp.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || emp.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getAttendanceStatus = (employeeId) => {
    return employeeStatus[employeeId] || "unmarked";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
        <span className="ml-3 text-gray-600">Loading employees...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Quick Mark Attendance</h3>
          <p className="text-gray-600">Click on employee cards to mark their attendance for today</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleMarkAllAbsent}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 !bg-red-600 text-white rounded-lg hover:!bg-red-700 transition-all duration-200 disabled:opacity-50"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaBan />}
            <span>Mark All Absent</span>
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === "success" ? "bg-green-50 border-green-200 text-green-800" :
          message.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
          "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          <div className="flex items-center">
            {message.type === "success" && <FaCheckCircle className="mr-2" />}
            {message.type === "error" && <FaExclamationTriangle className="mr-2" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Employees</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="general manager">General Manager</option>
              <option value="sales manager">Sales Manager</option>
              <option value="production manager">Production Manager</option>
              <option value="warehouse manager">Warehouse Manager</option>
              <option value="labour">Labour</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{filteredEmployees.length}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">
            {filteredEmployees.filter(emp => getAttendanceStatus(emp._id) === "present").length}
          </div>
          <div className="text-sm text-gray-600">Present</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-red-600">
            {filteredEmployees.filter(emp => getAttendanceStatus(emp._id) === "absent").length}
          </div>
          <div className="text-sm text-gray-600">Absent</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {filteredEmployees.filter(emp => getAttendanceStatus(emp._id) === "late").length}
          </div>
          <div className="text-sm text-gray-600">Late</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {filteredEmployees.filter(emp => getAttendanceStatus(emp._id) === "leave").length}
          </div>
          <div className="text-sm text-gray-600">Leave</div>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEmployees.map((employee) => {
          const status = getAttendanceStatus(employee._id);
          const isMarked = markedEmployees.has(employee._id);
          
          return (
            <div
              key={employee._id}
              className={`bg-white rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                isMarked ? getStatusColor(status) : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="p-6">
                {/* Employee Info */}
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    {isMarked ? getStatusIcon(status) : <FaUser className="text-2xl text-blue-600" />}
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{employee.name || employee.email}</h4>
                  <p className="text-sm text-gray-600 mb-2">{employee.email}</p>
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    {employee.role}
                  </span>
                </div>

                {/* Status Display */}
                {isMarked && (
                  <div className="text-center mb-4">
                    <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                      status === "present" ? "bg-green-100 text-green-800" :
                      status === "absent" ? "bg-red-100 text-red-800" :
                      status === "late" ? "bg-yellow-100 text-yellow-800" :
                      status === "leave" ? "bg-purple-100 text-purple-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                {!isMarked && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleMarkAttendance(employee._id, "present")}
                      disabled={saving}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 !bg-green-600 text-white rounded-lg hover:!bg-green-700 transition-all duration-200 disabled:opacity-50"
                    >
                      <FaCheck />
                      <span>Present</span>
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(employee._id, "late")}
                      disabled={saving}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 !bg-yellow-600 text-white rounded-lg hover:!bg-yellow-700 transition-all duration-200 disabled:opacity-50"
                    >
                      <FaClock />
                      <span>Late</span>
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(employee._id, "leave")}
                      disabled={saving}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 !bg-purple-600 text-white rounded-lg hover:!bg-purple-700 transition-all duration-200 disabled:opacity-50"
                    >
                      <FaCalendar />
                      <span>Leave</span>
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(employee._id, "absent")}
                      disabled={saving}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 !bg-red-600 text-white rounded-lg hover:!bg-red-700 transition-all duration-200 disabled:opacity-50"
                    >
                      <FaBan />
                      <span>Absent</span>
                    </button>
                  </div>
                )}

                {/* Change Status Button */}
                {isMarked && (
                  <button
                    onClick={() => setMarkedEmployees(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(employee._id);
                      return newSet;
                    })}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 !bg-gray-600 text-white rounded-lg hover:!bg-gray-700 transition-all duration-200"
                  >
                    <FaEdit />
                    <span>Change Status</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <FaUser className="mx-auto text-4xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
} 