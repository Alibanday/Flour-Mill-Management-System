import React, { useState, useEffect, useMemo } from "react";

export default function Warehouse() {
  const initial = [
    {
      id: 1,
      sku: "WH-1001",
      name: "Boxed Bolts",
      location: "A1",
      quantity: 120,
      price: 0.5,
      minStock: 20,
    },
    {
      id: 2,
      sku: "WH-2002",
      name: "Packing Tape",
      location: "B2",
      quantity: 30,
      price: 1.2,
      minStock: 10,
    },
    {
      id: 3,
      sku: "WH-3003",
      name: "Bubble Wrap",
      location: "C1",
      quantity: 8,
      price: 2.5,
      minStock: 15,
    },
  ];

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("warehouse_items");
      return saved ? JSON.parse(saved) : initial;
    } catch {
      return initial;
    }
  });

  const [form, setForm] = useState({
    sku: "",
    name: "",
    location: "",
    quantity: "",
    price: "",
    minStock: "",
  });
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState("All");

  useEffect(() => {
    localStorage.setItem("warehouse_items", JSON.stringify(items));
  }, [items]);

  const locations = useMemo(() => {
    const set = new Set(items.map((i) => i.location));
    return ["All", ...Array.from(set)];
  }, [items]);

  const resetForm = () =>
    setForm({ sku: "", name: "", location: "", quantity: "", price: "", minStock: "" });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addItem = () => {
    if (!form.sku || !form.name || !form.location) return;
    const newItem = {
      id: Date.now(),
      sku: form.sku.trim(),
      name: form.name.trim(),
      location: form.location.trim(),
      quantity: parseInt(form.quantity) || 0,
      price: parseFloat(form.price) || 0,
      minStock: parseInt(form.minStock) || 0,
    };
    setItems((prev) => [newItem, ...prev]);
    resetForm();
  };

  const startEdit = (id) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    setForm({
      sku: it.sku,
      name: it.name,
      location: it.location,
      quantity: String(it.quantity),
      price: String(it.price),
      minStock: String(it.minStock),
    });
    setEditId(id);
  };

  const updateItem = () => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === editId
          ? {
              ...i,
              sku: form.sku.trim(),
              name: form.name.trim(),
              location: form.location.trim(),
              quantity: parseInt(form.quantity) || 0,
              price: parseFloat(form.price) || 0,
              minStock: parseInt(form.minStock) || 0,
            }
          : i
      )
    );
    setEditId(null);
    resetForm();
  };

  const deleteItem = (id) => {
    if (!window.confirm("Delete this item?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const receive = (id, qty = 1) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + qty } : i)));

  const ship = (id, qty = 1) =>
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(0, i.quantity - qty) } : i
      )
    );

  const transfer = (id, toLocation) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, location: toLocation } : i)));

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const bySearch =
        search.trim() === "" ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.sku.toLowerCase().includes(search.toLowerCase());
      const byLocation = filterLocation === "All" || i.location === filterLocation;
      return bySearch && byLocation;
    });
  }, [items, search, filterLocation]);

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const totalValue = items.reduce((s, i) => s + i.quantity * i.price, 0);

  return (
    <div style={{ fontFamily: "Arial", padding: 20 }}>
      <h1>🏭 Warehouse Manager</h1>

      <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          name="sku"
          placeholder="SKU"
          value={form.sku}
          onChange={handleChange}
        />
        <input
          name="name"
          placeholder="Item name"
          value={form.name}
          onChange={handleChange}
        />
        <input
          name="location"
          placeholder="Location (e.g., A1)"
          value={form.location}
          onChange={handleChange}
        />
        <input
          name="quantity"
          placeholder="Quantity"
          type="number"
          value={form.quantity}
          onChange={handleChange}
        />
        <input
          name="price"
          placeholder="Unit price"
          type="number"
          step="0.01"
          value={form.price}
          onChange={handleChange}
        />
        <input
          name="minStock"
          placeholder="Min stock"
          type="number"
          value={form.minStock}
          onChange={handleChange}
        />
        {editId ? (
          <button onClick={updateItem}>Update</button>
        ) : (
          <button onClick={addItem}>Add Item</button>
        )}
        <button onClick={() => { resetForm(); setEditId(null); }}>Clear</button>
      </div>

      <div style={{ marginBottom: 12, disp
