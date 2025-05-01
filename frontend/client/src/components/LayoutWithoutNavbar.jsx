// src/LayoutWithoutNavbar.jsx
import { Outlet } from 'react-router-dom';

const LayoutWithoutNavbar = () => {
  return (
    <div className="main-content">
      <Outlet /> {/* Renders the child components based on the route */}
    </div>
  );
};

export default LayoutWithoutNavbar;
