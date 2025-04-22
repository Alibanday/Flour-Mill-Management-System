import React from "react";

export default function EmployeeTable({ data }) {
  return (
    <table className="w-full text-left border border-gray-300 rounded-md">
      <thead className="bg-gray-200">
        <tr>
          <th className="p-2">Name</th>
          <th className="p-2">CNIC</th>
          <th className="p-2">Designation</th>
          <th className="p-2">Salary</th>
          <th className="p-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan="5" className="text-center py-4 text-gray-500">No employees added yet.</td>
          </tr>
        ) : (
          data.map((emp, index) => (
            <tr key={index} className="border-t">
              <td className="p-2">{emp.name}</td>
              <td className="p-2">{emp.cnic}</td>
              <td className="p-2">{emp.designation}</td>
              <td className="p-2">Rs. {emp.salary}</td>
              <td className="p-2 capitalize">{emp.status}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
