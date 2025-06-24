import React, { useState, useMemo, useEffect } from "react";
import { FaPlus, FaTrash, FaTimes } from "react-icons/fa";
import axios from "axios";

const wheatOptions = ["Wheat Private", "Wheat Government"];

export default function DailyProductionForm({ onCancel, onSave }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [warehouse, setWarehouse] = useState("");

  const [grindingDetails, setGrindingDetails] = useState([
    { wheatType: "", quantity: "" }
  ]);

  const [productionItems, setProductionItems] = useState([
    { item: "", bagWeight: "", bagQty: "" }
  ]);

  const [outputWarehouse, setOutputWarehouse] = useState("");
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  
  // Dynamic item data
  const [allItems, setAllItems] = useState([]);
  const [itemNames, setItemNames] = useState([]);
  const [itemWeights, setItemWeights] = useState([]);
  const [itemCategory, setItemCategory] = useState("");

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8000/api/warehouse/active", { headers: { Authorization: `Bearer ${token}` } });
        setWarehouseOptions(res.data || []);
      } catch (e) {
        console.error("Failed to fetch warehouses", e.message);
      }
    };
    fetchWarehouses();
  }, []);

  // Fetch all items for production
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const token = localStorage.getItem("token");
        const allItemsRes = await axios.get("http://localhost:8000/api/items", { headers: { Authorization: `Bearer ${token}` } });
        setAllItems(allItemsRes.data.items || []);
        // Filter only bag items for dropdown (excluding wheat items)
        const bagItemNames = [...new Set((allItemsRes.data.items || []).filter(i => i.category === 'bags').map(i => i.name))];
        setItemNames(bagItemNames);
      } catch (e) {
        console.error("Failed to fetch items", e.message);
      }
    };
    fetchItems();
  }, []);

  // Fetch weights and category when item changes
  useEffect(() => {
    if (!productionItems[0]?.item) {
      setItemWeights([]);
      setItemCategory("");
      return;
    }
    const fetchWeights = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8000/api/items/weights/${encodeURIComponent(productionItems[0].item)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setItemWeights(res.data.weights || []);
        setItemCategory(res.data.category);
      } catch (e) {
        console.error("Failed to fetch weights", e.message);
        setItemWeights([]);
        setItemCategory("");
      }
    };
    fetchWeights();
  }, [productionItems[0]?.item]);

  // derived totals
  const totalWheatUsed = useMemo(() => {
    return grindingDetails.reduce((acc, g) => acc + Number(g.quantity || 0), 0);
  }, [grindingDetails]);

  const grossWeights = useMemo(() => {
    return productionItems.map((p) => Number(p.bagWeight || 0) * Number(p.bagQty || 0));
  }, [productionItems]);

  const totalGrossExcludingBran = useMemo(() => {
    return productionItems.reduce((acc, p, idx) => {
      if (p.item.toLowerCase() === "bran") return acc;
      return acc + grossWeights[idx];
    }, 0);
  }, [productionItems, grossWeights]);

  const handleGrindingChange = (idx, field, value) => {
    setGrindingDetails((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const addGrindingRow = () => {
    setGrindingDetails((prev) => [...prev, { wheatType: "", quantity: "" }]);
  };

  const removeGrindingRow = (idx) => {
    setGrindingDetails((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleProdItemChange = (idx, field, value) => {
    setProductionItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const addProdItemRow = () => {
    setProductionItems((prev) => [...prev, { item: "", bagWeight: "", bagQty: "" }]);
  };

  const removeProdItemRow = (idx) => {
    setProductionItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Clean up empty production items
  const cleanupEmptyProductionItems = () => {
    setProductionItems(prev => prev.filter(item => 
      item.item || item.bagWeight || item.bagQty
    ));
  };

  // Clean up empty grinding details
  const cleanupEmptyGrindingDetails = () => {
    setGrindingDetails(prev => prev.filter(item => 
      item.wheatType || item.quantity
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty production items
    const validProductionItems = productionItems.filter(item => 
      item.item && item.bagWeight && item.bagQty && item.bagQty > 0
    );
    
    // Validate that we have at least one production item
    if (validProductionItems.length === 0) {
      alert("Please add at least one production item with complete details");
      return;
    }
    
    // Validate grinding details
    const validGrindingDetails = grindingDetails.filter(item => 
      item.wheatType && item.quantity && item.quantity > 0
    );
    
    if (validGrindingDetails.length === 0) {
      alert("Please add at least one grinding detail with complete information");
      return;
    }
    
    const payload = {
      date,
      wheatWarehouse: warehouse,
      grindingDetails: validGrindingDetails,
      productionItems: validProductionItems,
      outputWarehouse,
    };

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:8000/api/dailyproduction", payload, { headers: { Authorization: `Bearer ${token}` } });
      if (onSave) onSave(res.data.production);
    } catch (err) {
      console.error("Failed to save production", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to save");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-200 bg-opacity-60 backdrop-blur-sm z-50 p-4 overflow-auto">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onCancel}
        >
          <FaTimes />
        </button>
        <h2 className="text-xl font-semibold mb-6 text-blue-900">Daily Production Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200">
          {/* Basic Info */}
          <div className="pt-0">
            <h3 className="text-base font-semibold text-blue-700 mb-4">Batch Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 rounded-md text-sm shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wheat Warehouse</label>
                <select value={warehouse} onChange={e => setWarehouse(e.target.value)} className="w-full border border-gray-300 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 rounded-md text-sm shadow-sm" required>
                  <option value="">Select Warehouse</option>
                  {warehouseOptions.map(w => (
                    <option key={w._id || w.name} value={w._id || w.name}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Grinding Details */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-blue-700">Grinding Details</h3>
              <button type="button" onClick={addGrindingRow} className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><FaPlus /> Add</button>
            </div>
            <div className="space-y-2">
              {grindingDetails.map((g, idx) => {
                const isIncomplete = !g.wheatType || !g.quantity;
                return (
                  <div key={idx} className={`grid grid-cols-1 sm:grid-cols-6 gap-2 items-center p-2 rounded-lg shadow-sm ${isIncomplete ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <select
                      value={g.wheatType}
                      onChange={(e) => handleGrindingChange(idx, "wheatType", e.target.value)}
                      className={`col-span-3 border px-2 py-1 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 ${!g.wheatType ? 'border-red-300' : 'border-gray-300'}`}
                    >
                      <option value="">Select Wheat</option>
                      {wheatOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Quantity (kg)"
                      value={g.quantity}
                      onChange={(e) => handleGrindingChange(idx, "quantity", e.target.value)}
                      className={`col-span-2 border px-2 py-1 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 ${!g.quantity ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    <button type="button" onClick={() => removeGrindingRow(idx)} className="text-red-500 hover:text-red-600"><FaTrash /></button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Production Details */}
          <div className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
              <h3 className="text-base font-semibold text-blue-700">Production Details</h3>
              <div className="flex items-center gap-3">
                <label className="text-sm">Output Warehouse:</label>
                <select value={outputWarehouse} onChange={(e) => setOutputWarehouse(e.target.value)} required className="border border-gray-300 px-2 py-1 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500">
                  <option value="" disabled>Select Warehouse</option>
                  {warehouseOptions.map(w => (
                    <option key={w._id || w.name} value={w._id || w.name}>{w.name}</option>
                  ))}
                </select>
                <button type="button" onClick={addProdItemRow} className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><FaPlus /> Add Item</button>
              </div>
            </div>
            <div className="space-y-2">
              {productionItems.map((p, idx) => {
                const isIncomplete = !p.item || !p.bagWeight || !p.bagQty;
                return (
                  <div key={idx} className={`grid grid-cols-1 sm:grid-cols-9 gap-2 items-center p-2 rounded-lg shadow-sm ${isIncomplete ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <select
                      value={p.item}
                      onChange={(e) => handleProdItemChange(idx, "item", e.target.value)}
                      className={`col-span-2 border px-2 py-1 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 ${!p.item ? 'border-red-300' : 'border-gray-300'}`}
                    >
                      <option value="">Select Item</option>
                      {itemNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <select
                      value={p.bagWeight}
                      onChange={(e) => handleProdItemChange(idx, "bagWeight", e.target.value)}
                      className={`col-span-1 border px-2 py-1 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 ${!p.bagWeight ? 'border-red-300' : 'border-gray-300'}`}
                    >
                      <option value="">Weight</option>
                      {itemWeights.map(w => (
                        <option key={w} value={w}>{w}kg</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Bag Qty"
                      value={p.bagQty}
                      onChange={(e) => handleProdItemChange(idx, "bagQty", e.target.value)}
                      className={`col-span-1 border px-2 py-1 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 ${!p.bagQty ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    <input
                      type="number"
                      value={grossWeights[idx]}
                      readOnly
                      className="col-span-4 border border-gray-300 px-2 py-1 text-sm rounded-md bg-gray-100"
                      placeholder="Gross Weight"
                    />
                    <button type="button" onClick={() => removeProdItemRow(idx)} className="text-red-500 hover:text-red-600"><FaTrash /></button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
              <h4 className="font-medium mb-1 text-blue-800">Total Wheat Used</h4>
              <p className="text-lg font-semibold text-blue-900">{totalWheatUsed} kg</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
              <h4 className="font-medium mb-1 text-blue-800">Gross Weight (excluding Bran)</h4>
              <p className="text-lg font-semibold text-blue-900">{totalGrossExcludingBran} kg</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md !bg-gray-200 hover:!bg-gray-300">Cancel</button>
            <button type="submit" className="px-6 py-2 rounded-md !bg-blue-600 text-white hover:!bg-blue-700 shadow">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
} 