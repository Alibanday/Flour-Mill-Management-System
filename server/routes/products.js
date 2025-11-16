import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} from '../controller/productController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Validation middleware
const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').isIn(['Raw Materials', 'Finished Goods', 'Packaging Materials']).withMessage('Invalid category'),
  body('subcategory').trim().notEmpty().withMessage('Subcategory is required'),
  body('unit').optional().isIn([
    'tons', 'kg', 'quintals',
    '50kg bags', '25kg bags', '20kg bags', '15kg bags', '10kg bags', '5kg bags',
    '100kg sacks', '50kg sacks', '25kg sacks',
    'bags', 'pieces', 'rolls', 'sheets', 'boxes', 'packets', 'bundles',
    'units', 'sets', 'kits', 'pairs', 'meters', 'liters'
  ]).withMessage('Invalid unit'),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  body('purchasePrice').optional().isNumeric().withMessage('Purchase price must be a number'),
  body('minimumStock').optional().isNumeric().withMessage('Minimum stock must be a number'),
  body('status').optional().isIn(['Active', 'Inactive', 'Discontinued']).withMessage('Invalid status')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Routes
router.get('/stats/overview', getProductStats);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', authorize('Admin', 'Manager'), validateProduct, handleValidationErrors, createProduct);
router.put('/:id', authorize('Admin', 'Manager'), validateProduct, handleValidationErrors, updateProduct);
router.delete('/:id', authorize('Admin'), deleteProduct);

export default router;

