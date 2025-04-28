import { useNavigate } from "react-router-dom";
import {
  FaBook, FaCashRegister, FaChartBar, FaFileInvoiceDollar, FaFileAlt, FaFolderOpen, FaWarehouse, FaSignOutAlt, FaUserCog
} from "react-icons/fa";

export default function ReportsPage() {
  const navigate = useNavigate();
  const activeMenu = "Reports"; // Set active menu to Reports

  const reportsMenu = [
    { name: "Sales Report", icon: <FaFileInvoiceDollar className="mr-3"  /> },
    { name: "Purchase Report", icon: <FaCashRegister className="mr-3"  /> },
    { name: "Stock Report", icon: <FaChartBar className="mr-3" /> },
    { name: "Transaction Report", icon: <FaBook className="mr-3"  /> },
    { name: "Attendance", icon: <FaFileAlt className="mr-3"  /> },
    { name: "Payroll Report", icon: <FaFileAlt className="mr-3" /> }
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div 
      className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-sm z-0"
      style={{ backgroundImage: "url('/dashboard.jpg')" }}
    >
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm w-full">
        <div className="px-6 py-3 flex items-center justify-between w-full">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
            <nav className="hidden md:flex space-x-8">
              <button 
                className={`px-4 py-2 font-medium rounded-md transition duration-150 ${activeMenu === "Dashboard" ? "text-gray-600 hover:text-blue-600 !bg-white hover:shadow-sm" : "text-gray-600 hover:text-blue-600 !bg-gray-200 hover:shadow-sm"}`}
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </button>

              {/*<button 
                className={`px-4 py-2 font-medium rounded-md transition duration-150 ${activeMenu === "Operations" ? "text-gray-600 hover:text-blue-600 !bg-white hover:shadow-sm" : "text-gray-600 hover:text-blue-600 !bg-white hover:shadow-sm"}`}
                onClick={() => console.log("Operations clicked")}
              >
                Operations
              </button>*/}

              <button 
                className={`px-4 py-2 font-medium rounded-md transition duration-150 ${activeMenu === "Reports" ? "!bg-blue-50 text-blue-600 border-b-2 border-blue-600 shadow-sm" : "text-gray-600 hover:text-blue-600 !bg-white hover:shadow-sm"}`}
                onClick={() => navigate("/ReportsPage")}
              >
                Reports
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full !bg-gray-100 text-gray-600 hover:bg-gray-200">
              <FaUserCog className="text-lg" />
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 !bg-transparent"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        {/* Sidebar */}
            <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] hidden md:block">
            <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Reports Menu</h3>
                <ul className="space-y-1">
                {reportsMenu.map((item, idx) => (
                    <li key={idx}>
                    <button
                        onClick={() => console.log(`${item.name} clicked`)}
                        className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors !bg-transparent"
                        >
                    {item.icon}
                    {item.name}
                    </button>
                    </li>
                ))}
                </ul>
            </div>
            </aside>


        {/* Main Reports Area */}
        <main className="flex-1 p-6 w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports Overview</h1>

          {/* Placeholder content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ReportCard title="Sales This Month" value="Rs. 1,20,000" />
            <ReportCard title="Total Stock Available" value="560 Units" />
            <ReportCard title="Monthly Payroll" value="Rs. 80,000" />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 mt-8 border border-gray-100 text-gray-600">
            <h2 className="text-lg font-semibold mb-4">Quick Summary</h2>
            <p>Click on any report from the left menu to view detailed analysis.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

function ReportCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100">
      <div className="text-sm font-medium text-gray-500 mb-1">{title}</div>
      <div className="text-2xl font-semibold text-gray-800">{value}</div>
    </div>
  );
}
