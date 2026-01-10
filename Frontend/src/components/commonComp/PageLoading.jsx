// components/PageLoading.jsx
import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const PageLoading = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 max-w-sm w-full mx-4">
        <div className="text-center">
          <LoadingSpinner size="xl" color="rose" />
          <h3 className="mt-4 text-lg lg:text-2xl font-bold text-gray-900">
            {message}
          </h3>
          <p className="mt-2 text-sm lg:text-lg text-gray-500">
            Please wait while we fetch your data...
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageLoading;
