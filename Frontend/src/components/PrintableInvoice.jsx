import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { FiDownload, FiPrinter } from 'react-icons/fi';

const PrintableInvoice = ({ rental }) => {
    const componentRef = useRef();

    if (!rental) return null;

    const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');
    const formatCurrency = (amount) => `₹${amount?.toFixed(2) || '0.00'}`;

    // Totals
    const subtotal = rental.totalAmount || 0;
    const totalPaid = rental.totalPaid || 0;
    const balance = rental.balanceAmount || 0;

    // Calculate Total Discount
    const totalDiscount = rental.payments?.filter(p => p.type === 'discount').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const netAmount = subtotal - totalDiscount;

    // Determine Invoice Type
    const isFullyPaid = balance <= 0;
    const invoiceType = isFullyPaid ? 'INVOICE' : 'PROFORMA INVOICE';
    const invoiceNo = `INV-${rental._id?.slice(-6)?.toUpperCase() || '000000'}`;
    const invoiceDate = formatDate(new Date());

    // Generate PDF
    const handleDownloadPdf = () => {
        const element = componentRef.current;
        const rentDate = rental.startDate ? new Date(rental.startDate).toLocaleDateString('en-GB').replace(/\//g, '-') : 'NoDate';
        const opt = {
            margin: [10, 10, 10, 10], // top, left, bottom, right in mm
            filename: `${rental.customerName.replace(/[^a-z0-9]/gi, '_')}_Rental_${rentDate}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    // Native Print
    const handlePrint = () => {
        const printContent = componentRef.current;
        const originalContents = document.body.innerHTML;
        
        // Hide everything else and show only print content
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        
        // Restore original content
        document.body.innerHTML = originalContents;
        window.location.reload(); // Quick explicit reload to restore React state bindings disconnected by innerHTML swap
    };

    return (
        <div className="flex flex-col gap-2">
            {/* Action Buttons */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Official Document Actions</div>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handlePrint}
                        className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
                    >
                        <FiPrinter className="w-4 h-4" />
                        Print Bill
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        className="w-full flex items-center justify-center gap-2 bg-[#086cbe] hover:bg-[#0757a8] text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
                    >
                        <FiDownload className="w-4 h-4" />
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Hidden Printable Container */}
            <div className="hidden">
                <div ref={componentRef} className="bg-white p-8 w-[210mm] min-h-[297mm] mx-auto" style={{ boxSizing: 'border-box', color: '#1f2937', fontFamily: 'Arial, sans-serif' }}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12" style={{ marginBottom: '3rem' }}>
                        <div>
                            <h1 className="text-2xl font-bold mb-1" style={{ color: '#111827', margin: 0 }}>EDASSERIKKUDIYIL RENTALS PVT LTD</h1>
                            <p className="text-sm" style={{ color: '#4b5563', margin: 0 }}>Mammattikkanam, Idukki</p>
                            <p className="text-sm" style={{ color: '#4b5563', margin: 0 }}>Kerala, India</p>
                        </div>
                        <div className="text-right" style={{ textAlign: 'right' }}>
                            <h2 className="text-xl font-bold mb-1" style={{ color: '#1f2937', margin: 0 }}>{invoiceType}</h2>
                            <p className="text-sm" style={{ color: '#4b5563', margin: 0 }}>Invoice #: <strong>{invoiceNo}</strong></p>
                            <p className="text-sm" style={{ color: '#4b5563', margin: 0 }}>Date: {invoiceDate}</p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="flex justify-between items-start mb-8" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#6b7280', margin: '0 0 0.5rem 0', fontSize: '0.75rem' }}>BILL TO</h3>
                            <p className="font-bold" style={{ color: '#111827', margin: 0 }}>{rental.customerName}</p>
                            {rental.customerAddress && <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: '#4b5563', margin: '0.25rem 0 0 0' }}>{rental.customerAddress}</p>}
                            <p className="text-sm mt-1" style={{ color: '#4b5563', margin: '0.25rem 0 0 0' }}>{rental.customerPhone}</p>
                        </div>
                        <div className="text-right" style={{ textAlign: 'right' }}>
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#6b7280', margin: '0 0 0.5rem 0', fontSize: '0.75rem' }}>INVOICE DETAILS</h3>
                            <p className="text-sm" style={{ color: '#4b5563', margin: 0 }}>Invoice Name: Rental Bill</p>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full mb-8 text-sm" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                <th className="py-3 text-left font-bold" style={{ padding: '0.75rem 0', textAlign: 'left', color: '#374151' }}>#</th>
                                <th className="py-3 text-left font-bold" style={{ padding: '0.75rem 0', textAlign: 'left', color: '#374151' }}>Item Name</th>
                                <th className="py-3 text-left font-bold" style={{ padding: '0.75rem 0', textAlign: 'left', color: '#374151' }}>Type</th>
                                <th className="py-3 text-right font-bold" style={{ padding: '0.75rem 0', textAlign: 'right', color: '#374151' }}>Qty</th>
                                <th className="py-3 text-right font-bold" style={{ padding: '0.75rem 0', textAlign: 'right', color: '#374151' }}>Rate</th>
                                <th className="py-3 text-right font-bold" style={{ padding: '0.75rem 0', textAlign: 'right', color: '#111827' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Products */}
                            {rental.productItems?.map((item, index) => (
                                <tr key={`prod-${index}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td className="py-4 text-gray-500" style={{ padding: '1rem 0', color: '#6b7280' }}>{index + 1}</td>
                                    <td className="py-4 font-medium" style={{ padding: '1rem 0', color: '#111827', fontWeight: 500, textTransform: 'capitalize' }}>{item.productName || item.productId?.name}</td>
                                    <td className="py-4" style={{ padding: '1rem 0', color: '#4b5563' }}>PRODUCT</td>
                                    <td className="py-4 text-right" style={{ padding: '1rem 0', textAlign: 'right', color: '#4b5563' }}>{item.quantity}</td>
                                    <td className="py-4 text-right" style={{ padding: '1rem 0', textAlign: 'right', color: '#4b5563' }}>{formatCurrency(item.rate)}/{item.rateType}</td>
                                    <td className="py-4 text-right font-medium" style={{ padding: '1rem 0', textAlign: 'right', color: '#111827', fontWeight: 500 }}>{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                            {/* Service Charges */}
                            {rental.serviceCharges?.map((charge, index) => (
                                <tr key={`serv-${index}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td className="py-4" style={{ padding: '1rem 0', color: '#6b7280' }}>{(rental.productItems?.length || 0) + index + 1}</td>
                                    <td className="py-4 font-medium" style={{ padding: '1rem 0', color: '#111827', fontWeight: 500, textTransform: 'capitalize' }}>{charge.name}</td>
                                    <td className="py-4" style={{ padding: '1rem 0', color: '#4b5563' }}>SERVICE CHARGE</td>
                                    <td className="py-4 text-right" style={{ padding: '1rem 0', textAlign: 'right', color: '#4b5563' }}>-</td>
                                    <td className="py-4 text-right" style={{ padding: '1rem 0', textAlign: 'right', color: '#4b5563' }}>-</td>
                                    <td className="py-4 text-right font-medium" style={{ padding: '1rem 0', textAlign: 'right', color: '#111827', fontWeight: 500 }}>{formatCurrency(charge.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Summary Totals */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '18rem' }}>
                            <div style={{ fontSize: '0.875rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', marginBottom: '0.75rem' }}>
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {totalDiscount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ea580c', marginBottom: '0.75rem' }}>
                                        <span>Discount:</span>
                                        <span>-{formatCurrency(totalDiscount)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.125rem', color: '#111827', padding: '0.75rem 0', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                                    <span>Total (INR):</span>
                                    <span>{formatCurrency(netAmount)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: 500, marginBottom: '0.75rem' }}>
                                    <span>Paid:</span>
                                    <span>{formatCurrency(totalPaid)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 'bold' }}>
                                    <span>Balance Due:</span>
                                    <span>{formatCurrency(balance)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '5rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Thank you for your business!</p>
                        {balance > 0 && <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', margin: 0 }}>Please remit payment for the balance amount at your earliest convenience.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintableInvoice;
