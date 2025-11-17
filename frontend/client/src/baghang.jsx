import React, { useState, useMemo } from "react";

export default function BagInventory() {
  const [bags, setBags] = useState([
    { id: 1, name: "Leather Bag", quantity: 10, price: 120 },
    { id: 2, name: "Travel Backpack", quantity: 5, price: 80 },
    { id: 3, name: "Canvas Tote", quantity: 8, price: 45 },
  ]);

  const [newBag, setNewBag] = useState("");
  const [price, setPrice] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");

  const addBag = () => {
    if (newBag.trim() && price) {
      setBags([
        ...bags,
        {
          id: Date.now(),
          name: newBag.trim(),
          quantity: 1,
          price: parseFloat(price),
        },
      ]);
      setNewBag("");
      setPrice("");
    }
  };

  const increaseQty = (id) =>
    setBags(
      bags.map((b) =>
        b.id === id ? { ...b, quantity: b.quantity + 1 } : b
      )
    );

  const decreaseQty = (id) =>
    setBags(
      bags.map((b) =>
        b.id === id && b.quantity > 1
          ? { ...b, quantity: b.quantity - 1 }
          : b
      )
    );

  const deleteBag = (id) => setBags(bags.filter((b) => b.id !== id));

  const totalItems = useMemo(
    () => bags.reduce((sum, b) => sum + b.quantity, 0),
    [bags]
  );

  const totalValue = useMemo(
    () => bags.reduce((sum, b) => sum + b.price * b.quantity, 0),
    [bags]
  );

  const filteredBags = useMemo(() => {
    const filtered = bags.filter((b) =>
      b.name.toLowerCase().includes(search.toLowerCase())
    );
    if (sort === "name") return filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price") return filtered.sort((a, b) => a.price - b.price);
    if (sort === "quantity") return filtered.sort((a, b) => b.quantity - a.quantity);
    return filtered;
  }, [bags, search, sort]);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>👜 Bag Store Inventory System</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          value={newBag}
          onChange={(e) => setNewBag(e.target.value)}
          placeholder="Enter bag name"
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Enter price"
          type="number"
          min="1"
        />
        <button onClick={addBag}>Add Bag</button>
      </div>

      <div style={{ marginBottom: 15 }}>
        <input
          placeholder="Search bag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name">Sort by Name</option>
          <option value="price">Sort by Price</option>
          <option value="quantity">Sort by Quantity</option>
        </select>
      </div>

      <h3>
        Total Items: {totalItems} | Unique Bags: {bags.length} | Inventory Value: $
        {totalValue.toFixed(2)}
      </h3>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {filteredBags.map((bag) => (
          <div
            key={bag.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 10,
              padding: 15,
              width: 200,
              background: "#f9f9f9",
            }}
          >
            <h4>{bag.name}</h4>
            <p>Price: ${bag.price}</p>
            <p>Quantity: {bag.quantity}</p>
            <div>
              <button onClick={() => increaseQty(bag.id)}>+</button>
              <button onClick={() => decreaseQty(bag.id)}>-</button>
              <button onClick={() => deleteBag(bag.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
