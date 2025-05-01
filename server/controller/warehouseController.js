import Warehouse from "../model/wareHouse.js";

// Add new warehouse
export const addWarehouse = async (req, res) => {
  try {
    const { warehouseNumber, name, location, status, description } = req.body;

    const newWarehouse = new Warehouse({
      warehouseNumber,
      name,
      location,
      status,
      description
    });

    await newWarehouse.save();

    res.status(201).json({ message: "Warehouse added successfully", warehouse: newWarehouse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding warehouse", error });
  }
};

// Get all warehouses
export const getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find();
    res.status(200).json(warehouses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving warehouses", error });
  }
};

// Get a single warehouse by ID
export const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    res.status(200).json(warehouse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving warehouse", error });
  }
};

// Update a warehouse by ID
export const updateWarehouse = async (req, res) => {
  try {
    const { warehouseNumber, name, location, status, description } = req.body;

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { warehouseNumber, name, location, status, description },
      { new: true }
    );

    if (!updatedWarehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    res.status(200).json({ message: "Warehouse updated successfully", warehouse: updatedWarehouse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating warehouse", error });
  }
};

// Delete a warehouse by ID
export const deleteWarehouse = async (req, res) => {
  try {
    const deletedWarehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!deletedWarehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    res.status(200).json({ message: "Warehouse deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting warehouse", error });
  }
};

// Search warehouses by query parameters
export const searchWarehouses = async (req, res) => {
    try {
      const { warehouseNumber, name, location, status } = req.query;
  
      // Build query filter
      const filter = {};
  
      if (warehouseNumber) filter.warehouseNumber = { $regex: warehouseNumber, $options: "i" }; // Case-insensitive search
      if (name) filter.name = { $regex: name, $options: "i" };
      if (location) filter.location = { $regex: location, $options: "i" };
      if (status) filter.status = status;
  
      // Find warehouses based on filter
      const warehouses = await Warehouse.find(filter);
  
      res.status(200).json(warehouses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error searching warehouses", error });
    }
  };

  export const getActiveWarehouses = async (req, res) => {
    try {
      const activeWarehouses = await Warehouse.find({ status: "Active" });
      res.status(200).json(activeWarehouses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error retrieving active warehouses", error });
    }
  };
  
  
  