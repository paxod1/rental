import React, { useState, useEffect } from "react";
import { FiX, FiChevronDown, FiDollarSign, FiPhone, FiMapPin, FiPlus, FiMinus, FiAlertTriangle, FiAlertCircle } from "react-icons/fi";
import { toast } from 'react-toastify';
import LoadingSpinner from "../LoadingSpinner";

const RentalForm = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  title = "Create New Rental",
  products = [],
  initialData = null,
  showAdvancePayment = true,
  showDaysField = true // ✅ New prop to control days field
}) => {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    startDate: "",
    advancePayment: "",
    notes: ""
  });

  const [productItems, setProductItems] = useState([
    { productId: "", quantity: 1, days: "" }
  ]);

  const [quantityErrors, setQuantityErrors] = useState({});

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        customerName: initialData.customerName || "",
        customerPhone: initialData.customerPhone || "",
        customerAddress: initialData.customerAddress || "",
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : "",
        advancePayment: initialData.advancePayment || "",
        notes: initialData.notes || ""
      });

      if (initialData.productId) {
        setProductItems([{
          productId: initialData.productId,
          quantity: initialData.quantity || 1,
          days: initialData.days || ""
        }]);
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
      startDate: new Date().toISOString().split('T')[0],
      advancePayment: "",
      notes: ""
    });
    setProductItems([{ productId: "", quantity: 1, days: "" }]);
    setQuantityErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProductChange = (index, field, value) => {
    const updatedItems = [...productItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setProductItems(updatedItems);

    // Clear quantity error when product changes
    if (field === 'productId') {
      const newErrors = { ...quantityErrors };
      delete newErrors[index];
      setQuantityErrors(newErrors);
      // Reset quantity to 1 when product changes
      updatedItems[index].quantity = 1;
      setProductItems(updatedItems);
    }

    // Validate quantity in real-time
    if (field === 'quantity') {
      validateQuantity(index, value, updatedItems[index].productId);
    }
  };

  // Real-time quantity validation
  const validateQuantity = (index, quantity, productId) => {
    const newErrors = { ...quantityErrors };
    const product = getSelectedProduct(productId);

    if (product && quantity) {
      const qty = parseInt(quantity);
      if (qty > product.quantity) {
        newErrors[index] = `Only ${product.quantity} units available`;
        // ✅ Show toast notification
        toast.warn(`⚠️ Only ${product.quantity} units available for ${product.name}`, {
          autoClose: 3000,
        });
      } else {
        delete newErrors[index];
      }
    } else {
      delete newErrors[index];
    }

    setQuantityErrors(newErrors);
  };

  const addProductRow = () => {
    setProductItems([...productItems, { productId: "", quantity: 1, days: "" }]);
    // ✅ Toast notification
    toast.success('➕ Product row added', { autoClose: 1500 });
  };

  const removeProductRow = (index) => {
    if (productItems.length > 1) {
      const updatedItems = productItems.filter((_, i) => i !== index);
      setProductItems(updatedItems);
      // Remove error for this index
      const newErrors = { ...quantityErrors };
      delete newErrors[index];
      setQuantityErrors(newErrors);
      // ✅ Toast notification
      toast.info('➖ Product row removed', { autoClose: 1500 });
    }
  };

  const getSelectedProduct = (productId) => {
    return products.find(p => p._id === productId);
  };

  // Get stock status for UI styling
  const getStockStatus = (product) => {
    if (!product) return { status: 'unknown', color: 'gray' };
    if (product.quantity <= 0) return { status: 'out-of-stock', color: 'red' };
    if (product.quantity < 10) return { status: 'low-stock', color: 'amber' };
    return { status: 'in-stock', color: 'green' };
  };

  const calculateItemTotal = (item) => {
    if (!item.productId || !item.quantity) return 0;

    const product = getSelectedProduct(item.productId);
    if (!product) return 0;

    let rate = 0;

    // ✅ If days field is shown and has value, calculate based on days
    if (showDaysField && item.days) {
      switch (product.rateType) {
        case 'daily':
          rate = product.rate * parseInt(item.days || 0);
          break;
        case 'weekly':
          rate = product.rate * Math.ceil(parseInt(item.days || 0) / 7);
          break;
        case 'monthly':
          rate = product.rate * Math.ceil(parseInt(item.days || 0) / 30);
          break;
        default:
          rate = product.rate;
      }
    } else {
      // ✅ If days field is not shown or empty, use base rate
      rate = product.rate;
    }

    return rate * parseInt(item.quantity || 1);
  };

  const calculateGrandTotal = () => {
    return productItems.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const getRemainingBalance = () => {
    const total = calculateGrandTotal();
    const advance = parseFloat(formData.advancePayment || 0);
    return Math.max(0, total - advance);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.customerName.trim()) {
      toast.error('❌ Customer name is required');
      return;
    }

    if (!formData.customerPhone.trim()) {
      toast.error('❌ Phone number is required');
      return;
    }

    // Validate product items
    const validItems = productItems.filter(item =>
      item.productId && item.quantity > 0
    );

    if (validItems.length === 0) {
      toast.error('❌ Please add at least one product');
      return;
    }

    // Check for quantity errors
    if (Object.keys(quantityErrors).length > 0) {
      toast.error('❌ Please fix quantity errors before submitting');
      return;
    }

    // Check for insufficient quantities (double check)
    for (const item of validItems) {
      const product = getSelectedProduct(item.productId);
      if (product && product.quantity < item.quantity) {
        toast.error(`❌ Insufficient quantity for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`);
        return;
      }
    }

    // ✅ Show loading toast
    toast.info('📝 Creating rental...', { autoClose: 1000 });

    // Prepare data for submission
    const submissionData = {
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim(),
      customerAddress: formData.customerAddress.trim() || undefined,
      startDate: formData.startDate,
      advancePayment: formData.advancePayment ? parseFloat(formData.advancePayment) : undefined,
      notes: formData.notes.trim() || undefined,
      productItems: validItems.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity),
        // ✅ Only include days if the field is shown and has value
        ...(showDaysField && item.days && { days: parseInt(item.days) })
      }))
    };

    onSubmit(submissionData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#086cbe] text-white px-6 py-4 rounded-t-xl">
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
                  onChange={handleFormChange}
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
                  onChange={handleFormChange}
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
                  onChange={handleFormChange}
                  rows="2"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="pb-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-800">Products to Rent</h4>
              <button
                type="button"
                onClick={addProductRow}
                disabled={isSubmitting}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1 text-sm disabled:opacity-50"
              >
                <FiPlus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            <div className="space-y-4">
              {productItems.map((item, index) => {
                const selectedProduct = getSelectedProduct(item.productId);
                const stockStatus = getStockStatus(selectedProduct);
                const hasQuantityError = quantityErrors[index];

                return (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-medium text-gray-700">Product {index + 1}</h5>
                      {productItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProductRow(index)}
                          disabled={isSubmitting}
                          className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          <FiMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* ✅ Conditional grid columns based on showDaysField */}
                    <div className={`grid grid-cols-1 gap-4 ${showDaysField ? 'md:grid-cols-4' : 'md:grid-cols-3'
                      }`}>
                      <div className={showDaysField ? 'md:col-span-2' : 'md:col-span-1'}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Product *
                        </label>
                        <div className="relative">
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                            required
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer disabled:bg-gray-100"
                          >
                            <option value="">Choose a product</option>
                            {products.map((product) => {
                              const status = getStockStatus(product);
                              const isOutOfStock = product.quantity <= 0;

                              return (
                                <option
                                  key={product._id}
                                  value={product._id}
                                  disabled={isOutOfStock}
                                  className={isOutOfStock ? 'text-gray-400 bg-gray-100' : ''}
                                >
                                  {product.name} - ₹{product.rate}/{product.rateType}
                                  {isOutOfStock ? ' (Out of Stock)' : ` (Available: ${product.quantity})`}
                                </option>
                              );
                            })}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <FiChevronDown className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>

                        {/* Stock Status Indicator */}
                        {selectedProduct && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.status === 'out-of-stock' ? 'bg-red-100 text-red-700' :
                              stockStatus.status === 'low-stock' ? 'bg-amber-100 text-amber-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                              {stockStatus.status === 'out-of-stock' && <FiAlertTriangle className="w-3 h-3" />}
                              {stockStatus.status === 'low-stock' && <FiAlertCircle className="w-3 h-3" />}
                              <span>
                                {stockStatus.status === 'out-of-stock' ? 'Out of Stock' :
                                  stockStatus.status === 'low-stock' ? 'Low Stock' :
                                    'In Stock'}
                              </span>
                            </div>
                            <span className="text-xs text-gray-600">
                              {selectedProduct.quantity} units available
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                          required
                          min="1"
                          max={selectedProduct?.quantity || 999}
                          disabled={isSubmitting || !selectedProduct || selectedProduct.quantity <= 0}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 ${hasQuantityError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                        />

                        {/* Quantity Error Message */}
                        {hasQuantityError && (
                          <div className="mt-1 flex items-center gap-1 text-red-600 text-xs">
                            <FiAlertTriangle className="w-3 h-3" />
                            <span>{hasQuantityError}</span>
                          </div>
                        )}

                        {/* Available Stock Helper */}
                        {selectedProduct && !hasQuantityError && (
                          <div className="mt-1 text-xs text-gray-500">
                            Max: {selectedProduct.quantity}
                          </div>
                        )}
                      </div>

                      {/* ✅ Conditional Days Field */}
                      {showDaysField && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Days (Optional)
                          </label>
                          <input
                            type="number"
                            placeholder="Days"
                            value={item.days}
                            onChange={(e) => handleProductChange(index, 'days', e.target.value)}
                            min="1"
                            disabled={isSubmitting}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                          />
                        </div>
                      )}
                    </div>

                    {/* Product Item Total */}
                    {item.productId && item.quantity && !hasQuantityError && (
                      <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {selectedProduct?.name} × {item.quantity}
                            {showDaysField && item.days && ` × ${item.days} days`}
                          </span>
                          <span className="font-bold text-blue-600">
                            ₹{calculateItemTotal(item).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment & Notes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
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
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  max={calculateGrandTotal()}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                placeholder="Additional notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows="3"
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Grand Total Summary */}
          {calculateGrandTotal() > 0 && Object.keys(quantityErrors).length === 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h5 className="font-medium text-gray-800 mb-3">Rental Summary</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Products:</span>
                  <span className="ml-2 font-medium">
                    {productItems.filter(item => item.productId).length} items
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Grand Total:</span>
                  <span className="ml-2 font-bold text-blue-600">
                    ₹{calculateGrandTotal().toFixed(2)}
                  </span>
                </div>
                {showAdvancePayment && formData.advancePayment && (
                  <>
                    <div>
                      <span className="text-gray-600">Advance Payment:</span>
                      <span className="ml-2 font-medium text-green-600">
                        ₹{formData.advancePayment}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Remaining Balance:</span>
                      <span className="ml-2 font-bold text-orange-600">
                        ₹{getRemainingBalance().toFixed(2)}
                      </span>
                    </div>
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
              disabled={
                isSubmitting ||
                !formData.customerName ||
                !formData.customerPhone ||
                !formData.startDate ||
                productItems.filter(item => item.productId).length === 0 ||
                Object.keys(quantityErrors).length > 0
              }
              className="flex-1 bg-[#086cbe] hover:bg-[#0757a8] text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
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
