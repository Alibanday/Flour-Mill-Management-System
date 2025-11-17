import React, { useState } from "react";

export default function BagInventory() {
  const [bags, setBags] = useState([
    { id: 1, name: "Travel Backpack", quantity: 14, price: 4500, category: "Backpack" },
    { id: 2, name: "Leather Handbag", quantity: 3, price: 3200, category: "Handbag" },
  ]);

  const [newBag, setNewBag] = useState({
    name: "",
    quantity: "",
    price: "",
    category: ""
  });

  const [editingBag, setEditingBag] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("");

  // Add Bag
  const addBag = () => {
    if (!newBag.name || !newBag.quantity || !newBag.price) return alert("All fields are required!");
    const bag = {
      id: Date.now(),
      ...newBag,
      quantity: Number(newBag.quantity),
      price: Number(newBag.price),
    };
    setBags([...bags, bag]);
    setNewBag({ name: "", quantity: "", price: "", category: "" });
  };

  // Delete Bag
  const deleteBag = (id) => {
    setBags(bags.filter((bag) => bag.id !== id));
  };

  // Edit bag
  const startEdit = (bag) => {
    setEditingBag(bag);
  };

  const saveEdit = () => {
    setBags(bags.map((b) => (b.id === editingBag.id ? editingBag : b)));
    setEditingBag(null);
  };

  // Search + Filter
  const filteredBags = bags
    .filter((bag) => bag.name.toLowerCase().includes(search.toLowerCase()))
    .filter((bag) => (filterCategory === "All" ? true : bag.category === filterCategory))
    .sort((a, b) => {
      if (sortBy === "price") return a.price - b.price;
      if (sortBy === "quantity") return a.quantity - b.quantity;
      return 0;
    });

  // Total inventory value
  const totalValue = bags.reduce((sum, bag) => sum + bag.price * bag.quantity, 0);

  return (
    <div style={{ padding: "20px" }}>
      <h2>👜 Bag Inventory Management</h2>

      <p><b>Total Inventory Value:</b> Rs {totalValue}</p>

      {/* Search */}
      <input
        type="text"
        placeholder="Search bags..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: 8, marginRight: 10 }}
      />

      {/* Category Filter */}
      <select onChange={(e) => setFilterCategory(e.target.value)}>
        <option>All</option>
        <option>Backpack</option>
        <option>Handbag</option>
        <option>Shoulder Bag</option>
      </select>

      {/* Sorting */}
      <select onChange={(e) => setSortBy(e.target.value)} style={{ marginLeft: 10 }}>
        <option value="">Sort By</option>
        <option value="price">Price</option>
        <option value="quantity">Quantity</option>
      </select>

      <hr />

      {/* Add Bag Form */}
      <div>
        <h3>Add New Bag</h3>
        <input type="text" placeholder="Bag Name"
          value={newBag.name}
          onChange={(e) => setNewBag({ ...newBag, name: e.target.value })} />

        <input type="number" placeholder="Quantity"
          value={newBag.quantity}
          onChange={(e) => setNewBag({ ...newBag, quantity: e.target.value })} />

        <input type="number" placeholder="Price"
          value={newBag.price}
          onChange={(e) => setNewBag({ ...newBag, price: e.target.value })} />

        <input type="text" placeholder="Category"
          value={newBag.category}
          onChange={(e) => setNewBag({ ...newBag, category: e.target.value })} />

        <button onClick={addBag}>Add Bag</button>
      </div>

      <hr />

      {/* Bag List */}
      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>Name</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Category</th>
            <th>Status</th>
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
                {bag.quantity < 5 ? (
                  <span style={{ color: "red" }}>Low Stock</span>
                ) : (
                  <span>OK</span>
                )}
              </td>

              <td>
                <button onClick={() => startEdit(bag)}>Edit</button>
                <button onClick={() => deleteBag(bag.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editingBag && (
        <div style={{ marginTop: 20 }}>
          <h3>Edit Bag</h3>
          <input
            value={editingBag.name}
            onChange={(e) => setEditingBag({ ...editingBag, name: e.target.value })}
          />
          <input
            value={editingBag.quantity}
            onChange={(e) => setEditingBag({ ...editingBag, quantity: e.target.value })}
          />
          <input
            value={editingBag.price}
            onChange={(e) => setEditingBag({ ...editingBag, price: e.target.value })}
          />
          <button onClick={saveEdit}>Save</button>
        </div>
      )}
    </div>
  );
}
