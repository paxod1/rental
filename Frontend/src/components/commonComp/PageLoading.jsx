// components/PageLoading.jsx
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const PageLoading = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full mx-4">
        <div className="text-center">
          <LoadingSpinner size="xl" color="rose" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {message}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while we fetch your data...
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageLoading;
