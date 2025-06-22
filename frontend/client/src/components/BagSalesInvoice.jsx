import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaSearch } from "react-icons/fa";
import BagSalesInvoiceForm from "./BagSalesInvoiceForm";

const formatDate = (d)=>new Date(d).toLocaleDateString();

export default function BagSalesInvoice({ onCancel }){
  const [showForm,setShowForm]=useState(false);
  const [invoices,setInvoices]=useState([]);
  const [loading,setLoading]=useState(false);
  const [search,setSearch]=useState("");

  const fetchInvoices=async()=>{
    try{
      setLoading(true);
      const res=await axios.get("http://localhost:8000/api/invoice",{params:{type:"bagsale",search}});
      setInvoices(res.data?.invoices||[]);
    }catch(err){console.error(err)}finally{setLoading(false)};
  };
  useEffect(()=>{fetchInvoices();},[search]);

  if(showForm) return <BagSalesInvoiceForm onInvoiceCreated={(inv)=>{setShowForm(false);if(inv)setInvoices([inv,...invoices]);}} onCancel={()=>setShowForm(false)}/>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Bag Sales Invoices</h2>
        <button onClick={()=>setShowForm(true)} className="flex items-center px-4 py-2 !bg-blue-600 text-white rounded hover:!bg-blue-700"><FaPlus className="mr-2"/>Create Invoice</button>
      </div>
      <div className="flex justify-end mb-4"><div className="relative w-full max-w-xs"><FaSearch className="absolute left-3 top-3 text-gray-400"/><input type="text" className="pl-8 pr-2 py-2 border rounded w-full" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
      <table className="min-w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">#</th><th className="px-4 py-2 text-left">Total</th><th className="px-4 py-2 text-left">Paid</th><th className="px-4 py-2 text-left">Date</th><th className="px-4 py-2 text-left">Status</th></tr></thead><tbody>{loading?<tr><td colSpan="5" className="text-center py-4">Loading...</td></tr>:invoices.length?invoices.map((inv,i)=><tr key={inv._id}><td className="px-4 py-2">{inv._id}</td><td className="px-4 py-2">Rs. {inv.totalAmount}</td><td className="px-4 py-2">Rs. {inv.initialPayment}</td><td className="px-4 py-2">{formatDate(inv.date)}</td><td className="px-4 py-2">{inv.status}</td></tr>):<tr><td colSpan="5" className="text-center py-4">No invoices</td></tr>}</tbody></table>
      {onCancel && <div className="mt-4 text-right"><button onClick={onCancel} className="text-blue-600 hover:underline">Back</button></div>}
    </div>
  )
} 