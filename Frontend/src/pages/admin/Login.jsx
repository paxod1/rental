// Alternative Simple Login Component
import React, { useState } from 'react';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

function Login() {
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
            toast.error('⚠️ Please enter both username and password');
            return;
        }

        setIsLoading(true);

        try {
            const result = await login(formData.username.trim(), formData.password.trim());

            if (result?.success) {
                toast.success('🎉 Login successful!');
                navigate('/', { replace: true });
            } else {
                toast.error(`❌ ${result?.message || 'Invalid username or password'}`);
            }
        } catch (error) {
            toast.error('❌ Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-2">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Edasserikkudiyil</h1>
                    <p className="text-lg text-blue-600 font-medium mb-1">Quality Rentals You Can Trust</p>
                    <p className="text-gray-600 text-sm">Rental Management System</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    {/* ✅ NO FORM - Just divs */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter your username"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                    className="w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-800 mb-2">Default Login:</h4>
                            <div className="text-xs text-blue-700">
                                <p><strong>Username:</strong> Edasserikkudiyil</p>
                                <p><strong>Password:</strong> eda123</p>
                            </div>
                        </div>

                        {/* ✅ SIMPLE button - no form submission */}
                        <button
                            onClick={handleLogin}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition duration-200 shadow-lg"
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
