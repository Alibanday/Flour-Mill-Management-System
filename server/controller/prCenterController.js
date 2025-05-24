import PrCenter from "../model/PrCenter.js";

// Create
export const createPrCenter = async (req, res) => {
  try {
    const { name, location, contact } = req.body;
    if (!name || !location || !contact) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const prCenter = await PrCenter.create({ name, location, contact });
    res.status(201).json({ message: "PR Center created", prCenter });
  } catch (error) {
    console.error("Create PR Center error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get All
export const getAllPrCenters = async (req, res) => {
  try {
    const prCenters = await PrCenter.find();
    res.status(200).json(prCenters);
  } catch (error) {
    console.error("Get all PR Centers error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get One
export const getPrCenterById = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === "all") {
      const prCenters = await PrCenter.find();
      return res.status(200).json(prCenters);
    }

    const prCenter = await PrCenter.findById(id);
    if (!prCenter) return res.status(404).json({ message: "PR Center not found" });

    res.status(200).json(prCenter);
  } catch (error) {
    console.error("Get PR Center by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update
export const updatePrCenter = async (req, res) => {
  try {
    const { name, location, contact } = req.body;
    const prCenter = await PrCenter.findById(req.params.id);
    if (!prCenter) return res.status(404).json({ message: "PR Center not found" });

    prCenter.name = name || prCenter.name;
    prCenter.location = location || prCenter.location;
    prCenter.contact = contact || prCenter.contact;

    await prCenter.save();
    res.status(200).json({ message: "PR Center updated", prCenter });
  } catch (error) {
    console.error("Update PR Center error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete
export const deletePrCenter = async (req, res) => {
  try {
    const prCenter = await PrCenter.findByIdAndDelete(req.params.id);
    if (!prCenter) return res.status(404).json({ message: "PR Center not found" });

    res.status(200).json({ message: "PR Center deleted successfully" });
  } catch (error) {
    console.error("Delete PR Center error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


