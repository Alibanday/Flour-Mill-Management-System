import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUsers, FaUserClock, FaUserPlus, FaCalendarAlt, FaSearch,
  FaFileExport, FaFilter, FaHome, FaChartBar, FaUserCog, 
  FaSignOutAlt, FaCheckCircle, FaTimes, FaEdit, FaTrash,
  FaClock, FaMapMarkerAlt, FaStickyNote, FaEye, FaRedo,
  FaDownload, FaPrint, FaBell, FaCalendarDay, FaUserCheck,
  FaUserTimes, FaUserMinus, FaHourglassHalf, FaBolt, FaCheck,
  FaBan, FaCalendar, FaUserEdit
} from "react-icons/fa";
import MarkAttendanceForm from "../../components/attendancesystem/MarkAttendanceForm";
import AttendanceList from "../../components/attendancesystem/AttendanceList";
import AttendanceSummary from "../../components/attendancesystem/AttendanceSummary";
import QuickMarkAttendance from "../../components/attendancesystem/QuickMarkAttendance";

export default function AttendancePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("quickmark");
  const [showMarkForm, setShowMarkForm] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    employeeId: "",
    status: "",
    role: ""
  });

  useEffect(() => {
    fetchAttendanceData();
    fetchEmployees();
    fetchSummaryData();
  }, [filters]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.employeeId) params.append("employeeId", filters.employeeId);
      if (filters.status) params.append("status", filters.status);
      if (filters.role) params.append("role", filters.role);

      const response = await axios.get(`http://localhost:8000/api/attendance?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAttendanceData(response.data.attendance || []);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8000/api/users/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchSummaryData = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await axios.get(`http://localhost:8000/api/attendance/summary?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSummaryData(response.data.summary || {});
    } catch (error) {
      console.error("Error fetching summary data:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleAttendanceMarked = () => {
    setShowMarkForm(false);
    fetchAttendanceData();
    fetchSummaryData();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportAttendanceData = () => {
    console.log("Exporting attendance data...");
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayAttendance = attendanceData.filter(att => 
      att.date.slice(0, 10) === today
    );
    
    return {
      present: todayAttendance.filter(att => att.status === "present").length,
      absent: todayAttendance.filter(att => att.status === "absent").length,
      late: todayAttendance.filter(att => att.status === "late").length,
      total: todayAttendance.length
    };
  };

  const todayStats = getTodayStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FaUserClock className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Attendance System</h1>
                <p className="text-sm text-gray-600">Manage employee attendance efficiently</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <button 
                className="px-4 py-2 font-medium rounded-lg transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                onClick={() => navigate("/dashboard")}
              >
                <FaHome className="text-sm" />
                <span>Dashboard</span>
              </button>
              <button 
                className="px-4 py-2 font-medium rounded-lg transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                onClick={() => navigate("/EmployeesPage")}
              >
                <FaUsers className="text-sm" />
                <span>Employees</span>
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FaBell className="text-gray-400" />
              <span>Today: {new Date().toLocaleDateString()}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:!bg-red-50 rounded-lg transition-all duration-200"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-5rem)] hidden lg:block">
          <div className="p-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">ATTENDANCE MENU</h3>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("quickmark")}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === "quickmark" 
                    ? "!bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" 
                    : "text-gray-700 hover:!bg-gray-50 hover:text-gray-900"
                }`}
              >
                <FaBolt className="mr-3 text-lg" />
                <span>Quick Mark</span>
              </button>
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === "overview" 
                    ? "!bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" 
                    : "text-gray-700 hover:!bg-gray-50 hover:text-gray-900"
                }`}
              >
                <FaChartBar className="mr-3 text-lg" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab("mark")}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === "mark" 
                    ? "!bg-blue-50 text-blue-700 border border-blue-200 shadow-sm" 
                    : "text-gray-700 hover:!bg-gray-50 hover:text-gray-900"
                }`}
              >
                <FaUserEdit className="mr-3 text-lg" />
                <span>Manual Entry</span>
              </button>
            </nav>

            {/* Quick Stats */}
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Today's Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Present:</span>
                  <span className="font-semibold text-green-600">{todayStats.present}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Absent:</span>
                  <span className="font-semibold text-red-600">{todayStats.absent}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Late:</span>
                  <span className="font-semibold text-yellow-600">{todayStats.late}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {activeTab === "quickmark" && "Quick Mark Attendance"}
                  {activeTab === "overview" && "Attendance Overview"}
                  {activeTab === "mark" && "Manual Entry"}
                </h2>
                <p className="text-gray-600">
                  {activeTab === "quickmark" && "Mark attendance for all employees with one click"}
                  {activeTab === "overview" && "Monitor attendance statistics and trends"}
                  {activeTab === "mark" && "Record employee attendance manually"}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {activeTab !== "quickmark" && (
                  <button
                    onClick={() => setActiveTab("quickmark")}
                    className="flex items-center space-x-2 px-6 py-3 !bg-blue-600 text-white rounded-xl hover:!bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <FaBolt />
                    <span>Quick Mark</span>
                  </button>
                )}
                <button
                  onClick={exportAttendanceData}
                  className="flex items-center space-x-2 px-4 py-3 !bg-white text-gray-700 rounded-xl hover:!bg-gray-50 transition-all duration-200 border border-gray-200 shadow-sm"
                >
                  <FaDownload />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FaUsers className="text-blue-600 text-xl" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present Today</p>
                    <p className="text-2xl font-bold text-green-600">{todayStats.present}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FaUserCheck className="text-green-600 text-xl" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent Today</p>
                    <p className="text-2xl font-bold text-red-600">{todayStats.absent}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <FaUserTimes className="text-red-600 text-xl" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Late Today</p>
                    <p className="text-2xl font-bold text-yellow-600">{todayStats.late}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <FaUserMinus className="text-yellow-600 text-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section - Only show for non-quickmark tabs */}
          {activeTab !== "quickmark" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setFilters({
                    startDate: new Date().toISOString().slice(0, 10),
                    endDate: new Date().toISOString().slice(0, 10),
                    employeeId: "",
                    status: "",
                    role: ""
                  })}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:!bg-blue-50 rounded-lg transition-all duration-200"
                >
                  <FaRedo />
                  <span>Reset</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                  <select
                    value={filters.employeeId}
                    onChange={(e) => handleFilterChange("employeeId", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">All Employees</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name || emp.email}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange("role", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">All Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half-day">Half Day</option>
                    <option value="leave">Leave</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {activeTab === "quickmark" && (
              <QuickMarkAttendance 
                employees={employees}
                attendanceData={attendanceData}
                onAttendanceMarked={handleAttendanceMarked}
                loading={loading}
              />
            )}

            {activeTab === "overview" && (
              <AttendanceSummary 
                summaryData={summaryData} 
                attendanceData={attendanceData}
                loading={loading}
                employees={employees}
              />
            )}

            {activeTab === "mark" && (
              <div className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="p-6 bg-blue-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <FaUserEdit className="text-4xl text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Manual Entry</h3>
                  <p className="text-gray-600 mb-8">Use the form below to manually enter attendance details for specific employees.</p>
                  <button
                    onClick={() => setShowMarkForm(true)}
                    className="px-8 py-4 !bg-blue-600 text-white rounded-xl hover:!bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Open Form
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mark Attendance Modal */}
      {showMarkForm && (
        <MarkAttendanceForm
          onClose={() => setShowMarkForm(false)}
          onAttendanceMarked={handleAttendanceMarked}
          employees={employees}
        />
      )}
    </div>
  );
} 