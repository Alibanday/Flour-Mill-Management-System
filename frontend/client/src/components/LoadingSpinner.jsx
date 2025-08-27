import React from 'react';

export default function LoadingSpinner({ size = "md", color = "blue" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };

  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    red: "text-red-600",
    gray: "text-gray-600",
    white: "text-white"
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-2 ${sizeClasses[size]} ${colorClasses[color]}`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
