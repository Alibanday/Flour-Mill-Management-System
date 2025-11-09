import React, { useState } from "react";

export default function BagInventory() {
  const [bags, setBags] = useState([
    { id: 1, name: "Leather Bag", quantity: 10 },
    { id: 2, name: "Travel Backpack", quantity: 5 },
  ]);

  const [newBag, setNewBag] = useState("");

  const addBag = () => {
    if (newBag.trim()) {
      setBags([
        ...bags,
        { id: Date.now(), name: newBag, quantity: 1 },
      ]);
      setNewBag("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>👜 Bag Store Inventory</h2>
      <input
        value={newBag}
        onChange={(e) => setNewBag(e.target.value)}
        placeholder="Enter bag name"
      />
      <button onClick={addBag}>Add Bag</button>
      <ul>
        {bags.map((bag) => (
          <li key={bag.id}>
            {bag.name} — Qty: {bag.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}
