import React, { useState, useEffect } from "react";
import { FiX, FiChevronDown, FiDollarSign, FiPhone, FiMapPin } from "react-icons/fi";
import LoadingSpinner from "../LoadingSpinner";

const RentalForm = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  title = "Create New Rental",
  products = [],
  initialData = null,
  showAdvancePayment = true
}) => {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    productId: "",
    quantity: 1,
    days: "",
    startDate: "",
    advancePayment: "",
    notes: ""
  });
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        customerName: initialData.customerName || "",
        customerPhone: initialData.customerPhone || "",
        customerAddress: initialData.customerAddress || "",
        productId: initialData.productId || "",
        quantity: initialData.quantity || 1,
        days: initialData.days || "",
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : "",
        advancePayment: initialData.advancePayment || "",
        notes: initialData.notes || ""
      });
      
      if (initialData.productId) {
        const product = products.find(p => p._id === initialData.productId);
        setSelectedProduct(product);
      }
    } else {
      resetForm();
    }
  }, [initialData, products, isOpen]);

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      productId: "",
      quantity: 1,
      days: "",
      startDate: new Date().toISOString().split('T')[0], // Default to today
      advancePayment: "",
      notes: ""
    });
    setSelectedProduct(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-populate product details when product is selected
    if (name === "productId") {
      const product = products.find(p => p._id === value);
      setSelectedProduct(product);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.customerPhone.trim()) {
      alert("Phone number is required");
      return;
    }
    
    // Prepare data according to new schema
    const submissionData = {
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim(),
      customerAddress: formData.customerAddress.trim() || undefined,
      productId: formData.productId,
      quantity: parseInt(formData.quantity),
      days: formData.days ? parseInt(formData.days) : undefined,
      startDate: formData.startDate,
      advancePayment: formData.advancePayment ? parseFloat(formData.advancePayment) : undefined,
      notes: formData.notes.trim() || undefined
    };

    onSubmit(submissionData);
  };

  const calculateTotal = () => {
    if (!selectedProduct || !formData.quantity || !formData.days) return 0;
    
    let rate = 0;
    switch (selectedProduct.rateType) {
      case 'daily':
        rate = selectedProduct.rate * parseInt(formData.days || 0);
        break;
      case 'weekly':
        rate = selectedProduct.rate * Math.ceil(parseInt(formData.days || 0) / 7);
        break;
      case 'monthly':
        rate = selectedProduct.rate * Math.ceil(parseInt(formData.days || 0) / 30);
        break;
      default:
        rate = selectedProduct.rate;
    }
    
    return rate * parseInt(formData.quantity || 1);
  };

  const getRemainingBalance = () => {
    const total = calculateTotal();
    const advance = parseFloat(formData.advancePayment || 0);
    return Math.max(0, total - advance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
              disabled={isSubmitting}
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Information */}
          <div className="border-b border-gray-200 pb-6">
            <h4 className="text-lg font-medium text-gray-800 mb-4">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  placeholder="Enter customer name"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiPhone className="inline w-4 h-4 mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  placeholder="Enter phone number"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMapPin className="inline w-4 h-4 mr-1" />
                  Address
                </label>
                <textarea
                  name="customerAddress"
                  placeholder="Enter customer address"
                  value={formData.customerAddress}
                  onChange={handleChange}
                  rows="2"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Rental Information */}
          <div className="pb-6">
            <h4 className="text-lg font-medium text-gray-800 mb-4">Rental Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Product *
                </label>
                <div className="relative">
                  <select
                    name="productId"
                    value={formData.productId}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer disabled:bg-gray-100"
                  >
                    <option value="">Choose a product</option>
                    {products.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} (Available: {product.quantity})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <FiChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                  max={selectedProduct?.quantity || 999}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Days
                </label>
                <input
                  type="number"
                  name="days"
                  placeholder="Enter number of days"
                  value={formData.days}
                  onChange={handleChange}
                  min="1"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                />
              </div>

              {showAdvancePayment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Advance Payment
                  </label>
                  <input
                    type="number"
                    name="advancePayment"
                    placeholder="Enter advance amount"
                    value={formData.advancePayment}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    max={calculateTotal()}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  placeholder="Additional notes or special requirements"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Product Details & Calculation */}
          {selectedProduct && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h5 className="font-medium text-gray-800 mb-3">Rental Summary</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Product:</span>
                  <span className="ml-2 font-medium">{selectedProduct.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Rate:</span>
                  <span className="ml-2 font-medium">
                    ${selectedProduct.rate} per {selectedProduct.rateType.replace('ly', '')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Available:</span>
                  <span className="ml-2 font-medium">{selectedProduct.quantity} units</span>
                </div>
                {formData.quantity && formData.days && (
                  <>
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="ml-2 font-bold text-blue-600">
                        ${calculateTotal()}
                      </span>
                    </div>
                    {showAdvancePayment && formData.advancePayment && (
                      <>
                        <div>
                          <span className="text-gray-600">Advance Payment:</span>
                          <span className="ml-2 font-medium text-green-600">
                            ${formData.advancePayment}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Remaining Balance:</span>
                          <span className="ml-2 font-bold text-orange-600">
                            ${getRemainingBalance()}
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.customerName || !formData.customerPhone || !formData.productId || !formData.quantity || !formData.startDate}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <LoadingSpinner size="sm" color="gray" />}
              Create Rental
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RentalForm;
