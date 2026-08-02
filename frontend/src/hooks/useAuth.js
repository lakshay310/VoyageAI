// src/hooks/useAuth.js
// Custom hook that provides access to the authentication context.
//
// Why a separate file?
// It keeps the import path clean:  import { useAuth } from '../hooks/useAuth'
// instead of:                      import { useAuth } from '../context/AuthContext'
//
// Any component that needs the logged-in user can just call useAuth().

import { useAuth } from '../context/AuthContext';

export { useAuth };
