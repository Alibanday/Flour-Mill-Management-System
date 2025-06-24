// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LayoutWithNavbar from './components/LayoutWithNavbar'; // Layout with navbar
import LayoutWithoutNavbar from './components/LayoutWithoutNavbar'; // Layout without navbar

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AccountsPage from "./pages/AccountsPage"; 
import EmployeesPage from "./pages/EmployeesPage";
import UserList from "./components/UserList";
import UserDetail from "./pages/UserDetail";
import UserEdit from "./pages/UserEdit";
import WarehousePage from "./pages/WarehousePage";
import InventoryPage from "./pages/InventoryPage";
import ProductionPage from "./pages/ProductionPage";
import ReportsPage from "./pages/ReportsPage";
import StockPage from "./pages/StockPage";
import SalesPage from "./pages/SalesPage";
import EditUserForm from "./pages/EditUserForm";
import GovernmentPurchase from "./pages/GovernmentPurchase";
import FoodPurchaseInvoice from "./components/FoodPurchaseInvoice";
import FoodArrivalEntry from "./components/FoodArrivalEntry";
import PrivatePurchase from "./pages/PrivatePurchase";
import WarehouseDetail from "./pages/WarehouseDetail";
import EditWarehouse from "./pages/EditWarehouse";
import AccountCreationForm from "./components/AccountCreationForm";
import AddPrCenter from "./components/Addprcenter";
import AccountDetail from "./pages/AccountDetail";
import PrCenterDetail from "./pages/PrCenterDetail";
import EditPrCenter from "./pages/EditPrCenter";
import EditAccountForm from "./pages/EditAccountForm";
import GovPurchaseForm from "./components/GovPurchaseForm";
import PrivatePurchaseForm from "./components/PrivatePurchaseForm";
import GovPurchaseDetail from "./pages/GovPurchasedetail";
import PrivatePurchaseDetail from "./pages/PrivatePurchaseDetail";
import GovPurchaseEditForm from "./pages/GovPurchaseEditForm";
import BagsScreen from "./pages/BagsScreen";
import BagPurchaseInvoice from "./components/bagsaleandpurchase/BagPurchaseInvoice";
import BagSalesInvoice from "./components/bagsaleandpurchase/BagSalesInvoice";
import FoodArrivalDetail from "./pages/FoodArrivalDetail";
import DailyProductionDetail from "./pages/production/DailyProductionDetail";
import RegisterItemsPage from "./pages/registeritems/RegisterItemsPage";
import AddItemPage from "./pages/registeritems/AddItemPage";
import EditItemForm from "./components/registeritems/EditItemForm";
import AttendancePage from "./pages/attendancesystem/AttendancePage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route - redirect to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Routes with Navbar */}
        <Route element={<LayoutWithNavbar />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ReportsPage" element={<ReportsPage />} />
        </Route>

        {/* Routes without Navbar */}
        <Route element={<LayoutWithoutNavbar />}>
          <Route path="/login" element={<Login />} />
          <Route path="/AccountsPage" element={<AccountsPage />} />
          <Route path="/EmployeesPage" element={<EmployeesPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/PrivatePurchase" element={<PrivatePurchase />} />
          <Route path="/user/:id" element={<UserDetail />} />
          <Route path="/gov-purchase" element={<GovernmentPurchase />}>
          
          <Route path="invoice" element={<FoodPurchaseInvoice />} />
          <Route path="arrival" element={<FoodArrivalEntry />} />
        </Route>
          {/* <Route path="/edit-user/:id" element={<UserEdit />} /> */}
          <Route path="/edit-user/:id" element={<EditUserForm />} />
          <Route path="/warehouse" element={<WarehousePage />} /> 
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/StockPage" element={<StockPage />} />
          <Route path="/accounts/create" element={<AccountCreationForm />} />
          <Route path="/SalesPage" element={<SalesPage />} />
          <Route path="/addprcenter" element={<AddPrCenter />} />

          <Route path="/warehouse/:id" element={<WarehouseDetail />} />
          <Route path="/warehouse/edit/:id" element={<EditWarehouse />} />

          <Route path="/account/:id" element={<AccountDetail />} />
          <Route path="/prcenter/:id" element={<PrCenterDetail />} />
          <Route path="/prcenter/edit/:id" element={<EditPrCenter />} />
          <Route path="/account/edit/:id" element={<EditAccountForm />} />
          <Route path="/govpurchase" element={<GovPurchaseForm />} />
          <Route path="/bags-screen" element={<BagsScreen/>} />
          <Route path="/pvtpurchase" element={<PrivatePurchaseForm />} />
          <Route path="/govpurchasedetail/:id" element={<GovPurchaseDetail />} />
          <Route path="/govpurchasedetail/:id" element={<GovPurchaseEditForm />} />

          <Route path="/privatepurchasedetail/:id" element={< PrivatePurchaseDetail/>} />
          <Route path="/bagpurchaseinvoice" element={<BagPurchaseInvoice />} />
          <Route path="/bagsalesinvoice" element={<BagSalesInvoice />} />
          <Route path="/foodarrival/:id" element={<FoodArrivalDetail />} />

          {/* Production detail */}
          <Route path="/production/daily/:id" element={<DailyProductionDetail />} />

          <Route path="/register-items" element={<RegisterItemsPage />} />
          <Route path="/register-items/add" element={<AddItemPage />} />
          <Route path="/register-items/edit/:id" element={<EditItemForm />} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;
