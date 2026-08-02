// src/components/common/LoadingSpinner.jsx
// A reusable full-page loading spinner.
// Used in ProtectedRoute and anywhere we're waiting for async data.

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4">
      {/* Spinning ring animation using Tailwind */}
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
