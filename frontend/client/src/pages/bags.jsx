import React, { useState } from "react";

export default function BagInventory() {
  const [bags, setBags] = useState([
    { id: 1, name: "Travel Backpack", quantity: 14, price: 4500, category: "Backpack" },
    { id: 2, name: "Hand Bag", quantity: 8, price: 3200, category: "Handbag" },
  ]);

  const [newBag, setNewBag] = useState({
    name: "",
    quantity: "",
    price: "",
    category: ""
  });

  const [search, setSearch] = useState("");

  // Add Bag
  const addBag = () => {
    if (!newBag.name || !newBag.quantity || !newBag.price) {
      alert("All fields are required!");
      return;
    }
    const bag = {
      id: Date.now(),
      ...newBag,
      quantity: Number(newBag.quantity),
      price: Number(newBag.price)
    };
    setBags([...bags, bag]);
    setNewBag({ name: "", quantity: "", price: "", category: "" });
  };

  // Delete Bag
  const deleteBag = (id) => {
    setBags(bags.filter((bag) => bag.id !== id));
  };

  // Search Filter
  const filteredBags = bags.filter((bag) =>
    bag.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>👜 Bag Inventory Management</h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search bags..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: 8, marginBottom: 20 }}
      />

      {/* Add Bag Form */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Bag Name"
          value={newBag.name}
          onChange={(e) => setNewBag({ ...newBag, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Quantity"
          value={newBag.quantity}
          onChange={(e) => setNewBag({ ...newBag, quantity: e.target.value })}
        />
        <input
          type="number"
          placeholder="Price"
          value={newBag.price}
          onChange={(e) => setNewBag({ ...newBag, price: e.target.value })}
        />
        <input
          type="text"
          placeholder="Category"
          value={newBag.category}
          onChange={(e) => setNewBag({ ...newBag, category: e.target.value })}
        />
        <button onClick={addBag}>Add Bag</button>
      </div>

      {/* Bag List */}
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Category</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredBags.map((bag) => (
            <tr key={bag.id}>
              <td>{bag.name}</td>
              <td>{bag.quantity}</td>
              <td>{bag.price}</td>
              <td>{bag.category}</td>
              <td>
                <button onClick={() => deleteBag(bag.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
