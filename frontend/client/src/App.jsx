// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserManagementPage from './pages/UserManagementPage';
import AccountsPage from './pages/AccountsPage';
import EmployeesPage from './pages/EmployeesPage';
import SalesPurchasePage from './pages/SalesPurchasePage';
import ProductionPage from './pages/ProductionPage';
import ReportsPage from './pages/ReportsPage';
import WarehousePage from './pages/WarehousePage';
import InventoryPage from './pages/InventoryPage';
import FinancialManagementPage from './pages/FinancialManagementPage';
import BagFoodPurchasePage from './pages/BagFoodPurchasePage';
import SupplierManagementPage from './pages/SupplierManagementPage';
import GatePassPage from './pages/GatePassPage';
import NotificationsPage from './pages/NotificationsPage';
import SystemConfigPage from './pages/SystemConfigPage';
import LanguageTestPage from './pages/LanguageTestPage';
import ProtectedRoute, { AdminRoute, ManagerRoute, UserManagementRoute, EmployeeRoute, CashierRoute } from './components/Auth/ProtectedRoute';

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
        
        {/* Accounts - Admin and Manager only */}
        <Route 
          path="/accounts" 
          element={
            <ManagerRoute>
              <AccountsPage />
            </ManagerRoute>
          } 
        />
        
        {/* Employees - Admin and Manager only */}
        <Route 
          path="/employees" 
          element={
            <ManagerRoute>
              <EmployeesPage />
            </ManagerRoute>
          } 
        />
        
        {/* Sales & Purchase Management - Admin, Manager, and Cashier */}
        <Route 
          path="/sales" 
          element={
            <CashierRoute>
              <SalesPurchasePage />
            </CashierRoute>
          } 
        />
        
        {/* Production - Admin, Manager, and Employee */}
        <Route 
          path="/production" 
          element={
            <EmployeeRoute>
              <ProductionPage />
            </EmployeeRoute>
          } 
        />
        
        {/* Reports - Admin and Manager only */}
        <Route 
          path="/reports" 
          element={
            <ManagerRoute>
              <ReportsPage />
            </ManagerRoute>
          } 
        />
        
        {/* Financial Management - Admin and Manager only */}
        <Route 
          path="/financial" 
          element={
            <ManagerRoute>
              <FinancialManagementPage />
            </ManagerRoute>
          } 
        />
        
        {/* Bag & Food Purchase - Admin and Manager only */}
        <Route 
          path="/bag-food-purchase" 
          element={
            <ManagerRoute>
              <BagFoodPurchasePage />
            </ManagerRoute>
          } 
        />
        
        {/* Supplier & Vendor Management - Admin and Manager only */}
        <Route 
          path="/suppliers" 
          element={
            <ManagerRoute>
              <SupplierManagementPage />
            </ManagerRoute>
          } 
        />
        
        {/* Gate Pass System - Admin, Manager, and Employee */}
        <Route 
          path="/gate-pass" 
          element={
            <EmployeeRoute>
              <GatePassPage />
            </EmployeeRoute>
          } 
        />
        
        {/* Notifications & Utilities - Admin and Manager only */}
        <Route 
          path="/notifications" 
          element={
            <ManagerRoute>
              <NotificationsPage />
            </ManagerRoute>
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
        
        {/* Warehouse - Admin, Manager, and Employee */}
                <Route
          path="/warehouse"
          element={
            <EmployeeRoute>
              <WarehousePage />
            </EmployeeRoute>
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
        
        {/* Stock - Admin, Manager, and Employee */}
        <Route 
          path="/stock" 
          element={
            <EmployeeRoute>
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Stock Management</h1>
                  <p className="text-gray-600">This module will be implemented next.</p>
                </div>
              </div>
            </EmployeeRoute>
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
