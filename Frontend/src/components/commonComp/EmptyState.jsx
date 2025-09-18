// components/EmptyState.jsx
import React from 'react';
import { FiPackage, FiPlus } from 'react-icons/fi';

const EmptyState = ({ 
  icon: Icon = FiPackage,
  title = "No data available",
  description = "Get started by adding your first item.",
  actionLabel = "Add Item",
  onAction,
  showAction = true
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-rose-100 rounded-full p-4 mb-4">
        <Icon className="w-8 h-8 text-rose-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
        {description}
      </p>
      {showAction && onAction && (
        <button
          onClick={onAction}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
