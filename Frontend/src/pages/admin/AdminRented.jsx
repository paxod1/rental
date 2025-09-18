import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
    FiX,
    FiEdit,
    FiPlus,
    FiMinus,
    FiDollarSign,
    FiCalendar,
    FiPackage,
    FiArrowUpCircle,
    FiArrowDownCircle,
    FiCreditCard
} from "react-icons/fi";
import PageLoading from "../../components/commonComp/PageLoading";
import EmptyState from "../../components/commonComp/EmptyState";
import LoadingSpinner from "../../components/commonComp/LoadingSpinner";
import axiosInstance from "../../../axiosCreate";


function AdminRented() {
    const [rentals, setRentals] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRental, setSelectedRental] = useState(null);
    const [modalType, setModalType] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [liveBalances, setLiveBalances] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        returnQuantity: '',
        additionalQuantity: '',
        amount: '',
        paymentType: 'partial_payment',
        notes: '',
        paymentAmount: '',
        paymentNotes: ''
    });


    useEffect(() => {
        fetchData();
    }, []);


    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [rentalsRes, productsRes] = await Promise.all([
                axiosInstance.get("/api/rentals"),
                axiosInstance.get("/api/products")
            ]);


            const activeRentals = rentalsRes.data.filter(rental =>
                rental.status === 'active' || rental.status === 'partially_returned'
            );


            setRentals(activeRentals);
            setProducts(productsRes.data);
            // Calculate live balances for all rentals
            const balances = {};
            for (const rental of activeRentals) {
                balances[rental._id] = await calculateLiveBalance(rental);
            }
            setLiveBalances(balances);
        } catch (error) {
            toast.error("Error fetching data");
            console.error("Error:", error);
        } finally {
            setIsLoading(false);
        }
    };


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };


    const resetForm = () => {
        setFormData({
            returnQuantity: '',
            additionalQuantity: '',
            amount: '',
            paymentType: 'partial_payment',
            notes: '',
            paymentAmount: '',
            paymentNotes: ''
        });
    };


    const openModal = (rental, type) => {
        setSelectedRental(rental);
        setModalType(type);
        resetForm();
        setIsModalOpen(true);
    };


    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRental(null);
        setModalType('');
        resetForm();
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);


        try {
            let endpoint = '';
            let payload = {};


            switch (modalType) {
                case 'return':
                    endpoint = `/api/rentals/${selectedRental._id}/return`;
                    payload = {
                        returnQuantity: parseInt(formData.returnQuantity),
                        notes: formData.notes,
                        // Add these payment fields
                        paymentAmount: formData.paymentAmount ? parseFloat(formData.paymentAmount) : null,
                        paymentNotes: formData.paymentNotes || null
                    };
                    break;
                case 'add-rental':
                    endpoint = `/api/rentals/${selectedRental._id}/add-rental`;
                    payload = {
                        additionalQuantity: parseInt(formData.additionalQuantity),
                        notes: formData.notes
                    };
                    break;
                case 'payment':
                    endpoint = `/api/rentals/${selectedRental._id}/payment`;
                    payload = {
                        amount: parseFloat(formData.amount),
                        paymentType: formData.paymentType,
                        notes: formData.notes
                    };
                    break;
            }


            const response = await axiosInstance.put(`${endpoint}`, payload);


            if (modalType === 'return' && response.data.returnCalculation) {
                toast.success(
                    `Return processed! Total charge: $${response.data.returnCalculation.total.toFixed(2)}`,
                    { duration: 3000 }
                );
            } else {
                toast.success(`${modalType.replace('-', ' ')} processed successfully!`);
            }


            closeModal();
            fetchData();
        } catch (error) {
            toast.error(`Error processing ${modalType.replace('-', ' ')}`);
            console.error("Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };



    const calculateDaysRented = (startDate) => {
        return Math.ceil((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
    };

    // Enhanced function to get all activities (transactions + payments) in chronological order
    const getAllActivities = (rental) => {
        const activities = [];

        // Add transactions
        const transactions = getTransactions(rental);
        transactions.forEach(transaction => {
            activities.push({
                ...transaction,
                activityType: 'transaction',
                date: transaction.date,
                displayDate: new Date(transaction.date).toLocaleDateString(),
                displayTime: new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        });

        // Add payments
        const payments = getPayments(rental);
        payments.forEach(payment => {
            activities.push({
                ...payment,
                activityType: 'payment',
                date: payment.date,
                displayDate: new Date(payment.date).toLocaleDateString(),
                displayTime: new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        });

        // Sort by date (newest first)
        return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    // Enhanced function to render activity item
    const renderActivityItem = (activity, index) => {
        const isTransaction = activity.activityType === 'transaction';
        const isPayment = activity.activityType === 'payment';

        if (isTransaction) {
            const isRental = activity.type === 'rental';
            const isReturn = activity.type === 'return' || activity.type === 'partial_return';

            return (
                <div key={`transaction-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isRental ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                            {isRental ? (
                                <FiArrowUpCircle className={`w-4 h-4 ${isRental ? 'text-green-600' : 'text-orange-600'}`} />
                            ) : (
                                <FiArrowDownCircle className="w-4 h-4 text-orange-600" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                    {isRental ? 'Rented' : 'Returned'} {activity.quantity} units
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                    {activity.displayTime}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                    {activity.displayDate}
                                </span>
                                {activity.notes && (
                                    <span className="text-xs text-blue-600 italic">
                                        • {activity.notes}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        {activity.amount > 0 && (
                            <span className={`font-semibold text-sm ${isReturn ? 'text-red-600' : 'text-green-600'
                                }`}>
                                {isReturn ? '+' : ''}${activity.amount.toFixed(2)}
                            </span>
                        )}
                        {activity.paymentAmount && activity.paymentAmount > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                                Paid: ${activity.paymentAmount.toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (isPayment) {
            const isRefund = activity.type === 'refund';

            return (
                <div key={`payment-${index}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isRefund ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                            <FiCreditCard className={`w-4 h-4 ${isRefund ? 'text-red-600' : 'text-blue-600'
                                }`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                    {isRefund ? 'Refund' : 'Payment'} received
                                </span>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                    {activity.displayTime}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                    {activity.displayDate}
                                </span>
                                <span className="text-xs text-blue-600 capitalize">
                                    • {(activity.type || '').replace('_', ' ')}
                                </span>
                                {activity.notes && (
                                    <span className="text-xs text-blue-600 italic">
                                        • {activity.notes}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`font-semibold text-sm ${isRefund ? 'text-red-600' : 'text-green-600'
                            }`}>
                            {isRefund ? '-' : '+'}${activity.amount.toFixed(2)}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                            {activity.method || 'Cash'}
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };


    // Add this helper function in your AdminRented component
    const calculateLiveBalance = (rental) => {
        if (!rental || !rental.productId) return 0;


        const currentDate = new Date();
        let calculatedAmount = 0;


        // Get rental transactions (FIFO order)
        const rentalTransactions = (rental.transactions || [])
            .filter(t => t.type === 'rental')
            .sort((a, b) => new Date(a.date) - new Date(b.date));


        const returnTransactions = (rental.transactions || [])
            .filter(t => t.type === 'return' || t.type === 'partial_return');


        let remainingQuantity = rental.currentQuantity || 0;


        // Calculate for each active rental
        for (const transaction of rentalTransactions) {
            if (remainingQuantity <= 0) break;


            const quantityForThisTransaction = Math.min(remainingQuantity, transaction.quantity);
            const rentalStartDate = new Date(transaction.date);
            const daysRented = Math.ceil((currentDate - rentalStartDate) / (1000 * 60 * 60 * 24));


            // Calculate daily rate - handle both populated and unpopulated productId
            let dailyRate = 0;
            let productData = rental.productId;


            // If productId is a string, find the product from products array
            if (typeof rental.productId === 'string') {
                productData = products.find(p => p._id === rental.productId);
            }


            if (productData) {
                switch (productData.rateType) {
                    case 'daily':
                        dailyRate = productData.rate;
                        break;
                    case 'weekly':
                        dailyRate = productData.rate / 7;
                        break;
                    case 'monthly':
                        dailyRate = productData.rate / 30;
                        break;
                    default:
                        dailyRate = productData.rate;
                }
            }


            calculatedAmount += quantityForThisTransaction * daysRented * dailyRate;
            remainingQuantity -= quantityForThisTransaction;
        }


        // Add return transaction amounts
        const returnAmount = returnTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        calculatedAmount += returnAmount;


        // Calculate total paid (including refunds)
        const totalPaid = (rental.payments || []).reduce((sum, payment) => {
            return payment.type === 'refund' ? sum - payment.amount : sum + payment.amount;
        }, 0);


        return Math.max(0, calculatedAmount - totalPaid);
    };



    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'partially_returned': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };


    const getProductName = (rental) => {
        if (rental?.productId && typeof rental.productId === 'object' && rental.productId.name) {
            return rental.productId.name;
        }
        if (rental?.productId && typeof rental.productId === 'string') {
            const product = products.find(p => p._id === rental.productId);
            return product ? product.name : 'Unknown Product';
        }
        return 'Unknown Product';
    };


    const getCurrentQuantity = (rental) => {
        return rental?.currentQuantity ?? rental?.quantity ?? 0;
    };


    const getTransactions = (rental) => {
        return Array.isArray(rental?.transactions) ? rental.transactions : [];
    };


    const getPayments = (rental) => {
        return Array.isArray(rental?.payments) ? rental.payments : [];
    };


    const getNetBalance = (rental) => {
        const totalAmount = rental?.totalAmount || 0;
        const totalPaid = rental?.totalPaid || 0;
        return Math.max(0, totalAmount - totalPaid);
    };


    if (isLoading) {
        return <PageLoading message="Loading Rental Data..." />;
    }

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };


    const filteredRentals = rentals.filter(rental => {
        const productName = getProductName(rental).toLowerCase();
        const customerName = (rental.customerName || '').toLowerCase();
        const term = searchTerm.toLowerCase();

        return productName.includes(term) || customerName.includes(term);
    });



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
                    Active Rentals Management
                </h2>
                <p className="text-gray-600 mt-2">Track returns, payments, and rental history with detailed activity timeline</p>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search by product or customer name..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                />
            </div>



            {/* Rentals List */}
            {filteredRentals.length === 0 ? (
                <div className="bg-white rounded-xl shadow-xl">
                    <EmptyState
                        icon={FiPackage}
                        title="No Active Rentals"
                        description="There are currently no active rentals to manage."
                        showAction={false}
                    />
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredRentals.map((rental) => (
                        <div key={rental._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {/* Rental Header */}
                            <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold">{rental.customerName || 'Unknown Customer'}</h3>
                                        <p className="text-rose-100">{getProductName(rental)}</p>
                                        <div className="flex flex-col gap-1 mt-2">
                                            <p className="text-sm ">Phone: {rental.customerPhone || 'N/A'}</p>
                                            <p className="text-sm ">Address: {rental.customerAddress || 'N/A'}</p>
                                        </div>
                                    </div>


                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                                        {(rental.status || 'unknown').replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>


                            {/* Rental Details */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <FiPackage className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Current Quantity</p>
                                            <p className="font-semibold">{getCurrentQuantity(rental)} units</p>
                                        </div>
                                    </div>


                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded-full">
                                            <FiCalendar className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Days Since Start</p>
                                            <p className="font-semibold">
                                                {rental.startDate ? calculateDaysRented(rental.startDate) : 0} days
                                            </p>
                                        </div>
                                    </div>


                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-100 p-2 rounded-full">
                                            <FiDollarSign className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total Billed</p>
                                            <p className="font-semibold">${rental.totalAmount || 0}</p>
                                        </div>
                                    </div>


                                    <div className="flex items-center gap-3">
                                        <div className="bg-rose-100 p-2 rounded-full">
                                            <FiDollarSign className="w-4 h-4 text-rose-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Balance Due</p>
                                            <p className="font-semibold text-rose-600">
                                                ${(liveBalances[rental._id] || 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>


                                {/* Enhanced Recent Activity with Payments */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-gray-800">Recent Activity</h4>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                            Last 5 activities
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {/* Show last 5 activities (transactions + payments combined) */}
                                        {getAllActivities(rental).slice(0, 5).map((activity, index) =>
                                            renderActivityItem(activity, index)
                                        )}
                                        {getAllActivities(rental).length === 0 && (
                                            <div className="text-center py-6">
                                                <FiPackage className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500 italic">No activity yet</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Show more activities link if there are more than 5 */}
                                    {getAllActivities(rental).length > 5 && (
                                        <div className="text-center mt-3">
                                            <button
                                                onClick={() => openModal(rental, 'details')}
                                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                            >
                                                View all {getAllActivities(rental).length} activities
                                            </button>
                                        </div>
                                    )}
                                </div>


                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => openModal(rental, 'return')}
                                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                                    >
                                        <FiMinus className="w-4 h-4" />
                                        Process Return
                                    </button>
                                    <button
                                        onClick={() => openModal(rental, 'add-rental')}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                                    >
                                        <FiPlus className="w-4 h-4" />
                                        Add More Items
                                    </button>
                                    <button
                                        onClick={() => openModal(rental, 'payment')}
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                                    >
                                        <FiDollarSign className="w-4 h-4" />
                                        Add Payment
                                    </button>
                                    <button
                                        onClick={() => openModal(rental, 'details')}
                                        className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                                    >
                                        <FiEdit className="w-4 h-4" />
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}


            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-4 rounded-t-xl">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">
                                    {modalType === 'return' && 'Process Return'}
                                    {modalType === 'add-rental' && 'Add More Items'}
                                    {modalType === 'payment' && 'Add Payment'}
                                    {modalType === 'details' && 'Rental Details & Complete Activity History'}
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>
                        </div>


                        <div className="p-6">
                            {modalType === 'details' ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Customer</p>
                                            <p className="font-medium">{selectedRental?.customerName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Product</p>
                                            <p className="font-medium">{getProductName(selectedRental)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Start Date</p>
                                            <p className="font-medium">
                                                {selectedRental?.startDate
                                                    ? new Date(selectedRental.startDate).toLocaleDateString()
                                                    : 'N/A'
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Current Status</p>
                                            <p className="font-medium">{selectedRental?.status || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Complete Activity History */}
                                    <div>
                                        <h4 className="font-medium mb-4 flex items-center gap-2">
                                            <FiCalendar className="w-4 h-4" />
                                            Complete Activity History ({getAllActivities(selectedRental).length} total)
                                        </h4>
                                        <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                                            {getAllActivities(selectedRental).map((activity, index) =>
                                                renderActivityItem(activity, index)
                                            )}
                                            {getAllActivities(selectedRental).length === 0 && (
                                                <div className="text-center py-8">
                                                    <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-gray-500">No activity history found</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-medium mb-3">Financial Summary</h4>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-sm text-gray-600">Total Billed</p>
                                                <p className="text-lg font-bold text-purple-600">
                                                    ${selectedRental?.totalAmount || 0}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Total Paid</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    ${selectedRental?.totalPaid || 0}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Balance Due</p>
                                                <p className="text-lg font-bold text-red-600">
                                                    ${(liveBalances[selectedRental._id] || 0).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">


                                    {modalType === 'return' && (
                                        <>
                                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-blue-800">
                                                    Return will be processed today ({new Date().toLocaleDateString()}).
                                                    Charges will be calculated automatically.
                                                </p>
                                            </div>


                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Return Quantity (max: {getCurrentQuantity(selectedRental)})
                                                </label>
                                                <input
                                                    type="number"
                                                    name="returnQuantity"
                                                    value={formData.returnQuantity}
                                                    onChange={handleChange}
                                                    max={getCurrentQuantity(selectedRental)}
                                                    min="1"
                                                    required
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                                />
                                            </div>


                                            {/* Payment during return */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Payment Amount (Optional)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="paymentAmount"
                                                    value={formData.paymentAmount || ''}
                                                    onChange={handleChange}
                                                    step="0.01"
                                                    min="0"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                                    placeholder="Enter payment amount if any"
                                                />
                                            </div>


                                            {/* Payment notes */}
                                            {formData.paymentAmount && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Payment Notes
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="paymentNotes"
                                                        value={formData.paymentNotes || ''}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                                        placeholder="Payment method, reference, etc."
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}



                                    {modalType === 'add-rental' && (
                                        <>
                                            <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                                <p className="text-sm text-green-800">
                                                    Additional items will start from today ({new Date().toLocaleDateString()}).
                                                    No upfront payment required - charges calculated on return.
                                                </p>
                                            </div>


                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Additional Quantity
                                                </label>
                                                <input
                                                    type="number"
                                                    name="additionalQuantity"
                                                    value={formData.additionalQuantity}
                                                    onChange={handleChange}
                                                    min="1"
                                                    required
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                                />
                                            </div>
                                        </>
                                    )}


                                    {modalType === 'payment' && (
                                        <>
                                            <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                                                <p className="text-sm text-yellow-800">
                                                    <strong>Current Balance:</strong> ${(liveBalances[selectedRental._id] || 0).toFixed(2)}
                                                </p>
                                            </div>


                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Payment Amount
                                                </label>
                                                <input
                                                    type="number"
                                                    name="amount"
                                                    value={formData.amount}
                                                    onChange={handleChange}
                                                    step="0.01"
                                                    min="0.01"
                                                    max={liveBalances[selectedRental._id] || 0}
                                                    required
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                                />
                                            </div>


                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Payment Type
                                                </label>
                                                <select
                                                    name="paymentType"
                                                    value={formData.paymentType}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                                >
                                                    <option value="advance">Advance Payment</option>
                                                    <option value="partial_payment">Partial Payment</option>
                                                    <option value="full_payment">Full Payment</option>
                                                </select>
                                            </div>
                                        </>
                                    )}


                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notes
                                        </label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                                        />
                                    </div>


                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isSubmitting && <LoadingSpinner size="sm" color="gray" />}
                                            {modalType === 'return' && 'Process Return'}
                                            {modalType === 'add-rental' && 'Add Items'}
                                            {modalType === 'payment' && 'Add Payment'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


export default AdminRented;
