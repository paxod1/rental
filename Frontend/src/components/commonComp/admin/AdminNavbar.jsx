import React, { useState, useEffect } from 'react';
import { FiMenu, FiX, FiHome, FiBox, FiClock, FiShoppingBag, FiTruck } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';

function AdminNavbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            setScrolled(isScrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Check if a link is active
    const isActiveLink = (path) => {
        return location.pathname === path;
    };

    return (
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
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
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
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="text-white hover:bg-[#b85555] hover:bg-opacity-80 p-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-110"
                        >
                            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu - Updated with consistent color scheme */}
                {isMenuOpen && (
                    <div className="md:hidden transform origin-top transition-all duration-300 ease-in-out">
                        <div className="px-3 pt-3 pb-4 space-y-2 bg-[#b85555] bg-opacity-95 backdrop-blur-sm rounded-lg mt-3 shadow-xl border border-white/10">
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
    );
}

export default AdminNavbar;
