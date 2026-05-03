import { auth } from './lib/firebase';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import AppAuthenticated from './components/AppAuthenticated'; 
import LoginPage from './components/Login/LoginPage';

import './App.css';

function App() {
  const [user, loading, error] = useAuthState(auth);

  // 1. Loading State (Truda Brand Colors)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E31E24]"></div>
      </div>
    );
  }

  // 2. Production Error Handling
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div>
          <h1 className="text-xl font-bold text-red-600">Connection Error</h1>
          <p className="text-gray-500">Could not connect to authentication services. Please refresh.</p>
        </div>
      </div>
    );
  }

  return (
    /* 
       Added basename="/". 
       For trudaclowflow.github.io, this ensures internal links 
       resolve correctly relative to the root domain.
    */
    <Router basename="/">
      <Routes>
        {/* Login Page: If logged in, redirect to home. 'replace' prevents back-button loops */}
        <Route 
          path="/login" 
          element={!user ? <LoginPage /> : <Navigate to="/" replace />} 
        />

        {/* Protected Routes: If NOT logged in, redirect to login */}
        <Route 
          path="/*" 
          element={user ? <AppAuthenticated user={user} /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;