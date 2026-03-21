import React, { useRef, useState } from 'react';
import html2pdf from 'html2pdf.js';
import { FiDownload, FiPrinter, FiMessageSquare, FiCopy } from 'react-icons/fi';
import toast from 'react-hot-toast';
import LoadingSpinner from './commonComp/LoadingSpinner';

const PrintableInvoice = ({ rental, customerPhone }) => {
    const componentRef = useRef();
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    if (!rental) return null;

    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';
    const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;
    
    const effectivePhone = customerPhone || rental.customerPhone;

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

    // Common PDF Generation Options
    const getPdfOptions = (filename) => ({
        margin: [10, 10, 10, 10], // top, left, bottom, right in mm
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            windowWidth: 794, // 190mm in pixels at 96dpi is ~718, 210mm is ~794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    });

    // Common Image Generation Options
    const getImgOptions = () => ({
        margin: [10, 10, 10, 10], // top, left, bottom, right in mm
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            windowWidth: 794, // 190mm in pixels at 96dpi is ~718, 210mm is ~794
        },
    });

    // Generate PDF
    const handleDownloadPdf = async () => {
        try {
            setIsDownloading(true);
            const element = componentRef.current;
            const rentDate = rental.startDate ? new Date(rental.startDate).toLocaleDateString('en-GB').replace(/\//g, '-') : 'NoDate';
            const customerName = rental.customerName || 'Customer';
            const filename = `${customerName.replace(/[^a-z0-9]/gi, '_')}_Rental_${rentDate}.pdf`;
            
            await html2pdf().set(getPdfOptions(filename)).from(element).save();
        } catch (error) {
            console.error('PDF Download failed:', error);
            toast.error('Failed to download PDF');
        } finally {
            setIsDownloading(false);
        }
    };

    // Copy as Image (The most "Automated" way for Desktop & Mobile)
    const handleCopyAsImage = async () => {
        try {
            setIsCopying(true);
            const element = componentRef.current;
            
            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const worker = html2pdf().set(getImgOptions()).from(element).toImg().toCanvas();
            const canvas = await worker.get('canvas');
            
            canvas.toBlob(async (blob) => {
                try {
                    const item = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([item]);
                    
                    toast.success('Bill Copied! Opening WhatsApp... Just hit Paste to send.', { duration: 6000, icon: '📋' });

                    // Open WhatsApp chat directly
                    if (effectivePhone) {
                        const cleanPhone = effectivePhone.replace(/\D/g, '');
                        // On Mobile, use whatsapp:// scheme for even faster app opening
                        const waUrl = isMobile 
                            ? `whatsapp://send?phone=91${cleanPhone}`
                            : `https://web.whatsapp.com/send?phone=91${cleanPhone}`;
                        window.open(waUrl, '_blank');
                    } else {
                        window.open(isMobile ? 'whatsapp://' : 'https://web.whatsapp.com/', '_blank');
                    }
                } catch (err) {
                    console.error('Clipboard write failed:', err);
                    toast.error('Instant Send not supported here. Please use the "Share PDF" option.');
                }
            }, 'image/png');

        } catch (error) {
            console.error('Image generation failed:', error);
            toast.error('Failed to generate bill image');
        } finally {
            setIsCopying(false);
        }
    };

    // Share via WhatsApp (The standard PDF way)
    const handleSharePdf = async () => {
        try {
            setIsSharing(true);
            const element = componentRef.current;
            const rentDate = rental.startDate ? new Date(rental.startDate).toLocaleDateString('en-GB').replace(/\//g, '-') : 'NoDate';
            const customerName = rental.customerName || 'Customer';
            const filename = `${customerName.replace(/[^a-z0-9]/gi, '_')}_Rental_${rentDate}.pdf`;
            
            // Generate PDF blob
            const pdfBlob = await html2pdf().set(getPdfOptions(filename)).from(element).output('blob');
            const file = new File([pdfBlob], filename, { type: 'application/pdf' });

            const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            // On Mobile, the Share API is the only way to send a PDF file.
            // It will open your phone's share menu—just tap WhatsApp and the contact.
            if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Rental Invoice',
                    text: `Please find the attached invoice from EDASSERIKKUDIYIL RENTALS for ${rental.customerName}.`
                });
            } else {
                // Desktop Direct Model: 1. Auto Download, 2. Auto Open WhatsApp
                toast.success('PDF Downloaded! Opening WhatsApp...', { duration: 5000, icon: '📱' });
                
                // 1. Download
                const url = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', filename);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // 2. Open WhatsApp (matching your "Open WhatsApp & Send" model)
                if (effectivePhone) {
                    const cleanPhone = effectivePhone.replace(/\D/g, '');
                    // Use HTTPS for Desktop Web and WHATSAPP:// for Mobile App
                    const waUrl = isMobile 
                        ? `whatsapp://send?phone=91${cleanPhone}`
                        : `https://web.whatsapp.com/send?phone=91${cleanPhone}`;
                    window.open(waUrl, '_blank');
                } else {
                    window.open(isMobile ? 'whatsapp://' : 'https://web.whatsapp.com/', '_blank');
                }
            }
        } catch (error) {
            console.error('Sharing failed:', error);
            if (error.name !== 'AbortError') {
                toast.error('Failed to share PDF');
            }
        } finally {
            setIsSharing(false);
        }
    };

    // Native Print
    const handlePrint = () => {
        const printContent = componentRef.current;
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        
        // Copy all head contents (styles, links) to the iframe
        doc.head.innerHTML = document.head.innerHTML;
        
        // Add specific print styles to ensure A4 fit
        const style = doc.createElement('style');
        style.textContent = `
            @page { size: A4; margin: 10mm; }
            body { margin: 0; padding: 0; }
            .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; }
        `;
        doc.head.appendChild(style);

        doc.body.innerHTML = `<div class="print-container">${printContent.innerHTML}</div>`;

        // Wait for images/styles to load then print
        iframe.contentWindow.focus();
        setTimeout(() => {
            iframe.contentWindow.print();
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    };

    return (
        <div className="flex flex-col gap-2">
            {/* Action Buttons */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <div className="grid md:grid-cols-2 grid-cols-1 gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2.5 rounded-lg transition-all text-xs font-semibold shadow-sm active:scale-95"
                    >
                        <FiPrinter className="w-4 h-4" />
                        Print Bill
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="flex items-center justify-center gap-2 bg-[#086cbe] hover:bg-[#0757a8] disabled:bg-blue-300 text-white px-3 py-2.5 rounded-lg transition-all text-xs font-semibold shadow-sm active:scale-95"
                    >
                        {isDownloading ? (
                            <LoadingSpinner size="sm" color="white" />
                        ) : (
                            <FiDownload className="w-4 h-4" />
                        )}
                        Download PDF
                    </button>
                </div>
                
                <button
                    onClick={handleCopyAsImage}
                    disabled={isCopying}
                    className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg transition-all text-sm font-bold shadow-md active:scale-95 hover:shadow-lg"
                >
                    {isCopying ? (
                        <LoadingSpinner size="sm" color="white" />
                    ) : (
                        <FiCopy className="w-5 h-5" />
                    )}
                    🚀 Instant Send: Copy & Paste to WhatsApp
                </button>

                {/* <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-50 px-2 text-gray-400">OR (Send as File)</span></div>
                </div>

                <button
                    onClick={handleSharePdf}
                    disabled={isSharing}
                    className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-6 py-3 rounded-lg transition-all text-sm font-bold shadow-md active:scale-95 hover:shadow-lg"
                >
                    {isSharing ? (
                        <LoadingSpinner size="sm" color="white" />
                    ) : (
                        <FiMessageSquare className="w-5 h-5" />
                    )}
                    📂 Share PDF via WhatsApp
                </button> */}
            </div>

            {/* Hidden Printable Container */}
            <div className="hidden">
                <div 
                    ref={componentRef} 
                    className="bg-white p-8 mx-auto" 
                    style={{ 
                        boxSizing: 'border-box', 
                        color: '#1f2937', 
                        fontFamily: 'Arial, sans-serif',
                        width: '190mm', // Standard content width for A4 with 10mm margins
                        minHeight: 'auto', // Remove forced full page height
                    }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12" style={{ marginBottom: '3rem' }}>
                        <div>
                            <h1 className="text-xl font-bold mb-1" style={{ color: '#111827', margin: 0 }}>EDASSERIKKUDIYIL RENTALS PVT LTD</h1>
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
                            <p className="font-bold" style={{ color: '#111827', margin: 0 }}>{rental.customerName || 'Customer'}</p>
                            {rental.customerAddress && <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: '#4b5563', margin: '0.25rem 0 0 0' }}>{rental.customerAddress}</p>}
                            <p className="text-sm mt-1" style={{ color: '#4b5563', margin: '0.25rem 0 0 0' }}>{rental.customerPhone || 'N/A'}</p>
                        </div>
                        <div className="text-right" style={{ textAlign: 'right' }}>
                            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#6b7280', margin: '0 0 0.5rem 0', fontSize: '0.75rem' }}>INVOICE DETAILS</h3>
                            <p className="text-sm" style={{ color: '#4b5563', margin: 0 }}>Invoice Name: Rental Bill</p>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full mb-8 text-sm" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', tableLayout: 'fixed' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                <th className="py-3 text-left font-bold" style={{ padding: '0.75rem 0', textAlign: 'left', color: '#374151', width: '30px' }}>#</th>
                                <th className="py-3 text-left font-bold" style={{ padding: '0.75rem 0', textAlign: 'left', color: '#374151' }}>Item Name</th>
                                <th className="py-3 text-left font-bold" style={{ padding: '0.75rem 0', textAlign: 'left', color: '#374151', width: '100px' }}>Type</th>
                                <th className="py-3 text-right font-bold" style={{ padding: '0.75rem 0', textAlign: 'right', color: '#374151', width: '60px' }}>Qty</th>
                                <th className="py-3 text-right font-bold" style={{ padding: '0.75rem 0', textAlign: 'right', color: '#374151', width: '100px' }}>Rate</th>
                                <th className="py-3 text-right font-bold" style={{ padding: '0.75rem 0', textAlign: 'right', color: '#111827', width: '100px' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Products */}
                            {(rental.productItems || []).map((item, index) => (
                                <tr key={`prod-${index}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td className="py-4 text-gray-500" style={{ padding: '1rem 0', color: '#6b7280' }}>{index + 1}</td>
                                    <td className="py-4 font-medium" style={{ padding: '1rem 0', color: '#111827', fontWeight: 500, textTransform: 'capitalize', wordBreak: 'break-word' }}>{item.productName || item.productId?.name || 'Unnamed Product'}</td>
                                    <td className="py-4" style={{ padding: '1rem 0', color: '#4b5563' }}>PRODUCT</td>
                                    <td className="py-4 text-right" style={{ padding: '1rem 0', textAlign: 'right', color: '#4b5563' }}>{item.quantity || 0}</td>
                                    <td className="py-4 text-right" style={{ padding: '1rem 0', textAlign: 'right', color: '#4b5563' }}>{formatCurrency(item.rate)}/{item.rateType || 'unit'}</td>
                                    <td className="py-4 text-right font-medium" style={{ padding: '1rem 0', textAlign: 'right', color: '#111827', fontWeight: 500 }}>{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                            {/* Service Charges */}
                            {rental.serviceCharges?.map((charge, index) => (
                                <tr key={`serv-${index}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td className="py-4" style={{ padding: '1rem 0', color: '#6b7280' }}>{(rental.productItems?.length || 0) + index + 1}</td>
                                    <td className="py-4 font-medium" style={{ padding: '1rem 0', color: '#111827', fontWeight: 500, textTransform: 'capitalize', wordBreak: 'break-word' }}>{charge.name}</td>
                                    <td className="py-4" style={{ padding: '1rem 0', color: '#4b5563' }}>SERVICE</td>
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
