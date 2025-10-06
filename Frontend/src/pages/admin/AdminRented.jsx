import React, { useState, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
    FiSearch,
    FiUser,
    FiPhone,
    FiPackage,
    FiX,
    FiChevronRight,
    FiMapPin
} from "react-icons/fi";
import PageLoading from "../../components/commonComp/PageLoading";
import EmptyState from "../../components/commonComp/EmptyState";
import axiosInstance from "../../../axiosCreate";
import RentalDetails from "./RentalDetails";

function AdminRented() {
    const [rentals, setRentals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRentalId, setSelectedRentalId] = useState(null);
    
    // Search states
    const [searchCustomer, setSearchCustomer] = useState('');
    const [searchProduct, setSearchProduct] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const rentalsRes = await axiosInstance.get("/api/rentals");
            
            const activeRentals = rentalsRes.data.filter(rental =>
                rental.status === 'active' || rental.status === 'partially_returned'
            );

            setRentals(activeRentals);
        } catch (error) {
            toast.error("Error fetching data");
            console.error("Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter rentals based on search criteria
    const filteredRentals = useMemo(() => {
        return rentals.filter(rental => {
            const customerMatch = !searchCustomer || 
                (rental.customerName || '').toLowerCase().includes(searchCustomer.toLowerCase());
            
            const productMatch = !searchProduct || 
                (rental.productItems || []).some(item => 
                    (item.productName || '').toLowerCase().includes(searchProduct.toLowerCase())
                );
            
            return customerMatch && productMatch;
        });
    }, [rentals, searchCustomer, searchProduct]);

    // Clear search filters
    const clearSearch = () => {
        setSearchCustomer('');
        setSearchProduct('');
    };

    const handleCardClick = (rentalId) => {
        setSelectedRentalId(rentalId);
    };

    const handleBackToList = () => {
        setSelectedRentalId(null);
        fetchData(); // Refresh data when coming back
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'partially_returned': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getActiveProductsCount = (rental) => {
        return (rental.productItems || []).filter(item => item.currentQuantity > 0).length;
    };

    const getTotalActiveQuantity = (rental) => {
        return (rental.productItems || []).reduce((sum, item) => sum + item.currentQuantity, 0);
    };

    // If a rental is selected, show the details view
    if (selectedRentalId) {
        return (
            <RentalDetails 
                rentalId={selectedRentalId} 
                onBack={handleBackToList}
            />
        );
    }

    if (isLoading) {
        return <PageLoading message="Loading Rental Data..." />;
    }

    return (
        <div className="p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-rose-50 to-pink-50 min-h-screen">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: { background: '#dbeafe', border: '2px solid #3b82f6', color: '#1e40af' },
                    success: { style: { background: '#f0fdf4', border: '2px solid #22c55e', color: '#15803d' } },
                    error: { style: { background: '#fef2f2', border: '2px solid #ef4444', color: '#dc2626' } },
                }}
            />

            {/* Header with Search */}
            <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#b86969] bg-[#b86969] bg-clip-text text-transparent">
                    Active Rentals
                </h2>
                <p className="text-gray-600 mt-2 mb-4 sm:mb-6 text-sm sm:text-base">Click on any rental card to view details and manage</p>
                
                {/* Search Section */}
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <FiSearch className="w-4 h-4 sm:w-5 sm:h-5 text-[#b86969]" />
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800">Search & Filter</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {/* Customer Name Search */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Customer Name
                            </label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchCustomer}
                                    onChange={(e) => setSearchCustomer(e.target.value)}
                                    placeholder="Search by customer name..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b86969] focus:border-transparent transition-colors text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* Product Name Search */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product Name
                            </label>
                            <div className="relative">
                                <FiPackage className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchProduct}
                                    onChange={(e) => setSearchProduct(e.target.value)}
                                    placeholder="Search by product name..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b86969] focus:border-transparent transition-colors text-sm sm:text-base"
                                />
                            </div>
                        </div>

                        {/* Clear Button */}
                        <div className="flex items-end sm:col-span-2 lg:col-span-1">
                            <button
                                onClick={clearSearch}
                                className="w-full bg-[#b86969] cursor-pointer text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                                <FiX className="w-4 h-4" />
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Search Results Summary */}
                    {(searchCustomer || searchProduct) && (
                        <div className="mt-3 sm:mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs sm:text-sm text-[#b86969]">
                                Found <span className="font-semibold">{filteredRentals.length}</span> rental(s) 
                                {searchCustomer && <span> matching customer: "<span className="font-semibold">{searchCustomer}</span>"</span>}
                                {searchCustomer && searchProduct && <span> and </span>}
                                {searchProduct && <span> matching product: "<span className="font-semibold">{searchProduct}</span>"</span>}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Rentals List - Fixed Responsive Cards */}
            {filteredRentals.length === 0 ? (
                <div className="bg-white rounded-xl shadow-xl">
                    <EmptyState
                        icon={searchCustomer || searchProduct ? FiSearch : FiPackage}
                        title={searchCustomer || searchProduct ? "No Matching Rentals" : "No Active Rentals"}
                        description={
                            searchCustomer || searchProduct 
                                ? "No rentals found matching your search criteria. Try adjusting your search terms."
                                : "There are currently no active rentals to manage."
                        }
                        showAction={false}
                    />
                    {(searchCustomer || searchProduct) && (
                        <div className="p-4 sm:p-6 text-center border-t">
                            <button
                                onClick={clearSearch}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors text-sm sm:text-base"
                            >
                                Clear Search & Show All
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid gap-3 sm:gap-4">
                    {filteredRentals.map((rental) => (
                        <div 
                            key={rental._id} 
                            onClick={() => handleCardClick(rental._id)}
                            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-50 hover:border-[#994646] overflow-hidden"
                        >
                            <div className="p-4 sm:p-6">
                                {/* Mobile Layout - Completely Rewritten for Better Flow */}
                                <div className="block lg:hidden">
                                    {/* Top Row: Customer Name + Status */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                                                <FiUser className="w-4 h-4 text-[#b86969]" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-semibold text-gray-800 uppercase line-clamp-1 break-words">
                                                    {rental.customerName || 'Unknown Customer'}
                                                </h3>
                                                {rental.customerPhone && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                                        <FiPhone className="w-3 h-3 flex-shrink-0" />
                                                        <span className="break-all">{rental.customerPhone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 ml-3 flex-shrink-0">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(rental.status)}`}>
                                                {rental.status === 'active' ? 'Active' : 
                                                 rental.status === 'partially_returned' ? 'Partial' : 'Unknown'}
                                            </span>
                                            <div className="bg-gray-100 p-1.5 rounded-full">
                                                <FiChevronRight className="w-3 h-3 text-gray-600" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Row - Mobile */}
                                    {rental.customerAddress && (
                                        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <FiMapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-xs text-gray-600 line-clamp-2 break-words">
                                                    {rental.customerAddress}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Products Summary Row - Mobile */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <FiPackage className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                            <span className="text-xs font-medium text-gray-700">
                                                {getActiveProductsCount(rental)} items • {getTotalActiveQuantity(rental)} units
                                            </span>
                                        </div>
                                        
                                        {/* Product Tags - Mobile with Better Wrapping */}
                                        <div className="flex flex-wrap gap-1">
                                            {(rental.productItems || [])
                                                .filter(item => item.currentQuantity > 0)
                                                .slice(0, 2) // Show max 2 on mobile for better layout
                                                .map((item, index) => (
                                                    <span 
                                                        key={index}
                                                        className="bg-blue-50 text-[#b86969] px-2 py-1 rounded text-xs font-medium inline-block max-w-[120px] truncate"
                                                        title={`${item.productName} (${item.currentQuantity})`}
                                                    >
                                                        {item.productName} ({item.currentQuantity})
                                                    </span>
                                                ))
                                            }
                                            {(rental.productItems || []).filter(item => item.currentQuantity > 0).length > 2 && (
                                                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                                    +{(rental.productItems || []).filter(item => item.currentQuantity > 0).length - 2} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Layout - Preserved Original */}
                                <div className="hidden lg:flex items-center justify-between">
                                    {/* Customer Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                                                <FiUser className="w-5 h-5 text-[#b86969]" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-lg font-semibold text-gray-800 uppercase truncate">
                                                    {rental.customerName || 'Unknown Customer'}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                                    {rental.customerPhone && (
                                                        <div className="flex items-center gap-1">
                                                            <FiPhone className="w-3 h-3 flex-shrink-0" />
                                                            <span className="truncate">{rental.customerPhone}</span>
                                                        </div>
                                                    )}
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                                                        {(rental.status || 'unknown').replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Address */}
                                        {rental.customerAddress && (
                                            <div className="flex items-start gap-2 mb-3 text-sm text-gray-600">
                                                <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2 break-words">{rental.customerAddress}</span>
                                            </div>
                                        )}

                                        {/* Products */}
                                        <div className="flex items-start gap-2">
                                            <FiPackage className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-700 mb-1">
                                                    Rented Products ({getActiveProductsCount(rental)} items, {getTotalActiveQuantity(rental)} units):
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(rental.productItems || [])
                                                        .filter(item => item.currentQuantity > 0)
                                                        .map((item, index) => (
                                                            <span 
                                                                key={index}
                                                                className="bg-blue-50 text-[#b86969] px-2 py-1 rounded text-xs font-medium inline-block max-w-[200px] truncate"
                                                                title={`${item.productName} (${item.currentQuantity})`}
                                                            >
                                                                {item.productName} ({item.currentQuantity})
                                                            </span>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Click Indicator */}
                                    <div className="ml-4 flex-shrink-0">
                                        <div className="bg-gray-100 p-2 rounded-full group-hover:bg-blue-100 transition-colors">
                                            <FiChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AdminRented;
