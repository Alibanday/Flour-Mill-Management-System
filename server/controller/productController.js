import Product from '../model/Product.js';
import asyncHandler from 'express-async-handler';

// @route   GET /api/products
// @desc    Get all products (catalog)
// @access  Private
export const getProducts = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      subcategory,
      status
    } = req.query;

    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (subcategory && subcategory !== 'all') {
      filter.subcategory = subcategory;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
export const getProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Admin, Manager)
export const createProduct = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      code,
      category,
      subcategory,
      description,
      unit,
      weightVariants,
      weight,
      price,
      purchasePrice,
      minimumStock,
      status,
      specifications,
      tags
    } = req.body;

    // Check if product with same name and category already exists
    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      category
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this name and category already exists'
      });
    }

    // Prepare weight variants - use weightVariants if provided, otherwise use legacy weight/price
    let finalWeightVariants = [];
    if (weightVariants && Array.isArray(weightVariants) && weightVariants.length > 0) {
      // Use provided weightVariants
      finalWeightVariants = weightVariants.map(v => ({
        weight: parseFloat(v.weight) || 0,
        price: parseFloat(v.price) || 0,
        unit: v.unit || 'kg',
        isActive: v.isActive !== false
      }));
    } else if (weight && price) {
      // Fallback to legacy weight/price
      finalWeightVariants = [{
        weight: parseFloat(weight) || 0,
        price: parseFloat(price) || 0,
        unit: unit || 'kg',
        isActive: true
      }];
    }

    // Validate that at least one weight variant exists
    if (finalWeightVariants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one weight category with price is required'
      });
    }

    const product = new Product({
      name,
      code,
      category,
      subcategory,
      description,
      unit: unit || 'kg',
      weightVariants: finalWeightVariants,
      weight: finalWeightVariants[0].weight, // Legacy field - use first variant
      price: finalWeightVariants[0].price, // Legacy field - use first variant
      purchasePrice: purchasePrice || 0,
      minimumStock: minimumStock || 0,
      status: status || 'Active',
      specifications,
      tags
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Admin, Manager)
export const updateProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const {
      name,
      code,
      category,
      subcategory,
      description,
      unit,
      weightVariants,
      weight,
      price,
      purchasePrice,
      minimumStock,
      status,
      specifications,
      tags
    } = req.body;

    // Update fields
    if (name !== undefined) product.name = name;
    if (code !== undefined) product.code = code;
    if (category !== undefined) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (description !== undefined) product.description = description;
    if (unit !== undefined) product.unit = unit;
    if (purchasePrice !== undefined) product.purchasePrice = purchasePrice;
    if (minimumStock !== undefined) product.minimumStock = minimumStock;
    if (status !== undefined) product.status = status;
    if (specifications !== undefined) product.specifications = specifications;
    if (tags !== undefined) product.tags = tags;

    // Handle weight variants
    if (weightVariants !== undefined && Array.isArray(weightVariants)) {
      if (weightVariants.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one weight category with price is required'
        });
      }
      
      // Process weight variants
      const processedVariants = weightVariants
        .filter(v => v.weight && v.price && v.weight !== '' && v.price !== '')
        .map(v => ({
          weight: parseFloat(v.weight) || 0,
          price: parseFloat(v.price) || 0,
          unit: v.unit || 'kg',
          isActive: v.isActive !== false
        }));
      
      if (processedVariants.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one valid weight category with price is required'
        });
      }
      
      product.weightVariants = processedVariants;
      // Update legacy fields from first variant
      product.weight = processedVariants[0].weight;
      product.price = processedVariants[0].price;
    } else if (weight !== undefined && price !== undefined) {
      // Fallback to legacy weight/price (update first variant or create new)
      if (product.weightVariants && product.weightVariants.length > 0) {
        product.weightVariants[0].weight = parseFloat(weight) || 0;
        product.weightVariants[0].price = parseFloat(price) || 0;
      } else {
        product.weightVariants = [{
          weight: parseFloat(weight) || 0,
          price: parseFloat(price) || 0,
          unit: unit || 'kg',
          isActive: true
        }];
      }
      product.weight = parseFloat(weight) || 0;
      product.price = parseFloat(price) || 0;
    }

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Admin)
export const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is used in any inventory
    const Inventory = (await import('../model/inventory.js')).default;
    const inventoryCount = await Inventory.countDocuments({ product: product._id });
    
    if (inventoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete product. It is used in ${inventoryCount} inventory record(s). Please remove inventory records first.`
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

// @route   GET /api/products/stats/overview
// @desc    Get product catalog statistics
// @access  Private
export const getProductStats = asyncHandler(async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'Active' });
    const inactiveProducts = await Product.countDocuments({ status: 'Inactive' });
    
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        productsByCategory
      }
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product statistics',
      error: error.message
    });
  }
});

