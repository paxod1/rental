import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { showToast } from "../../store/slices/toastSlice";
import { openDeleteModal, closeDeleteModal, setDeleteModalLoading, setGlobalLoading } from "../../store/slices/uiSlice";
import { FiX, FiEdit, FiTrash2, FiPlus, FiChevronDown, FiPackage } from "react-icons/fi";
import EmptyState from "../../components/commonComp/EmptyState";
import axiosInstance from "../../../axiosCreate";
import LoadingSpinner from "../../components/commonComp/LoadingSpinner";
import Pagination from "../../components/global/Pagination";

function AdminProducts() {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    rate: "",
    rateType: "daily",
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  const rateOptions = [
    { value: "daily", label: "Daily", displayText: "per Day" },
    { value: "weekly", label: "Weekly", displayText: "per Week" },
    { value: "monthly", label: "Monthly", displayText: "per Month" },
  ];

  // Fetch products
  useEffect(() => {
    fetchProducts(true);
  }, []);

  const fetchProducts = async (showGlobalLoader = false) => {
    try {
      if (showGlobalLoader) dispatch(setGlobalLoading(true));
      setIsLoading(true);
      const res = await axiosInstance.get("/api/products");
      setProducts(res.data);
    } catch (error) {
      dispatch(showToast({ message: "Error fetching products", type: "error" }));
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
      dispatch(setGlobalLoading(false));
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
        dispatch(showToast({ message: "Product updated successfully!", type: "success" }));
      } else {
        await axiosInstance.post("/api/products", formData);
        dispatch(showToast({ message: "Product added successfully!", type: "success" }));
      }
      closeModal();
      fetchProducts(false);
    } catch (error) {
      dispatch(showToast({ message: isEditing ? "Error updating product" : "Error adding product", type: "error" }));
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      dispatch(setDeleteModalLoading(true));
      await axiosInstance.delete(`/api/products/${id}`);
      await fetchProducts(false);
      dispatch(showToast({ message: "Product deleted successfully!", type: "success" }));
      dispatch(closeDeleteModal());
    } catch (error) {
      console.error("Error deleting product:", error);
      dispatch(showToast({ message: "Error deleting product", type: "error" }));
      dispatch(setDeleteModalLoading(false));
    }
  };

  // Open delete confirmation
  const openDeleteConfirm = (id) => {
    dispatch(openDeleteModal({
      title: "Delete Product",
      message: "Are you sure you want to delete this product? This action cannot be undone.",
      confirmText: "Delete Product",
      onConfirm: () => handleDelete(id)
    }));
  };

  // Get rate type display text
  const getRateTypeDisplay = (rateType) => {
    const option = rateOptions.find(opt => opt.value === rateType);
    return option ? option.displayText : rateType;
  };


  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-white min-h-screen">


      {/* Header */}
      <div className="flex md:mt-5 flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900">
          Product Management
        </h2>
        <button
          onClick={openAddModal}
          className="bg-[#086cbe] hover:bg-[#0757a8] cursor-pointer text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
        >
          <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add Product
        </button>
      </div>

      {/* Products Table or Empty State */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
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
              <table className="w-full border rounded-md border-gray-200 ">
                <thead className="bg-white border-b border-gray-200 text-black">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-sm lg:text-base">Product Name</th>
                    <th className="px-6 py-4 text-left font-bold text-sm lg:text-base">Quantity</th>
                    <th className="px-6 py-4 text-left font-bold text-sm lg:text-base">Rate</th>
                    <th className="px-6 py-4 text-left font-bold text-sm lg:text-base">Rate Type</th>
                    <th className="px-6 py-4 text-center font-bold text-sm lg:text-base">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((product, index) => (
                      <tr
                        key={product._id}
                        className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 uppercase text-sm lg:text-base">{product.name}</td>
                        <td className="px-6 py-4 text-gray-700 text-sm lg:text-base">{product.quantity}</td>
                        <td className="px-6 py-4 text-gray-700 text-sm lg:text-base">₹{product.rate}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#086cbe]">
                            {getRateTypeDisplay(product.rateType)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => openEditModal(product)}
                              className="bg-gradient-to-r from-blue-600 to-[#086cbe] hover:from-[#086cbe] hover:to-blue-700 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(product._id)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
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
              {products
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((product, index) => (
                  <div key={product._id} className="p-4 hover:bg-blue-50 transition-colors duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 uppercase text-sm truncate">
                          {product.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Qty: {product.quantity}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">₹{product.rate}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#086cbe]">
                            {getRateTypeDisplay(product.rateType)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <button
                          onClick={() => openEditModal(product)}
                          className="bg-[#086cbe] hover:bg-[#0757a8] text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(product._id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
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
                <thead className="bg-[#086cbe] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Product Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Quantity</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Rate</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm">Rate Type</th>
                    <th className="px-4 py-3 text-center font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((product, index) => (
                      <tr
                        key={product._id}
                        className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 uppercase text-sm">{product.name}</td>
                        <td className="px-4 py-3 text-gray-700 text-sm">{product.quantity}</td>
                        <td className="px-4 py-3 text-gray-700 text-sm">₹{product.rate}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-[#086cbe]">
                            {getRateTypeDisplay(product.rateType)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openEditModal(product)}
                              className="bg-[#086cbe] hover:bg-[#0757a8] text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(product._id)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
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

      {/* Pagination */}
      {products.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(products.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 w-full max-w-md transform transition-all">
            <div className="bg-[#086cbe] text-white px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl">
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
                <label className="block text-sm lg:text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#086cbe] focus:border-transparent transition-all disabled:bg-gray-100 text-sm sm:text-base lg:text-base"
                />
              </div>

              <div>
                <label className="block text-sm lg:text-sm font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#086cbe] focus:border-transparent transition-all disabled:bg-gray-100 text-sm sm:text-base lg:text-base"
                />
              </div>

              <div>
                <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2">
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
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#086cbe] focus:border-transparent transition-all disabled:bg-gray-100 text-sm sm:text-base lg:text-base"
                />
              </div>

              <div>
                <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2">
                  Rate Type
                </label>
                <div className="relative">
                  <select
                    name="rateType"
                    value={formData.rateType}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#086cbe] focus:border-transparent transition-all appearance-none bg-white cursor-pointer disabled:bg-gray-100 text-sm sm:text-base"
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
                  className="flex-1 bg-[#086cbe] hover:bg-[#0757a8] text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base lg:text-base"
                >
                  {isSubmitting && <LoadingSpinner size="sm" color="gray" />}
                  {isEditing ? "Update" : "Add"} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminProducts;
