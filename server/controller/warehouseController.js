import Warehouse from "../model/warehouse.js";

// Add new warehouse
export const addWarehouse = async (req, res) => {
  try {
    console.log('addWarehouse called with body:', req.body);
    const { warehouseNumber, name, location, status, description } = req.body;

    console.log('Extracted data:', { warehouseNumber, name, location, status, description });

    const newWarehouse = new Warehouse({
      warehouseNumber,
      name,
      location,
      status,
      description
    });

    console.log('Created warehouse object:', newWarehouse);

    await newWarehouse.save();

    console.log('Warehouse saved successfully');

    res.status(201).json({ 
      success: true,
      message: "Warehouse added successfully", 
      data: newWarehouse 
    });
  } catch (error) {
    console.error('Error in addWarehouse:', error);
    res.status(500).json({ 
      success: false,
      message: "Error adding warehouse", 
      error: error.message 
    });
  }
};

// Get all warehouses with pagination
export const getAllWarehouses = async (req, res) => {
  try {
    console.log('getAllWarehouses called with query:', req.query);
    const { page = 1, limit = 10, status } = req.query;
    
    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    console.log('Filter:', filter);
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('Pagination:', { page, limit, skip });
    
    // Get warehouses with pagination
    const warehouses = await Warehouse.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    console.log('Found warehouses:', warehouses.length);
    
    // Get total count for pagination
    const total = await Warehouse.countDocuments(filter);
    
    console.log('Total count:', total);
    
    res.status(200).json({
      success: true,
      data: warehouses,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error in getAllWarehouses:', error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving warehouses", 
      error: error.message 
    });
  }
};

// Get a single warehouse by ID
export const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    res.status(200).json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving warehouse", 
      error: error.message 
    });
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
      return res.status(404).json({ 
        success: false,
        message: "Warehouse not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Warehouse updated successfully", 
      data: updatedWarehouse 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error updating warehouse", 
      error: error.message 
    });
  }
};

// Delete a warehouse by ID
export const deleteWarehouse = async (req, res) => {
  try {
    const deletedWarehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!deletedWarehouse) {
      return res.status(404).json({ 
        success: false,
        message: "Warehouse not found" 
      });
    }
    res.status(200).json({ 
      success: true,
      message: "Warehouse deleted successfully" 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting warehouse", 
      error: error.message 
    });
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
  
      res.status(200).json({
        success: true,
        data: warehouses
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        success: false,
        message: "Error searching warehouses", 
        error: error.message 
      });
    }
  };

  export const getActiveWarehouses = async (req, res) => {
    try {
      const activeWarehouses = await Warehouse.find({ status: "Active" });
      res.status(200).json({
        success: true,
        data: activeWarehouses
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ 
        success: false,
        message: "Error retrieving active warehouses", 
        error: error.message 
      });
    }
  };

// Update warehouse status
export const updateWarehouseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Active' or 'Inactive'"
      });
    }

    const updatedWarehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedWarehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Warehouse status updated successfully",
      data: updatedWarehouse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error updating warehouse status",
      error: error.message
    });
  }
};