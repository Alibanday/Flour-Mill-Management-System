// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserManagementPage from './pages/UserManagementPage';
import AccountsPage from './pages/AccountsPage';
import EmployeesPage from './pages/EmployeesPage';
import SalesPage from './pages/SalesPage';
import ProductionPage from './pages/ProductionPage';
import ReportsPage from './pages/ReportsPage';
import WarehousePage from './pages/WarehousePage';
import WarehouseDetail from './components/WarehouseManagement/WarehouseDetail';
import InventoryPage from './pages/InventoryPage';
import FinancialManagementPage from './pages/FinancialManagementPage';
import BagFoodPurchasePage from './pages/BagFoodPurchasePage';
import SupplierManagementPage from './pages/SupplierManagementPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import GatePassPage from './pages/GatePassPage';
import NotificationsPage from './pages/NotificationsPage';
import SystemConfigPage from './pages/SystemConfigPage';
import LanguageTestPage from './pages/LanguageTestPage';
import CustomerManagementPage from './pages/CustomerManagementPage';
import StockTransferPage from './pages/StockTransferPage';
import RepackingPage from './pages/RepackingPage';
import ProductionCostPage from './pages/ProductionCostPage';
import StockPage from './pages/StockPage';
import WarehouseManagerDashboard from './pages/WarehouseManagerDashboard';
import DamageReportPage from './pages/DamageReportPage';
import ProtectedRoute, { AdminRoute, GeneralManagerRoute, SalesManagerRoute, ProductionManagerRoute, WarehouseManagerRoute, UserManagementRoute, EmployeeRoute, CashierRoute } from './components/Auth/ProtectedRoute';
import SaleDetailPage from './pages/SaleDetailPage';
import CustomerDetailPage from './pages/CustomerDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* User Management - Admin and Manager only */}
        <Route 
          path="/users" 
          element={
            <UserManagementRoute>
              <UserManagementPage />
            </UserManagementRoute>
          } 
        />
        
        {/* Accounts - Admin and General Manager only */}
        <Route 
          path="/accounts" 
          element={
            <GeneralManagerRoute>
              <AccountsPage />
            </GeneralManagerRoute>
          } 
        />
        
        {/* Employees - Admin and General Manager only */}
        <Route 
          path="/employees" 
          element={
            <GeneralManagerRoute>
              <EmployeesPage />
            </GeneralManagerRoute>
          } 
        />
        
        {/* Sales Management - Admin, General Manager, and Sales Manager */}
        <Route 
          path="/sales" 
          element={
            <SalesManagerRoute>
              <SalesPage />
            </SalesManagerRoute>
          } 
        />
        <Route
          path="/sales/:id"
          element={
            <SalesManagerRoute>
              <SaleDetailPage />
            </SalesManagerRoute>
          }
        />
        
        {/* Production - Admin, General Manager, and Production Manager */}
        <Route 
          path="/production" 
          element={
            <ProductionManagerRoute>
              <ProductionPage />
            </ProductionManagerRoute>
          } 
        />
        
        {/* Reports - Admin and General Manager only */}
        <Route 
          path="/reports" 
          element={
            <GeneralManagerRoute>
              <ReportsPage />
            </GeneralManagerRoute>
          } 
        />
        
        {/* Financial Management - Admin and General Manager only */}
        <Route 
          path="/financial" 
          element={
            <GeneralManagerRoute>
              <FinancialManagementPage />
            </GeneralManagerRoute>
          } 
        />
        
        {/* Bag & Food Purchase - Admin and General Manager only */}
        <Route 
          path="/bag-food-purchase" 
          element={
            <GeneralManagerRoute>
              <BagFoodPurchasePage />
            </GeneralManagerRoute>
          } 
        />
        
        {/* Supplier & Vendor Management - Admin and General Manager only */}
        <Route 
          path="/suppliers" 
          element={
            <GeneralManagerRoute>
              <SupplierManagementPage />
            </GeneralManagerRoute>
          } 
        />
        <Route
          path="/suppliers/:id"
          element={
            <GeneralManagerRoute>
              <SupplierDetailPage />
            </GeneralManagerRoute>
          }
        />
        
        {/* Gate Pass System - Admin, General Manager, Production Manager, and Warehouse Manager */}
        <Route 
          path="/gate-pass" 
          element={
            <EmployeeRoute>
              <GatePassPage />
            </EmployeeRoute>
          } 
        />
        
        {/* Notifications & Utilities - Admin and General Manager only */}
        <Route 
          path="/notifications" 
          element={
            <GeneralManagerRoute>
              <NotificationsPage />
            </GeneralManagerRoute>
          } 
        />
        
        {/* System Configuration - Admin only */}
        <Route 
          path="/system-config" 
          element={
            <AdminRoute>
              <SystemConfigPage />
            </AdminRoute>
          } 
        />
        
        {/* Language Test Page */}
        <Route 
          path="/language-test" 
          element={
            <ProtectedRoute>
              <LanguageTestPage />
            </ProtectedRoute>
          } 
        />

        {/* Customer Management - Admin, General Manager, and Sales Manager */}
        <Route 
          path="/customers" 
          element={
            <SalesManagerRoute>
              <CustomerManagementPage />
            </SalesManagerRoute>
          } 
        />
        <Route
          path="/customers/:id"
          element={
            <SalesManagerRoute>
              <CustomerDetailPage />
            </SalesManagerRoute>
          }
        />

        {/* Stock Transfer - Admin, General Manager, Production Manager, and Warehouse Manager */}
        <Route 
          path="/stock-transfers" 
          element={
            <EmployeeRoute>
              <StockTransferPage />
            </EmployeeRoute>
          } 
        />

        {/* Repacking - Admin, General Manager, and Production Manager */}
        <Route 
          path="/repacking" 
          element={
            <ProductionManagerRoute>
              <RepackingPage />
            </ProductionManagerRoute>
          } 
        />

        {/* Production Cost Analysis - Admin and General Manager only */}
        <Route 
          path="/production-costs" 
          element={
            <GeneralManagerRoute>
              <ProductionCostPage />
            </GeneralManagerRoute>
          } 
        />
        
        {/* Warehouse - Admin, General Manager, and Warehouse Manager */}
        <Route
          path="/warehouses"
          element={
            <WarehouseManagerRoute>
              <WarehousePage />
            </WarehouseManagerRoute>
          }
        />
        <Route
          path="/warehouses/:id"
          element={
            <WarehouseManagerRoute>
              <WarehouseDetail />
            </WarehouseManagerRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <EmployeeRoute>
              <InventoryPage />
            </EmployeeRoute>
          }
        />
        
        {/* Stock - Admin, General Manager, and Warehouse Manager */}
        <Route 
          path="/stock" 
          element={
            <WarehouseManagerRoute>
              <StockPage />
            </WarehouseManagerRoute>
          } 
        />
        
        {/* Warehouse Manager Dashboard */}
        <Route 
          path="/warehouse-manager-dashboard" 
          element={
            <WarehouseManagerRoute>
              <WarehouseManagerDashboard />
            </WarehouseManagerRoute>
          } 
        />
        
        {/* Damage Report Page */}
        <Route 
          path="/damage-report" 
          element={
            <WarehouseManagerRoute>
              <DamageReportPage />
            </WarehouseManagerRoute>
          } 
        />
        
        {/* Settings - Admin only */}
        <Route 
          path="/settings" 
          element={
            <AdminRoute>
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">System Settings</h1>
                  <p className="text-gray-600">This module will be implemented next.</p>
                </div>
              </div>
            </AdminRoute>
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
