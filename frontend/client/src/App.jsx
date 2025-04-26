// App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AccountsPage from "./pages/AccountsPage"; 
import EmployeesPage from "./pages/EmployeesPage";
import UserList from "./components/UserList";
import UserDetail from "./pages/UserDetail";
import UserEdit from "./pages/UserEdit";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/AccountsPage" element={<AccountsPage />} />
        <Route path="/EmployeesPage" element={<EmployeesPage />} />
        <Route path="/users" element={<UserList />} />
          <Route path="/user/:id" element={<UserDetail />} />
          <Route path="/edit-user/:id" element={<UserEdit />} />
      </Routes>
    </Router>
  );
}

export default App;
