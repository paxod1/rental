import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    FiArrowLeft,
    FiX,
    FiPlus,
    FiMinus,
    FiDollarSign,
    FiCalendar,
    FiPackage,
    FiArrowUpCircle,
    FiArrowDownCircle,
    FiCreditCard,
    FiUser,
    FiPhone, 
    FiChevronDown,
    FiCheck
} from "react-icons/fi";
import PageLoading from "../../components/commonComp/PageLoading";
import LoadingSpinner from "../../components/commonComp/LoadingSpinner";
import axiosInstance from "../../../axiosCreate";

function RentalDetails({ rentalId, onBack }) {
    const [rental, setRental] = useState(null);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProductItem, setSelectedProductItem] = useState(null);
    const [modalType, setModalType] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [liveBalance, setLiveBalance] = useState(0);

    const [formData, setFormData] = useState({
        productId: '',
        returnQuantity: '',
        additionalQuantity: '',
        amount: '',
        paymentType: 'product_payment',
        notes: '',
        paymentAmount: '',
        paymentNotes: '',
        payFullAmount: false,
        newProductId: '',
        newProductQuantity: '',
        newProductDays: '',
        returnDate: new Date().toISOString().split('T')[0],
        addProductDate: new Date().toISOString().split('T')[0],
        addMoreDate: new Date().toISOString().split('T')[0]
    });


    useEffect(() => {
        fetchRentalDetails();
        fetchProducts();
    }, [rentalId]);

    const fetchRentalDetails = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get(`/api/rentals/${rentalId}`);
            console.log(response);

            setRental(response.data);
            setLiveBalance(response.data.balanceAmount || 0);
        } catch (error) {
            toast.error("Error fetching rental details");
            console.error("Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axiosInstance.get("/api/products");
            setProducts(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    // Calculate days rented for a specific product based on rental start date
    const calculateDaysRentedForProduct = (productItem) => {
        if (!rental.startDate) return 0;

        // Get the earliest rental transaction for this product or use rental start date
        const productTransactions = (rental.transactions || [])
            .filter(t => t.type === 'rental' && t.productId?.toString() === (productItem.productId._id || productItem.productId)?.toString())
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const startDate = productTransactions.length > 0
            ? new Date(productTransactions[0].date)
            : new Date(rental.startDate);

        const currentDate = new Date();
        return Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
    };

    // Calculate live amount for a specific product
    // ✅ Use backend calculated amount (preserves locked amounts)
    const calculateLiveAmountForProduct = (productItem) => {
        // Use the amount calculated and stored by backend
        // This respects locked amounts for returned products
        return productItem?.amount || 0;
    };


    // Calculate product-specific balance
    const calculateProductBalance = (productItem) => {
        if (!productItem) return 0;

        // Use the balance calculated and stored by backend
        // This respects locked amounts and proper payment tracking
        return productItem.balanceAmount || 0;
    };



    // Check if product is fully paid
    const isProductFullyPaid = (productItem) => {
        return calculateProductBalance(productItem) <= 0;
    };

    // Calculate total days since rental started
    const calculateDaysRented = (startDate) => {
        return Math.ceil((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const resetForm = () => {
        setFormData({
            productId: '',
            returnQuantity: '',
            additionalQuantity: '',
            amount: '',
            paymentType: 'product_payment',
            notes: '',
            paymentAmount: '',
            paymentNotes: '',
            payFullAmount: false,
            newProductId: '',
            newProductQuantity: '',
            newProductDays: '',
            returnDate: new Date().toISOString().split('T')[0], // ✅ Reset to today
            addProductDate: new Date().toISOString().split('T')[0], // ✅ Reset to today
            addMoreDate: new Date().toISOString().split('T')[0]
        });
    };


    const openModal = (type, productItem = null) => {
        setSelectedProductItem(productItem);
        setModalType(type);
        resetForm();
        if (productItem) {
            setFormData(prev => ({
                ...prev,
                productId: productItem.productId._id || productItem.productId
            }));
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedProductItem(null);
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
                    endpoint = `/api/rentals/${rentalId}/return-and-pay`;
                    payload = {
                        productId: formData.productId,
                        returnQuantity: parseInt(formData.returnQuantity),
                        payFullAmount: formData.payFullAmount || false,
                        paymentAmount: formData.paymentAmount ? parseFloat(formData.paymentAmount) : null,
                        paymentNotes: formData.paymentNotes || null,
                        notes: formData.notes,
                        returnDate: formData.returnDate // ✅ Include return date
                    };
                    break;


                case 'add-rental':
                    endpoint = `/api/rentals/${rentalId}/add-rental`;
                    payload = {
                        productId: formData.productId,
                        additionalQuantity: parseInt(formData.additionalQuantity),
                        additionalStartDate: formData.addMoreDate, // ✅ This is correct
                        notes: formData.notes
                    };
                    break;


                case 'add-product':
                    endpoint = `/api/rentals/${rentalId}/add-product`;
                    payload = {
                        productId: formData.newProductId,
                        quantity: parseInt(formData.newProductQuantity),
                        days: formData.newProductDays ? parseInt(formData.newProductDays) : null,
                        notes: formData.notes,
                        startDate: formData.addProductDate // ✅ Include product date
                    };
                    break;

                case 'payment':
                    endpoint = `/api/rentals/${rentalId}/payment`;
                    payload = {
                        amount: parseFloat(formData.amount),
                        paymentType: formData.paymentType,
                        notes: formData.notes
                    };
                    break;
                case 'product-payment':
                    endpoint = `/api/rentals/${rentalId}/product-payment`;
                    payload = {
                        productId: formData.productId,
                        amount: parseFloat(formData.amount),
                        paymentType: formData.paymentType || 'product_payment',
                        notes: formData.notes
                    };
                    break;
                case 'product-full-payment':
                    endpoint = `/api/rentals/${rentalId}/product-full-payment`;
                    payload = {
                        productId: formData.productId,
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
            } else if (modalType === 'product-full-payment') {
                toast.success(
                    `Full payment of $${response.data.paidAmount.toFixed(2)} processed!`,
                    { duration: 3000 }
                );
            } else {
                toast.success(`${modalType.replace('-', ' ')} processed successfully!`);
            }

            closeModal();
            fetchRentalDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || `Error processing ${modalType.replace('-', ' ')}`);
            console.error("Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getAllActivities = () => {
        const activities = [];

        const transactions = rental.transactions || [];
        transactions.forEach(transaction => {
            activities.push({
                ...transaction,
                activityType: 'transaction',
                date: transaction.date,
                displayDate: new Date(transaction.date).toLocaleDateString(),
                displayTime: new Date(transaction.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        });

        const payments = rental.payments || [];
        payments.forEach(payment => {
            activities.push({
                ...payment,
                activityType: 'payment',
                date: payment.date,
                displayDate: new Date(payment.date).toLocaleDateString(),
                displayTime: new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
        });

        return activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

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
                                <FiArrowUpCircle className="w-4 h-4 text-green-600" />
                            ) : (
                                <FiArrowDownCircle className="w-4 h-4 text-orange-600" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                    {isRental ? 'Rented' : 'Returned'} {activity.quantity} units
                                    {activity.productName && ` of ${activity.productName}`}
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
                                {isReturn ? '+' : ''}₹{activity.amount.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>
            );
        }

        if (isPayment) {
            const isRefund = activity.type === 'refund';
            const isProductPayment = activity.productId;

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
                                    {isProductPayment && ` for ${activity.productName}`}
                                </span>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
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
                        <span className={`font-semibold text-sm ${isRefund ? 'text-red-600' : 'text-green-600'
                            }`}>
                            {isRefund ? '-' : '+'}₹{activity.amount.toFixed(2)}
                        </span>
                    </div>
                </div>
            );
        }

        return null;
    };




    const renderProductCard = (productItem, index) => {
        const daysRented = calculateDaysRentedForProduct(productItem);
        const liveAmount = calculateLiveAmountForProduct(productItem);
        const productBalance = calculateProductBalance(productItem);
        const isFullyPaid = productBalance <= 0;
        const paidAmount = liveAmount - productBalance;

        return (
            <div key={index} className="bg-gray-50 p-6 rounded-lg border">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">{productItem.productName}</h4>
                            {isFullyPaid && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                    <FiCheck className="w-3 h-3" />
                                    Fully Paid
                                </span>
                            )}
                            {productItem.currentQuantity === 0 && (
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                                    Returned
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-3 text-sm">
                            <div>
                                <span className="text-gray-600">Current Qty:</span>
                                <span className="ml-2 font-semibold text-blue-600">{productItem.currentQuantity} units</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Rate:</span>
                                <span className="ml-2 font-semibold">₹{productItem.rate}/{productItem.rateType}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Days:</span>
                                <span className="ml-2 font-semibold text-orange-600">{daysRented} days</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Total Amount:</span>
                                <span className="ml-2 font-semibold text-purple-600">₹{liveAmount.toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Paid:</span>
                                <span className="ml-2 font-semibold text-green-600">₹{paidAmount.toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Balance:</span>
                                <span className={`ml-2 font-semibold ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                                    ₹{productBalance.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                        {/* Product Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => openModal('return', productItem)}
                                disabled={productItem.currentQuantity === 0}
                                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                            >
                                <FiMinus className="w-3 h-3" />
                                Return
                            </button>
                            <button
                                onClick={() => openModal('add-rental', productItem)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                            >
                                <FiPlus className="w-3 h-3" />
                                Add More
                            </button>
                        </div>

                        {/* Product Payment Buttons */}
                        {!isFullyPaid && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openModal('product-payment', productItem)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                >
                                    <FiDollarSign className="w-3 h-3" />
                                    Pay
                                </button>
                                <button
                                    onClick={() => openModal('product-full-payment', productItem)}
                                    className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                >
                                    <FiDollarSign className="w-3 h-3" />
                                    Pay Full
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Summary for Product */}
                <div className="mt-4 p-3 bg-white rounded border">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Payment Summary</h5>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                        <div className="text-center">
                            <div className="text-gray-600">Total Amount</div>
                            <div className="font-bold text-purple-600">₹{liveAmount.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-gray-600">Paid Amount</div>
                            <div className="font-bold text-green-600">₹{paidAmount.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-gray-600">Balance</div>
                            <div className={`font-bold ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{productBalance.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Payment Progress Bar */}
                    <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${liveAmount > 0 ? (paidAmount / liveAmount) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <div className="text-xs text-center text-gray-600 mt-1">
                            {liveAmount > 0 ? ((paidAmount / liveAmount) * 100).toFixed(1) : 0}% Paid
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return <PageLoading message="Loading Rental Details..." />;
    }

    if (!rental) {
        return (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Rental Not Found</h2>
                    <button
                        onClick={onBack}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Back to List
                    </button>
                </div>
            </div>
        );
    }

    // Calculate total rental amount for all products
    const calculateTotalRentalAmount = () => {
        if (!rental || !rental.productItems) return 0;

        return rental.productItems.reduce((total, productItem) => {
            return total + calculateLiveAmountForProduct(productItem);
        }, 0);
    };

    // Calculate total balance for all products
    const calculateTotalBalance = () => {
        if (!rental || !rental.productItems) return 0;

        return rental.productItems.reduce((total, productItem) => {
            return total + calculateProductBalance(productItem);
        }, 0);
    };


    return (
        <div className="p-6 bg-gradient-to-br from-rose-50 to-pink-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={onBack}
                        className="bg-white hover:bg-gray-50 p-2 rounded-lg shadow transition-colors"
                    >
                        <FiArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Rental Details
                        </h2>
                        <p className="text-gray-600">{rental.customerName}'s rental management</p>
                    </div>
                </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <FiUser className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Customer Name</p>
                            <p className="font-semibold">{rental.customerName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                            <FiPhone className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Phone Number</p>
                            <p className="font-semibold">{rental.customerPhone || 'Not provided'}</p>
                        </div>
                    </div>
                    {rental.customerAddress && (
                        <div className="md:col-span-2 flex items-start gap-3">
                            <div className="bg-purple-100 p-2 rounded-full">
                                <FiUser className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Address</p>
                                <p className="font-semibold">{rental.customerAddress}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Information */}
            {/* Summary Information - Updated with 6 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">


                <div className="bg-white rounded-xl shadow-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <FiPackage className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Active Products</p>
                            <p className="text-lg font-bold text-gray-900">
                                {(rental.productItems || []).filter(item => item.currentQuantity > 0).length}
                            </p>
                        </div>
                    </div>
                </div>



                <div className="bg-white rounded-xl shadow-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-full">
                            <FiDollarSign className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Total Rental Amount</p>
                            <p className="text-lg font-bold text-indigo-600">
                                ₹{calculateTotalRentalAmount().toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-full">
                            <FiDollarSign className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-600">Total Balance</p>
                            <p className="text-lg font-bold text-red-600">
                                ₹{calculateTotalBalance().toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Products Section - Updated with Product-Specific Payments */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Rented Products</h3>
                    <button
                        onClick={() => openModal('add-product')}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <FiPlus className="w-4 h-4" />
                        Add Product
                    </button>
                </div>

                <div className="grid gap-6">
                    {(rental.productItems || []).map((productItem, index) =>
                        renderProductCard(productItem, index)
                    )}
                </div>
            </div>




            {/** 
           
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">General Actions</h3>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => openModal('payment')}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2"
                    >
                        <FiDollarSign className="w-5 h-5" />
                        Add General Payment
                    </button>
                </div>
            </div>
            */}

            {/* Activity History */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity History</h3>
                <div className="space-y-3">
                    {getAllActivities().map((activity, index) =>
                        renderActivityItem(activity, index)
                    )}
                    {getAllActivities().length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <FiPackage className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No activity recorded yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Enhanced Modal with Product-Specific Payment Options */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-4 rounded-t-xl">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-semibold">
                                    {modalType === 'return' && `Return ${selectedProductItem?.productName}`}
                                    {modalType === 'add-rental' && `Add More ${selectedProductItem?.productName}`}
                                    {modalType === 'add-product' && 'Add New Product to Rental'}
                                    {modalType === 'payment' && 'Add General Payment'}
                                    {modalType === 'product-payment' && `Pay for ${selectedProductItem?.productName}`}
                                    {modalType === 'product-full-payment' && `Full Payment for ${selectedProductItem?.productName}`}
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
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {modalType === 'product-payment' && (
                                    <>
                                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                            <p className="text-sm text-green-800">
                                                Making payment for <strong>{selectedProductItem?.productName}</strong>
                                            </p>
                                            <p className="text-sm text-green-700 mt-1">
                                                Current balance: <strong>₹{calculateProductBalance(selectedProductItem).toFixed(2)}</strong>
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
                                                max={calculateProductBalance(selectedProductItem)}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter payment amount"
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
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="product_payment">Product Payment</option>
                                                <option value="partial_payment">Partial Payment</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {modalType === 'product-full-payment' && (
                                    <>
                                        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                                            <p className="text-sm text-purple-800">
                                                <strong>Full Payment for {selectedProductItem?.productName}</strong>
                                            </p>
                                            <p className="text-sm text-purple-700 mt-1">
                                                Amount to be paid: <strong>₹{calculateProductBalance(selectedProductItem).toFixed(2)}</strong>
                                            </p>
                                        </div>
                                    </>
                                )}

                                {modalType === 'return' && (
                                    <div>
                                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                            <p className="text-sm text-blue-800">
                                                Returning <strong>{selectedProductItem?.productName}</strong>
                                            </p>
                                            <div className="text-sm text-blue-700 mt-1 space-y-1">
                                                <p>Current quantity: <strong>{selectedProductItem?.currentQuantity} units</strong></p>
                                                <p>Current balance: <strong>₹{calculateProductBalance(selectedProductItem).toFixed(2)}</strong></p>
                                                <p>Days rented: <strong>{calculateDaysRentedForProduct(selectedProductItem)} days</strong></p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Return Quantity (max: {selectedProductItem?.currentQuantity || 0})
                                            </label>
                                            <input
                                                type="number"
                                                name="returnQuantity"
                                                value={formData.returnQuantity}
                                                onChange={handleChange}
                                                max={selectedProductItem?.currentQuantity || 0}
                                                min="1"
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        {/* ✅ Add Return Date Picker */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <FiCalendar className="w-4 h-4 inline mr-1" />
                                                Return Date
                                            </label>
                                            <input
                                                type="date"
                                                name="returnDate"
                                                value={formData.returnDate}
                                                onChange={handleChange}
                                                max={new Date().toISOString().split('T')[0]} // Can't select future dates
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Select the date when the product was returned
                                            </p>
                                        </div>


                                        {/* Payment Options */}
                                        <div className="border-t pt-4">
                                            <h4 className="font-medium text-gray-700 mb-3">Payment Options</h4>

                                            <div className="space-y-3">
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="paymentOption"
                                                        value="none"
                                                        checked={!formData.payFullAmount && !formData.paymentAmount}
                                                        onChange={() => setFormData(prev => ({ ...prev, payFullAmount: false, paymentAmount: '' }))}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">No payment now</span>
                                                </label>

                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="paymentOption"
                                                        value="full"
                                                        checked={formData.payFullAmount}
                                                        onChange={() => setFormData(prev => ({ ...prev, payFullAmount: true, paymentAmount: '' }))}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">Pay full amount (${calculateProductBalance(selectedProductItem).toFixed(2)})</span>
                                                </label>

                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="paymentOption"
                                                        value="partial"
                                                        checked={!formData.payFullAmount && formData.paymentAmount}
                                                        onChange={() => setFormData(prev => ({ ...prev, payFullAmount: false }))}
                                                        className="mr-2"
                                                    />
                                                    <span className="text-sm">Pay specific amount</span>
                                                </label>
                                            </div>

                                            {!formData.payFullAmount && (
                                                <div className="mt-3">
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
                                                        max={calculateProductBalance(selectedProductItem)}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Enter payment amount"
                                                    />
                                                </div>
                                            )}

                                            {(formData.payFullAmount || formData.paymentAmount) && (
                                                <div className="mt-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Payment Notes
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="paymentNotes"
                                                        value={formData.paymentNotes || ''}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Payment method, reference, etc."
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {modalType === 'add-rental' && (
                                    <>
                                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                            <p className="text-sm text-green-800">
                                                Adding more units of <strong>{selectedProductItem?.productName}</strong>
                                            </p>
                                            <p className="text-sm text-green-700 mt-1">
                                                Current quantity: <strong>{selectedProductItem?.currentQuantity} units</strong>
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
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <FiCalendar className="w-4 h-4 inline mr-1" />
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                name="addMoreDate" // ✅ CORRECT
                                                value={formData.addMoreDate} // ✅ CORRECT
                                                onChange={handleChange}
                                                max={new Date().toISOString().split('T')[0]}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Select when this product rental started (defaults to today)
                                            </p>
                                        </div>
                                    </>
                                )}

                                {modalType === 'add-product' && (
                                    <>
                                        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                                            <p className="text-sm text-purple-800">
                                                Adding a new product to <strong>{rental.customerName}'s</strong> rental.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Select Product *
                                            </label>
                                            <div className="relative">
                                                <select
                                                    name="newProductId"
                                                    value={formData.newProductId}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                                                >
                                                    <option value="">Choose a product</option>
                                                    {products.map((product) => (
                                                        <option key={product._id} value={product._id}>
                                                            {product.name} - ${product.rate}/{product.rateType} (Available: {product.quantity})
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                    <FiChevronDown className="w-4 h-4 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Quantity *
                                                </label>
                                                <input
                                                    type="number"
                                                    name="newProductQuantity"
                                                    value={formData.newProductQuantity}
                                                    onChange={handleChange}
                                                    min="1"
                                                    required
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Enter quantity"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Days (Optional)
                                                </label>
                                                <input
                                                    type="number"
                                                    name="newProductDays"
                                                    value={formData.newProductDays}
                                                    onChange={handleChange}
                                                    min="1"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Enter days"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <FiCalendar className="w-4 h-4 inline mr-1" />
                                                    Start Date
                                                </label>
                                                <input
                                                    type="date"
                                                    name="addProductDate" // ✅ CORRECT
                                                    value={formData.addProductDate} // ✅ CORRECT
                                                    onChange={handleChange}
                                                    max={new Date().toISOString().split('T')[0]}
                                                    required
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Select when this product rental started (defaults to today)
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {modalType === 'payment' && (
                                    <>
                                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                                            <p className="text-sm text-yellow-800">
                                                <strong>Current Total Balance:</strong>₹{calculateTotalBalance().toFixed(2)}
                                            </p>
                                            <p className="text-sm text-yellow-700 mt-1">
                                                This is a general payment that will be applied to the overall rental balance.
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
                                                max={liveBalance || 0}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isSubmitting && <LoadingSpinner size="sm" color="gray" />}
                                        {modalType === 'return' && 'Process Return'}
                                        {modalType === 'add-rental' && 'Add Quantity'}
                                        {modalType === 'add-product' && 'Add Product'}
                                        {modalType === 'payment' && 'Add Payment'}
                                        {modalType === 'product-payment' && 'Process Payment'}
                                        {modalType === 'product-full-payment' && 'Pay Full Amount'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RentalDetails;
