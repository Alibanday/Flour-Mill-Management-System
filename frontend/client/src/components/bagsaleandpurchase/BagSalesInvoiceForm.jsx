import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaWallet, FaTimes, FaSave, FaPrint } from "react-icons/fa";

const BAG_TYPES = ["Ata", "Maida", "Suji", "Fine"];
const BAG_WEIGHTS = [10, 15, 20, 40, 80];

export default function BagSalesInvoiceForm({ onInvoiceCreated, onCancel }) {
  const [form, setForm] = useState({
    customerAccount: "",
    paymentMethod: "cash",
    initialPayment: "",
    date: new Date(),
    warehouse: "",
  });

  const [accounts, setAccounts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [itemInput, setItemInput] = useState({ bagType: "Ata", weight: 40, quantity: "", pricePerBag: "" });
  const [generateGatepass, setGenerateGatepass] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const totalPrice = items.reduce((sum, it) => sum + it.quantity * it.pricePerBag, 0);
  const remainingAmount = Math.max(totalPrice - (parseFloat(form.initialPayment) || 0), 0);
  const invoiceNumber = `${Date.now()}`;

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token");
        const accRes = await axios.get("http://localhost:8000/api/accounts", { headers: { Authorization: `Bearer ${token}` }, params: { type: "receivable" } });
        setAccounts(accRes.data);
        const whRes = await axios.get("http://localhost:8000/api/warehouse/active", { headers: { Authorization: `Bearer ${token}` } });
        setWarehouses(whRes.data);
      } catch {}
    };
    fetch();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addItem = () => {
    if (!itemInput.quantity || !itemInput.pricePerBag) return setError("Fill item fields");
    setItems([...items, { ...itemInput, quantity: parseFloat(itemInput.quantity), pricePerBag: parseFloat(itemInput.pricePerBag) }]);
    setItemInput({ ...itemInput, quantity: "", pricePerBag: "" });
    setError(null);
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const handlePrint = () => setIsPrinting(true);

  useEffect(() => {
    if (isPrinting) {
      const t = setTimeout(() => window.print(), 100);
      const stop = () => setIsPrinting(false);
      window.addEventListener("afterprint", stop);
      return () => { clearTimeout(t); window.removeEventListener("afterprint", stop); };
    }
  }, [isPrinting]);

  if (isPrinting) {
    const cust = accounts.find(a => a._id === form.customerAccount);
    return (
      <div className="p-8 text-sm">
        <h1 className="text-2xl font-bold text-center mb-4">Bag Sales Invoice</h1>
        <div className="flex justify-between mb-4">
          <div>
            <p><span className="font-semibold">Invoice #:</span> {invoiceNumber}</p>
            <p><span className="font-semibold">Date:</span> {form.date.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-semibold">Customer:</p>
            {cust ? <p>{cust.accountName}</p> : <p>{form.customerAccount}</p>}
          </div>
        </div>
        <table className="w-full border-collapse mb-4">
          <thead><tr><th className="border px-2 py-1">#</th><th className="border px-2 py-1">Item</th><th className="border px-2 py-1">W</th><th className="border px-2 py-1">Qty</th><th className="border px-2 py-1">Price</th><th className="border px-2 py-1">Amount</th></tr></thead>
          <tbody>
            {items.map((it,i)=>(
              <tr key={i}><td className="border px-2 py-1">{i+1}</td><td className="border px-2 py-1">{it.bagType}</td><td className="border px-2 py-1">{it.weight}</td><td className="border px-2 py-1">{it.quantity}</td><td className="border px-2 py-1">{it.pricePerBag}</td><td className="border px-2 py-1">{(it.quantity*it.pricePerBag).toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="text-right">
          <p><span className="font-semibold">Total:</span> Rs. {totalPrice.toFixed(2)}</p>
          <p><span className="font-semibold">Paid:</span> Rs. {form.initialPayment || 0}</p>
          <p><span className="font-semibold">Remaining:</span> Rs. {remainingAmount.toFixed(2)}</p>
        </div>
      </div>
    );
  }

  const handleSave = async (printAfter=false) => {
    if (!form.customerAccount || !form.warehouse || items.length === 0) return setError("Missing fields");
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = {
        buyer: form.customerAccount,
        warehouse: form.warehouse,
        paymentMethod: form.paymentMethod,
        initialPayment: parseFloat(form.initialPayment) || 0,
        totalAmount: totalPrice,
        remainingAmount,
        items,
        type: "bagsale",
        date: form.date,
        status: "pending",
        gatepass: generateGatepass,
      };
      const { data } = await axios.post("http://localhost:8000/api/invoice", payload, { headers: { Authorization: `Bearer ${token}` } });
      onInvoiceCreated && onInvoiceCreated(data.invoice);
      if(printAfter){handlePrint();}
    } catch (err) {
      setError(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center"><FaWallet className="mr-2" /> Bag Sales Invoice</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button type="button" onClick={()=>setGenerateGatepass(!generateGatepass)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${generateGatepass? 'bg-green-500 border-green-500 text-white':'border-gray-400 text-gray-500 hover:border-gray-600'}`}>GP</button>
            <span className="text-xs text-gray-600 select-none">Gatepass</span>
          </div>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700"><FaTimes className="text-xl" /></button>
        </div>
      </div>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {/* Top Row: Date & Warehouse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date *</label>
          <DatePicker selected={form.date} onChange={(d)=>setForm({...form,date:d})} className="w-full px-2 py-2 border border-gray-300 rounded-md" />
        </div>
        <div className="hidden md:block"></div>
        {/* Warehouse */}
        <div className="md:col-start-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Remove from Warehouse *</label>
          <select name="warehouse" value={form.warehouse} onChange={handleChange} className="w-full px-2 py-2 border border-gray-300 rounded-md" required>
            <option value="">Select Warehouse</option>
            {warehouses.map(w=><option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {/* Customer & Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 border p-4 rounded-lg mt-6">
        {/* Customer Account */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Account *</label>
          <select name="customerAccount" value={form.customerAccount} onChange={handleChange} className="w-full px-2 py-2 border border-gray-300 rounded-md" required>
            <option value="">Select</option>
            {accounts.map(a=><option key={a._id} value={a._id}>{a.accountName}</option>)}
          </select>
        </div>
        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="w-full px-2 py-2 border border-gray-300 rounded-md">
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>
        </div>
        {/* Initial Payment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Initial Payment (Rs.)</label>
          <input type="number" name="initialPayment" value={form.initialPayment} onChange={handleChange} className="w-full px-2 py-2 border border-gray-300 rounded-md" min="0" step="0.01" />
        </div>
      </div>

      <h3 className="font-semibold mb-2">Add Items</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
        <select value={itemInput.bagType} onChange={(e)=>setItemInput({...itemInput,bagType:e.target.value})} className="border px-2 py-1"><option>Ata</option><option>Maida</option><option>Suji</option><option>Fine</option></select>
        <select value={itemInput.weight} onChange={(e)=>setItemInput({...itemInput,weight:Number(e.target.value)})} className="border px-2 py-1">{BAG_WEIGHTS.map(w=><option key={w}>{w}</option>)}</select>
        <input type="number" placeholder="Qty" value={itemInput.quantity} onChange={(e)=>setItemInput({...itemInput,quantity:e.target.value})} className="border px-2 py-1"/>
        <input type="number" placeholder="Price" value={itemInput.pricePerBag} onChange={(e)=>setItemInput({...itemInput,pricePerBag:e.target.value})} className="border px-2 py-1"/>
        <button onClick={addItem} className="!bg-green-600 text-white px-2 py-1 rounded">Add</button>
      </div>
      {items.length > 0 && (
        <table className="w-full mb-4 text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-left">Wt (kg)</th>
              <th className="px-4 py-2 text-left">Qty</th>
              <th className="px-4 py-2 text-left">Price</th>
              <th className="px-4 py-2 text-left">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((it, i) => (
              <tr key={i}>
                <td className="px-4 py-2">{i + 1}</td>
                <td className="px-4 py-2 capitalize">{it.bagType}</td>
                <td className="px-4 py-2">{it.weight}</td>
                <td className="px-4 py-2">{it.quantity}</td>
                <td className="px-4 py-2">{it.pricePerBag}</td>
                <td className="px-4 py-2">{(it.quantity * it.pricePerBag).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="text-right font-semibold mb-4">Total: Rs. {totalPrice.toFixed(2)} | Remaining: Rs. {remainingAmount.toFixed(2)}</div>

      <div className="flex gap-3 justify-end mt-6">
        <button type="button" onClick={()=>handleSave(false)} disabled={loading} className="flex items-center px-4 py-2 !bg-blue-600 text-white rounded hover:!bg-blue-700"><FaSave className="mr-2"/>{loading?"Saving...":"Save"}</button>
        <button type="button" onClick={handlePrint} className="flex items-center px-4 py-2 !bg-gray-600 text-white rounded hover:!bg-gray-700"><FaPrint className="mr-2"/>Print Invoice</button>
        <button type="button" onClick={()=>handleSave(true)} disabled={loading} className="flex items-center px-4 py-2 !bg-green-600 text-white rounded hover:!bg-green-700"><FaPrint className="mr-2"/>{loading?"Saving...":"Print & Save"}</button>
      </div>
    </div>
  );
} 