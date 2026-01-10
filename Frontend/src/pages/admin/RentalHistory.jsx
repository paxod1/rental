import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { showToast } from "../../store/slices/toastSlice";
import { openDeleteModal, closeDeleteModal, setDeleteModalLoading, setGlobalLoading } from "../../store/slices/uiSlice";
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
  FiTrash2,
  FiPhone,
  FiMapPin
} from "react-icons/fi";
import EmptyState from "../../components/commonComp/EmptyState";
import LoadingSpinner from "../../components/commonComp/LoadingSpinner";
import axiosInstance from "../../../axiosCreate";
import Pagination from "../../components/global/Pagination";

function RentalHistory() {
  const dispatch = useDispatch();
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Enhanced payment data with discount support (same as RentalDetails)
  const [paymentData, setPaymentData] = useState({
    amount: '',
    discountAmount: '0',
    paymentType: 'partial_payment',
    notes: '',
    discountNotes: ''
  });

  useEffect(() => {
    fetchRentalHistory(isInitialLoad);
    if (isInitialLoad) setIsInitialLoad(false);
  }, [currentPage, statusFilter]);

  const fetchRentalHistory = async (showGlobalLoader = false) => {
    try {
      if (showGlobalLoader) dispatch(setGlobalLoading(true));
      setIsLoading(true);
      const response = await axiosInstance.get("/api/rentals/all-history", {
        params: {
          page: currentPage,
          limit: 5,
          search: searchTerm,
          status: statusFilter
        }
      });

      setRentals(response.data.rentals);
      setTotalPages(response.data.totalPages);
      setTotalRentals(response.data.totalRentals);
    } catch (error) {
      dispatch(showToast({ message: "Error fetching rental history", type: "error" }));
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
      dispatch(setGlobalLoading(false));
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
      discountAmount: '0',
      paymentType: 'partial_payment',
      notes: '',
      discountNotes: ''
    });
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedRental(null);
    setPaymentData({
      amount: '',
      discountAmount: '0',
      paymentType: 'partial_payment',
      notes: '',
      discountNotes: ''
    });
  };

  const handlePaymentChange = (e) => {
    setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
  };

  // Enhanced payment submit function (same as RentalDetails general-payment)
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const endpoint = `/api/rentals/${selectedRental._id}/general-payment`;
      const payload = {
        amount: paymentData.amount ? parseFloat(paymentData.amount) : null,
        discountAmount: paymentData.discountAmount ? parseFloat(paymentData.discountAmount) : null,
        paymentType: paymentData.paymentType,
        notes: paymentData.notes,
        discountNotes: paymentData.discountNotes
      };

      const response = await axiosInstance.put(endpoint, payload);

      // Same success message format as RentalDetails
      const paymentAmt = response.data.paymentAmount || 0;
      const discountAmt = response.data.discountAmount || 0;
      const totalReduction = response.data.totalReduction || 0;

      let message = `Payment: ₹${paymentAmt.toFixed(2)}`;
      if (discountAmt > 0) {
        message += ` + Discount: ₹${discountAmt.toFixed(2)}`;
      }
      message += ` = Total: ₹${totalReduction.toFixed(2)} processed successfully!`;

      dispatch(showToast({ message: message, type: "success" }));
      closePaymentModal();
      fetchRentalHistory(false);
    } catch (error) {
      console.error("Payment error:", error);
      dispatch(showToast({ message: error.response?.data?.message || "Error processing payment", type: "error" }));
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


  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-white min-h-screen">


      {/* Header */}
      <div className="mb-6 md:mt-5 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          Rental History
        </h2>
        <p className="text-gray-600 mt-2 text-sm sm:text-base lg:text-lg">Complete rental records and payment management</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md w-full">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#086cbe] w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#086cbe] focus:border-transparent text-sm sm:text-base lg:text-lg"
            />
          </div>
          <div className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
            Total: {totalRentals} rentals
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusFilter('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm lg:text-base font-medium transition-all ${statusFilter === 'all'
              ? 'bg-[#086cbe] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            All Rentals
          </button>
          <button
            onClick={() => handleStatusFilter('completed')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${statusFilter === 'completed'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Fully Paid
          </button>
          <button
            onClick={() => handleStatusFilter('pending_payment')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${statusFilter === 'pending_payment'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <span className="hidden sm:inline">Pending Payment</span>
            <span className="sm:hidden">Pending</span>
          </button>
        </div>
      </div>

      {/* Rental History Table/Cards */}
      {rentals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <EmptyState
            icon={FiPackage}
            title="No Rental History"
            description="No rentals found matching your criteria."
            showAction={false}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Mobile Card View */}
          <div className="block lg:hidden divide-y divide-gray-200">
            {rentals.map((rental) => {
              const paymentStatus = getPaymentStatus(rental);
              return (
                <div key={rental._id} className="p-4 hover:bg-gray-50">
                  {/* Customer Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {rental.customerName}
                      </h3>
                      {rental.customerPhone && (
                        <p className="text-sm text-gray-500 truncate">
                          {rental.customerPhone}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${paymentStatus.color} ml-2`}>
                      <paymentStatus.icon className="w-3 h-3" />
                      <span className="hidden sm:inline">{paymentStatus.text}</span>
                      <span className="sm:hidden">
                        {paymentStatus.text === 'Fully Paid' ? 'Paid' :
                          paymentStatus.text === 'Partial Payment' ? 'Partial' : 'Pending'}
                      </span>
                    </span>
                  </div>

                  {/* Products Summary */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FiPackage className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {rental.productItems.length} Products
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rental.productItems.slice(0, 2).map((item, index) => (
                        <span key={index} className="bg-blue-50 text-[#086cbe] px-2 py-1 rounded text-xs">
                          {item.productId?.name || item.productName} ({item.quantity})
                        </span>
                      ))}
                      {rental.productItems.length > 2 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{rental.productItems.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="font-semibold text-sm">₹{rental.paymentSummary?.totalAmount || rental.totalAmount || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Paid</p>
                        <p className="font-semibold text-sm text-green-600">₹{rental.paymentSummary?.totalPaid || rental.totalPaid || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Balance</p>
                        <p className="font-semibold text-sm text-red-600">₹{rental.paymentSummary?.balanceAmount || rental.balanceAmount || 0}</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-green-500 h-1 rounded-full"
                          style={{
                            width: `${rental.paymentSummary?.paymentProgress || 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                    <FiCalendar className="w-4 h-4" />
                    <span>{calculateDuration(rental.startDate, rental.updatedAt)} days</span>
                    <span>•</span>
                    <span>{formatDate(rental.startDate)} - {formatDate(rental.updatedAt)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(rental)}
                      className="flex-1 bg-[#086cbe] hover:bg-[#0757a8] text-white px-3 py-2 rounded text-xs flex items-center justify-center gap-1"
                    >
                      <FiEye className="w-3 h-3" />
                      View
                    </button>
                    {(rental.paymentSummary?.balanceAmount || rental.balanceAmount) > 0 && (
                      <button
                        onClick={() => openPaymentModal(rental)}
                        className="flex-1 bg-[#086cbe] hover:bg-[#0757a8] text-white px-3 py-2 rounded text-xs flex items-center justify-center gap-1"
                      >
                        <FiCreditCard className="w-3 h-3" />
                        Pay
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteModal(rental)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs flex items-center justify-center gap-1"
                    >
                      <FiTrash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs lg:text-base font-bold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs lg:text-base font-bold text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs lg:text-base font-bold text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs lg:text-base font-bold text-gray-500 uppercase tracking-wider">
                    Financial Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs lg:text-base font-bold text-gray-500 uppercase tracking-wider">
                    Status
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
                          <div className="text-sm lg:text-lg font-medium text-gray-900">
                            {rental.customerName}
                          </div>
                          {rental.customerPhone && (
                            <div className="text-sm lg:text-base text-gray-500">
                              {rental.customerPhone}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {rental.productItems.slice(0, 2).map((item, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium text-gray-900">
                                {item.productId?.name || item.productName}
                              </span>
                              <span className="text-gray-500 ml-2">
                                ({item.quantity} units)
                              </span>
                              {item.currentQuantity === 0 && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  Returned
                                </span>
                              )}
                            </div>
                          ))}

                          {rental.productItems.length > 2 && (
                            <div className="text-xs text-[#086cbe] font-medium">
                              +{rental.productItems.length - 2} more products
                            </div>
                          )}

                          <div className="text-xs text-gray-500 mt-1">
                            Total: {rental.totalProducts} products •
                            Active: {rental.activeProducts} •
                            Returned: {rental.returnedProducts}
                          </div>
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
                        <div className="text-sm lg:text-lg font-medium text-gray-900">
                          Total: ₹{rental.paymentSummary?.totalAmount || rental.totalAmount || 0}
                        </div>
                        <div className="text-sm lg:text-lg text-green-600">
                          Paid: ₹{rental.paymentSummary?.totalPaid || rental.totalPaid || 0}
                        </div>
                        {(rental.paymentSummary?.balanceAmount || rental.balanceAmount) > 0 && (
                          <div className="text-sm lg:text-lg text-red-600 font-medium">
                            Balance: ₹{rental.paymentSummary?.balanceAmount || rental.balanceAmount}
                          </div>
                        )}

                        <div className="mt-1">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-green-500 h-1 rounded-full"
                              style={{
                                width: `${rental.paymentSummary?.paymentProgress || 0}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatus.color}`}>
                            <paymentStatus.icon className="w-3 h-3" />
                            {paymentStatus.text}
                          </span>

                          <div className="text-xs text-gray-500 capitalize">
                            {rental.status.replace('_', ' ')}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal(rental)}
                            className="bg-[#086cbe] hover:bg-[#0757a8] text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                          >
                            <FiEye className="w-4 h-4" />
                            View
                          </button>
                          {(rental.paymentSummary?.balanceAmount || rental.balanceAmount) > 0 && (
                            <button
                              onClick={() => openPaymentModal(rental)}
                              className="bg-[#086cbe] hover:bg-[#0757a8] text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                            >
                              <FiCreditCard className="w-4 h-4" />
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteModal(rental)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
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
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              maxVisiblePages={5}
            />
          )}
        </div>
      )}

      {/* Enhanced Payment Modal - Fully Responsive */}
      {isPaymentModalOpen && selectedRental && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-lg mx-2 sm:mx-4 max-h-[95vh] overflow-y-auto">
            <div className="bg-[#086cbe] text-white px-3 sm:px-6 py-3 sm:py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-lg lg:text-2xl font-semibold">Payment & Discount</h3>
                <button
                  onClick={closePaymentModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                >
                  <FiX className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-3 sm:p-6 space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="text-xs sm:text-sm text-gray-600">Customer</div>
                <div className="font-semibold text-sm sm:text-base truncate">{selectedRental.customerName}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">
                  Balance Due: <span className="font-bold text-red-600">₹{selectedRental.balanceAmount}</span>
                </div>
              </div>

              {/* Payment and Discount Fields - Enhanced Mobile Layout */}
              <div className="space-y-4">
                {/* Mobile: Stacked Layout, Desktop: Side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Payment Amount
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={paymentData.amount}
                      onChange={handlePaymentChange}
                      step="0.01"
                      min="0"
                      max={selectedRental.balanceAmount}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                      placeholder="Enter payment amount"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Discount Amount
                    </label>
                    <input
                      type="number"
                      name="discountAmount"
                      value={paymentData.discountAmount}
                      onChange={handlePaymentChange}
                      step="0.01"
                      min="0"
                      max={selectedRental.balanceAmount}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                      placeholder="Enter discount amount"
                    />
                  </div>
                </div>

                {/* Payment Type - Full Width */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Payment Type
                  </label>
                  <select
                    name="paymentType"
                    value={paymentData.paymentType}
                    onChange={handlePaymentChange}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                  >
                    <option value="general_payment">General Payment</option>
                    <option value="partial_payment">Partial Payment</option>
                    <option value="full_payment">Full Payment</option>
                  </select>
                </div>

                {/* Notes - Mobile: Stacked, Desktop: Side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Payment Notes
                    </label>
                    <textarea
                      name="notes"
                      value={paymentData.notes}
                      onChange={handlePaymentChange}
                      rows="3"
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base resize-none"
                      placeholder="Payment method, reference, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Discount Notes
                    </label>
                    <textarea
                      name="discountNotes"
                      value={paymentData.discountNotes}
                      onChange={handlePaymentChange}
                      rows="3"
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm sm:text-base resize-none"
                      placeholder="Reason for discount..."
                    />
                  </div>
                </div>
              </div>

              {/* Summary - Enhanced Mobile View */}
              {(paymentData.amount || paymentData.discountAmount) && (
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2 sm:mb-3">Summary</p>
                  <div className="space-y-2">
                    {/* Mobile: Stack vertically, Desktop: Show inline */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-[#086cbe]">
                      {paymentData.amount && (
                        <div className="flex justify-between sm:block">
                          <span>Payment:</span>
                          <span className="font-medium">₹{parseFloat(paymentData.amount || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {paymentData.discountAmount && (
                        <div className="flex justify-between sm:block">
                          <span>Discount:</span>
                          <span className="font-medium">₹{parseFloat(paymentData.discountAmount || 0).toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Total and New Balance */}
                    <div className="border-t border-blue-200 pt-2 space-y-1">
                      <div className="flex justify-between text-sm font-medium text-blue-800">
                        <span>Total Reduction:</span>
                        <span>₹{(parseFloat(paymentData.amount || 0) + parseFloat(paymentData.discountAmount || 0)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-blue-900">
                        <span>New Balance:</span>
                        <span>₹{Math.max(0, selectedRental.balanceAmount - (parseFloat(paymentData.amount || 0) + parseFloat(paymentData.discountAmount || 0))).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons - Enhanced Mobile */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="flex-1 w-full px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 w-full bg-[#086cbe] hover:bg-[#0757a8] text-white px-4 py-3 sm:py-2 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base font-medium"
                >
                  {isSubmitting && <LoadingSpinner size="sm" color="gray" />}
                  <span>Process Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rental Details Modal */}
      {isModalOpen && selectedRental && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-[#086cbe] text-white px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-semibold">
                  Rental Details - {selectedRental.productItems.length} Products
                </h3>
                <button
                  onClick={closeModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                >
                  <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Customer Information */}
              <div className="mb-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiUser className="w-4 h-4 sm:w-5 sm:h-5" />
                  Customer Information
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Customer Name</p>
                      <p className="font-semibold text-gray-900">{selectedRental.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <FiPhone className="w-3 h-3" />
                        Phone Number
                      </p>
                      <p className="font-semibold text-gray-900">{selectedRental.customerPhone}</p>
                    </div>
                    {selectedRental.customerAddress && (
                      <div className="sm:col-span-2">
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <FiMapPin className="w-3 h-3" />
                          Address
                        </p>
                        <p className="text-gray-900">{selectedRental.customerAddress}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Products Information */}
              <div className="mb-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiPackage className="w-4 h-4 sm:w-5 sm:h-5" />
                  Products Information ({selectedRental.productItems.length} items)
                </h4>

                <div className="space-y-3 sm:space-y-4">
                  {selectedRental.productItems.map((item, index) => {
                    const isReturned = item.currentQuantity === 0;
                    const hasBalance = item.balanceAmount > 0;

                    return (
                      <div key={index} className={`p-3 sm:p-4 rounded-lg border-l-4 ${isReturned
                        ? hasBalance
                          ? 'bg-red-50 border-red-400'
                          : 'bg-green-50 border-green-400'
                        : 'bg-blue-50 border-[#086cbe]'
                        }`}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600">Product</p>
                            <p className="font-semibold text-sm sm:text-base">{item.productId?.name || item.productName}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600">Quantity</p>
                            <p className="font-semibold text-sm sm:text-base">
                              {item.currentQuantity}/{item.quantity} units
                              {isReturned && <span className="text-green-600 ml-2">(Returned)</span>}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600">Amount</p>
                            <p className="font-semibold text-sm sm:text-base">₹{item.amount || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600">Balance</p>
                            <p className={`font-semibold text-sm sm:text-base ${hasBalance ? 'text-red-600' : 'text-green-600'}`}>
                              ₹{item.balanceAmount || 0}
                            </p>
                          </div>
                        </div>

                        {/* Product Status Badge */}
                        <div className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isReturned
                            ? hasBalance
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                            }`}>
                            {isReturned
                              ? hasBalance
                                ? 'Returned - Payment Pending'
                                : 'Returned - Fully Paid'
                              : 'Active Rental'}
                          </span>

                          <div className="text-xs sm:text-sm text-gray-600">
                            ₹{item.rate}/{item.rateType?.replace('ly', '')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="mb-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                  Financial Summary (All Products)
                </h4>
                <div className={`p-4 sm:p-6 rounded-lg ${selectedRental.balanceAmount <= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div className="text-center">
                      <p className={`text-xs sm:text-sm ${selectedRental.balanceAmount <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Total Amount
                      </p>
                      <p className={`font-bold text-2xl sm:text-3xl ${selectedRental.balanceAmount <= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        ₹{selectedRental.totalAmount || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs sm:text-sm ${selectedRental.balanceAmount <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Total Paid
                      </p>
                      <p className={`font-bold text-2xl sm:text-3xl ${selectedRental.balanceAmount <= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        ₹{selectedRental.totalPaid || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className={`text-xs sm:text-sm ${selectedRental.balanceAmount <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Balance Due
                      </p>
                      <p className={`font-bold text-2xl sm:text-3xl ${selectedRental.balanceAmount <= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        ₹{selectedRental.balanceAmount || 0}
                      </p>
                    </div>
                  </div>

                  {/* Payment Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                      <span>Payment Progress</span>
                      <span>{Math.round((selectedRental.totalPaid / selectedRental.totalAmount) * 100 || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((selectedRental.totalPaid / selectedRental.totalAmount) * 100 || 0, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default RentalHistory;
