import express from 'express';
import { 
  createItem, 
  getAllItems, 
  getItemsByCategory, 
  getItemNames, 
  getWeightsForItem, 
  getItemPrice, 
  updateItem, 
  deleteItem 
} from '../controller/itemController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Create new item
router.post('/', createItem);

// Get all items
router.get('/', getAllItems);

// Get items by category
router.get('/category/:category', getItemsByCategory);

// Get unique item names (for dropdown)
router.get('/names', getItemNames);

// Get weights for a specific item name
router.get('/weights/:itemName', getWeightsForItem);

// Get price for specific item and weight
router.get('/price/:itemName/:weight', getItemPrice);

// Update item
router.put('/:id', updateItem);

// Delete item
router.delete('/:id', deleteItem);

export default router; 