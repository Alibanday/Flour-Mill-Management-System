// components/AccountsPage.jsx or pages/AccountsPage.jsx
import React from "react";

export default function AccountsPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="w-[800px] border border-white bg-[#003F3F] text-white p-6 rounded-md pointer-events-auto shadow-lg">
        <h2 className="text-xl mb-4 border-b pb-2 font-semibold">Account's Information</h2>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-1">Account Type:</label>
            <select className="w-full px-2 py-1 bg-white text-black rounded">
              <option>Cash</option>
              <option>Bank</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Search:</label>
            <input type="text" className="w-full px-2 py-1 bg-white text-black rounded" />
          </div>
          <div>
            <label className="block mb-1">Account ID:</label>
            <input type="text" value="10002" className="w-full px-2 py-1 bg-white text-black rounded" readOnly />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">Account Name:</label>
            <input type="text" className="w-full px-2 py-1 bg-white text-black rounded" />
          </div>
          <div>
            <label className="block mb-1">Account Name in Urdu:</label>
            <input type="text" className="w-full px-2 py-1 bg-white text-black rounded" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">Cell No:</label>
            <input type="text" className="w-full px-2 py-1 bg-white text-black rounded" />
          </div>
          <div>
            <label className="block mb-1">Credit Limit:</label>
            <input type="text" className="w-full px-2 py-1 bg-white text-black rounded" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1">Address:</label>
          <textarea className="w-full px-2 py-1 bg-white text-black rounded" rows="3" />
        </div>

        <h3 className="text-lg mb-2 border-b pb-1">Sub Account Type Information</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">Sub Account Type:</label>
            <select className="w-full px-2 py-1 bg-white text-black rounded">
              <option>Select Type</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 invisible">Hidden Label</label>
            <select className="w-full px-2 py-1 bg-white text-black rounded">
              <option>Option 1</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-between mt-6">
          {["SAVE", "NEW", "UPDATE", "DELETE", "Accounts List", "EXIT"].map((btn, idx) => (
            <button key={idx} className="flex-1 bg-[#005F5F] hover:bg-[#007F7F] px-4 py-2 rounded text-white font-semibold">
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
