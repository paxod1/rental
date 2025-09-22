// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout"; 
import AdminHome from "./pages/admin/AdminHome";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminRented from "./pages/admin/AdminRented";
import RentalHistory from "./pages/admin/RentalHistory";
import Login from "./pages/admin/Login";


function App() {
  return (
    <AuthProvider>
      <Router>
        {/* ✅ Configure Toaster with 2-second duration */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 2000, // 2 seconds for all toasts
            style: {
              background: '#fff',
              color: '#333',
            },
            success: {
              duration: 2000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 2000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected admin routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminHome />} />
            <Route path="Admin-products" element={<AdminProducts />} />
            <Route path="Admin-Rented" element={<AdminRented />} />
            <Route path="Rental-History" element={<RentalHistory />} />
          </Route>
          
          {/* Catch all route - redirect to home if authenticated, login if not */}
          <Route path="*" element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
