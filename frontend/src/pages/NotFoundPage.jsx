// src/pages/NotFoundPage.jsx
// Shown when the user visits any URL that doesn't match a defined route.
// React Router v6 renders this when path="*" matches (catch-all).

import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">

        {/* Large 404 number */}
        <div className="text-8xl font-black text-transparent bg-clip-text
                        bg-gradient-to-r from-purple-400 to-blue-400 mb-4">
          404
        </div>

        {/* Airplane emoji flying off */}
        <div className="text-6xl mb-6 animate-bounce">✈️</div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-400 mb-8">
          Looks like this destination doesn't exist on our map.
          Let's get you back on track!
        </p>

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/dashboard"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold
                       px-6 py-2.5 rounded-xl transition"
          >
            🏠 Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold
                       border border-gray-700 px-6 py-2.5 rounded-xl transition"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
