import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout"; 
import AdminHome from "./pages/admin/AdminHome";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminRented from "./pages/admin/AdminRented";
import RentalHistory from "./pages/admin/RentalHistory";


function App() {
  return (
    <Router>
      <Routes>
        {/* Admin routes at root path */}
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />   {/* / -> AdminHome */}
          <Route path="/Admin-products" element={<AdminProducts />} />   
          <Route path="/Admin-Rented" element={<AdminRented />} />   
          <Route path="/Rental-History" element={<RentalHistory />} />   
  
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
