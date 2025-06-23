import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaSearch } from "react-icons/fa";
import BagsPurchaseInvoiceForm from "./BagsPurchaseInvoiceForm";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const BagPurchaseInvoice = ({ onCancel }) => {
  const [showForm, setShowForm] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // Replace type value with appropriate one once backend is ready
      const res = await axios.get("http://localhost:8000/api/invoice", {
        params: { search: searchTerm, type: "bag" },
      });
      setInvoices(res?.data?.invoices || []);
    } catch (error) {
      console.error("Failed to fetch bag invoices:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [searchTerm]);

  if (showForm) {
    return (
      <BagsPurchaseInvoiceForm
        onInvoiceCreated={(newInv) => {
          setShowForm(false);
          if (newInv) setInvoices((prev) => [newInv, ...prev]);
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Bag Purchase Invoices</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 !bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FaPlus className="mr-2" /> Create Invoice
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-end mb-4">
        <div className="relative w-full max-w-xs">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bag Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : invoices.length > 0 ? (
              invoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-blue-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{invoice._id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.wheatQuantity || invoice.bagQuantity} units @ Rs. {invoice.ratePerKg || invoice.ratePerBag}/unit
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Rs. {invoice.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cancel button if provided */}
      {onCancel && (
        <div className="mt-6 text-right">
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={onCancel}
          >
            Back to Bags
          </button>
        </div>
      )}
    </div>
  );
};

export default BagPurchaseInvoice;