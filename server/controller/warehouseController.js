import Warehouse from "../model/wareHouse.js";

// Add new warehouse (Admin only)
export const addWarehouse = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can add warehouses" });
    }

    const { warehouseNumber, name, location, status, description, manager } = req.body;

    const newWarehouse = new Warehouse({
      warehouseNumber,
      name,
      location,
      status,
      description,
      manager,
    });

    await newWarehouse.save();

    res.status(201).json({ message: "Warehouse added successfully", warehouse: newWarehouse });
  } catch (error) {
    console.error("Warehouse creation error:", error);
    res.status(500).json({ message: "Error adding warehouse", error: error.message });
  }
};

// ✅ Get all warehouses with search + pagination (All users)
export const getAllWarehouses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      warehouseNumber,
      name,
      location,
      status
    } = req.query;

    const filter = {};
    if (warehouseNumber) filter.warehouseNumber = { $regex: warehouseNumber, $options: "i" };
    if (name) filter.name = { $regex: name, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [warehouses, total] = await Promise.all([
      Warehouse.find(filter).populate('manager', 'firstName lastName email').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Warehouse.countDocuments(filter)
    ]);

    res.status(200).json({
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      warehouses
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving warehouses", error });
  }
};

// Get a single warehouse by ID (All users)
export const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id).populate('manager', 'firstName lastName email');
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    res.status(200).json(warehouse);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving warehouse", error });
  }
};

// Update a warehouse by ID (Admin only)
export const updateWarehouse = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can update warehouses" });
    }

    const { warehouseNumber, name, location, status, description, manager } = req.body;

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { warehouseNumber, name, location, status, description, manager },
      { new: true }
    );

    if (!updatedWarehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res.status(200).json({ message: "Warehouse updated successfully", warehouse: updatedWarehouse });
  } catch (error) {
    res.status(500).json({ message: "Error updating warehouse", error });
  }
};

// Delete a warehouse by ID (Admin only)
export const deleteWarehouse = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can delete warehouses" });
    }

    const deletedWarehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!deletedWarehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    res.status(200).json({ message: "Warehouse deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting warehouse", error });
  }
};

// Search warehouses (All users) – still usable separately if needed
export const searchWarehouses = async (req, res) => {
  try {
    const { warehouseNumber, name, location, status } = req.query;

    const filter = {};
    if (warehouseNumber) filter.warehouseNumber = { $regex: warehouseNumber, $options: "i" };
    if (name) filter.name = { $regex: name, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };
    if (status) filter.status = status;

    const warehouses = await Warehouse.find(filter);

    res.status(200).json(warehouses);
  } catch (error) {
    res.status(500).json({ message: "Error searching warehouses", error });
  }
};

// Get only active warehouses (All users)
export const getActiveWarehouses = async (req, res) => {
  try {
    const activeWarehouses = await Warehouse.find({ status: "Active" }).populate('manager', 'firstName lastName email');
    res.status(200).json(activeWarehouses);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving active warehouses", error });
  }
};
