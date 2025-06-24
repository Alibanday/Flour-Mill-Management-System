import React from "react";
import {
  FaUsers, FaUserCheck, FaUserTimes, FaUserClock, FaClock,
  FaChartLine, FaCalendarAlt, FaPercentage, FaHourglassHalf
} from "react-icons/fa";

export default function AttendanceSummary({ summaryData, attendanceData, loading, employees }) {
  const formatNumber = (num) => {
    return num ? num.toLocaleString() : "0";
  };

  const formatPercentage = (num) => {
    return num ? `${num}%` : "0%";
  };

  const formatHours = (hours) => {
    if (!hours) return "0h";
    return `${Math.round(hours * 100) / 100}h`;
  };

  const getTodayAttendance = () => {
    const today = new Date().toISOString().slice(0, 10);
    return attendanceData.filter(att => 
      att.date.slice(0, 10) === today
    );
  };

  const todayAttendance = getTodayAttendance();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading summary data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Attendance Overview</h3>
        <p className="text-sm text-gray-500">Summary of employee attendance and statistics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaUsers className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(employees?.length || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaUserCheck className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayAttendance.filter(att => att.status === "present").length}
              </p>
            </div>
          </div>
        </div>

        {/* Absent Today */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FaUserTimes className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Absent Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayAttendance.filter(att => att.status === "absent").length}
              </p>
            </div>
          </div>
        </div>

        {/* Late Today */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FaUserClock className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Late Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayAttendance.filter(att => att.status === "late").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Period Statistics */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Period Statistics</h4>
            <FaChartLine className="text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaUserCheck className="text-green-600 mr-3" />
                <span className="text-gray-700">Present Days</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatNumber(summaryData.presentDays || 0)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaUserTimes className="text-red-600 mr-3" />
                <span className="text-gray-700">Absent Days</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatNumber(summaryData.absentDays || 0)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaUserClock className="text-yellow-600 mr-3" />
                <span className="text-gray-700">Late Days</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatNumber(summaryData.lateDays || 0)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaPercentage className="text-blue-600 mr-3" />
                <span className="text-gray-700">Attendance Rate</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatPercentage(summaryData.attendanceRate || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Work Hours Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Work Hours Summary</h4>
            <FaClock className="text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaHourglassHalf className="text-blue-600 mr-3" />
                <span className="text-gray-700">Total Work Hours</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatHours(summaryData.totalWorkHours || 0)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaClock className="text-orange-600 mr-3" />
                <span className="text-gray-700">Total Overtime</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatHours(summaryData.totalOvertime || 0)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaCalendarAlt className="text-purple-600 mr-3" />
                <span className="text-gray-700">Total Records</span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatNumber(summaryData.totalRecords || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Attendance Quick View */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Today's Attendance</h4>
          <FaCalendarAlt className="text-gray-400" />
        </div>
        
        {todayAttendance.length === 0 ? (
          <div className="text-center py-8">
            <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-500">No attendance records for today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Hours</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todayAttendance.map((attendance) => (
                  <tr key={attendance._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {attendance.employee?.name || attendance.employee?.email || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {attendance.employee?.role || "No role"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        attendance.status === "present" ? "bg-green-100 text-green-800" :
                        attendance.status === "absent" ? "bg-red-100 text-red-800" :
                        attendance.status === "late" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {attendance.checkIn?.time ? 
                        new Date(attendance.checkIn.time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : "-"
                      }
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {attendance.checkOut?.time ? 
                        new Date(attendance.checkOut.time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : "-"
                      }
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {attendance.workHours ? `${attendance.workHours}h` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 