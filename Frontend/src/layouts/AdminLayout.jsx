import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminNavbar from '../components/commonComp/admin/AdminNavbar'

function AdminLayout() {
    return (
        <div>
            {/* Navbar always visible */}
            <AdminNavbar />

            {/* Page content changes here */}
            <div className='pt-16'>
                <Outlet />
            </div>
        </div>
    )
}

export default AdminLayout
