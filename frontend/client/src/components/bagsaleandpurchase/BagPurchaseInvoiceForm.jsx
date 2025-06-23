import React from "react";

export default function BagPurchaseInvoiceForm({ onInvoiceCreated, onCancel }) {
  return (
    <div className="p-6 bg-white rounded shadow max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4">Bag Purchase Invoice Form (Coming Soon)</h2>
      <button onClick={onCancel} className="px-4 py-2 bg-blue-600 text-white rounded">Close</button>
    </div>
  );
} 