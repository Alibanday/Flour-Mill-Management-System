import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaIndustry, FaInfoCircle } from "react-icons/fa";

export default function DailyProductionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8000/api/dailyproduction/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (e) {
        console.error(e);
        setError("Failed to load production details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "N/A");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-2" /> Back to Production
        </button>
      </div>

      {/* Card */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-blue-600 text-white p-4 flex items-center">
          <FaIndustry className="text-2xl mr-3" />
          <h2 className="text-xl font-bold">Daily Production Batch</h2>
        </div>

        <div className="p-6 space-y-8">
          {/* Batch Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <FaInfoCircle className="mr-2 text-blue-500" /> Batch Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Batch ID:</span>
                <span className="font-medium text-black">{data.productionId}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-black">{formatDate(data.date)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Wheat Warehouse:</span>
                <span className="font-medium text-black">{data.wheatWarehouse?.name || "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Output Warehouse:</span>
                <span className="font-medium text-black">{data.outputWarehouse?.name || "-"}</span>
              </div>
            </div>
          </div>

          {/* Grinding Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Grinding Details</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wheat</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity (kg)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.grindingDetails.map((g, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2">{g.wheatType}</td>
                    <td className="px-4 py-2">{g.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Production Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Production Output</h3>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag Weight</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Weight</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.productionItems.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 capitalize">{p.item}</td>
                    <td className="px-4 py-2">{p.bagWeight} kg</td>
                    <td className="px-4 py-2">{p.bagQty}</td>
                    <td className="px-4 py-2">{p.grossWeight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
              <h4 className="font-medium mb-1 text-blue-800">Total Wheat Used</h4>
              <p className="text-lg font-semibold text-blue-900">{data.totalWheatUsed} kg</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
              <h4 className="font-medium mb-1 text-blue-800">Gross Weight (excl. Bran)</h4>
              <p className="text-lg font-semibold text-blue-900">{data.grossWeightExcludingBran} kg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 