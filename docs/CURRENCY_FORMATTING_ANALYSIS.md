# Currency Formatting Analysis - Floor Mill Management System

## Overview
This document lists all locations where currency (Indian/Pakistani Rupee) is displayed in the system, showing the formatting patterns used.

## Currency Symbols Used
1. **₹** (Indian Rupee symbol) - Used in some components
2. **Rs.** (with period) - Most common format
3. **Rs** (without period) - Less common
4. **PKR** - Pakistani Rupee abbreviation
5. **Intl.NumberFormat with currency: 'PKR'** - Internationalized format

---

## Files Using ₹ (Indian Rupee Symbol)

### 1. `frontend/client/src/components/BagFoodPurchase/BagPurchaseList.jsx`
- **Line 236**: `₹{(b.totalPrice || 0).toLocaleString()}`
- **Line 239**: `Unit Price: ₹{(b.unitPrice || 0).toLocaleString()}`
- **Pattern**: Uses ₹ directly with toLocaleString()

### 2. `frontend/client/src/components/BagFoodPurchase/FoodPurchaseList.jsx`
- **Line 239**: `₹{(purchase.totalPrice || 0).toLocaleString()}`
- **Line 242**: `Unit Price: ₹{(purchase.unitPrice || 0).toLocaleString()}`
- **Line 314**: `₹{filteredPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0).toLocaleString()}`
- **Pattern**: Uses ₹ directly with toLocaleString()

### 3. `frontend/client/src/pages/BagFoodPurchasePage.jsx`
- **Line 360**: `₹{(stats.totalBagValue || 0).toLocaleString()}`
- **Line 372**: `₹{(stats.totalFoodValue || 0).toLocaleString()}`
- **Line 384**: `₹{(stats.pendingPayments || 0).toLocaleString()}`
- **Pattern**: Uses ₹ directly with toLocaleString()

### 4. `frontend/client/src/components/CustomerManagement/CustomerSearch.jsx`
- **Line 206**: `Credit: ₹{customer.creditLimit?.toLocaleString()}`
- **Pattern**: Uses ₹ directly with toLocaleString()

### 5. `frontend/client/src/components/CustomerManagement/CustomerReports.jsx`
- **Line 158**: `₹{reports.customerSummary.totalRevenue}`
- **Pattern**: Uses ₹ directly (no toLocaleString())

### 6. `frontend/client/src/components/CustomerManagement/CustomerList.jsx`
- **Line 297**: `Limit: ₹{customer.creditLimit?.toLocaleString() || 0}`
- **Line 298**: `Used: ₹{customer.creditUsed?.toLocaleString() || 0}`
- **Pattern**: Uses ₹ directly with toLocaleString()

### 7. `frontend/client/src/components/CustomerManagement/CustomerDashboard.jsx`
- **Line 168**: `₹{stats.totalRevenue?.toLocaleString() || 0}`
- **Line 218**: `₹{customer.totalSpent?.toLocaleString() || 0}`
- **Pattern**: Uses ₹ directly with toLocaleString()

---

## Files Using "Rs." (Rs with period)

### 1. `frontend/client/src/pages/Dashboard.jsx`
- **Line 200**: `"Rs. 0"`
- **Line 207**: `"Rs. 0"`
- **Line 214**: `"Rs. 0"`
- **Pattern**: Hardcoded "Rs. 0"

### 2. `frontend/client/src/components/SalesManagement/SalesFormEnhanced.jsx`
- **Line 313**: `Rs. ${availableCredit.toFixed(2)}`
- **Line 368**: `Rs. ${availableCredit.toFixed(2)}`
- **Line 579**: `Credit Limit (Rs.) *`
- **Line 593**: `Outstanding Balance (Rs.) *`
- **Line 618**: `Rs. {Math.max(0, ...).toFixed(2)}`
- **Line 623**: `Current Purchase: Rs. {calculateTotal().toFixed(2)}`
- **Line 720**: `Rs. {inventory.find(...)?.price || 0}`
- **Line 746**: `Unit Price (Rs.)`
- **Line 795**: `Rs. {item.unitPrice}/unit`
- **Line 796**: `Rs. {item.totalPrice.toFixed(2)}`
- **Line 875**: `Tax (Rs.)`
- **Line 894**: `Rs. {calculateTotal().toFixed(2)}`
- **Pattern**: Uses "Rs." prefix with toFixed(2) for decimals

### 3. `frontend/client/src/pages/SalesPage.jsx`
- **Line 182**: `Rs. {sale.totalAmount?.toFixed(2) || '0.00'}`
- **Pattern**: Uses "Rs." with toFixed(2)

### 4. `frontend/client/src/components/BagFoodPurchase/FoodPurchaseForm.jsx`
- **Line 269**: `Price per kg (Rs.) *`
- **Line 285**: `Total Price (Rs.)`
- **Line 352**: `Paid Amount (Rs.) *`
- **Line 368**: `Total Amount (Rs.)`
- **Line 379**: `Remaining Amount (Rs.)`
- **Pattern**: Label text with "(Rs.)"

### 5. `frontend/client/src/pages/SupplierManagementPage.jsx`
- **Line 471**: `Rs. {(totalOutstanding || 0).toLocaleString()}`
- **Line 642**: `Rs. {(totalOutstanding || 0).toLocaleString()}`
- **Line 682**: `Rs. {(supplier.outstandingBalance || 0).toLocaleString()}`
- **Pattern**: Uses "Rs." with toLocaleString()

### 6. `frontend/client/src/components/StockManagement/StockStats.jsx`
- **Line 220**: `Rs. ${inventoryStats.totalValue.toLocaleString()}`
- **Line 256**: `Rs. {stats.value.toLocaleString()}`
- **Line 285**: `Rs. {stats.value.toLocaleString()}`
- **Pattern**: Uses "Rs." with toLocaleString()

### 7. `frontend/client/src/components/SalesManagement/PurchaseForm.jsx`
- **Line 679**: `Outstanding Balance (Rs.)`
- **Line 791**: `Unit Price (Rs.)`
- **Line 806**: `Total Price (Rs.)`
- **Line 907**: `Unit Price (Rs.) *`
- **Line 922**: `Total Price (Rs.)`
- **Line 1007**: `Tax (Rs.)`
- **Line 1026**: `Shipping Cost (Rs.)`
- **Line 1228**: `Rs. {(bagsTotal || 0).toFixed(2)}`
- **Line 1235**: `Rs. {(itemsTotal || 0).toFixed(2)}`
- **Line 1241**: `Rs. {Number(subtotal || 0).toFixed(2)}`
- **Line 1246**: `+Rs. {Number(formData.tax || 0).toFixed(2)}`
- **Line 1251**: `+Rs. {Number(formData.shippingCost || 0).toFixed(2)}`
- **Line 1256**: `Rs. {Number(totalAmount || 0).toFixed(2)}`
- **Pattern**: Mix of labels and values with "Rs."

### 8. `frontend/client/src/pages/ProductionPage.jsx`
- **Line 413**: `Rs. {production.productionCost?.totalCost?.toFixed(2) || '0.00'}`
- **Pattern**: Uses "Rs." with toFixed(2)

### 9. `frontend/client/src/pages/AccountsPage.jsx`
- **Line 28**: `balance: "Rs. 50,000"`
- **Line 29**: `balance: "Rs. 1,50,000"`
- **Line 30**: `balance: "Rs. -25,000"`
- **Line 129**: `Rs. 1,75,000`
- **Line 147**: `Rs. 25,000`
- **Pattern**: Hardcoded strings with "Rs."

### 10. `frontend/client/src/components/SupplierManagement/SupplierList.jsx`
- **Line 292**: `Rs. {(supplier.outstandingBalance || 0).toLocaleString()}`
- **Line 296**: `Limit: Rs. {supplier.creditLimit?.toLocaleString()}`
- **Pattern**: Uses "Rs." with toLocaleString()

### 11. `frontend/client/src/components/SupplierManagement/OutstandingBalances.jsx`
- **Line 149**: `Rs. {(summary.totalOutstanding || 0).toLocaleString()}`
- **Line 264**: `Rs. {(supplier.creditLimit || 0).toLocaleString()}`
- **Line 269**: `Rs. {(supplier.outstandingBalance || 0).toLocaleString()}`
- **Pattern**: Uses "Rs." with toLocaleString()

### 12. `frontend/client/src/components/SalesManagement/SalesForm.jsx`
- **Line 361**: `Credit Limit (Rs.)`
- **Line 377**: `Outstanding Balance (Rs.)`
- **Line 399**: `Available Credit: Rs. {Math.max(...).toFixed(2)}`
- **Line 403**: `Credit Limit: Rs. {safeNumber(...).toFixed(2)}`
- **Line 405**: `Outstanding: Rs. {safeNumber(...).toFixed(2)}`
- **Line 456**: `Unit Price (Rs.)`
- **Line 518**: `Rs. {(item.unitPrice || 0).toFixed(2)}`
- **Line 521**: `Rs. {(item.totalPrice || 0).toFixed(2)}`
- **Line 554**: `Fixed Amount (Rs.)`
- **Line 591**: `Tax (Rs.)`
- **Line 771**: `Rs. {(subtotal || 0).toFixed(2)}`
- **Line 775**: `-Rs. {(discountAmount || 0).toFixed(2)}`
- **Line 779**: `+Rs. {(taxAmount || 0).toFixed(2)}`
- **Line 783**: `Rs. {(totalAmount || 0).toFixed(2)}`
- **Pattern**: Mix of labels and values

### 13. `frontend/client/src/components/Reports/VendorOutstandingReport.jsx`
- **Line 59**: `Rs. ${(reportData.summary.totalOutstanding || 0).toLocaleString()}`
- **Line 60**: `Rs. ${(reportData.summary.averageOutstanding || 0).toLocaleString()}`
- **Line 81**: `Rs. ${(vendor.totalOutstanding || 0).toLocaleString()}`
- **Line 243**: `Rs. {(reportData.summary.totalOutstanding || 0).toLocaleString()}`
- **Line 247**: `Rs. {(reportData.summary.averageOutstanding || 0).toLocaleString()}`
- **Line 289**: `Rs. {(vendor.totalOutstanding || 0).toLocaleString()}`
- **Pattern**: Uses "Rs." with toLocaleString()

### 14. `frontend/client/src/components/Reports/SalesReport.jsx`
- **Line 80**: `Rs. ${(reportData.summary.totalAmount || 0).toLocaleString()}`
- **Line 82**: `Rs. ${(reportData.summary.averageOrderValue || 0).toLocaleString()}`
- **Line 107**: `head: [['Date', 'Customer', 'Amount (Rs.)', 'Payment Status']]`
- **Line 139**: `['Date', 'Customer', 'Amount (Rs.)', 'Payment Status', 'Items']`
- **Line 305**: `Rs. {(reportData.summary.totalAmount || 0).toLocaleString()}`
- **Line 313**: `Rs. {(reportData.summary.averageOrderValue || 0).toLocaleString()}`
- **Line 363**: `Rs. {(sale.totalAmount || 0).toLocaleString()}`
- **Pattern**: Uses "Rs." with toLocaleString()

### 15. `frontend/client/src/components/Reports/SalaryReport.jsx`
- **Line 78**: `Rs. ${(reportData.summary.totalAmount || 0).toLocaleString()}`
- **Line 79**: `Rs. ${(reportData.summary.averageSalary || 0).toLocaleString()}`
- **Line 98**: `Rs. ${(data.amount || 0).toLocaleString()}`
- **Line 119**: `Rs. ${(salary.amount || 0).toLocaleString()}`
- **Line 342**: `Rs. {(reportData.summary.totalAmount || 0).toLocaleString()}`
- **Line 346**: `Rs. {(reportData.summary.averageSalary || 0).toLocaleString()}`
- **Line 365**: `Rs. {(data.amount || 0).toLocaleString()}`
- **Line 412**: `Rs. {(salary.amount || 0).toLocaleString()}`
- **Pattern**: Uses "Rs." with toLocaleString()

---

## Files Using "PKR" (Pakistani Rupee)

### 1. `frontend/client/src/components/WarehouseManagement/WarehouseDetail.jsx`
- **Line 54-58**: Uses `Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })`
- **Line 331**: `{formatCurrency(actualStockTotals.totalValue || 0)}`

### 2. `frontend/client/src/pages/DamageReportPage.jsx`
- **Line 393**: `PKR` (label)

### 3. `frontend/client/src/components/CustomerManagement/CustomerForm.jsx`
- **Line 307**: `Credit Limit (PKR)` (label)

### 4. `frontend/client/src/pages/InventoryPage.jsx`
- **Line 232**: `PKR {(stats.totalValue || 0).toLocaleString()}`

### 5. `frontend/client/src/components/InventoryManagement/InventoryForm.jsx`
- **Line 264**: `Price (PKR per item) *` (label)

### 6. `frontend/client/src/components/DamageReportModal.jsx`
- **Line 329**: `PKR` (label)

### 7. `frontend/client/src/components/EmployeeManagement/PayrollDetailsModal.jsx`
- **Line 17-22**: ⚠️ **WRONG CURRENCY** - Uses `currency: 'USD'` instead of PKR/INR
- **Line 18**: Returns `'$0'` for zero amounts

### 8. `frontend/client/src/components/EmployeeManagement/EmployeeReports.jsx`
- **Line 337**: `PKR ${Math.round(item.avgSalary).toLocaleString()}`
- **Line 350**: `PKR {item.salary?.toLocaleString()}`

### 9. `frontend/client/src/components/EmployeeManagement/EmployeeDashboard.jsx`
- **Line 176**: `PKR ${Math.round(dept.avgSalary).toLocaleString()}`
- **Line 222**: `PKR ${Math.round(stats.salaryStats.avgSalary).toLocaleString()}`
- **Line 228**: `PKR ${Math.round(stats.salaryStats.minSalary).toLocaleString()}`
- **Line 234**: `PKR ${Math.round(stats.salaryStats.maxSalary).toLocaleString()}`
- **Line 240**: `PKR ${Math.round(stats.salaryStats.totalSalary).toLocaleString()}`

### 10. `frontend/client/src/components/Dashboard/RealTimeDashboard.jsx`
- **Line 226**: `PKR {dashboardData.inventory.totalValue.toLocaleString()}`
- **Line 284**: `PKR {dashboardData.production.totalCost.toLocaleString()}`
- **Line 305**: `PKR {dashboardData.sales.totalRevenue.toLocaleString()}`
- **Line 330**: `PKR {dashboardData.purchase.totalAmount.toLocaleString()}`

### 11. `frontend/client/src/pages/ProductionCostPage.jsx`
- **Line 143, 164, 185**: Uses `currency: 'PKR'` in Intl.NumberFormat

### 12. `frontend/client/src/components/Repacking/RepackingStats.jsx`
- **Line 4-8**: Uses `Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })`

### 13. `frontend/client/src/components/Repacking/RepackingList.jsx`
- **Line 37-41**: Uses `Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })`

### 14. `frontend/client/src/components/Repacking/RepackingForm.jsx`
- **Line 375**: `Labor Cost (PKR)` (label)
- **Line 383**: `Material Cost (PKR)` (label)
- **Line 391**: `Total Cost (PKR)` (label)

### 15. `frontend/client/src/components/ProductionCost/ProductionCostTable.jsx`
- **Line 5-9**: Uses `Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })`

### 16. `frontend/client/src/components/ProductionCost/ProductionCostChart.jsx`
- **Line 25-29**: Uses `Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })`

### 17. `frontend/client/src/components/FinancialManagement/TransactionList.jsx`
- **Line 70-74**: Uses `Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })`

### 18. `frontend/client/src/components/FinancialManagement/TransactionForm.jsx`
- **Line 9**: `currency: 'PKR'` (default)
- **Line 377**: `<option value="PKR">PKR (Pakistani Rupee)</option>`

### 19. `frontend/client/src/components/FinancialManagement/SalaryList.jsx`
- **Line 68-72**: Uses `Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })`

### 20. `frontend/client/src/components/FinancialManagement/FinancialDashboard.jsx`
- **Line 29-33**: Uses `Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })`

### 21. `frontend/client/src/components/FinancialManagement/AccountList.jsx`
- **Line 66-70**: Uses `Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })`

### 22. `frontend/client/src/components/FinancialManagement/AccountForm.jsx`
- **Line 12**: `currency: 'PKR'` (default)
- **Line 244**: `<option value="PKR">PKR (Pakistani Rupee)</option>`

### 23. `frontend/client/src/components/CustomerManagement/CustomerStats.jsx`
- **Line 4-10**: Uses `Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' })`

---

## Summary Statistics

### Currency Format Distribution:
- **₹ (Indian Rupee symbol)**: 7 files, ~20 occurrences
- **Rs.** (with period): 15 files, ~80+ occurrences
- **PKR** (with Intl.NumberFormat): 23 files, ~50+ occurrences
- **PKR** (direct text): 10 files, ~20 occurrences
- **USD** (incorrect): 1 file (PayrollDetailsModal.jsx)

### Issues Found:
1. **Inconsistent currency symbols**: Mix of ₹, Rs., and PKR
2. **Wrong currency in PayrollDetailsModal.jsx**: Uses USD instead of PKR/INR
3. **Mixed formatting**: Some use toLocaleString(), some use toFixed(2), some use Intl.NumberFormat
4. **No standardization**: Different components use different approaches

### Recommendations:
1. **Standardize to one format**: Choose either ₹ or Rs. or PKR consistently
2. **Fix PayrollDetailsModal.jsx**: Change USD to PKR or INR
3. **Create a utility function**: Create a centralized `formatCurrency()` function
4. **Use Intl.NumberFormat**: Most consistent and locale-aware approach

---

## Files That Need Updates

### High Priority:
1. `components/EmployeeManagement/PayrollDetailsModal.jsx` - Uses USD (WRONG)
2. All files using ₹ - Consider standardizing to Rs. or PKR
3. All files using hardcoded "Rs." - Consider using utility function

### Medium Priority:
1. Standardize all currency formatting to use one approach
2. Create a centralized currency formatting utility
3. Update all components to use the utility function

---

*Generated on: $(date)*
*Total files analyzed: 118*
*Total currency occurrences: ~170+*

