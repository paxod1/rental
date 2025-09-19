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
  FiBarChart2, // ✅ Changed from FiBarChart3
  FiClock
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const lowStockProducts = products.filter(p => p.quantity < 10).length;
  const outOfStockProducts = products.filter(p => p.quantity < 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-r from-rose-50 to-pink-50">
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

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-3">
                Welcome Back! 👋
              </h1>
              <p className="text-slate-600 text-lg">
                Here's what's happening with your rental business today
              </p>
            </div>
            
            <div className="flex gap-3">
              <button className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 border border-slate-200">
                <FiBarChart2 className="w-5 h-5" />
                Reports
              </button>
              <button
                onClick={openModal}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                <FiPlus className="w-5 h-5" />
                New Rental
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Total Products */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <FiPackage className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <FiArrowUp className="w-3 h-3" />
                Active
              </div>
            </div>
            <div>
              <h3 className="text-slate-600 text-sm font-medium mb-2">Total Products</h3>
              <p className="text-2xl lg:text-3xl font-bold text-slate-800">{analytics.totalProducts}</p>
            </div>
          </div>

          {/* Active Rentals */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <FiActivity className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <FiArrowUp className="w-3 h-3" />
                Live
              </div>
            </div>
            <div>
              <h3 className="text-slate-600 text-sm font-medium mb-2">Active Rentals</h3>
              <p className="text-2xl lg:text-3xl font-bold text-slate-800">{analytics.activeRentals}</p>
            </div>
          </div>

          {/* Total Rentals */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-xl">
                <FiTrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                <FiArrowUp className="w-3 h-3" />
                +18%
              </div>
            </div>
            <div>
              <h3 className="text-slate-600 text-sm font-medium mb-2">Total Rentals</h3>
              <p className="text-2xl lg:text-3xl font-bold text-slate-800">{analytics.totalRentals}</p>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${outOfStockProducts > 0 ? 'bg-red-100' : lowStockProducts > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
                <FiAlertTriangle className={`w-6 h-6 ${outOfStockProducts > 0 ? 'text-red-600' : lowStockProducts > 0 ? 'text-amber-600' : 'text-green-600'}`} />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                outOfStockProducts > 0 ? 'bg-red-100 text-red-700' : 
                lowStockProducts > 0 ? 'bg-amber-100 text-amber-700' : 
                'bg-green-100 text-green-700'
              }`}>
                {outOfStockProducts > 0 ? 'Critical' : lowStockProducts > 0 ? 'Warning' : 'Good'}
              </div>
            </div>
            <div>
              <h3 className="text-slate-600 text-sm font-medium mb-2">Stock Alerts</h3>
              <p className="text-2xl lg:text-3xl font-bold text-slate-800">{lowStockProducts + outOfStockProducts}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Products Inventory */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FiPackage className="w-6 h-6 text-blue-600" />
                  Product Inventory
                </h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {products.map((product, index) => {
                    const stockStatus = getStockStatus(product.quantity);
                    return (
                      <div key={product._id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <FiPackage className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 capitalize">{product.name}</h4>
                            <p className="text-sm text-slate-600">₹{product.rate}/{product.rateType}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-slate-800">
                              {product.quantity.toLocaleString()} units
                            </p>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                              {stockStatus.status}
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
          <div className="xl:col-span-1 space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FiActivity className="w-6 h-6 text-green-600" />
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={openModal}
                  className="w-full group p-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl transition-all duration-300 text-left shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:bg-opacity-30 transition-all">
                      <FiPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">New Rental</h4>
                      <p className="text-blue-100 text-sm">Create booking</p>
                    </div>
                  </div>
                </button>

                <button className="w-full group p-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all duration-300 text-left shadow-lg hover:shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:bg-opacity-30 transition-all">
                      <FiPackage className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Manage Products</h4>
                      <p className="text-green-100 text-sm">Update inventory</p>
                    </div>
                  </div>
                </button>

                <button className="w-full group p-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-300 text-left shadow-lg hover:shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:bg-opacity-30 transition-all">
                      <FiBarChart2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">View Reports</h4>
                      <p className="text-purple-100 text-sm">Business analytics</p>
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
