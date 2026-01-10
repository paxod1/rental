// App.jsx
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner';
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import AdminHome from "./pages/admin/AdminHome";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminRented from "./pages/admin/AdminRented";
import RentalHistory from "./pages/admin/RentalHistory";
import Login from "./pages/admin/Login";
import GlobalToast from "./components/global/GlobalToast";
import GlobalDeleteModal from "./components/global/GlobalDeleteModal";
import InitialPageLoader from "./components/global/InitialPageLoader";

function App() {
  const isGlobalLoading = useSelector((state) => state.ui.isGlobalLoading);

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

        {/* Global Components */}
        {isGlobalLoading && <InitialPageLoader />}
        <Toaster />
        <GlobalToast />
        <GlobalDeleteModal />
      </Router>
    </AuthProvider>
  );
}

export default App;
