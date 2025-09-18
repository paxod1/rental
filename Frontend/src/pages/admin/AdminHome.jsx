import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { 
  FiPlus, 
  FiPackage, 
  FiUsers, 
  FiTrendingUp, 
  FiCalendar
} from "react-icons/fi";
import LoadingSpinner from "../../components/commonComp/LoadingSpinner";
import axiosInstance from "../../../axiosCreate";
import RentalForm from "../../components/commonComp/admin/RentalForm";

function AdminHome() {
  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    totalCustomers: 0,
    totalRentals: 0,
    activeRentals: 0
  });
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [analyticsRes, productsRes] = await Promise.all([
        axiosInstance.get("/api/analytics"),
        axiosInstance.get("/api/products")
      ]);
      
      setAnalytics(analyticsRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error("Error fetching dashboard data");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleRentalSubmit = async (rentalData) => {
    setIsSubmitting(true);
    try {
      await axiosInstance.post("/api/rentals", rentalData);
      toast.success("Rental booking created successfully!");
      closeModal();
      fetchDashboardData(); // Refresh analytics
    } catch (error) {
      toast.error("Error creating rental booking");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 p-6">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#fdf2f8',
            border: '2px solid #f43f5e',
            color: '#881337',
          },
          success: {
            style: {
              background: '#f0fdf4',
              border: '2px solid #22c55e',
              color: '#15803d',
            },
          },
          error: {
            style: {
              background: '#fef2f2',
              border: '2px solid #ef4444',
              color: '#dc2626',
            },
          },
        }}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
              BRAND MASTERS Dashboard
            </h1>
            <p className="text-gray-600">Welcome to your rental management system</p>
          </div>
          <button
            onClick={openModal}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            New Rental
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalProducts}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiPackage className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalCustomers}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiUsers className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Rentals */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rentals</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalRentals}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FiTrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Active Rentals */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Rentals</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.activeRentals}</p>
            </div>
            <div className="bg-rose-100 p-3 rounded-full">
              <FiCalendar className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={openModal}
            className="p-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-3"
          >
            <FiPlus className="w-5 h-5" />
            Create New Rental
          </button>
          <button className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center gap-3">
            <FiPackage className="w-5 h-5" />
            Manage Products
          </button>
          <button className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center gap-3">
            <FiUsers className="w-5 h-5" />
            View Customers
          </button>
        </div>
      </div>

      {/* Rental Form Modal */}
      <RentalForm
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleRentalSubmit}
        isSubmitting={isSubmitting}
        products={products}
        title="Create New Rental"
        showAdvancePayment={true}
      />
    </div>
  );
}

export default AdminHome;
