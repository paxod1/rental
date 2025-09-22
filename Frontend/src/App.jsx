// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
          
          {/* Catch all route */}
          <Route path="*" element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          } />
        </Routes>

        {/* ✅ Only ToastContainer - removed Toaster */}
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastStyle={{
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
