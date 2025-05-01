// App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LayoutWithNavbar from './components/LayoutWithNavbar'; // Import the layout with navbar
import LayoutWithoutNavbar from './components/LayoutWithoutNavbar';
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AccountsPage from "./pages/AccountsPage"; 
import EmployeesPage from "./pages/EmployeesPage";
import UserList from "./components/UserList";
import UserDetail from "./pages/UserDetail";
import UserEdit from "./pages/UserEdit";
import WarehousePage from "./pages/WarehousePage";
import ProductionPage from "./pages/ProductionPage"
import ReportsPage from "./pages/ReportsPage";
import StockPage from "./pages/StockPage";
import SalesPage from "./pages/SalesPage";

function App() {
  return (
    <Router>
      <Routes>
       
       <Route element={<LayoutWithNavbar />}>
         <Route path="/dashboard" element={<Dashboard />} />
         <Route path="/ReportsPage" element={<ReportsPage />} />
       </Route>




      <Route element={<LayoutWithoutNavbar />}>
        <Route path="/login" element={<Login />} />
        <Route path="/AccountsPage" element={<AccountsPage />} />
        <Route path="/EmployeesPage" element={<EmployeesPage />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/user/:id" element={<UserDetail />} />
        <Route path="/edit-user/:id" element={<UserEdit />} />
        <Route path="/warehouse" element={<WarehousePage />} /> 
        <Route path="/production" element={<ProductionPage />}/>
        <Route path="/StockPage" element={<StockPage/>}/>
        <Route path="/SalesPage" element={<SalesPage/>}/>
      </Route>

      </Routes>
    </Router>
  );
}

export default App;
