import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaWallet, FaTimes, FaSave, FaPrint } from "react-icons/fa";

const BAG_TYPES = ["Ata", "Maida", "Suji", "Fine"];
const BAG_WEIGHTS = [10, 15, 20, 40, 80];

// Simple form for creating a Bag Purchase Invoice (placeholder / WIP)
export default function BagsPurchaseInvoiceForm({ onInvoiceCreated, onCancel }) {
  const [form, setForm] = useState({
    supplierAccount: "",
    paymentMethod: "cash",
    initialPayment: "",
    bagType: "",
    bagWeight: "",
    bagQuantity: "",
    ratePerBag: "",
    totalAmount: "",
    remainingAmount: "",
    date: new Date(),
    status: "pending",
    warehouse: "",
  });

  const [sellerAccounts, setSellerAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);

  const [itemInput, setItemInput] = useState({
    bagType: "Ata",
    weight: 40,
    quantity: "",
    pricePerBag: "",
  });

  const [generateGatepass, setGenerateGatepass] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const totalPrice = items.reduce(
    (sum, item) => sum + item.quantity * item.pricePerBag,
    0
  );

  const remainingAmount = Math.max(totalPrice - (parseFloat(form.initialPayment) || 0), 0);

  const invoiceNumber = `${Date.now()}`; // placeholder

  // Fetch accounts for supplier dropdown (reuse payable type)
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8000/api/accounts", {
          headers: { Authorization: `Bearer ${token}` },
          params: { type: "payable" },
        });
        setSellerAccounts(res.data);
      } catch (err) {
        console.error("Failed to fetch accounts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:8000/api/warehouse/active", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWarehouses(res.data);
      } catch (err) {
        console.error("Failed to fetch warehouses", err);
      }
    };
    fetchWarehouses();
  }, []);

  // Calculate totals dynamically
  useEffect(() => {
    if (form.bagQuantity && form.ratePerBag) {
      const total = parseFloat(form.bagQuantity) * parseFloat(form.ratePerBag);
      const remaining = total - (parseFloat(form.initialPayment) || 0);
      setForm((prev) => ({
        ...prev,
        totalAmount: total.toFixed(2),
        remainingAmount: remaining > 0 ? remaining.toFixed(2) : "0.00",
      }));
    } else {
      setForm((prev) => ({ ...prev, totalAmount: "", remainingAmount: "" }));
    }
  }, [form.bagQuantity, form.ratePerBag, form.initialPayment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Add item handler
  const handleAddItem = () => {
    // Validate item
    if (!itemInput.quantity || itemInput.quantity <= 0) {
      setError("Enter valid quantity for item");
      return;
    }
    if (!itemInput.pricePerBag || itemInput.pricePerBag <= 0) {
      setError("Enter valid price per bag");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        ...itemInput,
        quantity: parseFloat(itemInput.quantity),
        pricePerBag: parseFloat(itemInput.pricePerBag),
      },
    ]);
    // reset itemInput quantity/price
    setItemInput((prev) => ({ ...prev, quantity: "", pricePerBag: "" }));
    setError(null);
  };

  // Remove item
  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async (printAfter = false) => {
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!form.supplierAccount) return setError("Supplier Account is required");
    if (!form.warehouse) return setError("Warehouse is required");
    if (items.length === 0) return setError("Add at least one item");

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = {
        seller: form.supplierAccount,
        warehouse: form.warehouse,
        paymentMethod: form.paymentMethod,
        initialPayment: parseFloat(form.initialPayment) || 0,
        totalAmount: totalPrice,
        remainingAmount: totalPrice - (parseFloat(form.initialPayment) || 0),
        items,
        type: "bag",
        date: form.date,
        status: form.status,
        gatepass: generateGatepass,
      };
      const { data } = await axios.post("http://localhost:8000/api/invoice", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setSuccess("Invoice saved successfully!");
      onInvoiceCreated && onInvoiceCreated(data.invoice);
      if (printAfter) {
        window.print();
      }
      // reset form state if desired
      // ... (optional cleanup)
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
  };

  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
      }, 100);

      const afterPrint = () => {
        setIsPrinting(false);
      };
      window.addEventListener('afterprint', afterPrint);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', afterPrint);
      };
    }
  }, [isPrinting]);

  if (isPrinting) {
    const supplier = sellerAccounts.find(acc => acc._id === form.supplierAccount);
    return (
      <div className="p-8 text-sm">
        <h1 className="text-2xl font-bold mb-4 text-center">Bag Purchase Invoice</h1>
        <div className="mb-4 flex justify-between">
          <div>
            <p><span className="font-semibold">Invoice #:</span> {invoiceNumber}</p>
            <p><span className="font-semibold">Date:</span> {form.date.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-semibold">Supplier:</p>
            {supplier ? (
              <p>{supplier.accountName} ({supplier.accountId})</p>
            ) : (
              <p>{form.supplierAccount}</p>
            )}
          </div>
        </div>

        <table className="w-full border-collapse mb-4">
          <thead>
            <tr>
              <th className="border px-2 py-1 text-left">#</th>
              <th className="border px-2 py-1 text-left">Item</th>
              <th className="border px-2 py-1 text-left">Weight (kg)</th>
              <th className="border px-2 py-1 text-left">Qty</th>
              <th className="border px-2 py-1 text-left">Price/Bag</th>
              <th className="border px-2 py-1 text-left">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1">{idx + 1}</td>
                <td className="border px-2 py-1">{item.bagType}</td>
                <td className="border px-2 py-1">{item.weight}</td>
                <td className="border px-2 py-1">{item.quantity}</td>
                <td className="border px-2 py-1">Rs. {item.pricePerBag}</td>
                <td className="border px-2 py-1">Rs. {(item.quantity * item.pricePerBag).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right">
          <p><span className="font-semibold">Total Amount:</span> Rs. {totalPrice.toFixed(2)}</p>
          <p><span className="font-semibold">Amount Paid:</span> Rs. {form.initialPayment || 0}</p>
          <p><span className="font-semibold">Remaining Balance:</span> Rs. {remainingAmount.toFixed(2)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaWallet className="mr-2" /> Bag Purchase Invoice
        </h2>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setGenerateGatepass(!generateGatepass)}
            title="Generate Gatepass"
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${generateGatepass ? 'bg-green-500 border-green-500 text-white' : 'border-gray-400 text-gray-500 hover:border-gray-600'}`}
          >
            GP
          </button>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <FaTimes className="text-xl" />
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}

      <form className="space-y-6">
        {/* Top Row: Date and Warehouse */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
            <DatePicker
              selected={form.date}
              onChange={(date) => setForm((prev) => ({ ...prev, date }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
              required
            />
          </div>

          {/* Empty spacer on medium screens so that warehouse aligns right */}
          <div className="hidden md:block"></div>

          {/* Warehouse */}
          <div className="md:col-start-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Add to Warehouse *</label>
            <select
              name="warehouse"
              value={form.warehouse || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
              required
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Supplier & Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 border p-4 rounded-lg mt-6">
          {/* Supplier Account */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Account *</label>
            <select
              name="supplierAccount"
              value={form.supplierAccount}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
              required
            >
              <option value="">Select Supplier Account</option>
              {loading ? (
                <option disabled>Loading accounts...</option>
              ) : (
                sellerAccounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountName} ({acc.accountId})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </select>
          </div>

          {/* Initial Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Payment (Rs.)</label>
            <input
              type="number"
              name="initialPayment"
              value={form.initialPayment}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Line Item Entry */}
        <h3 className="text-lg font-semibold mt-8 mb-2">Add Items</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-4">
          {/* Bag Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bag Type</label>
            <select
              value={itemInput.bagType}
              onChange={(e) => setItemInput((prev) => ({ ...prev, bagType: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
            >
              {BAG_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <select
              value={itemInput.weight}
              onChange={(e) => setItemInput((prev) => ({ ...prev, weight: Number(e.target.value) }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
            >
              {BAG_WEIGHTS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (bags)</label>
            <input
              type="number"
              value={itemInput.quantity}
              onChange={(e) => setItemInput((prev) => ({ ...prev, quantity: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
              min="1"
            />
          </div>
          {/* Price per bag */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price/Bag (Rs.)</label>
            <input
              type="number"
              value={itemInput.pricePerBag}
              onChange={(e) => setItemInput((prev) => ({ ...prev, pricePerBag: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full px-4 py-2 !bg-green-600 text-white rounded-md hover:!bg-green-700"
            >
              Add Item
            </button>
          </div>
        </div>

        {/* Items Table */}
        {items.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price/Bag</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm">{idx + 1}</td>
                    <td className="px-4 py-2 text-sm">{item.bagType}</td>
                    <td className="px-4 py-2 text-sm">{item.weight} kg</td>
                    <td className="px-4 py-2 text-sm">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm">Rs. {item.pricePerBag}</td>
                    <td className="px-4 py-2 text-sm text-right">
                      <button
                        type="button"
                        className="text-red-500 hover:underline text-xs"
                        onClick={() => handleRemoveItem(idx)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total Price */}
        <div className="text-right font-semibold text-lg">
          Total Price: Rs. {totalPrice.toFixed(2)}
        </div>
        <div className="text-right font-semibold text-md mb-6">
          Remaining Amount: Rs. {remainingAmount.toFixed(2)}
        </div>

        {/* Submit Button */}
        <div className="flex flex-wrap gap-4 justify-end">
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="flex items-center px-4 py-2 !bg-blue-600 text-white rounded-md hover:!bg-blue-700"
            disabled={loading}
          >
            <FaSave className="mr-2" /> {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center px-4 py-2 !bg-gray-600 text-white rounded-md hover:!bg-gray-700"
          >
            <FaPrint className="mr-2" /> Print Invoice
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="flex items-center px-4 py-2 !bg-green-600 text-white rounded-md hover:!bg-green-700"
            disabled={loading}
          >
            <FaPrint className="mr-2" /> {loading ? 'Saving...' : 'Print & Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
