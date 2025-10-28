// components/WhatsAppBill.jsx - FREE MODE (Opens Native WhatsApp)
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    FiMessageSquare,
    FiPhone,
    FiX,
    FiSend,
    FiEdit3,
    FiCheck,
    FiExternalLink,
    FiSmartphone
} from 'react-icons/fi';

const WhatsAppBill = ({ rental, isOpen, onClose }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [billPreview, setBillPreview] = useState('');
    const [billType, setBillType] = useState('detailed');

    useEffect(() => {
        if (rental && isOpen) {
            setPhoneNumber(rental.customerPhone || '');
            generateBill();
        }
    }, [rental, isOpen, billType]);

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
*Date:* ${currentDate}
*Invoice No:* ${invoiceNo}
*Customer:* ${rental.customerName}

*BILL TO:*
${rental.customerName}
${rental.customerPhone}
${rental.customerAddress || 'Address not provided'}

*RENTAL DETAILS:*
────────────────────`;

        // Add product items
        rental.productItems.forEach((product, index) => {
            billText += `\n
*${index + 1}. ${product.productName.toUpperCase()}*
Rate: ${formatCurrency(product.rate)}/${product.rateType}
Quantity: ${product.quantity} units
Current: ${product.currentQuantity} units
Amount: ${formatCurrency(product.amount || 0)}`;
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

        // Payment status
        let statusEmoji = balance > 0 ? '🔴' : '✅';
        let statusText = balance > 0 ? 'PENDING' : 'PAID';

        billText += `\n
*PAYMENT STATUS:* ${statusEmoji} ${statusText}`;

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
*CONTACT INFORMATION:*
📞 Phone: +91-9961964928
📧 Email: info@edasserikkudiyil.com

_Generated on ${currentDate}_

*Thank you for your business!*
*EDASSERIKKUDIYIL RENTALS*`;

        setBillPreview(billText.trim());
    };

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

*ITEMS RENTED:*`;

        // Products summary
        rental.productItems.forEach((product, index) => {
            billText += `
${index + 1}. ${product.productName}
   Qty: ${product.quantity} units
   Rate: ${formatCurrency(product.rate)}/${product.rateType}
   Amount: ${formatCurrency(product.amount || 0)}`;
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

    const generateMinimalBill = () => {
        if (!rental) return;

        const formatCurrency = (amount) => `₹${amount?.toFixed(2) || '0.00'}`;
        const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

        const balance = rental.balanceAmount || 0;
        const totalPaid = rental.totalPaid || 0;
        const totalAmount = rental.totalAmount || 0;
        const totalDiscount = getTotalDiscounts();

        let billText = `*Rental Invoice - EDASSERIKKUDIYIL*

Customer: ${rental.customerName}
Date: ${formatDate(new Date())}

*Products:*`;

        rental.productItems.forEach((product, index) => {
            billText += `
${product.productName} - ${formatCurrency(product.amount || 0)}`;
        });

        billText += `
Total: ${formatCurrency(totalAmount)}`;

        if (totalDiscount > 0) {
            billText += `
Discount: -${formatCurrency(totalDiscount)}`;
        }

        billText += `
Paid: ${formatCurrency(totalPaid)}
*Balance: ${formatCurrency(balance)}*

Status: ${balance > 0 ? 'Pending' : 'Paid'}

EDASSERIKKUDIYIL RENTALS
📞 +91-9447379802`;

        setBillPreview(billText.trim());
    };

    // Helper functions for discounts
    const getTotalDiscounts = () => {
        if (!rental || !rental.payments) return 0;
        return rental.payments.reduce((total, payment) => {
            return total + (payment.discountAmount || 0);
        }, 0);
    };

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

    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^[6-9]\d{9}$/;
        const cleanPhone = phone.replace(/\D/g, '');
        return phoneRegex.test(cleanPhone);
    };

    const openWhatsApp = () => {
        if (!phoneNumber) {
            toast.error('Please enter a phone number');
            return;
        }

        if (!validatePhoneNumber(phoneNumber)) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        if (!billPreview) {
            toast.error('Please generate bill first');
            return;
        }

        // Clean phone number (remove any non-digits)
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        
        // Encode the message for URL
        const encodedMessage = encodeURIComponent(billPreview);
        
        // Create WhatsApp URL
        const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodedMessage}`;
        
        // Open WhatsApp in new tab
        window.open(whatsappUrl, '_blank');
        
        toast.success('Opening WhatsApp... Check your phone!', {
            duration: 4000,
            icon: '📱'
        });
    };

    const copyBillText = () => {
        if (!billPreview) {
            toast.error('Please generate bill first');
            return;
        }
        navigator.clipboard.writeText(billPreview);
        toast.success('Bill copied to clipboard! You can now paste it in WhatsApp manually.');
    };

    const simulateMobileWhatsApp = () => {
        if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
            toast.error('Please enter a valid phone number first');
            return;
        }

        if (!billPreview) {
            toast.error('Please generate bill first');
            return;
        }

        // For mobile devices, use the direct WhatsApp API
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(billPreview);
        
        // Different approach for mobile vs desktop
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            // Mobile device - use WhatsApp direct link
            window.location.href = `whatsapp://send?phone=91${cleanPhone}&text=${encodedMessage}`;
        } else {
            // Desktop - open web version
            window.open(`https://web.whatsapp.com/send?phone=91${cleanPhone}&text=${encodedMessage}`, '_blank');
        }

        toast.success('Opening WhatsApp...', {
            duration: 4000,
            icon: '📱'
        });
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
                            <h3 className="text-xl font-semibold">Send Bill via WhatsApp</h3>
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
                        {/* Left Panel - Controls */}
                        <div className="space-y-6">
                            {/* WhatsApp Info */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FiSmartphone className="w-5 h-5 text-blue-600" />
                                    <span className="font-medium text-blue-800">Free WhatsApp Integration</span>
                                </div>
                                <p className="text-blue-700 text-sm">
                                    Opens WhatsApp on your phone with the bill pre-filled. Just tap send!
                                </p>
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

                            {/* Discount Summary */}
                            {getTotalDiscounts() > 0 && (
                                <div className="bg-yellow-50 rounded-lg p-4">
                                    <h5 className="font-medium text-yellow-800 mb-2">💸 Discount Applied:</h5>
                                    <div className="text-sm text-yellow-700 space-y-1">
                                        <p>• Total Discounts: ₹{getTotalDiscounts().toFixed(2)}</p>
                                        <p>• Customer saves ₹{getTotalDiscounts().toFixed(2)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={openWhatsApp}
                                    disabled={!phoneNumber || !validatePhoneNumber(phoneNumber) || !billPreview}
                                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                                >
                                    <FiExternalLink className="w-5 h-5" />
                                    📱 Open WhatsApp & Send
                                </button>

                                <button
                                    onClick={simulateMobileWhatsApp}
                                    disabled={!phoneNumber || !validatePhoneNumber(phoneNumber) || !billPreview}
                                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <FiSmartphone className="w-4 h-4" />
                                    Mobile WhatsApp (Direct)
                                </button>

                                <button
                                    onClick={copyBillText}
                                    disabled={!billPreview}
                                    className="w-full bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
                                >
                                    📋 Copy Bill Text
                                </button>
                            </div>

                            {/* Instructions */}
                            <div className="bg-green-50 rounded-lg p-4">
                                <h5 className="font-medium text-green-800 mb-2">🚀 How It Works:</h5>
                                <ul className="text-sm text-green-700 space-y-1">
                                    <li>1. Enter customer's phone number</li>
                                    <li>2. Choose bill format and generate</li>
                                    <li>3. Click "Open WhatsApp & Send"</li>
                                    <li>4. WhatsApp opens with bill pre-filled</li>
                                    <li>5. Review and tap send button</li>
                                    {getTotalDiscounts() > 0 && (
                                        <li>• ✅ Discounts automatically included</li>
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
                                        onClick={() => setBillType('detailed')}
                                        className={`px-3 py-1 text-xs rounded transition-colors ${billType === 'detailed'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Detailed
                                    </button>
                                    <button
                                        onClick={() => setBillType('simple')}
                                        className={`px-3 py-1 text-xs rounded transition-colors ${billType === 'simple'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        Simple
                                    </button>
                                    <button
                                        onClick={() => setBillType('minimal')}
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
• Detailed - Full bill with all details
• Simple - Clean summary with key info  
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
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppBill;