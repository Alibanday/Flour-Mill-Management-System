import Item from '../model/Item.js';

// Create new item
export const createItem = async (req, res) => {
  try {
    const { name, category, weight, price, description } = req.body;

    // Validate required fields
    if (!name || !category || !price) {
      return res.status(400).json({ message: 'Name, category, and price are required' });
    }

    // Validate category
    if (!['wheat', 'bags'].includes(category)) {
      return res.status(400).json({ message: 'Category must be either wheat or bags' });
    }

    // Validate weight for bags
    if (category === 'bags' && !weight) {
      return res.status(400).json({ message: 'Weight is required for bags' });
    }

    if (category === 'bags' && ![10, 15, 20, 40, 80].includes(weight)) {
      return res.status(400).json({ message: 'Weight must be 10, 15, 20, 40, or 80 kg' });
    }

    // Create item object
    const itemData = {
      name: name.trim(),
      category,
      price: parseFloat(price),
      description: description?.trim() || ''
    };

    // Add weight only for bags
    if (category === 'bags') {
      itemData.weight = weight;
    }

    const item = new Item(itemData);
    await item.save();

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      item
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Item with this name, category, and weight already exists' 
      });
    }
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all items
export const getAllItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ name: 1, weight: 1 });
    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get items by category
export const getItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!['wheat', 'bags'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const items = await Item.find({ category }).sort({ name: 1, weight: 1 });
    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Error fetching items by category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get unique item names (for dropdown)
export const getItemNames = async (req, res) => {
  try {
    const itemNames = await Item.distinct('name');
    res.json({
      success: true,
      itemNames: itemNames.sort()
    });
  } catch (error) {
    console.error('Error fetching item names:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get weights for a specific item name
export const getWeightsForItem = async (req, res) => {
  try {
    const { itemName } = req.params;
    
    const items = await Item.find({ name: itemName }).sort({ weight: 1 });
    
    if (items.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // For wheat, return empty array (no weights)
    if (items[0].category === 'wheat') {
      return res.json({
        success: true,
        weights: [],
        category: 'wheat'
      });
    }

    // For bags, return available weights
    const weights = items.map(item => item.weight);
    
    res.json({
      success: true,
      weights,
      category: 'bags'
    });

  } catch (error) {
    console.error('Error fetching weights for item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get price for specific item and weight
export const getItemPrice = async (req, res) => {
  try {
    const { itemName, weight } = req.params;
    
    let query = { name: itemName };
    
    // If weight is provided, add it to query
    if (weight && weight !== 'undefined') {
      query.weight = parseInt(weight);
    }

    const item = await Item.findOne(query);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({
      success: true,
      price: item.price,
      category: item.category,
      priceUnit: item.priceUnit
    });

  } catch (error) {
    console.error('Error fetching item price:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update item
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const item = await Item.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({
      success: true,
      message: 'Item updated successfully',
      item
    });

  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete item
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await Item.findByIdAndDelete(id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 