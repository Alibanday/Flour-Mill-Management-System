import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";

const formatDate = (d)=>new Date(d).toLocaleDateString();

const FoodArrivalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice,setInvoice]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const fetch = async ()=>{
      try{
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8000/api/invoice/${id}`,{headers:{Authorization:`Bearer ${token}`}});
        setInvoice(res.data);
      }catch(e){console.error(e);}finally{setLoading(false);}
    };
    fetch();
  },[id]);

  if(loading) return <p className="p-8">Loading...</p>;
  if(!invoice) return <p className="p-8">Invoice not found</p>;

  return (
    <div className="p-6">
      <button onClick={()=>navigate(-1)} className="flex items-center mb-4 text-blue-600 hover:underline"><FaArrowLeft className="mr-1"/>Back</button>
      <h2 className="text-2xl font-semibold mb-4">Arrival Entry Detail</h2>
      <div className="bg-white rounded shadow p-4 mb-6">
        <p><span className="font-semibold">Invoice #:</span> {invoice._id}</p>
        <p><span className="font-semibold">Date:</span> {formatDate(invoice.date)}</p>
        <p><span className="font-semibold">PR Center:</span> {invoice.prCenter?.name}</p>
        <p><span className="font-semibold">Wheat Quantity:</span> {invoice.wheatQuantity} kg</p>
        <p><span className="font-semibold">Total Amount:</span> Rs. {invoice.totalAmount}</p>
        <p><span className="font-semibold">Status:</span> {invoice.status}</p>
      </div>
    </div>
  );
};

export default FoodArrivalDetail; 