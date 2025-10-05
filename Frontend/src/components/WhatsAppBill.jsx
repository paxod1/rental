// components/WhatsAppBill.jsx - WITH DISCOUNT SUPPORT
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    FiMessageSquare,
    FiPhone,
    FiX,
    FiSend,
    FiEdit3,
    FiCheck,
    FiLoader,
    FiWifi
} from 'react-icons/fi';
import axiosInstance from '../../axiosCreate';

const WhatsAppBill = ({ rental, isOpen, onClose }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [billPreview, setBillPreview] = useState('');
    const [whatsappStatus, setWhatsappStatus] = useState({ connected: false, status: 'checking' });
    const [billType, setBillType] = useState('detailed');


    useEffect(() => {
        if (rental && isOpen) {
            setPhoneNumber(rental.customerPhone || '');
            generateBill(); // Use the main generate function instead of generateBillText
            checkWhatsAppStatus();
        }
    }, [rental, isOpen, billType]); // Add billType to dependencies

    

    const generateBill = () => {
        switch (billType) {
            case 'simple':
                return generateSimpleBill();
            case 'minimal':
                return generateMinimalBill();
            default:
                return generateBillText();
        }
    };


    const checkWhatsAppStatus = async () => {
        try {
            const response = await axiosInstance.get('/api/whatsapp/status');
            setWhatsappStatus(response.data);
        } catch (error) {
            console.error('Failed to check WhatsApp status:', error);
            setWhatsappStatus({ connected: false, status: 'error' });
        }
    };

    const restartWhatsApp = async () => {
        try {
            const response = await axiosInstance.post('/api/whatsapp/restart');
            if (response.data.success) {
                toast.success('WhatsApp service restarted! Check terminal for QR code.', {
                    duration: 5000
                });
                setTimeout(checkWhatsAppStatus, 2000);
            }
        } catch (error) {
            toast.error('Failed to restart WhatsApp service');
        }
    };

    const generateBillText = () => {
        if (!rental) return;

        const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');
        const formatCurrency = (amount) => `₹${amount?.toFixed(2) || '0.00'}`;

        // Calculate totals
        const subtotal = rental.totalAmount || 0;
        const totalPaid = rental.totalPaid || 0;
        const totalDiscount = getTotalDiscounts();
        const balance = rental.balanceAmount || 0;
        const netAmount = subtotal - totalDiscount;

        // Generate invoice number
        const invoiceNo = `INV-${rental._id?.slice(-6)?.toUpperCase() || '000000'}`;
        const currentDate = formatDate(new Date());

        let billText = `*EDASSERIKKUDIYIL RENTALS PVT LTD*

*INVOICE / BILL RECEIPT*

*Invoice No:* ${invoiceNo}
*Date:* ${currentDate}
*Customer:* ${rental.customerName}

*BILL TO:*
${rental.customerName}
📱 ${rental.customerPhone}
📍 ${rental.customerAddress || 'Address not provided'}

*RENTAL DETAILS:*
────────────────────`;

        // Add product items
        rental.productItems.forEach((product, index) => {
            const activities = getProductActivities(product.productId?._id || product.productId);

            billText += `\n
*${index + 1}. ${product.productName.toUpperCase()}*
Rate: ${formatCurrency(product.rate)}/${product.rateType}
Quantity: ${product.quantity} units
Current: ${product.currentQuantity} units
Amount: ${formatCurrency(product.amount || 0)}`;

            // Add transaction history
            if (activities.length > 0) {
                billText += `\n*Transaction History:*`;
                activities.forEach(activity => {
                    if (activity.activityType === 'transaction') {
                        if (activity.type === 'rental' || activity.type === 'additional_rental') {
                            billText += `\n📦 ${formatDate(activity.date)}: Rented ${activity.quantity} units`;
                        } else if (activity.type === 'return' || activity.type === 'partial_return') {
                            billText += `\n🔄 ${formatDate(activity.date)}: Returned ${activity.quantity} units`;
                            if (activity.amount > 0) {
                                billText += ` (${formatCurrency(activity.amount)})`;
                            }
                        }
                    } else if (activity.activityType === 'payment') {
                        billText += `\n💳 ${formatDate(activity.date)}: Payment ${formatCurrency(activity.amount)}`;
                    }
                });
            }
        });

        billText += `\n
*PAYMENT SUMMARY:*
────────────────────
Subtotal: ${formatCurrency(subtotal)}`;

        if (totalDiscount > 0) {
            billText += `
Discount: -${formatCurrency(totalDiscount)}
────────────────────
Net Amount: ${formatCurrency(netAmount)}`;
        }

        billText += `
Paid: ${formatCurrency(totalPaid)}
────────────────────
*BALANCE DUE: ${formatCurrency(balance)}*`;

        // Payment status with emoji
        let statusEmoji = balance > 0 ? '🔴' : '✅';
        let statusText = balance > 0 ? 'PENDING' : 'PAID';
        let progressPercent = subtotal > 0 ? ((totalPaid / subtotal) * 100).toFixed(0) : 0;

        billText += `\n
*PAYMENT STATUS:* ${statusEmoji} ${statusText}
Progress: ${progressPercent}% Complete`;

        // Discount breakdown if any
        if (totalDiscount > 0) {
            billText += `\n
*DISCOUNT BREAKDOWN:*`;
            const discountBreakdown = getDiscountBreakdown();
            discountBreakdown.forEach((discount, index) => {
                billText += `\n${index + 1}. ${formatDate(discount.date)}: ${formatCurrency(discount.amount)}`;
                if (discount.notes) {
                    billText += ` (${discount.notes})`;
                }
            });
            billText += `\n────────────────────
*TOTAL SAVINGS: ${formatCurrency(totalDiscount)}*`;
        }

        billText += `\n
*TERMS & CONDITIONS:*
• Payment due within 30 days
• Items to be returned in good condition
• Late fees may apply for overdue payments

*CONTACT INFORMATION:*
📞 Phone: +91-9961964928
📧 Email: info@edasserikkudiyil.com
🌐 Service: Equipment Rental

_Generated on ${currentDate}_

*Thank you for your business!*
*EDASSERIKKUDIYIL RENTALS*`;

        setBillPreview(billText.trim());
    };

    // Alternative: Simple version for better WhatsApp display
    const generateSimpleBill = () => {
        if (!rental) return;

        const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');
        const formatCurrency = (amount) => `₹${amount?.toFixed(2) || '0.00'}`;

        const subtotal = rental.totalAmount || 0;
        const totalPaid = rental.totalPaid || 0;
        const totalDiscount = getTotalDiscounts();
        const balance = rental.balanceAmount || 0;
        const netAmount = subtotal - totalDiscount;

        const invoiceNo = `INV-${rental._id?.slice(-6)?.toUpperCase() || '000000'}`;

        let billText = `*EDASSERIKKUDIYIL RENTALS*
*INVOICE ${invoiceNo}*

*Customer:* ${rental.customerName}
*Phone:* ${rental.customerPhone}
*Date:* ${formatDate(new Date())}

*ITEMS RENTED:*
`;

        // Products summary
        rental.productItems.forEach((product, index) => {
            billText += `
${index + 1}. ${product.productName}
   Qty: ${product.quantity} units (${product.currentQuantity} active)
   Rate: ${formatCurrency(product.rate)}/${product.rateType}
   Amount: ${formatCurrency(product.amount || 0)}
`;
        });

        billText += `
*AMOUNT SUMMARY:*
Subtotal: ${formatCurrency(subtotal)}`;

        if (totalDiscount > 0) {
            billText += `
Discount: -${formatCurrency(totalDiscount)}
Net Amount: ${formatCurrency(netAmount)}`;
        }

        billText += `
Paid: ${formatCurrency(totalPaid)}
*Balance: ${formatCurrency(balance)}*

*Status:* ${balance > 0 ? '🔄 PENDING' : '✅ PAID'}

*Contact:* +91-9961964928
*Thank You!*`;

        setBillPreview(billText.trim());
    };

    // Ultra simple version for SMS/WhatsApp
    const generateMinimalBill = () => {
        if (!rental) return;

        const formatCurrency = (amount) => `₹${amount?.toFixed(2) || '0.00'}`;
        const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

        const balance = rental.balanceAmount || 0;
        const totalPaid = rental.totalPaid || 0;
        const totalAmount = rental.totalAmount || 0;

        let billText = `*Rental Invoice*

Customer: ${rental.customerName}
Invoice Date: ${formatDate(new Date())}

*Products:*
`;

        rental.productItems.forEach((product, index) => {
            billText += `${product.productName} - ${formatCurrency(product.amount || 0)}
`;
        });

        billText += `
Total: ${formatCurrency(totalAmount)}
Paid: ${formatCurrency(totalPaid)}
*Balance: ${formatCurrency(balance)}*

Status: ${balance > 0 ? 'Pending' : 'Paid'}

EDASSERIKKUDIYIL RENTALS
📞 +91-9961964928`;

        setBillPreview(billText.trim());
    };

    // Helper function to calculate total days for a product (fixed version)
    const getProductTotalDays = (activities) => {
        if (!activities || activities.length === 0) return 0;

        const rentals = activities.filter(a =>
            a.activityType === 'transaction' &&
            (a.type === 'rental' || a.type === 'additional_rental')
        );
        const returns = activities.filter(a =>
            a.activityType === 'transaction' &&
            (a.type === 'return' || a.type === 'partial_return')
        );

        if (rentals.length === 0) return 0;

        // Sort by date
        rentals.sort((a, b) => new Date(a.date) - new Date(b.date));
        returns.sort((a, b) => new Date(a.date) - new Date(b.date));

        const firstRental = rentals[0];
        const lastActivity = returns.length > 0 ? returns[returns.length - 1] : rentals[rentals.length - 1];

        const start = new Date(firstRental.date);
        const end = returns.length > 0 ? new Date(lastActivity.date) : new Date();

        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return Math.max(days, 1); // Ensure at least 1 day
    };






    // ✅ HELPER FUNCTION TO CALCULATE TOTAL DISCOUNTS
    const getTotalDiscounts = () => {
        if (!rental || !rental.payments) return 0;

        return rental.payments.reduce((total, payment) => {
            return total + (payment.discountAmount || 0);
        }, 0);
    };

    // ✅ HELPER FUNCTION TO GET DISCOUNT BREAKDOWN
    const getDiscountBreakdown = () => {
        if (!rental || !rental.payments) return [];

        return rental.payments
            .filter(payment => payment.discountAmount && payment.discountAmount > 0)
            .map(payment => ({
                date: payment.date,
                amount: payment.discountAmount,
                notes: payment.discountNotes || payment.notes
            }));
    };

    const getProductActivities = (productId) => {
        if (!rental) return [];

        const activities = [];

        const productTransactions = rental.transactions.filter(transaction => {
            return transaction.productId &&
                transaction.productId.toString() === productId.toString();
        });

        productTransactions.forEach(transaction => {
            activities.push({
                ...transaction,
                activityType: 'transaction',
                date: transaction.date
            });
        });

        const productPayments = rental.payments.filter(payment => {
            return payment.productId &&
                payment.productId.toString() === productId.toString();
        });

        productPayments.forEach(payment => {
            activities.push({
                ...payment,
                activityType: 'payment',
                date: payment.date
            });
        });

        return activities.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^[6-9]\d{9}$/;
        const cleanPhone = phone.replace(/\D/g, '');
        return phoneRegex.test(cleanPhone);
    };

    const formatPhoneNumber = (phone) => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 10) {
            return `91${cleanPhone}`;
        }
        return cleanPhone;
    };

    const sendWhatsAppBill = async () => {
        if (!phoneNumber) {
            toast.error('Please enter a phone number');
            return;
        }

        if (!validatePhoneNumber(phoneNumber)) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        if (!whatsappStatus.connected) {
            toast.error('WhatsApp is not connected. Please scan QR code in terminal first.', {
                duration: 8000
            });
            return;
        }

        setIsSending(true);

        try {
            const formattedPhone = formatPhoneNumber(phoneNumber);

            const response = await axiosInstance.post('/api/whatsapp/send-bill', {
                phoneNumber: formattedPhone,
                billText: billPreview,
                customerName: rental.customerName,
                rentalId: rental._id
            });

            if (response.data.success) {
                toast.success('✅ Bill sent automatically via WhatsApp!', {
                    duration: 5000,
                    icon: '📱'
                });
                onClose();
            } else if (response.data.needsQR) {
                toast.error('WhatsApp not connected. Please scan QR code in terminal first.', {
                    duration: 8000
                });
            } else {
                throw new Error(response.data.message || 'Failed to send bill');
            }
        } catch (error) {
            console.error('WhatsApp send error:', error);
            if (error.response?.status === 503) {
                toast.error('WhatsApp not connected. Please connect WhatsApp first.', {
                    duration: 6000
                });
            } else {
                toast.error(error.response?.data?.message || 'Failed to send WhatsApp bill automatically.');
            }
        } finally {
            setIsSending(false);
        }
    };

    const copyBillText = () => {
        navigator.clipboard.writeText(billPreview);
        toast.success('Bill copied to clipboard!');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <div className="flex items-center gap-3">
                        <FiMessageSquare className="w-6 h-6" />
                        <div>
                            <h3 className="text-xl font-semibold">Send Bill via WhatsApp (Auto)</h3>
                            <p className="text-green-100 text-sm">Customer: {rental?.customerName}</p>
                            {getTotalDiscounts() > 0 && (
                                <p className="text-green-100 text-xs">💸 Includes ₹{getTotalDiscounts().toFixed(2)} discount</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-green-600 rounded-full transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Panel */}
                        <div className="space-y-6">
                            {/* WhatsApp Status */}
                            <div className={`rounded-lg p-4 ${whatsappStatus.connected ? 'bg-green-50' : 'bg-red-50'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <FiWifi className={`w-4 h-4 ${whatsappStatus.connected ? 'text-green-600' : 'text-red-600'}`} />
                                        <span className={`font-medium text-sm ${whatsappStatus.connected ? 'text-green-800' : 'text-red-800'}`}>
                                            WhatsApp Status: {whatsappStatus.connected ? 'Connected ✅' : 'Not Connected ❌'}
                                        </span>
                                    </div>

                                    {!whatsappStatus.connected && (
                                        <button
                                            onClick={restartWhatsApp}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                        >
                                            🔄 Generate QR
                                        </button>
                                    )}
                                </div>

                                {!whatsappStatus.connected && (
                                    <div className="text-red-700 text-xs space-y-1">
                                        <p>Please scan QR code in terminal to connect WhatsApp</p>
                                        <p>Click "Generate QR" to create a new QR code</p>
                                    </div>
                                )}
                            </div>

                            {/* Phone Number Section */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                                    <FiPhone className="w-4 h-4" />
                                    Customer WhatsApp Number
                                </h4>

                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <>
                                            <div className="flex-1">
                                                <input
                                                    type="tel"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    placeholder="Enter 10-digit phone number"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Enter without +91 (e.g., 9876543210)
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                                            >
                                                <FiCheck className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1">
                                                <div className="bg-white px-3 py-2 border rounded-lg">
                                                    {phoneNumber ? (
                                                        <span className="font-mono">+91 {phoneNumber}</span>
                                                    ) : (
                                                        <span className="text-gray-400">No number set</span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                                            >
                                                <FiEdit3 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {phoneNumber && !validatePhoneNumber(phoneNumber) && (
                                    <p className="text-red-600 text-sm mt-2">
                                        Please enter a valid 10-digit phone number
                                    </p>
                                )}
                            </div>

                            {/* ✅ DISCOUNT SUMMARY IF DISCOUNTS EXIST */}
                            {getTotalDiscounts() > 0 && (
                                <div className="bg-yellow-50 rounded-lg p-4">
                                    <h5 className="font-medium text-yellow-800 mb-2">💸 Discount Information:</h5>
                                    <div className="text-sm text-yellow-700 space-y-1">
                                        <p>• Total Discounts: ₹{getTotalDiscounts().toFixed(2)}</p>
                                        <p>• {getDiscountBreakdown().length} discount(s) applied</p>
                                        <p>• Customer saves ₹{getTotalDiscounts().toFixed(2)} on this rental</p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={sendWhatsAppBill}
                                    disabled={!phoneNumber || !validatePhoneNumber(phoneNumber) || isSending || !whatsappStatus.connected}
                                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                                >
                                    {isSending ? (
                                        <>
                                            <FiLoader className="w-5 h-5 animate-spin" />
                                            Sending automatically...
                                        </>
                                    ) : (
                                        <>
                                            <FiSend className="w-5 h-5" />
                                            🤖 Send Bill Automatically
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={copyBillText}
                                    className="w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                                >
                                    📋 Copy Bill Text
                                </button>
                            </div>

                            {/* Instructions */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h5 className="font-medium text-blue-800 mb-2">🤖 Automatic Sending:</h5>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• WhatsApp must be connected (scan QR once)</li>
                                    <li>• Bill sends automatically to customer</li>
                                    <li>• No manual intervention needed</li>
                                    <li>• Message sent from +91-9961964928</li>
                                    {getTotalDiscounts() > 0 && (
                                        <li>• ✅ Includes discount information</li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* Right Panel - Bill Preview */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-800">📄 Bill Preview</h4>

                                {/* Bill Format Selector */}
                                <div className="flex gap-1 bg-white border rounded-lg p-1">
                                    <button
                                        onClick={() => {
                                            setBillType('detailed');
                                            generateBillText(); // Auto-generate when switching
                                        }}
                                        className={`px-3 py-1 text-xs rounded transition-colors ${billType === 'detailed'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Detailed
                                    </button>
                                    <button
                                        onClick={() => {
                                            setBillType('simple');
                                            generateSimpleBill(); // Auto-generate when switching
                                        }}
                                        className={`px-3 py-1 text-xs rounded transition-colors ${billType === 'simple'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Simple
                                    </button>
                                    <button
                                        onClick={() => {
                                            setBillType('minimal');
                                            generateMinimalBill(); // Auto-generate when switching
                                        }}
                                        className={`px-3 py-1 text-xs rounded transition-colors ${billType === 'minimal'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Minimal
                                    </button>
                                </div>
                            </div>

                            {/* Bill Preview Area */}
                            <div className="bg-white rounded-lg p-4 border h-96 overflow-y-auto">
                                <pre className="text-xs whitespace-pre-wrap text-gray-800 font-mono leading-relaxed">
                                    {billPreview || `Select a bill format and click generate to preview...
            
Available Formats:
• Detailed - Full bill with transaction history
• Simple - Clean summary with key details  
• Minimal - Ultra-compact for quick sending`}
                                </pre>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={generateBill}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                >
                                    🔄 Generate Bill
                                </button>
                                <button
                                    onClick={copyBillText}
                                    disabled={!billPreview}
                                    className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                >
                                    📋 Copy Text
                                </button>
                            </div>
                        </div>


                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={checkWhatsAppStatus}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                    >
                        🔄 Check Status
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppBill;
