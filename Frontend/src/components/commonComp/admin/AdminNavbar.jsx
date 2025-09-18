import React, { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

function AdminNavbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand Logo */}
                    <div className="flex-shrink-0">
                        <h1 className="text-white text-xl font-bold tracking-wide">
                            YOUR BRAND
                        </h1>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            <Link
                                to="/"
                                className="text-white hover:bg-rose-700 hover:bg-opacity-75 px-3 py-2 rounded-md text-sm font-medium transition duration-300 ease-in-out"
                            >
                                Home
                            </Link>
                            <Link
                                to="/Admin-products"
                                className="text-white hover:bg-rose-700 hover:bg-opacity-75 px-3 py-2 rounded-md text-sm font-medium transition duration-300 ease-in-out"
                            >
                                Products
                            </Link>
                            <Link
                                to="/Rental-History"
                                className="text-white hover:bg-rose-700 hover:bg-opacity-75 px-3 py-2 rounded-md text-sm font-medium transition duration-300 ease-in-out"
                            >
                                History
                            </Link>
                            <Link
                                to="/Admin-Rented"
                                className="text-white hover:bg-rose-700 hover:bg-opacity-75 px-3 py-2 rounded-md text-sm font-medium transition duration-300 ease-in-out"
                            >
                                Rented
                            </Link>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={toggleMenu}
                            className="text-white hover:bg-rose-700 hover:bg-opacity-75 p-2 rounded-md transition duration-300 ease-in-out"
                        >
                            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 bg-rose-600 bg-opacity-95 rounded-md mt-2">
                            <Link
                                to="/"
                                className="text-white hover:bg-rose-700 hover:bg-opacity-75 block px-3 py-2 rounded-md text-base font-medium transition duration-300 ease-in-out"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                to="/Admin-products"
                                className="text-white hover:bg-rose-700 hover:bg-opacity-75 block px-3 py-2 rounded-md text-base font-medium transition duration-300 ease-in-out"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Products
                            </Link>
                            <Link
                                to="/Rental-History"
                                className="text-white hover:bg-rose-700 hover:bg-opacity-75 block px-3 py-2 rounded-md text-base font-medium transition duration-300 ease-in-out"
                                onClick={() => setIsMenuOpen(false)}
                            >
                               History
                            </Link>
                            <Link
                                to="/Admin-Rented"
                                className="text-white hover:bg-rose-700 hover:bg-opacity-75 block px-3 py-2 rounded-md text-base font-medium transition duration-300 ease-in-out"
                                onClick={() => setIsMenuOpen(false)}
                            >
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
