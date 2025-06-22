import Bag from "../model/Bag.js";

// GET /api/bags
export const getAllBags = async (req, res) => {
  try {
    const bags = await Bag.find().sort({ createdAt: -1 });
    res.status(200).json(bags);
  } catch (err) {
    console.error("Get Bags Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/bags (admin only for now)
export const createBag = async (req, res) => {
  try {
    const bag = new Bag({ ...req.body, createdBy: req.user?._id });
    await bag.save();
    res.status(201).json({ message: "Bag created", bag });
  } catch (err) {
    console.error("Create Bag Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/bags/:id
export const updateBag = async (req, res) => {
  try {
    const bag = await Bag.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bag) return res.status(404).json({ message: "Bag not found" });
    res.status(200).json({ message: "Bag updated", bag });
  } catch (err) {
    console.error("Update Bag Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/bags/:id
export const deleteBag = async (req, res) => {
  try {
    const bag = await Bag.findByIdAndDelete(req.params.id);
    if (!bag) return res.status(404).json({ message: "Bag not found" });
    res.status(200).json({ message: "Bag deleted" });
  } catch (err) {
    console.error("Delete Bag Error:", err);
    res.status(500).json({ message: "Server error" });
  }
}; 