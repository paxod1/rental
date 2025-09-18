// pages/admin/RentalHistory.jsx - Fixed version
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  FiSearch,
  FiEye,
  FiDollarSign,
  FiCalendar,
  FiPackage,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2
} from "react-icons/fi";
import PageLoading from "../../components/commonComp/PageLoading";
import EmptyState from "../../components/commonComp/EmptyState";
import LoadingSpinner from "../../components/commonComp/LoadingSpinner";
import axiosInstance from "../../../axiosCreate";

function RentalHistory() {
  const [rentals, setRentals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRentals, setTotalRentals] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRental, setSelectedRental] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentType: 'partial_payment',
    notes: ''
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rentalToDelete, setRentalToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function firstFeatch() {
      setIsLoading(true);
      await fetchRentalHistory();
      setIsLoading(false);
    }
    firstFeatch()
  }, [currentPage, statusFilter]);

  const fetchRentalHistory = async () => {
    try {

      const response = await axiosInstance.get("/api/rentals/all-history", {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm,
          status: statusFilter
        }
      });

      setRentals(response.data.rentals);
      setTotalPages(response.data.totalPages);
      setTotalRentals(response.data.totalRentals);
    } catch (error) {
      toast.error("Error fetching rental history");
      console.error("Error:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    fetchRentalHistory()
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openModal = (rental) => {
    setSelectedRental(rental);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRental(null);
  };

  const openPaymentModal = (rental) => {
    setSelectedRental(rental);
    setPaymentData({
      amount: '',
      paymentType: 'partial_payment',
      notes: ''
    });
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedRental(null);
    setPaymentData({
      amount: '',
      paymentType: 'partial_payment',
      notes: ''
    });
  };

  const handlePaymentChange = (e) => {
    setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axiosInstance.put(`/api/rentals/${selectedRental._id}/history-payment`, {
        amount: parseFloat(paymentData.amount),
        paymentType: paymentData.paymentType,
        notes: paymentData.notes
      });

      toast.success("Payment added successfully!");
      closePaymentModal();
      fetchRentalHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding payment");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openDeleteModal = (rental) => {
    setRentalToDelete(rental);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setRentalToDelete(null);
    setIsDeleting(false);
  };

  const handleDeleteConfirm = async () => {
    if (!rentalToDelete) return;

    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/api/rentals/${rentalToDelete._id}`);
      toast.success("Rental record deleted successfully!");
      closeDeleteModal();
      fetchRentalHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting rental");
      console.error("Error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDifference = end.getTime() - start.getTime();
    return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  };

  // Fixed getPaymentStatus function
  const getPaymentStatus = (rental) => {
    if (rental.balanceAmount <= 0) {
      return {
        status: 'paid',
        color: 'bg-green-100 text-green-800',
        icon: FiCheckCircle,
        text: 'Fully Paid',
        canDelete: true
      };
    } else if (rental.totalPaid > 0) {
      return {
        status: 'partial',
        color: 'bg-yellow-100 text-yellow-800',
        icon: FiAlertCircle,
        text: 'Partial Payment',
        canDelete: true
      };
    } else {
      return {
        status: 'pending',
        color: 'bg-red-100 text-red-800',
        icon: FiAlertCircle,
        text: 'Payment Pending',
        canDelete: true
      };
    }
  };

  if (isLoading) {
    return <PageLoading message="Loading Rental History..." />;
  }

  return (
    <div className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 min-h-screen">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#fdf2f8', border: '2px solid #f43f5e', color: '#881337' },
          success: { style: { background: '#f0fdf4', border: '2px solid #22c55e', color: '#15803d' } },
          error: { style: { background: '#fef2f2', border: '2px solid #ef4444', color: '#dc2626' } },
        }}
      />

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
          Rental History
        </h2>
        <p className="text-gray-600 mt-2">Complete rental records and payment management</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-600">
            Total: {totalRentals} rentals
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'all'
              ? 'bg-rose-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            All Rentals
          </button>
          <button
            onClick={() => handleStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'completed'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Fully Paid
          </button>
          <button
            onClick={() => handleStatusFilter('pending_payment')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === 'pending_payment'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Pending Payment
          </button>
        </div>
      </div>

      {/* Rental History Table */}
      {rentals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-xl">
          <EmptyState
            icon={FiPackage}
            title="No Rental History"
            description="No rentals found matching your criteria."
            showAction={false}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rentals.map((rental) => {
                  const paymentStatus = getPaymentStatus(rental);
                  return (
                    <tr key={rental._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {rental.customerName}
                          </div>
                          {rental.customerEmail && (
                            <div className="text-sm text-gray-500">
                              {rental.customerEmail}
                            </div>
                          )}
                          {rental.customerPhone && (
                            <div className="text-sm text-gray-500">
                              {rental.customerPhone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {rental.productId?.name || 'Unknown Product'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rental.initialQuantity} units
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {calculateDuration(rental.startDate, rental.updatedAt)} days
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(rental.startDate)} - {formatDate(rental.updatedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Total: ${rental.totalAmount}
                        </div>
                        <div className="text-sm text-green-600">
                          Paid: ${rental.totalPaid}
                        </div>
                        {rental.balanceAmount > 0 && (
                          <div className="text-sm text-red-600 font-medium">
                            Balance: ${rental.balanceAmount}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatus.color}`}>
                          <paymentStatus.icon className="w-3 h-3" />
                          {paymentStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal(rental)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                          >
                            <FiEye className="w-4 h-4" />
                            View
                          </button>
                          {rental.balanceAmount > 0 && (
                            <button
                              onClick={() => openPaymentModal(rental)}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                            >
                              <FiCreditCard className="w-4 h-4" />
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteModal(rental)}
                            className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <FiChevronLeft className="h-5 w-5" />
                    </button>
                    {[...Array(Math.min(5, totalPages))].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                            ? 'z-10 bg-rose-50 border-rose-500 text-rose-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <FiChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedRental && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Add Payment</h3>
                <button
                  onClick={closePaymentModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Customer</div>
                <div className="font-semibold">{selectedRental.customerName}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Balance Due: <span className="font-bold text-red-600">${selectedRental.balanceAmount}</span>
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={paymentData.amount}
                  onChange={handlePaymentChange}
                  step="0.01"
                  min="0.01"
                  max={selectedRental.balanceAmount}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Enter payment amount"
                />
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type
                </label>
                <select
                  name="paymentType"
                  value={paymentData.paymentType}
                  onChange={handlePaymentChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="partial_payment">Partial Payment</option>
                  <option value="full_payment">Full Payment</option>
                </select>
              </div>

              {/* Payment Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={paymentData.notes}
                  onChange={handlePaymentChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Payment method, reference number, etc."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <LoadingSpinner size="sm" color="gray" />}
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rental Details Modal */}
      {isModalOpen && selectedRental && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Rental Details</h3>
                <button
                  onClick={closeModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Customer Info */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiUser className="w-5 h-5" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedRental.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedRental.customerEmail || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedRental.customerPhone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">
                      {calculateDuration(selectedRental.startDate, selectedRental.updatedAt)} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiPackage className="w-5 h-5" />
                  Product Information
                </h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-blue-600">Product Name</p>
                      <p className="font-medium text-blue-900">{selectedRental.productId?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Quantity</p>
                      <p className="font-medium text-blue-900">{selectedRental.initialQuantity} units</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Rate</p>
                      <p className="font-medium text-blue-900">
                        ${selectedRental.productId?.rate} per {selectedRental.productId?.rateType?.replace('ly', '')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Rental Period</p>
                      <p className="font-medium text-blue-900">
                        {formatDate(selectedRental.startDate)} - {formatDate(selectedRental.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiDollarSign className="w-5 h-5" />
                  Financial Summary
                </h4>
                <div className={`p-4 rounded-lg ${selectedRental.balanceAmount <= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className={`text-sm ${selectedRental.balanceAmount <= 0 ? 'text-green-600' : 'text-red-600'}`}>Total Amount</p>
                      <p className={`font-bold text-2xl ${selectedRental.balanceAmount <= 0 ? 'text-green-900' : 'text-red-900'}`}>${selectedRental.totalAmount}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${selectedRental.balanceAmount <= 0 ? 'text-green-600' : 'text-red-600'}`}>Total Paid</p>
                      <p className={`font-bold text-2xl ${selectedRental.balanceAmount <= 0 ? 'text-green-900' : 'text-red-900'}`}>${selectedRental.totalPaid}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${selectedRental.balanceAmount <= 0 ? 'text-green-600' : 'text-red-600'}`}>Balance</p>
                      <p className={`font-bold text-2xl ${selectedRental.balanceAmount <= 0 ? 'text-green-900' : 'text-red-900'}`}>${selectedRental.balanceAmount}</p>
                    </div>
                  </div>
                  {selectedRental.balanceAmount > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          closeModal();
                          openPaymentModal(selectedRental);
                        }}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <FiCreditCard className="w-4 h-4" />
                        Add Payment
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction History */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Transaction History</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedRental.transactions?.map((transaction, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {transaction.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span>${transaction.amount}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {transaction.quantity} units
                        {transaction.days && ` × ${transaction.days} days`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Payment History</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedRental.payments?.map((payment, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {payment.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="font-bold text-green-700">${payment.amount}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(payment.date)}
                      </p>
                      {payment.notes && (
                        <p className="text-xs text-gray-600 mt-1">{payment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && rentalToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Delete Rental Record</h3>
                <button
                  onClick={closeDeleteModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Warning Message */}
              <div className="flex items-center gap-3 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <FiTrash2 className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">Are you sure you want to delete this rental?</p>
                  <p className="text-red-600 text-sm mt-1">This action cannot be undone.</p>
                </div>
              </div>

              {/* Rental Details */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">{rentalToDelete.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Product</p>
                    <p className="font-medium">{rentalToDelete.productId?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-medium">${rentalToDelete.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium capitalize">{rentalToDelete.status.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              {/* Warning if there's outstanding balance */}
              {rentalToDelete.balanceAmount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="w-5 h-5 text-yellow-600" />
                    <p className="text-yellow-800 font-medium">Outstanding Balance</p>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    This rental has an outstanding balance of <strong>${rentalToDelete.balanceAmount}</strong>.
                    Deleting this record will permanently remove all payment history.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting && <LoadingSpinner size="sm" color="gray" />}
                  {isDeleting ? 'Deleting...' : 'Delete Rental'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RentalHistory;
