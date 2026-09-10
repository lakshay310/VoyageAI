// src/hooks/useApi.js
// Custom React hook that encapsulates API calling logic:
// - Manages loading, error, and data states automatically
// - Eliminates repetitive try/catch and useState boilerplate across pages
//
// Prompt 28 — Code Refactoring
//
// Usage:
//   const { data, loading, error, execute } = useApi(getMyTrips);
//   useEffect(() => { execute(); }, []);

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook to execute any asynchronous API function with managed state.
 *
 * @param {Function} apiFunc - Async function that returns a Promise (e.g. from an API service)
 * @param {Object} options - Configuration options
 * @param {boolean} options.showErrorToast - Whether to automatically show a toast on error (default: true)
 * @param {*} options.initialData - Initial data value before API returns (default: null)
 */
export const useApi = (apiFunc, options = {}) => {
  const { showErrorToast = true, initialData = null } = options;

  const [data, setData]       = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  /**
   * Execute the API call with any arguments passed in.
   * useCallback ensures this function has a stable identity across renders.
   */
  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFunc(...args);
        // Standard response format: response.data.data or response.data
        const result = response?.data?.data !== undefined ? response.data.data : response?.data;
        setData(result);
        return { success: true, data: result };
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
        setError(errorMessage);

        if (showErrorToast) {
          toast.error(errorMessage);
        }

        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [apiFunc, showErrorToast]
  );

  return { data, loading, error, execute, setData };
};

export default useApi;
