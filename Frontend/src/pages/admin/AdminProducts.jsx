import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { FiX, FiEdit, FiTrash2, FiPlus, FiChevronDown, FiPackage } from "react-icons/fi";
import PageLoading from "../../components/commonComp/PageLoading";
import EmptyState from "../../components/commonComp/EmptyState";
import axiosInstance from "../../../axiosCreate";
import LoadingSpinner from "../../components/commonComp/LoadingSpinner";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    rate: "",
    rateType: "daily",
  });

  const rateOptions = [
    { value: "daily", label: "Daily", displayText: "per Day" },
    { value: "weekly", label: "Weekly", displayText: "per Week" },
    { value: "monthly", label: "Monthly", displayText: "per Month" },
  ];

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/api/products");
      setProducts(res.data);
    } catch (error) {
      toast.error("Error fetching products");
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      quantity: "",
      rate: "",
      rateType: "daily",
    });
    setIsEditing(false);
    setEditingId(null);
  };

  // Open modal for adding
  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (product) => {
    setFormData({
      name: product.name,
      quantity: product.quantity,
      rate: product.rate,
      rateType: product.rateType,
    });
    setIsEditing(true);
    setEditingId(product._id);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        await axiosInstance.put(`/api/products/${editingId}`, formData);
        toast.success("Product updated successfully!");
      } else {
        await axiosInstance.post("/api/products", formData);
        toast.success("Product added successfully!");
      }
      closeModal();
      fetchProducts();
    } catch (error) {
      toast.error(isEditing ? "Error updating product" : "Error adding product");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      await axiosInstance.delete(`/api/products/${deleteId}`);
      toast.success("Product deleted successfully!");
      setShowDeleteConfirm(false);
      setDeleteId(null);
      fetchProducts();
    } catch (error) {
      toast.error("Error deleting product");
      console.error("Error deleting product:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open delete confirmation
  const openDeleteConfirm = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  // Get rate type display text
  const getRateTypeDisplay = (rateType) => {
    const option = rateOptions.find(opt => opt.value === rateType);
    return option ? option.displayText : rateType;
  };

  // Show page loading for initial load
  if (isLoading) {
    return <PageLoading message="Loading Products..." />;
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-rose-50 to-pink-50 min-h-screen">
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 bg-[#b86969] bg-clip-text text-transparent">
          Product Management
        </h2>
        <button
          onClick={openAddModal}
          className="bg-[#b86969] hover:to-[#af5d5d] cursor-pointer text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
        >
          <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add Product
        </button>
      </div>

      {/* Products Table or Empty State */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {products.length === 0 ? (
          <EmptyState
            icon={FiPackage}
            title="No Products Yet"
            description="Start managing your inventory by adding your first product. You can set rates for daily, weekly, or monthly rentals."
            actionLabel="Add First Product"
            onAction={openAddModal}
          />
        ) : (
          <>
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#b86969] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Product Name</th>
                    <th className="px-6 py-4 text-left font-semibold">Quantity</th>
                    <th className="px-6 py-4 text-left font-semibold">Rate</th>
                    <th className="px-6 py-4 text-left font-semibold">Rate Type</th>
                    <th className="px-6 py-4 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product, index) => (
                    <tr 
                      key={product._id}
                      className={`hover:bg-rose-50 transition-colors duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 uppercase">{product.name}</td>
                      <td className="px-6 py-4 text-gray-700">{product.quantity}</td>
                      <td className="px-6 py-4 text-gray-700">₹{product.rate}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          {getRateTypeDisplay(product.rateType)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => openEditModal(product)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(product._id)}
                            className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View - Hidden on Desktop */}
            <div className="lg:hidden divide-y divide-gray-200">
              {products.map((product, index) => (
                <div key={product._id} className="p-4 hover:bg-rose-50 transition-colors duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 uppercase text-sm truncate">
                        {product.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">Qty: {product.quantity}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">₹{product.rate}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          {getRateTypeDisplay(product.rateType)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() => openEditModal(product)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(product._id)}
                        className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet Horizontal Scroll View */}
            <div className="hidden sm:block lg:hidden overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-[#b86969] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Product Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Quantity</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Rate</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Rate Type</th>
                    <th className="px-4 py-3 text-center font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product, index) => (
                    <tr 
                      key={product._id}
                      className={`hover:bg-rose-50 transition-colors duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 uppercase text-sm">{product.name}</td>
                      <td className="px-4 py-3 text-gray-700 text-sm">{product.quantity}</td>
                      <td className="px-4 py-3 text-gray-700 text-sm">₹{product.rate}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          {getRateTypeDisplay(product.rateType)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(product._id)}
                            className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white p-2 rounded-lg transition-all duration-200 hover:shadow-md"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-semibold">
                  {isEditing ? "Edit Product" : "Add New Product"}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                  disabled={isSubmitting}
                >
                  <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all disabled:bg-gray-100 text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="0"
                  disabled={isSubmitting}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all disabled:bg-gray-100 text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate
                </label>
                <input
                  type="number"
                  name="rate"
                  placeholder="Enter rate"
                  value={formData.rate}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all disabled:bg-gray-100 text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Type
                </label>
                <div className="relative">
                  <select
                    name="rateType"
                    value={formData.rateType}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer disabled:bg-gray-100 text-sm sm:text-base"
                  >
                    {rateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <FiChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {isSubmitting && <LoadingSpinner size="sm" color="gray" />}
                  {isEditing ? "Update" : "Add"} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <FiTrash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-center text-gray-900 mb-2">
                Delete Product
              </h3>
              <p className="text-gray-600 text-center mb-6 text-sm sm:text-base">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
                >
                  {isDeleting && <LoadingSpinner size="sm" color="gray" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProducts;
