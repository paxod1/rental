// components/commonComp/admin/AdminNavbar.jsx
import React, { useState, useEffect } from 'react';
import { FiMenu, FiX, FiHome, FiBox, FiClock, FiShoppingBag, FiUser, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { showToast } from '../../../store/slices/toastSlice';

function AdminNavbar() {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showTooltip, setShowTooltip] = useState('');
    const location = useLocation();
    const { user, logout } = useAuth();

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
        dispatch(showToast({ message: 'Logged out successfully', type: 'success' }));
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

    // Navigation items for reusability (only main nav items, logout moved to header)
    const navItems = [
        { path: '/', icon: FiHome, label: 'Home' },
        { path: '/Admin-products', icon: FiBox, label: 'Products' },
        { path: '/Rental-History', icon: FiClock, label: 'History' },
        { path: '/Admin-Rented', icon: FiShoppingBag, label: 'Rented' }
    ];

    // Handle tooltip show/hide with delays
    const handleTooltipShow = (label) => {
        setTimeout(() => setShowTooltip(label), 300);
    };

    const handleTooltipHide = () => {
        setShowTooltip('');
    };

    return (
        <>
            {/* Desktop Navbar - Hidden on mobile */}
            <nav className={`hidden md:block  fixed w-full z-50 bg-white shadow-lg transition-all duration-300 ${scrolled ? 'py-1' : 'py-2'}`}>
                <div className="w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Brand Logo */}
                        <div className="flex">
                            <Link to="/" className="flex flex-col items-start group">
                                <h1 className='text-gray-900 text-xl lg:text-2xl font-bold whitespace-nowrap group-hover:text-[#086cbe] transition-colors duration-300'>
                                    Edasserikkudiyil
                                </h1>
                                <p className='text-[#086cbe] text-sm lg:text-base whitespace-nowrap w-full text-left group-hover:text-[#0757a8] transition-colors duration-300'>
                                    Quality Rentals You Can Trust
                                </p>
                            </Link>
                        </div>

                        {/* Desktop Menu */}
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex items-baseline space-x-10">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center  py-2 text-sm lg:text-lg px-2 font-medium transition-all duration-300 ease-in-out relative ${isActiveLink(item.path)
                                            ? 'text-[#086cbe] border-b-3 border-[#086cbe]'
                                            : 'text-gray-700 hover:text-[#086cbe] border-b-3 border-transparent hover:border-gray-300'
                                            }`}
                                    >
                                        <item.icon className="mr-2" />
                                        {item.label}
                                    </Link>
                                ))}
                            </div>

                        </div>


                        {/* Profile Menu */}
                        <div className="relative profile-menu">
                            <button
                                onClick={toggleProfileMenu}
                                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-300 ease-in-out"
                            >
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    <FiUser className="w-4 h-4 text-[#086cbe]" />
                                </div>
                                <span className="text-sm lg:text-lg font-medium">{user?.username || 'Admin'}</span>
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
                </div>
            </nav>

            {/* Mobile Header - Brand logo + Logout button - REMOVED z-40 and added z-50 */}
            <div className="md:hidden fixed top-0 w-full z-50 bg-white shadow-lg">
                <div className="px-4 py-3 flex justify-between items-center">
                    {/* Brand Logo */}
                    <Link to="/" className="flex flex-col items-start">
                        <h1 className='text-gray-900 text-lg font-bold'>
                            Edasserikkudiyil
                        </h1>
                        <p className='text-[#086cbe] text-xs'>
                            Quality Rentals You Can Trust
                        </p>
                    </Link>

                    {/* Mobile Logout Button */}
                    <button
                        onClick={handleLogoutClick}
                        className="relative flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 ease-in-out group"
                        onTouchStart={() => handleTooltipShow('Logout')}
                        onTouchEnd={() => setTimeout(handleTooltipHide, 1500)}
                    >
                        <FiLogOut className="w-5 h-5 text-gray-700 group-hover:text-red-600 transition-colors duration-300" />

                        {/* Tooltip for mobile logout */}
                        {showTooltip === 'Logout' && (
                            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap animate-fade-in">
                                Logout
                                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-l-transparent border-r-2 border-r-transparent border-b-2 border-b-gray-900"></div>
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Instagram-Style Mobile Bottom Navigation - REMOVED extra padding */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
                <div className="bg-white border-t border-gray-200 shadow-2xl">
                    <div className="flex items-center justify-around px-2 py-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ease-in-out group"
                                onMouseEnter={() => handleTooltipShow(item.label)}
                                onMouseLeave={handleTooltipHide}
                                onTouchStart={() => handleTooltipShow(item.label)}
                                onTouchEnd={() => setTimeout(handleTooltipHide, 1500)}
                            >
                                <div className={`p-2 rounded-full transition-all duration-300 ${isActiveLink(item.path)
                                    ? 'bg-[#086cbe] shadow-lg scale-110'
                                    : 'hover:bg-gray-100 group-active:bg-gray-200'
                                    }`}>
                                    <item.icon
                                        className={`w-5 h-5 transition-colors duration-300 ${isActiveLink(item.path)
                                            ? 'text-white'
                                            : 'text-gray-600 group-hover:text-[#086cbe]'
                                            }`}
                                    />
                                </div>

                                {/* Active Indicator Dot */}
                                {isActiveLink(item.path) && (
                                    <div className="w-1.5 h-1.5 bg-[#086cbe] rounded-full mt-1 animate-pulse"></div>
                                )}

                                {/* Tooltip */}
                                {showTooltip === item.label && (
                                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap animate-fade-in">
                                        {item.label}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-l-transparent border-r-2 border-r-transparent border-t-2 border-t-gray-900"></div>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

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
                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
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

            {/* Custom CSS for animations - UPDATED to remove body padding */}
            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px) translateX(-50%);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) translateX(-50%);
                    }
                }
                
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
            `}</style>
        </>
    );
}

export default AdminNavbar;
