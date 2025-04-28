import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="bg-white shadow-sm w-full">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-2xl font-bold text-blue-800 mr-10">FlourMill Pro</div>
          <nav className="hidden md:flex space-x-8">
            <button 
              className={`px-5 py-2.5 font-semibold rounded-lg transition-all duration-200 ${
                location.pathname === "/dashboard" 
                  ? "!bg-blue-100 text-blue-700 border-b-2 border-blue-600 shadow-md" 
                  : "text-gray-700 hover:text-blue-600 !bg-white hover:shadow-md border hover:border-blue-400"
              }`}
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
              className={`px-5 py-2.5 font-semibold rounded-lg transition-all duration-200 ${
                location.pathname === "/ReportsPage" 
                  ? "!bg-blue-100 text-blue-700 border-b-2 border-blue-600 shadow-md" 
                  : "text-gray-700 hover:text-blue-600 !bg-white hover:shadow-md border hover:border-blue-400"
              }`}
              onClick={() => navigate("/ReportsPage")}
            >
              Reports
            </button>
          </nav>
        </div>

        {/* (Optional: profile and logout buttons can be added here too) */}
      </div>
    </header>
  );
}
