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
import ProductionPage from "./pages/ProductionPage";
import ReportsPage from "./pages/ReportsPage";
import StockPage from "./pages/StockPage";
import SalesPage from "./pages/SalesPage";
import EditUserForm from "./pages/EditUserForm";
import GovernmentPurchase from "./pages/GovernmentPurchase";
import FoodPurchaseInvoice from "./components/FoodPurchaseInvoice";
import FoodArrivalEntry from "./components/FoodArrivalEntry";
import PrivatePurchase from "./pages/PrivatePurchase";

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
          <Route path="/users" element={<UserList />} />
          <Route path="/PrivatePurchase" element={<PrivatePurchase />} />
          <Route path="/user/:id" element={<UserDetail />} />
          <Route path="/gov-purchase" element={<GovernmentPurchase />}>
          
          <Route path="invoice" element={<FoodPurchaseInvoice />} />
          <Route path="arrival" element={<FoodArrivalEntry />} />
        </Route>
          {/* <Route path="/edit-user/:id" element={<UserEdit />} /> */}
          <Route path="/edit-user/:id" element={<EditUserForm />} />
          <Route path="/warehouse" element={<WarehousePage />} /> 
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/StockPage" element={<StockPage />} />
          <Route path="/SalesPage" element={<SalesPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
