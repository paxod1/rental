// layouts/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from '../components/commonComp/admin/AdminNavbar';
import { useAuth } from '../contexts/AuthContext';

function AdminLayout() {
  const { logout } = useAuth();

  const handleMenuClick = () => {
    // Handle mobile menu click if needed
  };

  return (
    <div >
      {/* Navbar always visible */}
      <AdminNavbar onMenuClick={handleMenuClick} onLogout={logout} />

      {/* Page content changes here */}
      <div className='pt-16 sm:pb-0 pb-20 '>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
