import React, { useState } from 'react';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { Navigate, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/slices/toastSlice';
import { useAuth } from '../../contexts/AuthContext';

function Login() {
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    // ✅ SIMPLE button click handler (no form submission)
    const handleLogin = async () => {
        if (isLoading) return;

        if (!formData.username.trim() || !formData.password.trim()) {
            dispatch(showToast({ message: '⚠️ Please enter both username and password', type: 'warning' }));
            return;
        }

        setIsLoading(true);

        try {
            const result = await login(formData.username.trim(), formData.password.trim());

            if (result?.success) {
                dispatch(showToast({ message: '🎉 Login successful!', type: 'success' }));
                navigate('/', { replace: true });
            } else {
                dispatch(showToast({ message: `❌ ${result?.message || 'Invalid username or password'}`, type: 'error' }));
            }
        } catch (error) {
            dispatch(showToast({ message: '❌ Login failed', type: 'error' }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-2">
                    <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-2">Edasserikkudiyil</h1>
                    <p className="text-lg lg:text-2xl text-[#086cbe] font-bold mb-1">Quality Rentals You Can Trust</p>
                    <p className="text-gray-600 text-sm lg:text-lg">Rental Management System</p>
                </div>

                <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-200">
                    {/* ✅ NO FORM - Just divs */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm lg:text-lg font-medium text-gray-700 mb-2">Username</label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#086cbe]" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 lg:py-4 border rounded-lg focus:ring-2 focus:ring-[#086cbe] outline-none lg:text-xl"
                                    placeholder="Enter your username"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm lg:text-lg font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#086cbe]" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                    className="w-full pl-10 pr-12 py-3 lg:py-4 border rounded-lg focus:ring-2 focus:ring-[#086cbe] outline-none lg:text-xl"
                                    placeholder="Enter your password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* ✅ SIMPLE button - no form submission */}
                        <button
                            onClick={handleLogin}
                            disabled={isLoading}
                            className="w-full bg-[#086cbe] hover:bg-[#0757a8] text-white py-3 lg:py-4 rounded-lg font-bold lg:text-xl disabled:opacity-50 transition duration-200 shadow-md"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Signing in...
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            © 2025 Edasserikkudiyil Rentals. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
