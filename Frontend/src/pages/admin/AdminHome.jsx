import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  FiPlus,
  FiPackage,
  FiUsers,
  FiTrendingUp,
  FiCalendar,
  FiActivity,
  FiAlertTriangle,
  FiDollarSign,
  FiArrowUp,
  FiBarChart2,
  FiClock
} from "react-icons/fi";
import LoadingSpinner from "../../components/commonComp/LoadingSpinner";
import axiosInstance from "../../../axiosCreate";
import RentalForm from "../../components/commonComp/admin/RentalForm";
import { Link, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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
      console.log(analyticsRes.data, productsRes.data);

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
      fetchDashboardData();
    } catch (error) {
      toast.error("Error creating rental booking");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get stock status
  const getStockStatus = (quantity) => {
    if (quantity < 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-50 border-red-200', icon: 'text-red-600' };
    if (quantity < 10) return { status: 'Low Stock', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: 'text-amber-600' };
    if (quantity < 50) return { status: 'Medium Stock', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: 'text-blue-600' };
    return { status: 'In Stock', color: 'text-green-600 bg-green-50 border-green-200', icon: 'text-green-600' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const lowStockProducts = products.filter(p => p.quantity < 10).length;
  const outOfStockProducts = products.filter(p => p.quantity < 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#334155',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
          success: {
            style: {
              background: '#f0fdf4',
              border: '1px solid #22c55e',
              color: '#15803d',
            },
          },
          error: {
            style: {
              background: '#fef2f2',
              border: '1px solid #ef4444',
              color: '#dc2626',
            },
          },
        }}
      />

      <div className="p-3 sm:p-4 lg:p-6 w-[95%] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#994646] mb-2 sm:mb-3">
                Welcome Back! 👋
              </h1>
              <p className="text-gray-700 text-sm sm:text-base lg:text-lg">
                Here's what's happening with your rental business today
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button className="bg-white hover:bg-slate-50 text-slate-700 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 border border-slate-200 text-sm sm:text-base">
                <FiBarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Reports</span>
                <span className="sm:hidden">Reports</span>
              </button>
              <button
                onClick={openModal}
                className="bg-[#b86969] hover:bg-[#994646] cursor-pointer text-white px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                New Rental
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {/* Total Products */}
          <div onClick={() => { navigate("/Admin-products") }} className="cursor-pointer bg-white rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg lg:rounded-xl">
                <FiPackage className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <FiArrowUp className="w-2 h-2 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Active</span>
              </div>
            </div>
            <div>
              <h3 className="text-slate-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Total Products</h3>
              <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-800">{analytics.totalProducts}</p>
            </div>
          </div>

          {/* Active Rentals */}
          <div onClick={() => { navigate("/Admin-Rented") }} className="bg-white cursor-pointer rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="bg-green-100 p-2 sm:p-3 rounded-lg lg:rounded-xl">
                <FiActivity className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <FiArrowUp className="w-2 h-2 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Live</span>
              </div>
            </div>
            <div>
              <h3 className="text-slate-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Active Rentals</h3>
              <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-800">{analytics.activeRentals}</p>
            </div>
          </div>

          {/* Total Rentals */}
          <div className="bg-white cursor-pointer rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="bg-purple-100 p-2 sm:p-3 rounded-lg lg:rounded-xl">
                <FiTrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
              </div>
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                <FiArrowUp className="w-2 h-2 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">+18%</span>
              </div>
            </div>
            <div>
              <h3 className="text-slate-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Total Rentals</h3>
              <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-800">{analytics.totalRentals}</p>
            </div>
          </div>

          {/* Stock Alerts */}
          <div onClick={() => { navigate("/Admin-products") }} className="bg-white cursor-pointer rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className={`p-2 sm:p-3 rounded-lg lg:rounded-xl ${outOfStockProducts > 0 ? 'bg-red-100' : lowStockProducts > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
                <FiAlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${outOfStockProducts > 0 ? 'text-red-600' : lowStockProducts > 0 ? 'text-amber-600' : 'text-green-600'}`} />
              </div>
              <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${outOfStockProducts > 0 ? 'bg-red-100 text-red-700' :
                lowStockProducts > 0 ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                <span className="hidden sm:inline">
                  {outOfStockProducts > 0 ? 'Critical' : lowStockProducts > 0 ? 'Warning' : 'Good'}
                </span>
                <span className="sm:hidden">
                  {outOfStockProducts > 0 ? '!' : lowStockProducts > 0 ? '⚠' : '✓'}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-slate-600 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Stock Alerts</h3>
              <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-800">{lowStockProducts + outOfStockProducts}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

          {/* Products Inventory */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg border border-slate-100">
              <div className="p-4 sm:p-6 border-b border-slate-100">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FiPackage className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  Product Inventory
                </h3>
              </div>

              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {products.map((product, index) => {
                    const stockStatus = getStockStatus(product.quantity);
                    return (
                      <div key={product._id} className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 hover:bg-slate-100 rounded-lg lg:rounded-xl transition-colors">
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                          <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm flex-shrink-0">
                            <FiPackage className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-slate-800 capitalize text-sm sm:text-base truncate">{product.name}</h4>
                            <p className="text-xs sm:text-sm text-slate-600">₹{product.rate}/{product.rateType}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-sm sm:text-base lg:text-lg font-bold text-slate-800">
                              {product.quantity.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 sm:hidden">units</p>
                            <div className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                              <span className="hidden sm:inline">{stockStatus.status}</span>
                              <span className="sm:hidden">
                                {stockStatus.status === 'Out of Stock' ? 'Out' :
                                 stockStatus.status === 'Low Stock' ? 'Low' :
                                 stockStatus.status === 'Medium Stock' ? 'Med' : 'Good'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Stats */}
          <div className="xl:col-span-1 space-y-4 sm:space-y-6">

            {/* Quick Actions */}
            <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-100">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
                <FiActivity className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                Quick Actions
              </h3>

              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={openModal}
                  className="w-full cursor-pointer group p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg lg:rounded-xl transition-all duration-300 text-left shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-white bg-opacity-20 p-1.5 sm:p-2 rounded-lg group-hover:bg-opacity-30 transition-all flex-shrink-0">
                      <FiPlus className="w-4 h-4 sm:w-5 sm:h-5 text-[#b86969]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base">New Rental</h4>
                      <p className="text-blue-100 text-xs sm:text-sm">Create booking</p>
                    </div>
                  </div>
                </button>

                <button 
                  className="w-full cursor-pointer group p-3 sm:p-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg lg:rounded-xl transition-all duration-300 text-left shadow-lg hover:shadow-xl"
                  onClick={() => { navigate("/Admin-products") }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-white bg-opacity-20 p-1.5 sm:p-2 rounded-lg group-hover:bg-opacity-30 transition-all flex-shrink-0">
                      <FiPackage className="w-4 h-4 sm:w-5 sm:h-5 text-[#b86969]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base">Manage Products</h4>
                      <p className="text-green-100 text-xs sm:text-sm">Update inventory</p>
                    </div>
                  </div>
                </button>

                <button className="w-full cursor-not-allowed group p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg lg:rounded-xl transition-all duration-300 text-left shadow-lg hover:shadow-xl">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-white bg-opacity-20 p-1.5 sm:p-2 rounded-lg group-hover:bg-opacity-30 transition-all flex-shrink-0">
                      <FiBarChart2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#b86969]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base">View Reports</h4>
                      <p className="text-purple-100 text-xs sm:text-sm">Business analytics</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

          </div>
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
