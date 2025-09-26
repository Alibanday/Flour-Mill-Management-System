import Inventory from "../model/inventory.js";
import Stock from "../model/stock.js";
import Production from "../model/Production.js";
import Sale from "../model/Sale.js";
import Purchase from "../model/Purchase.js";
import Warehouse from "../model/warehouse.js";
import Notification from "../model/Notification.js";

// Get real-time dashboard data
export const getRealTimeDashboard = async (req, res) => {
  try {
    console.log("Fetching real-time dashboard data for user:", req.user._id);

    // Get inventory statistics
    const inventoryStats = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ["$currentStock", "$cost.purchasePrice"] } },
          lowStock: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ["$currentStock", 0] }, { $lte: ["$currentStock", "$minimumStock"] }] },
                1,
                0
              ]
            }
          },
          outOfStock: {
            $sum: {
              $cond: [{ $eq: ["$currentStock", 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get stock movement statistics
    const stockStats = await Stock.aggregate([
      {
        $group: {
          _id: null,
          totalMovements: { $sum: 1 },
          inMovements: {
            $sum: {
              $cond: [{ $eq: ["$movementType", "in"] }, 1, 0]
            }
          },
          outMovements: {
            $sum: {
              $cond: [{ $eq: ["$movementType", "out"] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get production statistics
    const productionStats = await Production.aggregate([
      {
        $group: {
          _id: null,
          totalBatches: { $sum: 1 },
          totalQuantity: { $sum: "$quantity.value" },
          totalCost: { $sum: "$productionCost.totalCost" }
        }
      }
    ]);

    // Get sales statistics
    const salesStats = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          pendingPayments: {
            $sum: {
              $cond: [{ $eq: ["$status", "Pending"] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get purchase statistics
    const purchaseStats = await Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ["$status", "Pending"] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get warehouse statistics
    const warehouseStats = await Warehouse.aggregate([
      {
        $group: {
          _id: null,
          totalWarehouses: { $sum: 1 },
          activeWarehouses: {
            $sum: {
              $cond: [{ $eq: ["$status", "Active"] }, 1, 0]
            }
          },
          capacityAlerts: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$capacity.totalCapacity", 0] },
                    {
                      $gte: [
                        { $divide: ["$capacity.currentUsage", "$capacity.totalCapacity"] },
                        0.8
                      ]
                    }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get notification statistics
    const notificationStats = await Notification.aggregate([
      {
        $match: {
          $or: [
            { user: req.user._id },
            { recipient: req.user._id }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ["$status", "unread"] }, 1, 0]
            }
          },
          critical: {
            $sum: {
              $cond: [{ $eq: ["$priority", "critical"] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get recent activities
    const recentActivities = await Promise.all([
      Inventory.find().sort({ updatedAt: -1 }).limit(5).populate('warehouse', 'name'),
      Stock.find().sort({ createdAt: -1 }).limit(5).populate('inventoryItem', 'name').populate('warehouse', 'name'),
      Production.find().sort({ createdAt: -1 }).limit(5).populate('warehouse', 'name'),
      Sale.find().sort({ createdAt: -1 }).limit(5).populate('warehouse', 'name'),
      Purchase.find().sort({ createdAt: -1 }).limit(5).populate('warehouse', 'name')
    ]);

    // Get low stock items
    const lowStockItems = await Inventory.find({
      $or: [
        { currentStock: 0 },
        { $expr: { $lte: ["$currentStock", "$minimumStock"] } }
      ]
    }).populate('warehouse', 'name').limit(10);

    // Get recent notifications
    const recentNotifications = await Notification.find({
      $or: [
        { user: req.user._id },
        { recipient: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'firstName lastName')
    .populate('recipient', 'firstName lastName');

    // Format the response
    const dashboardData = {
      inventory: inventoryStats[0] || { totalItems: 0, totalValue: 0, lowStock: 0, outOfStock: 0 },
      stock: stockStats[0] || { totalMovements: 0, inMovements: 0, outMovements: 0 },
      production: productionStats[0] || { totalBatches: 0, totalQuantity: 0, totalCost: 0 },
      sales: salesStats[0] || { totalSales: 0, totalRevenue: 0, pendingPayments: 0 },
      purchase: purchaseStats[0] || { totalPurchases: 0, totalAmount: 0, pendingOrders: 0 },
      warehouse: warehouseStats[0] || { totalWarehouses: 0, activeWarehouses: 0, capacityAlerts: 0 },
      notifications: notificationStats[0] || { total: 0, unread: 0, critical: 0 },
      recentActivities: {
        inventory: recentActivities[0],
        stock: recentActivities[1],
        production: recentActivities[2],
        sales: recentActivities[3],
        purchase: recentActivities[4]
      },
      lowStockItems,
      recentNotifications,
      lastUpdated: new Date(),
      realTimeStatus: 'connected'
    };

    console.log("Real-time dashboard data fetched successfully");

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error("Error fetching real-time dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching real-time dashboard data",
      error: error.message
    });
  }
};

// Get module-specific real-time data
export const getModuleData = async (req, res) => {
  try {
    const { module } = req.params;
    const { startDate, endDate, warehouse } = req.query;

    let data = {};

    switch (module) {
      case 'inventory':
        data = await getInventoryData(startDate, endDate, warehouse);
        break;
      case 'stock':
        data = await getStockData(startDate, endDate, warehouse);
        break;
      case 'production':
        data = await getProductionData(startDate, endDate, warehouse);
        break;
      case 'sales':
        data = await getSalesData(startDate, endDate, warehouse);
        break;
      case 'purchase':
        data = await getPurchaseData(startDate, endDate, warehouse);
        break;
      case 'warehouse':
        data = await getWarehouseData();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid module specified"
        });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error(`Error fetching ${req.params.module} data:`, error);
    res.status(500).json({
      success: false,
      message: `Error fetching ${req.params.module} data`,
      error: error.message
    });
  }
};

// Helper functions for module-specific data
const getInventoryData = async (startDate, endDate, warehouse) => {
  const filter = {};
  if (startDate && endDate) {
    filter.updatedAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  if (warehouse) filter.warehouse = warehouse;

  return await Inventory.find(filter)
    .populate('warehouse', 'name location')
    .sort({ updatedAt: -1 });
};

const getStockData = async (startDate, endDate, warehouse) => {
  const filter = {};
  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  if (warehouse) filter.warehouse = warehouse;

  return await Stock.find(filter)
    .populate('inventoryItem', 'name code')
    .populate('warehouse', 'name')
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

const getProductionData = async (startDate, endDate, warehouse) => {
  const filter = {};
  if (startDate && endDate) {
    filter.productionDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  if (warehouse) filter.warehouse = warehouse;

  return await Production.find(filter)
    .populate('warehouse', 'name location')
    .populate('addedBy', 'firstName lastName')
    .sort({ productionDate: -1 });
};

const getSalesData = async (startDate, endDate, warehouse) => {
  const filter = {};
  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  if (warehouse) filter.warehouse = warehouse;

  return await Sale.find(filter)
    .populate('warehouse', 'name location')
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });
};

const getPurchaseData = async (startDate, endDate, warehouse) => {
  const filter = {};
  if (startDate && endDate) {
    filter.purchaseDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  if (warehouse) filter.warehouse = warehouse;

  return await Purchase.find(filter)
    .populate('warehouse', 'name location')
    .populate('createdBy', 'firstName lastName')
    .sort({ purchaseDate: -1 });
};

const getWarehouseData = async () => {
  return await Warehouse.find()
    .populate('manager', 'firstName lastName')
    .sort({ name: 1 });
};
