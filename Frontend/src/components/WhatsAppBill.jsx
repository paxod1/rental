// components/WhatsAppBill.jsx - AUTOMATIC SENDING VERSION
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

    useEffect(() => {
        if (rental && isOpen) {
            setPhoneNumber(rental.customerPhone || '');
            generateBillText();
            checkWhatsAppStatus();
        }
    }, [rental, isOpen]);

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
        const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

        let billText = `🏢 *EDASSERIKKUDIYIL RENTALS*
Quality Rentals You Can Trust
━━━━━━━━━━━━━━━━━━━━━━━━━

📋 *RENTAL BILL*
━━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Customer Details:*
• Name: ${rental.customerName}
• Phone: ${rental.customerPhone}
• Address: ${rental.customerAddress || 'Not provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━

📦 *RENTED PRODUCTS:*`;

        // Add product details
        rental.productItems.forEach((product, index) => {
            const activities = getProductActivities(product.productId._id || product.productId);

            billText += `

${index + 1}. *${product.productName.toUpperCase()}*
   Rate: ${formatCurrency(product.rate)}/${product.rateType}
   Total Quantity: ${product.quantity} units
   Status: ${product.currentQuantity === 0 ? '✅ Returned' : '🔄 Active'}
   
   💰 *Amount: ${formatCurrency(product.amount || 0)}*
   💳 *Paid: ${formatCurrency(product.paidAmount || 0)}*
   🔴 *Balance: ${formatCurrency(product.balanceAmount || 0)}*`;

            // Add activity timeline
            if (activities.length > 0) {
                billText += `
   
   📅 *Activity History:*`;
                activities.forEach(activity => {
                    if (activity.activityType === 'transaction') {
                        if (activity.type === 'rental') {
                            billText += `
   • ${formatDate(activity.date)}: Rented ${activity.quantity} units`;
                        } else {
                            billText += `
   • ${formatDate(activity.date)}: Returned ${activity.quantity} units - ${formatCurrency(activity.amount || 0)}`;
                        }
                    } else if (activity.activityType === 'payment') {
                        billText += `
   • ${formatDate(activity.date)}: Payment ${formatCurrency(activity.amount)} ${activity.type === 'refund' ? '(Refund)' : ''}`;
                    }
                });
            }
        });

        billText += `

━━━━━━━━━━━━━━━━━━━━━━━━━

💰 *PAYMENT SUMMARY:*
• Total Amount: ${formatCurrency(rental.totalAmount || 0)}
• Total Paid: ${formatCurrency(rental.totalPaid || 0)}
• **Balance Due: ${formatCurrency(rental.balanceAmount || 0)}**

📊 Payment Progress: ${rental.totalAmount > 0 ? ((rental.totalPaid / rental.totalAmount) * 100).toFixed(1) : 0}%

━━━━━━━━━━━━━━━━━━━━━━━━━

📞 *Contact Us:*
Phone: +91-9961964928
Email: info@edasserikkudiyil.com

⏰ Generated: ${formatDate(new Date())}

*Thank you for choosing Edasserikkudiyil Rentals!*`;

        setBillPreview(billText.trim());
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

    // ✅ UPDATED: For automatic sending
    const sendWhatsAppBill = async () => {
        if (!phoneNumber) {
            toast.error('Please enter a phone number');
            return;
        }

        if (!validatePhoneNumber(phoneNumber)) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        // Check WhatsApp connection first
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <div className="flex items-center gap-3">
                        <FiMessageSquare className="w-6 h-6" />
                        <div>
                            <h3 className="text-xl font-semibold">Send Bill via WhatsApp (Auto)</h3>
                            <p className="text-green-100 text-sm">Customer: {rental?.customerName}</p>
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
                                </ul>
                            </div>
                        </div>

                        {/* Right Panel - Bill Preview */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-800 mb-3">📄 Bill Preview</h4>
                            <div className="bg-white rounded-lg p-4 border h-96 overflow-y-auto">
                                <pre className="text-xs whitespace-pre-wrap text-gray-800 font-mono leading-relaxed">
                                    {billPreview}
                                </pre>
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
