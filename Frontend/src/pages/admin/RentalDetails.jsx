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
    FiCheck,
    FiEdit,    // ✅ Add this
    FiSave,    // ✅ Add this
    FiTrash2,
    FiMessageSquare

} from "react-icons/fi";
import PageLoading from "../../components/commonComp/PageLoading";
import LoadingSpinner from "../../components/commonComp/LoadingSpinner";
import axiosInstance from "../../../axiosCreate";
import WhatsAppBill from "../../components/WhatsAppBill";

function RentalDetails({ rentalId, onBack }) {
    const [rental, setRental] = useState(null);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProductItem, setSelectedProductItem] = useState(null);
    const [modalType, setModalType] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [liveBalance, setLiveBalance] = useState(0);
    const [showWhatsAppBill, setShowWhatsAppBill] = useState(false);

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
        addMoreDate: new Date().toISOString().split('T')[0],
        discountAmount: '0',
        discountNotes: '',
        multipleProducts: [
            {
                id: Date.now(),
                productId: '',
                quantity: 1,
                days: '',
                startDate: new Date().toISOString().split('T')[0]
            }
        ]
    });
    const [isEditingCustomer, setIsEditingCustomer] = useState(false);
    const [customerEditData, setCustomerEditData] = useState({
        customerName: '',
        customerPhone: '',
        customerAddress: ''
    });


    useEffect(() => {
        fetchRentalDetails();
        fetchProducts();
    }, [rentalId]);


    const startEditingCustomer = () => {
        setIsEditingCustomer(true);
        setCustomerEditData({
            customerName: rental.customerName || '',
            customerPhone: rental.customerPhone || '',
            customerAddress: rental.customerAddress || ''
        });
    };

    const cancelCustomerEdit = () => {
        setIsEditingCustomer(false);
        setCustomerEditData({
            customerName: rental.customerName || '',
            customerPhone: rental.customerPhone || '',
            customerAddress: rental.customerAddress || ''
        });
    };

    const saveCustomerEdit = async () => {
        try {
            setIsSubmitting(true);

            // Validation
            if (!customerEditData.customerName.trim() || !customerEditData.customerPhone.trim()) {
                toast.error("Customer name and phone number are required");
                return;
            }

            const response = await axiosInstance.put(`/api/rentals/${rentalId}/update-customer`, {
                customerName: customerEditData.customerName.trim(),
                customerPhone: customerEditData.customerPhone.trim(),
                customerAddress: customerEditData.customerAddress.trim()
            });

            setRental(response.data);
            setIsEditingCustomer(false);
            toast.success("Customer information updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Error updating customer information");
            console.error("Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCustomerEditChange = (e) => {
        const { name, value } = e.target;
        setCustomerEditData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // ✅ UPDATE YOUR fetchRentalDetails FUNCTION
    const fetchRentalDetails = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get(`/api/rentals/${rentalId}`);
            setRental(response.data);
            setLiveBalance(response.data.balanceAmount || 0);

            // ✅ ADD THIS: Initialize customer edit data
            setCustomerEditData({
                customerName: response.data.customerName || '',
                customerPhone: response.data.customerPhone || '',
                customerAddress: response.data.customerAddress || ''
            });
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

    // Helper functions for managing multiple products
    const addProductRow = () => {
        const newProduct = {
            id: Date.now() + Math.random(),
            productId: '',
            quantity: 1,
            days: '',
            startDate: new Date().toISOString().split('T')[0]
        };

        setFormData(prev => ({
            ...prev,
            multipleProducts: [...prev.multipleProducts, newProduct]
        }));
    };

    const removeProductRow = (productRowId) => {
        if (formData.multipleProducts.length > 1) {
            setFormData(prev => ({
                ...prev,
                multipleProducts: prev.multipleProducts.filter(p => p.id !== productRowId)
            }));
        }
    };

    const updateProductRow = (productRowId, field, value) => {
        setFormData(prev => ({
            ...prev,
            multipleProducts: prev.multipleProducts.map(product =>
                product.id === productRowId
                    ? { ...product, [field]: value }
                    : product
            )
        }));
    };

    // Existing helper functions from your original code
    const calculateDaysRentedForProduct = (productItem) => {
        if (!rental.startDate) return 0;

        const productTransactions = (rental.transactions || [])
            .filter(t => t.type === 'rental' && t.productId?.toString() === (productItem.productId._id || productItem.productId)?.toString())
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        const startDate = productTransactions.length > 0
            ? new Date(productTransactions[0].date)
            : new Date(rental.startDate);

        const currentDate = new Date();
        return Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24));
    };

    const calculateLiveAmountForProduct = (productItem) => {
        if (!productItem || !rental.transactions) {
            return productItem?.amount || 0;
        }

        // If amount is locked and set, use it directly (this contains the accumulated total)
        if (productItem.amountLocked && productItem.amount > 0) {
            console.log(`✅ Using locked amount for ${productItem.productName}: ₹${productItem.amount}`);
            return productItem.amount;
        }

        // Otherwise, calculate from transactions (fallback)
        const productId = productItem.productId._id || productItem.productId;

        const productTransactions = rental.transactions.filter(transaction =>
            transaction.productId &&
            transaction.productId.toString() === productId.toString() &&
            (transaction.type === 'rental' || transaction.type === 'return' || transaction.type === 'partial_return')
        );

        const totalTransactionAmount = productTransactions.reduce((sum, transaction) => {
            return sum + (transaction.amount || 0);
        }, 0);

        console.log(`💰 Calculated from transactions for ${productItem.productName}: ₹${totalTransactionAmount.toFixed(2)}`);

        return Math.max(totalTransactionAmount, productItem.amount || 0);
    };


    const calculateProductBalance = (productItem) => {
        if (!productItem) return 0;
        return productItem.balanceAmount || 0;
    };

    const isProductFullyPaid = (productItem) => {
        return calculateProductBalance(productItem) <= 0;
    };

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
            returnDate: new Date().toISOString().split('T')[0],
            addProductDate: new Date().toISOString().split('T')[0],
            addMoreDate: new Date().toISOString().split('T')[0],
            discountAmount: '0',
            discountNotes: '',
            multipleProducts: [
                {
                    id: Date.now(),
                    productId: '',
                    quantity: 1,
                    days: '',
                    startDate: new Date().toISOString().split('T')[0]
                }
            ]
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

    // ✅ UPDATED DELETE FUNCTION WITH FORCE DELETE OPTION
    // ✅ CORRECTED DELETE FUNCTION - NO CIRCULAR REFERENCES
    const deleteEntireRental = async (forceDelete = false) => {
        if (!forceDelete) {
            const confirmed = window.confirm(
                `⚠️ DELETE ENTIRE RENTAL - ${rental.customerName}\n\n` +
                `This will permanently delete:\n` +
                `• Customer: ${rental.customerName} (${rental.customerPhone})\n` +
                `• ${rental.productItems.length} products totaling ₹${(rental.totalAmount || 0).toFixed(2)}\n` +
                `• Total Paid: ₹${(rental.totalPaid || 0).toFixed(2)}\n` +
                `• All ${(rental.transactions || []).length} transactions\n` +
                `• All ${(rental.payments || []).length} payment records\n\n` +
                `⚠️ This action CANNOT be undone!\n\n` +
                `Are you absolutely sure?`
            );

            if (!confirmed) return;
        }

        const reason = prompt(
            forceDelete
                ? "FORCE DELETE - Provide reason for force deleting this rental with payments:"
                : "Please provide a reason for deleting this rental:",
            forceDelete
                ? "Force delete with payments - admin decision"
                : "Added by mistake / Duplicate entry"
        );

        if (reason === null) return;

        try {
            setIsSubmitting(true);

            // ✅ CRITICAL: Only send plain, JSON-serializable data
            const requestData = {
                reason: reason.trim() || "No reason provided",
                forceDelete: Boolean(forceDelete) // ✅ Ensure it's a boolean, not an object
            };

            console.log('🗑️ Sending delete request:', requestData); // ✅ Debug log

            const response = await axiosInstance.delete(
                `/api/rentals/${rentalId}/delete-rental`,
                {
                    data: requestData // ✅ Clean data object
                }
            );

            const summary = response.data.deletionSummary;
            toast.success(
                `Rental deleted successfully!\n\n` +
                `Customer: ${summary.customerName}\n` +
                `Products returned: ${summary.totalProducts}\n` +
                `${summary.totalPaid > 0 ? `⚠️ Payments deleted: ₹${summary.totalPaid.toFixed(2)}` : ''}`,
                { duration: 8000 }
            );

            setTimeout(() => {
                onBack();
            }, 2000);

        } catch (error) {
            console.error('❌ Delete error:', error); // ✅ Better error logging

            if (error.response?.status === 400 && error.response?.data?.hasPendingPayments) {
                const errorData = error.response.data;

                const forceConfirm = window.confirm(
                    `⚠️ RENTAL HAS PAYMENTS!\n\n` +
                    `This rental has ₹${errorData.totalPaid.toFixed(2)} in payments.\n\n` +
                    `Options:\n` +
                    `• Click CANCEL to process refunds first (recommended)\n` +
                    `• Click OK to FORCE DELETE anyway (⚠️ WARNING: This will permanently delete all payment records!)\n\n` +
                    `Do you want to FORCE DELETE this rental and permanently delete all payments?`
                );

                if (forceConfirm) {
                    deleteEntireRental(true); // ✅ Recursive call with clean boolean
                }
                return;
            }

            toast.error(
                error.response?.data?.message ||
                "Error deleting rental. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let endpoint = '';
            let payload = {};

            switch (modalType) {
                case 'general-payment':
                    endpoint = `/api/rentals/${rentalId}/general-payment`;
                    payload = {
                        amount: formData.amount ? parseFloat(formData.amount) : null,
                        discountAmount: formData.discountAmount ? parseFloat(formData.discountAmount) : null,
                        paymentType: formData.paymentType,
                        notes: formData.notes,
                        discountNotes: formData.discountNotes
                    };
                    break;

                case 'return':
                    endpoint = `/api/rentals/${rentalId}/return-and-pay`;
                    payload = {
                        productId: formData.productId,
                        returnQuantity: parseInt(formData.returnQuantity),
                        payFullAmount: formData.payFullAmount || false,
                        paymentAmount: formData.paymentAmount ? parseFloat(formData.paymentAmount) : null,
                        paymentNotes: formData.paymentNotes || null,
                        notes: formData.notes,
                        returnDate: formData.returnDate
                    };
                    break;

                case 'add-rental':
                    endpoint = `/api/rentals/${rentalId}/add-rental`;
                    payload = {
                        productId: formData.productId,
                        additionalQuantity: parseInt(formData.additionalQuantity),
                        additionalStartDate: formData.addMoreDate,
                        notes: formData.notes
                    };
                    break;

                case 'add-products-bulk':
                    // Validate all products before submission
                    const validProducts = formData.multipleProducts.filter(product =>
                        product.productId && product.quantity > 0
                    );

                    if (validProducts.length === 0) {
                        toast.error('Please add at least one valid product');
                        return;
                    }

                    // Check for duplicate products
                    const productIds = validProducts.map(p => p.productId);
                    const uniqueProductIds = [...new Set(productIds)];

                    if (productIds.length !== uniqueProductIds.length) {
                        toast.error('Cannot add duplicate products in the same operation');
                        return;
                    }

                    endpoint = `/api/rentals/${rentalId}/add-products-bulk`;
                    payload = {
                        products: validProducts.map(product => ({
                            productId: product.productId,
                            quantity: parseInt(product.quantity),
                            days: product.days ? parseInt(product.days) : null,
                            startDate: product.startDate,
                            notes: formData.notes
                        }))
                    };
                    break;

                case 'add-product':
                    endpoint = `/api/rentals/${rentalId}/add-product`;
                    payload = {
                        productId: formData.newProductId,
                        quantity: parseInt(formData.newProductQuantity),
                        days: formData.newProductDays ? parseInt(formData.newProductDays) : null,
                        notes: formData.notes,
                        startDate: formData.addProductDate
                    };
                    break;

                case 'payment':
                    endpoint = `/api/rentals/${rentalId}/product-payment`;
                    payload = {
                        productId: formData.productId,
                        amount: parseFloat(formData.amount),
                        paymentType: formData.paymentType,
                        notes: formData.notes
                    };
                    break;

                default:
                    throw new Error(`Unknown modal type: ${modalType}`);
            }

            const response = await axiosInstance.put(endpoint, payload);

            if (modalType === 'general-payment') {
                const paymentAmt = response.data.paymentAmount || 0;
                const discountAmt = response.data.discountAmount || 0;
                const totalReduction = response.data.totalReduction || 0;

                let message = `Payment: ₹${paymentAmt.toFixed(2)}`;
                if (discountAmt > 0) {
                    message += ` + Discount: ₹${discountAmt.toFixed(2)}`;
                }
                message += ` = Total: ₹${totalReduction.toFixed(2)} processed successfully!`;

                toast.success(message, { duration: 4000 });
            }
            else if (modalType === 'add-products-bulk') {
                toast.success(`Successfully added ${payload.products.length} products to rental!`, { duration: 4000 });
            }
            else {
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

    // Activity functions
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

    const getProductActivities = (productId) => {
        const activities = [];

        const productTransactions = rental.transactions.filter(transaction =>
            transaction.productId && transaction.productId.toString() === productId.toString()
        );

        productTransactions.forEach(transaction => {
            activities.push({
                ...transaction,
                activityType: 'transaction',
                date: transaction.date,
                displayDate: new Date(transaction.date).toLocaleDateString(),
            });
        });

        const productPayments = rental.payments.filter(payment =>
            payment.productId && payment.productId.toString() === productId.toString()
        );

        productPayments.forEach(payment => {
            activities.push({
                ...payment,
                activityType: 'payment',
                date: payment.date,
                displayDate: new Date(payment.date).toLocaleDateString(),
            });
        });

        return activities.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    // [Keep all your existing activity rendering functions from the original file]
    const renderProductActivityItem = (activity, index) => {
        const isTransaction = activity.activityType === 'transaction';
        const isPayment = activity.activityType === 'payment';

        const calculateTransactionDays = (activity) => {
            if (!activity.date) return 0;

            if (activity.type === 'return' || activity.type === 'partial_return') {
                const rentalTransaction = rental.transactions.find(t =>
                    t.type === 'rental' &&
                    t.productId &&
                    t.productId.toString() === activity.productId.toString()
                );

                if (rentalTransaction) {
                    const rentalStartDate = new Date(rentalTransaction.date);
                    const returnDate = new Date(activity.date);
                    const daysDifference = Math.ceil((returnDate - rentalStartDate) / (1000 * 60 * 60 * 24));
                    return daysDifference + 1;
                }
            }

            const startDate = new Date(activity.date);
            const endDate = new Date();
            return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        };

        const getDailyRate = (productId) => {
            const productItem = rental.productItems.find(item =>
                (item.productId._id || item.productId).toString() === productId.toString()
            );

            if (!productItem) return 0;

            switch (productItem.rateType) {
                case 'daily': return productItem.rate;
                case 'weekly': return productItem.rate / 7;
                case 'monthly': return productItem.rate / 30;
                default: return productItem.rate;
            }
        };

        if (isTransaction) {
            const isRental = activity.type === 'rental';
            const isReturn = activity.type === 'return' || activity.type === 'partial_return';
            const transactionDays = calculateTransactionDays(activity);
            const dailyRate = getDailyRate(activity.productId);
            const calculatedAmount = activity.quantity * transactionDays * dailyRate;

            return (
                <div key={`product-transaction-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isRental ? 'bg-green-100' : 'bg-orange-100'}`}>
                            {isRental ? (
                                <FiArrowUpCircle className="w-4 h-4 text-green-600" />
                            ) : (
                                <FiArrowDownCircle className="w-4 h-4 text-orange-600" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-800">
                                    {isRental ? 'Rented' : 'Returned'} {activity.quantity} units
                                </span>
                            </div>

                            <div className="text-sm text-gray-600 mt-1 space-y-1">
                                <div className="font-medium">{activity.displayDate}</div>

                                {isReturn && transactionDays > 0 && (
                                    <div className="bg-white p-3 rounded border text-xs space-y-2">
                                        {/* ✅ RENTAL PERIOD CALCULATION */}
                                        <div className="bg-orange-50 p-2 rounded">
                                            <div className="font-medium text-orange-800 mb-1">📅 Rental Period Calculation:</div>
                                            <div className="space-y-1 text-orange-700">
                                                {(() => {
                                                    const rentalTransactions = rental.transactions
                                                        .filter(t => t.type === 'rental' &&
                                                            t.productId &&
                                                            t.productId.toString() === activity.productId.toString())
                                                        .sort((a, b) => new Date(a.date) - new Date(b.date));

                                                    if (rentalTransactions.length > 1) {
                                                        return (
                                                            <>
                                                                <div>• Rented on multiple dates:</div>
                                                                {rentalTransactions.map((rt, index) => (
                                                                    <div key={index} className="ml-4">
                                                                        - {new Date(rt.date).toLocaleDateString()}: {rt.quantity} units of {activity.productName}
                                                                    </div>
                                                                ))}
                                                                <div>• Returned on: {activity.displayDate}</div>
                                                            </>
                                                        );
                                                    } else {
                                                        return (
                                                            <>
                                                                <div>• Rented on: {new Date(rentalTransactions[0]?.date).toLocaleDateString()}</div>
                                                                <div>• Returned on: {activity.displayDate}</div>
                                                                <div className="font-semibold">• Total days: {transactionDays} days (inclusive)</div>
                                                            </>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        </div>

                                        {/* ✅ ENHANCED PRICE CALCULATION WITH PRODUCT NAME */}
                                        <div className="bg-blue-50 p-2 rounded">
                                            <div className="font-medium text-blue-800 mb-1">💰 Price Calculation:</div>
                                            {(() => {
                                                const rentalTransactions = rental.transactions
                                                    .filter(t => t.type === 'rental' &&
                                                        t.productId &&
                                                        t.productId.toString() === activity.productId.toString())
                                                    .sort((a, b) => new Date(a.date) - new Date(b.date));

                                                const isRecalculated = Math.abs(calculatedAmount - (activity.amount || 0)) > 0.01;

                                                if (rentalTransactions.length > 1 && isRecalculated) {
                                                    // ✅ MULTI-PERIOD CALCULATION WITH PRODUCT NAME
                                                    return (
                                                        <div className="space-y-1">
                                                            <div className="text-blue-800 font-medium text-center">
                                                                {activity.quantity} units of {activity.productName} split:
                                                            </div>

                                                            {(() => {
                                                                const returnDate = new Date(activity.date);
                                                                let breakdown = [];
                                                                let remainingQty = activity.quantity;

                                                                // ✅ Get all existing returns to calculate what's already returned from each period
                                                                const existingReturns = rental.transactions
                                                                    .filter(t => (t.type === 'return' || t.type === 'partial_return') &&
                                                                        t.productId &&
                                                                        t.productId.toString() === activity.productId.toString() &&
                                                                        new Date(t.date) < returnDate)
                                                                    .reduce((sum, tx) => sum + tx.quantity, 0);

                                                                let alreadyReturned = existingReturns;

                                                                // ✅ FIFO breakdown calculation (return from oldest rental first)
                                                                for (let i = 0; i < rentalTransactions.length && remainingQty > 0; i++) {
                                                                    const rentalTx = rentalTransactions[i];
                                                                    const rentalDate = new Date(rentalTx.date);
                                                                    const periodDays = Math.ceil((returnDate - rentalDate) / (1000 * 60 * 60 * 24)) + 1;

                                                                    // Calculate available quantity from this period
                                                                    let availableFromPeriod = rentalTx.quantity;
                                                                    if (alreadyReturned > 0) {
                                                                        if (alreadyReturned >= rentalTx.quantity) {
                                                                            availableFromPeriod = 0;
                                                                            alreadyReturned -= rentalTx.quantity;
                                                                        } else {
                                                                            availableFromPeriod = rentalTx.quantity - alreadyReturned;
                                                                            alreadyReturned = 0;
                                                                        }
                                                                    }

                                                                    const qtyFromPeriod = Math.min(remainingQty, availableFromPeriod);

                                                                    if (qtyFromPeriod > 0) {
                                                                        breakdown.push(`${qtyFromPeriod} units×${periodDays} days`);
                                                                        remainingQty -= qtyFromPeriod;
                                                                    }
                                                                }

                                                                return (
                                                                    <div className="text-center font-semibold text-blue-800 bg-white p-2 rounded">
                                                                        ({breakdown.join(' + ')}) × ₹{dailyRate.toFixed(2)}/day = ₹{(activity.amount || 0).toFixed(2)}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    );
                                                } else {
                                                    // ✅ STANDARD SINGLE-PERIOD CALCULATION WITH PRODUCT NAME
                                                    return (
                                                        <div className="text-center font-semibold text-blue-800">
                                                            {activity.quantity} units of {activity.productName} × {transactionDays} days × ₹{dailyRate.toFixed(2)}/day = ₹{calculatedAmount.toFixed(2)}
                                                        </div>
                                                    );
                                                }
                                            })()}
                                        </div>


                                    </div>
                                )}


                                {isRental && (
                                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                        <span>Rate: ₹{dailyRate.toFixed(2)}/day</span>
                                    </div>
                                )}

                                {activity.notes && (
                                    <div className="text-sm text-blue-600 italic font-normal">
                                        📝 {activity.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-right space-y-1">
                        {isRental && activity.amount > 0 && (
                            <span className="font-bold text-lg text-green-600 block">
                                ₹{activity.amount.toFixed(2)}
                            </span>
                        )}

                        {isReturn && (
                            <div className="space-y-1">
                                <span className="font-bold text-lg text-red-600 block">
                                    ₹{(activity.amount || 0).toFixed(2)}
                                </span>


                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (isPayment) {
            const isRefund = activity.type === 'refund';

            return (
                <div key={`product-payment-${index}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isRefund ? 'bg-red-100' : 'bg-blue-100'}`}>
                            <FiCreditCard className={`w-4 h-4 ${isRefund ? 'text-red-600' : 'text-blue-600'}`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-800">
                                    {isRefund ? 'Refund' : 'Payment received'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                                <div className="font-medium">{activity.displayDate}</div>
                                {activity.notes && (
                                    <div className="text-sm text-blue-600 italic font-normal mt-1">
                                        📝 {activity.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`font-bold text-lg ${isRefund ? 'text-red-600' : 'text-green-600'}`}>
                            {isRefund ? '-' : '+'}₹{activity.amount.toFixed(2)}
                        </span>
                    </div>
                </div>
            );
        }

        return null;
    };


    // Add delete function
    const deleteProduct = async (productItem) => {
        // Show confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to delete "${productItem.productName}" from this rental?\n\n` +
            `This will:\n` +
            `• Remove ${productItem.quantity} units from the rental\n` +
            `• Return ${productItem.currentQuantity} units to inventory\n` +
            `• Remove ₹${calculateLiveAmountForProduct(productItem).toFixed(2)} from total amount\n\n` +
            `This action cannot be undone!`
        );

        if (!confirmed) return;

        // Get reason for deletion
        const reason = prompt(
            "Please provide a reason for deleting this product:",
            "Added by mistake"
        );

        if (reason === null) return; // User cancelled

        try {
            setIsSubmitting(true);
            const response = await axiosInstance.delete(
                `/api/rentals/${rentalId}/delete-product/${productItem.productId._id || productItem.productId}`,
                {
                    data: { reason: reason.trim() || "No reason provided" }
                }
            );

            setRental(response.data.rental);
            toast.success(response.data.message, { duration: 5000 });
        } catch (error) {
            toast.error(error.response?.data?.message || "Error deleting product");
            console.error("Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderProductCard = (productItem, index) => {
        const daysRented = calculateDaysRentedForProduct(productItem);
        const liveAmount = calculateLiveAmountForProduct(productItem);
        const productBalance = calculateProductBalance(productItem);
        const isFullyPaid = productBalance <= 0;
        const paidAmount = liveAmount - productBalance;

        // Check if product can be deleted (no returns or payments)
        const hasReturns = rental.transactions.some(t =>
            (t.type === 'return' || t.type === 'partial_return') &&
            t.productId && t.productId.toString() === (productItem.productId._id || productItem.productId).toString()
        );

        const hasPayments = rental.payments.some(p =>
            p.productId && p.productId.toString() === (productItem.productId._id || productItem.productId).toString()
        );

        const canDelete = !hasReturns && !hasPayments && productItem.currentQuantity === productItem.quantity;

        const productActivities = getProductActivities(productItem.productId._id || productItem.productId);

        return (
            <div key={index} className="bg-gray-50 p-8 rounded-lg shadow-xl border border-[#eddbdb]">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-800 uppercase">{productItem.productName}</h4>
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
                            {canDelete && (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                    Can Delete
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-3 text-sm">
                            <div>
                                <span className="text-gray-600">Current Qty</span>
                                <span className="ml-2 font-semibold text-blue-600">{productItem.currentQuantity} units</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Total Qty</span>
                                <span className="ml-2 font-semibold">{productItem.quantity} units</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Rate</span>
                                <span className="ml-2 font-semibold">₹{productItem.rate}/{productItem.rateType}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Days</span>
                                <span className="ml-2 font-semibold text-orange-600">{daysRented} days</span>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons with Delete option */}
                    <div className="flex flex-col gap-2 ml-4">
                        {/* Primary Actions Row */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => openModal('return', productItem)}
                                disabled={productItem.currentQuantity <= 0}
                                className="cursor-pointer bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                            >
                                <FiMinus className="w-3 h-3" />
                                Return
                            </button>
                            <button
                                onClick={() => openModal('add-rental', productItem)}
                                className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                            >
                                <FiPlus className="w-3 h-3" />
                                Add More
                            </button>

                            {!isFullyPaid && (
                                <button
                                    onClick={() => openModal('payment', productItem)}
                                    className="cursor-pointer bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                >
                                    <FiDollarSign className="w-3 h-3" />
                                    Pay
                                </button>
                            )}
                        </div>

                        {/* Secondary Actions Row */}
                        <div className="flex gap-2">


                            {/* ✅ DELETE BUTTON */}
                            {canDelete ? (
                                <button
                                    onClick={() => deleteProduct(productItem)}
                                    disabled={isSubmitting}
                                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                                    title="Delete this product (only if no returns or payments made)"
                                >
                                    {isSubmitting ? (
                                        <LoadingSpinner size="sm" color="white" />
                                    ) : (
                                        <FiTrash2 className="w-3 h-3" />
                                    )}
                                    Delete
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="bg-gray-300 text-gray-500 px-3 py-1 rounded text-sm cursor-not-allowed flex items-center gap-1"
                                    title={
                                        hasReturns ? "Cannot delete: Product has return transactions" :
                                            hasPayments ? "Cannot delete: Product has payment transactions" :
                                                "Cannot delete: Some units have been returned"
                                    }
                                >
                                    <FiTrash2 className="w-3 h-3" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rest of your existing product card content */}
                <div className="mt-4 p-4 bg-white rounded-2xl shadow-xl shadow-gray-200">
                    <h5 className="text-base font-semibold text-gray-700 mb-3">Payment Summary</h5>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                            <div className="text-gray-600 text-sm font-medium">Total Amount</div>
                            <div className="font-bold text-lg text-purple-600">₹{liveAmount.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-gray-600 text-sm font-medium">Paid Amount</div>
                            <div className="font-bold text-lg text-green-600">₹{paidAmount.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-gray-600 text-sm font-medium">Balance</div>
                            <div className={`font-bold text-lg ${isFullyPaid ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{productBalance.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${liveAmount > 0 ? (paidAmount / liveAmount) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <div className="text-sm text-center text-gray-600 mt-2 font-medium">
                            {liveAmount > 0 ? ((paidAmount / liveAmount) * 100).toFixed(1) : 0}% Paid
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-5 bg-white rounded-2xl shadow-xl shadow-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium text-gray-700">Product Activity History</h5>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {productActivities.length} activities
                        </span>
                    </div>

                    <div className="space-y-2 overflow-y-auto">
                        {productActivities.length > 0 ? (
                            productActivities.map((activity, index) =>
                                renderProductActivityItem(activity, index)
                            )
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                <FiPackage className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                <p className="text-xs">No activity recorded for this product yet</p>
                            </div>
                        )}
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

    const calculateTotalRentalAmount = () => {
        if (!rental || !rental.productItems) return 0;
        return rental.productItems.reduce((total, productItem) => {
            return total + calculateLiveAmountForProduct(productItem);
        }, 0);
    };

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
                        <h2 className="text-3xl font-bold text-[#b86969]">
                            Rental Details
                        </h2>
                        <p className="text-gray-600">
                            <span className="uppercase font-bold">{rental.customerName}</span>'s rental management
                        </p>
                    </div>
                </div>
            </div>

            {/* Customer Information Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Customer Information</h3>
                    <div className="flex gap-1">
                        {!isEditingCustomer && (
                            <button
                                onClick={startEditingCustomer}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                            >
                                <FiEdit className="w-3 h-3" />
                                Edit
                            </button>
                        )}

                        {/* ✅ DELETE RENTAL BUTTON */}
                        <button
                            onClick={deleteEntireRental}
                            disabled={isSubmitting}
                            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                            title="Delete entire rental (will return all products to inventory)"
                        >
                            {isSubmitting ? (
                                <LoadingSpinner size="sm" color="white" />
                            ) : (
                                <FiTrash2 className="w-3 h-3" />
                            )}
                            Delete Rental
                        </button>
                    </div>
                </div>

                {isEditingCustomer ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FiUser className="w-4 h-4 inline mr-1" />
                                    Customer Name *
                                </label>
                                <input
                                    type="text"
                                    name="customerName"
                                    value={customerEditData.customerName}
                                    onChange={handleCustomerEditChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter customer name"
                                />
                                {!customerEditData.customerName.trim() && (
                                    <p className="text-xs text-red-600 mt-1">Customer name is required</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FiPhone className="w-4 h-4 inline mr-1" />
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    name="customerPhone"
                                    value={customerEditData.customerPhone}
                                    onChange={handleCustomerEditChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter phone number"
                                />
                                {!customerEditData.customerPhone.trim() && (
                                    <p className="text-xs text-red-600 mt-1">Phone number is required</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FiUser className="w-4 h-4 inline mr-1" />
                                Address (Optional)
                            </label>
                            <textarea
                                name="customerAddress"
                                value={customerEditData.customerAddress}
                                onChange={handleCustomerEditChange}
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter customer address"
                            />
                        </div>

                        {/* Edit Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={saveCustomerEdit}
                                disabled={isSubmitting || !customerEditData.customerName.trim() || !customerEditData.customerPhone.trim()}
                                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <LoadingSpinner size="sm" color="white" />
                                ) : (
                                    <FiSave className="w-4 h-4" />
                                )}
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={cancelCustomerEdit}
                                disabled={isSubmitting}
                                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <FiX className="w-4 h-4" />
                                Cancel
                            </button>
                        </div>

                        {/* Preview of changes */}
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 mb-2">Preview Changes:</p>
                            <div className="text-sm space-y-1">
                                <p><strong>Name:</strong> {customerEditData.customerName || <span className="text-gray-400">Not set</span>}</p>
                                <p><strong>Phone:</strong> {customerEditData.customerPhone || <span className="text-gray-400">Not set</span>}</p>
                                <p><strong>Address:</strong> {customerEditData.customerAddress || <span className="text-gray-400">Not set</span>}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <FiUser className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Customer Name</p>
                                <p className="font-semibold uppercase">{rental.customerName}</p>
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
                )}
            </div>


            {/* Summary Cards */}
            <div className="w-full flex items-center justify-center mb-5">
                <div className="w-full flex flex-row gap-[10%] justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-4 px-10">
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

                    <div className="bg-white rounded-xl shadow-lg p-4 px-10">
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

                    <div className="bg-white rounded-xl shadow-lg p-4 px-10">
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
            </div>

            {/* Products Section with Updated Button */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Rented Products</h3>
                    <div className="flex gap-2">
                        {/* Multiple Products Button */}
                        <button
                            onClick={() => openModal('add-products-bulk')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Products
                        </button>

                    </div>
                </div>

                <div className="grid gap-6">
                    {(rental.productItems || []).map((productItem, index) =>
                        renderProductCard(productItem, index)
                    )}
                </div>
            </div>

            {/* General Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Actions</h3>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => openModal('general-payment')}
                        disabled={calculateTotalBalance() <= 0}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2"
                    >
                        <FiDollarSign className="w-5 h-5" />
                        Payment & Discount (Balance: ₹{calculateTotalBalance().toFixed(2)})
                    </button>

                    {/* WhatsApp Bill Button */}
                    <button
                        onClick={() => setShowWhatsAppBill(true)}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg transition-all flex items-center gap-2"
                    >
                        <FiMessageSquare className="w-5 h-5" />
                        📱 Send Bill to WhatsApp
                    </button>


                </div>
            </div>

            {/* Add WhatsApp Bill Modal */}
            <WhatsAppBill
                rental={rental}
                isOpen={showWhatsAppBill}
                onClose={() => setShowWhatsAppBill(false)}
            />

            {/* Enhanced Modal with Multiple Products Support */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-xl font-semibold text-gray-800">
                                {modalType === 'add-products-bulk' ? 'Add Multiple Products' :
                                    modalType === 'add-product' ? 'Add Single Product' :
                                        modalType === 'general-payment' ? 'Payment & Discount' :
                                            modalType.charAt(0).toUpperCase() + modalType.slice(1).replace('-', ' ')}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <FiX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Multiple Products Modal Content */}
                                {modalType === 'add-products-bulk' && (
                                    <>
                                        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                                            <p className="text-sm text-purple-800">
                                                Adding multiple products to <strong>{rental.customerName}'s</strong> rental.
                                            </p>
                                            <p className="text-sm text-purple-600 mt-1">
                                                You can add multiple products with individual quantities and dates.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-gray-700">Products to Add</h4>
                                                <button
                                                    type="button"
                                                    onClick={addProductRow}
                                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                                >
                                                    <FiPlus className="w-3 h-3" /> Add Product
                                                </button>
                                            </div>

                                            <div className=" space-y-4">
                                                {formData.multipleProducts.map((productRow, index) => (
                                                    <div key={productRow.id} className="bg-gray-50 p-4 rounded-lg border">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-sm font-medium text-gray-600">
                                                                Product #{index + 1}
                                                            </span>
                                                            {formData.multipleProducts.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeProductRow(productRow.id)}
                                                                    className="text-red-500 hover:text-red-700 p-1"
                                                                >
                                                                    <FiX className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Product Selection */}
                                                        <div className="mb-3">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Select Product
                                                            </label>
                                                            <div className="relative">
                                                                <select
                                                                    value={productRow.productId}
                                                                    onChange={(e) => updateProductRow(productRow.id, 'productId', e.target.value)}
                                                                    required
                                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                                                                >
                                                                    <option value="">Choose a product</option>
                                                                    {products
                                                                        .filter(product =>
                                                                            // Filter out products already in rental and already selected in other rows
                                                                            !rental.productItems.some(item =>
                                                                                (item.productId._id || item.productId).toString() === product._id.toString()
                                                                            ) &&
                                                                            !formData.multipleProducts
                                                                                .filter(p => p.id !== productRow.id)
                                                                                .map(p => p.productId)
                                                                                .includes(product._id)
                                                                        )
                                                                        .map(product => (
                                                                            <option key={product._id} value={product._id}>
                                                                                {product.name} - ₹{product.rate}/{product.rateType} (Available: {product.quantity})
                                                                            </option>
                                                                        ))
                                                                    }
                                                                </select>
                                                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                                    <FiChevronDown className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Quantity, Days, and Date in a grid */}
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Quantity
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={productRow.quantity}
                                                                    onChange={(e) => updateProductRow(productRow.id, 'quantity', e.target.value)}
                                                                    min="1"
                                                                    max={
                                                                        productRow.productId
                                                                            ? products.find(p => p._id === productRow.productId)?.quantity || 1
                                                                            : 1
                                                                    }
                                                                    required
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="Qty"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    Days (Optional)
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    value={productRow.days}
                                                                    onChange={(e) => updateProductRow(productRow.id, 'days', e.target.value)}
                                                                    min="1"
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                    placeholder="Days"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                    <FiCalendar className="w-3 h-3 inline mr-1" />
                                                                    Start Date
                                                                </label>
                                                                <input
                                                                    type="date"
                                                                    value={productRow.startDate}
                                                                    onChange={(e) => updateProductRow(productRow.id, 'startDate', e.target.value)}
                                                                    max={new Date().toISOString().split('T')[0]}
                                                                    required
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Product Info Display */}
                                                        {productRow.productId && (
                                                            <div className="mt-3 p-2 bg-white rounded border">
                                                                {(() => {
                                                                    const selectedProduct = products.find(p => p._id === productRow.productId);
                                                                    return selectedProduct ? (
                                                                        <div className="text-xs text-gray-600 space-y-1">
                                                                            <div className="flex justify-between">
                                                                                <span>Rate: ₹{selectedProduct.rate}/{selectedProduct.rateType}</span>
                                                                                <span>Available: {selectedProduct.quantity} units</span>
                                                                            </div>
                                                                            {productRow.days && (
                                                                                <div className="text-blue-600 font-medium">
                                                                                    Estimated Cost: ₹{(
                                                                                        selectedProduct.rateType === 'daily'
                                                                                            ? selectedProduct.rate * productRow.days * productRow.quantity
                                                                                            : selectedProduct.rateType === 'weekly'
                                                                                                ? selectedProduct.rate * Math.ceil(productRow.days / 7) * productRow.quantity
                                                                                                : selectedProduct.rate * Math.ceil(productRow.days / 30) * productRow.quantity
                                                                                    ).toFixed(2)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : null;
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Common Notes for all products */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Notes (Applied to all products)
                                                </label>
                                                <textarea
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleChange}
                                                    rows="2"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Additional notes for all products..."
                                                />
                                            </div>

                                            {/* Summary */}
                                            <div className="bg-blue-50 p-3 rounded-lg">
                                                <p className="text-sm font-medium text-blue-800 mb-1">Summary</p>
                                                <div className="text-sm text-blue-700">
                                                    <p>Products to add: {formData.multipleProducts.filter(p => p.productId).length}</p>
                                                    <p>Total units: {formData.multipleProducts.reduce((sum, p) => sum + (p.productId ? parseInt(p.quantity || 0) : 0), 0)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Single Product Modal */}
                                {modalType === 'add-product' && (
                                    <>
                                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                            <p className="text-sm text-blue-800">
                                                Adding new product to <strong>{rental.customerName}'s</strong> rental.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Select Product
                                            </label>
                                            <div className="relative">
                                                <select
                                                    name="newProductId"
                                                    value={formData.newProductId}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none"
                                                >
                                                    <option value="">Choose a product</option>
                                                    {products
                                                        .filter(product =>
                                                            !rental.productItems.some(item =>
                                                                (item.productId._id || item.productId).toString() === product._id.toString()
                                                            )
                                                        )
                                                        .map(product => (
                                                            <option key={product._id} value={product._id}>
                                                                {product.name} - ₹{product.rate}/{product.rateType} (Available: {product.quantity})
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                    <FiChevronDown className="w-4 h-4 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Quantity
                                                </label>
                                                <input
                                                    type="number"
                                                    name="newProductQuantity"
                                                    value={formData.newProductQuantity}
                                                    onChange={handleChange}
                                                    min="1"
                                                    required
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    <FiCalendar className="w-4 h-4 inline mr-1" />
                                                    Start Date
                                                </label>
                                                <input
                                                    type="date"
                                                    name="addProductDate"
                                                    value={formData.addProductDate}
                                                    onChange={handleChange}
                                                    max={new Date().toISOString().split('T')[0]}
                                                    required
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* General Payment Modal */}
                                {modalType === 'general-payment' && (
                                    <>
                                        <div className="mb-4 p-4 bg-green-50 rounded-lg">
                                            <p className="text-sm text-green-800">
                                                <strong>Payment & Discount</strong>
                                            </p>
                                            <p className="text-lg font-bold text-green-900 mt-2">
                                                Current Total Balance: ₹{calculateTotalBalance().toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                💰 Payment Amount <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="amount"
                                                value={formData.amount}
                                                onChange={handleChange}
                                                step="0.01"
                                                min="0.01"
                                                max={calculateTotalBalance() - (parseFloat(formData.discountAmount) || 0)}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                placeholder="Enter payment amount"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                💸 Discount Amount (Optional)
                                            </label>
                                            <input
                                                type="number"
                                                name="discountAmount"
                                                value={formData.discountAmount}
                                                onChange={handleChange}
                                                step="0.01"
                                                min="0"
                                                max={calculateTotalBalance() - (parseFloat(formData.amount) || 0)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                placeholder="Enter discount amount (default: 0)"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment Type
                                            </label>
                                            <select
                                                name="paymentType"
                                                value={formData.paymentType}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            >
                                                <option value="general">General Payment</option>
                                                <option value="partial_payment">Partial Payment</option>
                                                <option value="advance">Advance Payment</option>
                                            </select>
                                        </div>

                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment Notes
                                            </label>
                                            <textarea
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleChange}
                                                rows="2"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                placeholder="Payment method, reference, etc."
                                            />
                                        </div>

                                        {formData.discountAmount && parseFloat(formData.discountAmount) > 0 && (
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Discount Notes
                                                </label>
                                                <textarea
                                                    name="discountNotes"
                                                    value={formData.discountNotes}
                                                    onChange={handleChange}
                                                    rows="2"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                                    placeholder="Reason for discount, special offer, etc."
                                                />
                                            </div>
                                        )}

                                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                            <p className="text-sm font-medium text-blue-800 mb-2">Transaction Summary:</p>
                                            <div className="space-y-1 text-sm text-blue-700">
                                                <p>💰 Payment: ₹{(parseFloat(formData.amount) || 0).toFixed(2)}</p>
                                                <p>💸 Discount: ₹{(parseFloat(formData.discountAmount) || 0).toFixed(2)}</p>
                                                <p className="font-medium border-t pt-1">
                                                    📊 Total Reduction: ₹{((parseFloat(formData.amount) || 0) + (parseFloat(formData.discountAmount) || 0)).toFixed(2)}
                                                </p>
                                                <p className="font-medium text-green-700">
                                                    🎯 New Balance: ₹{(calculateTotalBalance() - (parseFloat(formData.amount) || 0) - (parseFloat(formData.discountAmount) || 0)).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Other existing modal types (return, add-rental, payment, etc.) would go here */}
                                {modalType === 'return' && (
                                    <>
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
                                                max={new Date().toISOString().split('T')[0]}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Select the date when the product was returned
                                            </p>
                                        </div>
                                    </>
                                )}

                                {modalType === 'add-rental' && (
                                    <>
                                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                            <p className="text-sm text-green-800">
                                                Adding more <strong>{selectedProductItem?.productName}</strong>
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
                                                name="addMoreDate"
                                                value={formData.addMoreDate}
                                                onChange={handleChange}
                                                max={new Date().toISOString().split('T')[0]}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </>
                                )}

                                {modalType === 'payment' && (
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

                                {/* Common Notes Field */}
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
                                        placeholder="Additional notes..."
                                    />
                                </div>

                                {/* Action Buttons */}
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
                                        {modalType === 'add-products-bulk' && 'Add All Products'}
                                        {modalType === 'add-product' && 'Add Product'}
                                        {modalType === 'general-payment' && 'Process Payment'}
                                        {modalType === 'return' && 'Process Return'}
                                        {modalType === 'add-rental' && 'Add Quantity'}
                                        {modalType === 'payment' && 'Add Payment'}
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
