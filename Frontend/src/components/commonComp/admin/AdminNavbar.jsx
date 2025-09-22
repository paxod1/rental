// components/commonComp/admin/AdminNavbar.jsx
import React, { useState, useEffect } from 'react';
import { FiMenu, FiX, FiHome, FiBox, FiClock, FiShoppingBag, FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import toast from 'react-hot-toast';

function AdminNavbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(!isProfileMenuOpen);
    };

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
        setIsProfileMenuOpen(false);
    };

    const handleLogoutConfirm = () => {
        logout();
        setShowLogoutConfirm(false);
        toast.success('Logged out successfully');
    };

    const handleLogoutCancel = () => {
        setShowLogoutConfirm(false);
    };

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            setScrolled(isScrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfileMenuOpen && !event.target.closest('.profile-menu')) {
                setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileMenuOpen]);

    // Check if a link is active
    const isActiveLink = (path) => {
        return location.pathname === path;
    };

    return (
        <>
            <nav className={`fixed w-full z-50 bg-gradient-to-r from-[#ca6464] to-[#d17474] shadow-lg transition-all duration-300 ${scrolled ? 'py-1' : 'py-2'}`}>
                <div className="w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Brand Logo - Enhanced with gradient background */}
                        <div className="flex-shrink-0">
                            <Link to="/" className="flex flex-col items-start group">
                                <h1 className='text-white text-xl font-bold whitespace-nowrap group-hover:text-yellow-100 transition-colors duration-300'>
                                    Edasserikkudiyil
                                </h1>
                                <p className='text-yellow-200 text-sm whitespace-nowrap w-full text-left group-hover:text-yellow-100 transition-colors duration-300'>
                                    Quality Rentals You Can Trust
                                </p>
                            </Link>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-4">
                            <div className="flex items-baseline space-x-4">
                                <Link
                                    to="/"
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out ${isActiveLink('/') 
                                        ? 'bg-[#b85555] text-white shadow-lg transform scale-105 ring-2 ring-white/20' 
                                        : 'text-white hover:bg-[#b85555] hover:bg-opacity-80 hover:shadow-md hover:scale-102'}`}
                                >
                                    <FiHome className="mr-2" />
                                    Home
                                </Link>
                                <Link
                                    to="/Admin-products"
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out ${isActiveLink('/Admin-products') 
                                        ? 'bg-[#b85555] text-white shadow-lg transform scale-105 ring-2 ring-white/20' 
                                        : 'text-white hover:bg-[#b85555] hover:bg-opacity-80 hover:shadow-md hover:scale-102'}`}
                                >
                                    <FiBox className="mr-2" />
                                    Products
                                </Link>
                                <Link
                                    to="/Rental-History"
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out ${isActiveLink('/Rental-History') 
                                        ? 'bg-[#b85555] text-white shadow-lg transform scale-105 ring-2 ring-white/20' 
                                        : 'text-white hover:bg-[#b85555] hover:bg-opacity-80 hover:shadow-md hover:scale-102'}`}
                                >
                                    <FiClock className="mr-2" />
                                    History
                                </Link>
                                <Link
                                    to="/Admin-Rented"
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out ${isActiveLink('/Admin-Rented') 
                                        ? 'bg-[#b85555] text-white shadow-lg transform scale-105 ring-2 ring-white/20' 
                                        : 'text-white hover:bg-[#b85555] hover:bg-opacity-80 hover:shadow-md hover:scale-102'}`}
                                >
                                    <FiShoppingBag className="mr-2" />
                                    Rented
                                </Link>
                            </div>

                            {/* Profile Menu */}
                            <div className="relative profile-menu">
                                <button
                                    onClick={toggleProfileMenu}
                                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white hover:bg-[#b85555] hover:bg-opacity-80 transition-all duration-300 ease-in-out"
                                >
                                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                        <FiUser className="w-4 h-4 text-black" />
                                    </div>
                                    <span className="text-sm font-medium">{user?.username || 'Admin'}</span>
                                    <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Profile Dropdown */}
                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                                            <p className="text-xs text-gray-500 capitalize">{user?.role || 'Admin'}</p>
                                        </div>
                                        
                                        <button
                                            onClick={handleLogoutClick}
                                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                                        >
                                            <FiLogOut className="mr-3 w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center space-x-2">
                            {/* Mobile Profile Icon */}
                            <button
                                onClick={handleLogoutClick}
                                className="text-white hover:bg-[#b85555] hover:bg-opacity-80 p-2 rounded-lg transition-all duration-300 ease-in-out"
                            >
                                <FiLogOut size={20} />
                            </button>
                            
                            <button
                                onClick={toggleMenu}
                                className="text-white hover:bg-[#b85555] hover:bg-opacity-80 p-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-110"
                            >
                                {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="md:hidden transform origin-top transition-all duration-300 ease-in-out">
                            <div className="px-3 pt-3 pb-4 space-y-2 bg-[#b85555] bg-opacity-95 backdrop-blur-sm rounded-lg mt-3 shadow-xl border border-white/10">
                                <div className="border-b border-white/20 pb-3 mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                            <FiUser className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">{user?.username || 'Admin'}</p>
                                            <p className="text-yellow-200 text-xs capitalize">{user?.role || 'Administrator'}</p>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    to="/"
                                    className={`flex items-center text-white hover:bg-[#a04a4a] block px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 ease-in-out ${isActiveLink('/') ? 'bg-[#a04a4a] shadow-md' : ''}`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <FiHome className="mr-3" />
                                    Home
                                </Link>
                                <Link
                                    to="/Admin-products"
                                    className={`flex items-center text-white hover:bg-[#a04a4a] block px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 ease-in-out ${isActiveLink('/Admin-products') ? 'bg-[#a04a4a] shadow-md' : ''}`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <FiBox className="mr-3" />
                                    Products
                                </Link>
                                <Link
                                    to="/Rental-History"
                                    className={`flex items-center text-white hover:bg-[#a04a4a] block px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 ease-in-out ${isActiveLink('/Rental-History') ? 'bg-[#a04a4a] shadow-md' : ''}`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <FiClock className="mr-3" />
                                    History
                                </Link>
                                <Link
                                    to="/Admin-Rented"
                                    className={`flex items-center text-white hover:bg-[#a04a4a] block px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 ease-in-out ${isActiveLink('/Admin-Rented') ? 'bg-[#a04a4a] shadow-md' : ''}`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <FiShoppingBag className="mr-3" />
                                    Rented
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
                        <div className="p-6">
                            {/* Icon */}
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                                <FiLogOut className="w-8 h-8 text-red-600" />
                            </div>
                            
                            {/* Title */}
                            <h3 className="text-xl font-semibold text-center text-gray-900 mb-2">
                                Confirm Logout
                            </h3>
                            
                            {/* Message */}
                            <p className="text-center text-gray-600 mb-6">
                                Are you sure you want to logout? You'll need to login again to access the admin panel.
                            </p>
                            
                            {/* Buttons */}
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleLogoutCancel}
                                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogoutConfirm}
                                    className="flex-1 px-4 py-3 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                                >
                                    <FiLogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AdminNavbar;
