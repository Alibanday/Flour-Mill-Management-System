// src/LayoutWithoutNavbar.jsx
import { Outlet } from 'react-router-dom';

const LayoutWithoutNavbar = () => {
  return (
    <div className="min-h-screen w-screen bg-white overflow-x-hidden">
      <Outlet /> {/* Renders the child components based on the route */}
    </div>
  );
};

export default LayoutWithoutNavbar;
