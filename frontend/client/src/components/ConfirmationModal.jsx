import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "warning" // warning, danger, info
}) {
  if (!isOpen) return null;

  const typeStyles = {
    warning: {
      icon: <FaExclamationTriangle className="text-yellow-600" />,
      button: "bg-yellow-600 hover:bg-yellow-700",
      bg: "bg-yellow-50"
    },
    danger: {
      icon: <FaExclamationTriangle className="text-red-600" />,
      button: "bg-red-600 hover:bg-red-700",
      bg: "bg-red-50"
    },
    info: {
      icon: <FaExclamationTriangle className="text-blue-600" />,
      button: "bg-blue-600 hover:bg-blue-700",
      bg: "bg-blue-50"
    }
  };

  const currentStyle = typeStyles[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className={`p-6 ${currentStyle.bg} rounded-t-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-3 text-2xl">
                {currentStyle.icon}
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl bg-transparent p-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">{message}</p>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${currentStyle.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
