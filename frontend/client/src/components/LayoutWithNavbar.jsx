// src/LayoutWithNavbar.jsx
import Navbar from './Navbar'; // Import your Navbar component
import { Outlet } from 'react-router-dom'; // React Router outlet to render the page content

const LayoutWithNavbar = () => {
  return (
    <>
      <Navbar />
      <div className="main-content">
        <Outlet /> {/* Renders the child components based on the route */}
      </div>
    </>
  );
};

export default LayoutWithNavbar;
