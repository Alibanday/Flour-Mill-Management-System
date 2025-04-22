import React, { useState } from "react";

export default function EmployeeForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    cnic: "",
    designation: "",
    salary: "",
    status: "active"
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-md shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="border p-2 rounded" />
        <input name="cnic" value={formData.cnic} onChange={handleChange} placeholder="CNIC" className="border p-2 rounded" />
        <input name="designation" value={formData.designation} onChange={handleChange} placeholder="Designation" className="border p-2 rounded" />
        <input name="salary" value={formData.salary} onChange={handleChange} placeholder="Salary" type="number" className="border p-2 rounded" />
        <select name="status" value={formData.status} onChange={handleChange} className="border p-2 rounded">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex justify-end space-x-2">
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md">Save</button>
        <button type="button" onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded-md">Cancel</button>
      </div>
    </form>
  );
}
