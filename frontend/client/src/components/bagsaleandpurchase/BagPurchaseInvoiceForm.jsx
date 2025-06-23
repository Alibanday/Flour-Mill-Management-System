import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaWallet, FaTimes, FaSave, FaPrint, FaCreditCard, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

export default function BagPurchaseInvoiceForm({ onInvoiceCreated, onCancel }) {
  const [form, setForm] = useState({
    supplierAccount: "",
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
  const [itemInput, setItemInput] = useState({ itemName: "", weight: "", quantity: "", price: "" });
  const [itemNames, setItemNames] = useState([]);
  const [itemWeights, setItemWeights] = useState([]);
  const [itemCategory, setItemCategory] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [creditInfo, setCreditInfo] = useState({ creditLimit: 0, outstanding: 0, available: 0 });
  const [creditLoading, setCreditLoading] = useState(false);

  const totalPrice = items.reduce((sum, it) => sum + it.quantity * it.price, 0);
  const remainingAmount = Math.max(totalPrice - (parseFloat(form.initialPayment) || 0), 0);
  const invoiceNumber = `${Date.now()}`;

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token");
        const accRes = await axios.get("http://localhost:8000/api/accounts", { headers: { Authorization: `Bearer ${token}` }, params: { type: "payable" } });
        setAccounts(accRes.data);
        const whRes = await axios.get("http://localhost:8000/api/warehouse/active", { headers: { Authorization: `Bearer ${token}` } });
        setWarehouses(whRes.data);
        const allItemsRes = await axios.get("http://localhost:8000/api/items", { headers: { Authorization: `Bearer ${token}` } });
        setAllItems(allItemsRes.data.items || []);
        const bagItemNames = [...new Set((allItemsRes.data.items || []).filter(i => i.category === 'bags').map(i => i.name))];
        setItemNames(bagItemNames);
      } catch {}
    };
    fetch();
  }, []);

  // Fetch credit info when supplier changes
  useEffect(() => {
    const fetchCreditInfo = async () => {
      if (!form.supplierAccount) {
        setCreditInfo({ creditLimit: 0, outstanding: 0, available: 0 });
        return;
      }
      setCreditLoading(true);
      try {
        const token = localStorage.getItem("token");
        const accRes = await axios.get(`http://localhost:8000/api/accounts/${form.supplierAccount}`, { headers: { Authorization: `Bearer ${token}` } });
        const creditLimit = accRes.data.creditLimit || 0;
        const invRes = await axios.get(`http://localhost:8000/api/invoice/account/${form.supplierAccount}`, { headers: { Authorization: `Bearer ${token}` } });
        const invoices = invRes.data.invoices || [];
        const outstanding = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue').reduce((sum, inv) => sum + (inv.remainingAmount || 0), 0);
        const available = Math.max(creditLimit - outstanding, 0);
        setCreditInfo({ creditLimit, outstanding, available });
      } catch {
        setCreditInfo({ creditLimit: 0, outstanding: 0, available: 0 });
      } finally {
        setCreditLoading(false);
      }
    };
    fetchCreditInfo();
  }, [form.supplierAccount]);

  // Fetch weights and category when itemName changes
  useEffect(() => {
    if (!itemInput.itemName) {
      setItemWeights([]);
      setItemCategory("");
      setItemInput((prev) => ({ ...prev, weight: "", price: "" }));
      return;
    }
    const fetchWeights = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8000/api/items/weights/${encodeURIComponent(itemInput.itemName)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.category !== 'bags') {
          setItemWeights([]);
          setItemCategory("");
          setItemInput((prev) => ({ ...prev, weight: "", price: "" }));
          return;
        }
        setItemWeights(res.data.weights || []);
        setItemCategory(res.data.category);
        setItemInput((prev) => ({ ...prev, weight: "", price: "" }));
      } catch {
        setItemWeights([]);
        setItemCategory("");
        setItemInput((prev) => ({ ...prev, weight: "", price: "" }));
      }
    };
    fetchWeights();
  }, [itemInput.itemName]);

  // Fetch price when itemName or weight changes
  useEffect(() => {
    if (!itemInput.itemName || itemCategory !== "bags" || !itemInput.weight) return;
    const fetchPrice = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8000/api/items/price/${encodeURIComponent(itemInput.itemName)}/${itemInput.weight}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setItemInput((prev) => ({ ...prev, price: res.data.price }));
      } catch {
        setItemInput((prev) => ({ ...prev, price: "" }));
      }
    };
    fetchPrice();
  }, [itemInput.itemName, itemInput.weight, itemCategory]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addItem = () => {
    if (!itemInput.itemName || (itemCategory === "bags" && !itemInput.weight) || !itemInput.quantity || !itemInput.price) {
      setError("Fill item fields");
      return;
    }
    setItems([
      ...items,
      {
        itemName: itemInput.itemName,
        weight: itemCategory === "bags" ? itemInput.weight : undefined,
        quantity: parseFloat(itemInput.quantity),
        price: parseFloat(itemInput.price),
        category: itemCategory
      }
    ]);
    setItemInput({ itemName: "", weight: "", quantity: "", price: "" });
    setItemCategory("");
    setItemWeights([]);
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
    const supp = accounts.find(a => a._id === form.supplierAccount);
    return (
      <div className="p-8 text-sm">
        <h1 className="text-2xl font-bold text-center mb-4">Bag Purchase Invoice</h1>
        <div className="flex justify-between mb-4">
          <div>
            <p><span className="font-semibold">Invoice #:</span> {invoiceNumber}</p>
            <p><span className="font-semibold">Date:</span> {form.date.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-semibold">Supplier:</p>
            {supp ? <p>{supp.accountName}</p> : <p>{form.supplierAccount}</p>}
          </div>
        </div>
        <table className="w-full border-collapse mb-4">
          <thead><tr><th className="border px-2 py-1">#</th><th className="border px-2 py-1">Item</th><th className="border px-2 py-1">W</th><th className="border px-2 py-1">Qty</th><th className="border px-2 py-1">Price</th><th className="border px-2 py-1">Amount</th></tr></thead>
          <tbody>
            {items.map((it,i)=>(
              <tr key={i}><td className="border px-2 py-1">{i+1}</td><td className="border px-2 py-1">{it.itemName}</td><td className="border px-2 py-1">{it.weight || "-"}</td><td className="border px-2 py-1">{it.quantity}</td><td className="border px-2 py-1">{it.price}</td><td className="border px-2 py-1">{(it.quantity*it.price).toFixed(2)}</td></tr>
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
    if (!form.supplierAccount || !form.warehouse || items.length === 0) return setError("Missing fields");
    if ((creditInfo.outstanding + remainingAmount) > creditInfo.creditLimit) {
      setError(`Credit limit exceeded! Outstanding: Rs. ${creditInfo.outstanding}, New Remaining: Rs. ${remainingAmount}, Credit Limit: Rs. ${creditInfo.creditLimit}`);
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = {
        seller: form.supplierAccount,
        warehouse: form.warehouse,
        paymentMethod: form.paymentMethod,
        initialPayment: parseFloat(form.initialPayment) || 0,
        totalAmount: totalPrice,
        remainingAmount,
        items,
        type: "bag",
        date: form.date,
        status: "pending",
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
        <h2 className="text-2xl font-bold text-gray-800 flex items-center"><FaWallet className="mr-2" /> Bag Purchase Invoice</h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700"><FaTimes className="text-xl" /></button>
      </div>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      
      {/* Top Row: Date & Warehouse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date *</label>
          <DatePicker selected={form.date} onChange={(d)=>setForm({...form,date:d})} className="w-full px-2 py-2 border border-gray-300 rounded-md" />
        </div>
        <div className="hidden md:block"></div>
        <div className="md:col-start-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Add to Warehouse *</label>
          <select name="warehouse" value={form.warehouse} onChange={handleChange} className="w-full px-2 py-2 border border-gray-300 rounded-md" required>
            <option value="">Select Warehouse</option>
            {warehouses.map(w=><option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {/* Supplier & Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 border p-4 rounded-lg mt-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Account *</label>
          <select name="supplierAccount" value={form.supplierAccount} onChange={handleChange} className="w-full px-2 py-2 border border-gray-300 rounded-md" required>
            <option value="">Select</option>
            {accounts.map(a=><option key={a._id} value={a._id}>{a.accountName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="w-full px-2 py-2 border border-gray-300 rounded-md">
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>
        </div>
      </div>

      {/* Credit Info Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 mt-4">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center">
          <FaCreditCard className="text-blue-600 text-2xl mr-3" />
          <div>
            <div className="text-xs text-gray-500 uppercase">Credit Limit</div>
            <div className="text-lg font-bold text-blue-700">Rs. {creditLoading ? '...' : creditInfo.creditLimit.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center">
          <FaExclamationTriangle className="text-orange-500 text-2xl mr-3" />
          <div>
            <div className="text-xs text-gray-500 uppercase">Outstanding</div>
            <div className="text-lg font-bold text-orange-600">Rs. {creditLoading ? '...' : creditInfo.outstanding.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center">
          <FaCheckCircle className={`text-2xl mr-3 ${creditInfo.available > 0 ? 'text-green-600' : 'text-red-600'}`} />
          <div>
            <div className="text-xs text-gray-500 uppercase">Available Credit</div>
            <div className={`text-lg font-bold ${creditInfo.available > 0 ? 'text-green-700' : 'text-red-700'}`}>Rs. {creditLoading ? '...' : creditInfo.available.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Add Items</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
        <select value={itemInput.itemName} onChange={e=>setItemInput({...itemInput, itemName: e.target.value})} className="border px-2 py-1">
          <option value="">Select Item</option>
          {itemNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        {itemCategory === "bags" ? (
          <select value={itemInput.weight} onChange={e=>setItemInput({...itemInput, weight: e.target.value})} className="border px-2 py-1">
            <option value="">Select Weight</option>
            {itemWeights.map(w => <option key={w} value={w}>{w} kg</option>)}
          </select>
        ) : (
          <input type="text" value={"-"} disabled className="border px-2 py-1 bg-gray-100" />
        )}
        <input type="number" placeholder="Qty" value={itemInput.quantity} onChange={e=>setItemInput({...itemInput, quantity: e.target.value})} className="border px-2 py-1"/>
        <input type="number" placeholder="Price" value={itemInput.price} onChange={e=>setItemInput({...itemInput, price: e.target.value})} className="border px-2 py-1" disabled />
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
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((it, i) => (
              <tr key={i}>
                <td className="px-4 py-2">{i + 1}</td>
                <td className="px-4 py-2 capitalize">{it.itemName}</td>
                <td className="px-4 py-2">{it.weight || "-"}</td>
                <td className="px-4 py-2">{it.quantity}</td>
                <td className="px-4 py-2">{it.price}</td>
                <td className="px-4 py-2">{(it.quantity * it.price).toFixed(2)}</td>
                <td className="px-4 py-2">
                  <button onClick={() => removeItem(i)} className="text-red-600 hover:text-red-800">
                    <FaTimes />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex justify-end mt-4">
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Initial Payment (Rs.)</label>
          <input type="number" name="initialPayment" value={form.initialPayment} onChange={handleChange} className="w-full px-2 py-2 border border-gray-300 rounded-md" min="0" step="0.01" />
        </div>
      </div>

      <div className="text-right font-semibold mb-4">Total: Rs. {totalPrice.toFixed(2)} | Remaining: Rs. {remainingAmount.toFixed(2)}</div>

      <div className="flex gap-3 justify-end mt-6">
        <button type="button" onClick={()=>handleSave(false)} disabled={loading} className="flex items-center px-4 py-2 !bg-blue-600 text-white rounded hover:!bg-blue-700"><FaSave className="mr-2"/>{loading?"Saving...":"Save"}</button>
        <button type="button" onClick={handlePrint} className="flex items-center px-4 py-2 !bg-gray-600 text-white rounded hover:!bg-gray-700"><FaPrint className="mr-2"/>Print Invoice</button>
        <button type="button" onClick={()=>handleSave(true)} disabled={loading} className="flex items-center px-4 py-2 !bg-green-600 text-white rounded hover:!bg-green-700"><FaPrint className="mr-2"/>{loading?"Saving...":"Print & Save"}</button>
      </div>
    </div>
  );
} 