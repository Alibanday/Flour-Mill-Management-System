import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DailyProductionForm from "../components/DailyProductionForm";
import axios from "axios";

const sampleData = [
  { id: 1, product: "Wheat Flour", quantity: "500 Bags", date: "2024-06-20" },
  { id: 2, product: "Whole Wheat", quantity: "300 Bags", date: "2024-06-19" },
  { id: 3, product: "Premium Flour", quantity: "700 Bags", date: "2024-06-18" },
];

export default function DailyProduction() {
  const [production, setProduction] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8000/api/dailyproduction", { headers: { Authorization: `Bearer ${token}` } });
      setProduction(res.data?.productions || []);
    } catch (e) {
      console.error("Failed to load productions", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setShowForm(true);
  };

  const handleSave = (saved) => {
    setShowForm(false);
    fetchData();
  };

  return (
    <div className="min-h-screen w-full bg-white bg-opacity-30 backdrop-blur-sm bg-cover bg-no-repeat bg-center" style={{ backgroundImage: "url('/dashboard.jpg')" }}>
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <h1 className="text-2xl font-bold text-blue-800">Daily Production</h1>
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 !bg-blue-600 text-white rounded shadow hover:bg-blue-700">
            <FaPlus />
            Add Daily Production
          </button>
        </div>
      </header>

      <main className="p-6 w-full flex flex-col items-center">
        <div className="w-full bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Daily Production Batches</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wheat Used (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Weight (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output Warehouse</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                  </tr>
                ) : production.length > 0 ? (
                  production.map((batch) => (
                    <tr key={batch._id} className="hover:bg-blue-50 cursor-pointer" onClick={() => navigate(`/production/daily/${batch._id}`)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{batch.productionId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{batch.totalWheatUsed}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{batch.grossWeightExcludingBran}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{batch.outputWarehouse?.name || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{batch.date ? new Date(batch.date).toLocaleDateString() : ""}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No production records</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showForm && (
        <DailyProductionForm onCancel={() => setShowForm(false)} onSave={handleSave} />
      )}
    </div>
  );
} 