import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function BagStock({ onCancel }) {
  const [warehouses, setWarehouses] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const [whRes, stockRes] = await Promise.all([
          axios.get("http://localhost:8000/api/warehouse/active", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:8000/api/stock", { headers: { Authorization: `Bearer ${token}` }, params: { limit: 1000 } }),
        ]);
        setWarehouses(whRes.data);
        const map = {};
        stockRes.data.stocks.forEach(s => {
          if (s.itemType === "bags" && s.warehouse) {
            const id = s.warehouse;
            const qty = s.quantity?.value || 0;
            map[id] = (map[id] || 0) + qty;
          }
        });
        setStockMap(map);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Bag Stock by Warehouse</h2>
        {onCancel && <button onClick={onCancel} className="text-blue-600 hover:underline">Back</button>}
      </div>
      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map(w => (
            <div
              key={w._id}
              onClick={() => navigate(`/warehouse/${w._id}`)}
              className="cursor-pointer border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-1">{w.name}</h3>
              <p className="text-sm text-gray-600 mb-1">#{w.warehouseNumber}</p>
              <p className="text-sm text-gray-600 mb-2">{w.location}</p>
              <div className="font-medium">Total Bags: {stockMap[w._id] || 0}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 