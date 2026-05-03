import { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { signOut, type User } from 'firebase/auth';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Hooks & Components
import { useUserProfile } from '../hooks/useUserProfile';
import Navbar from '../components/Navbar/Navbar';
import PortalHome from '../components/Portal/PortalHome';
import InviteUser from './Portal/Admin/InviteUser';
import UserManagement from './Portal/Admin/UserManagement';
import ReportManagement from './Portal/Admin/ReportManagement';

import '../App.css';

type Props = {
  user: User; // Changed from 'any' to Firebase User type
};

const AppAuthenticated = ({ user }: Props) => {
  const { profile, loading } = useUserProfile();
  const navigate = useNavigate();

  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    let isMounted = true;

    const fetchYears = async () => {
      try {
        // Production Fix: Added a limit to prevent excessive reads if the collection grows
        const q = query(collection(db, 'reports'), limit(500));
        const snapshot = await getDocs(q);
        
        if (!isMounted) return;

        const yearSet = new Set<number>();
        snapshot.forEach((doc) => {
          const d = doc.data();
          if (d.year) yearSet.add(d.year);
        });

        const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
        setYears(sortedYears);

        // Auto-select the latest year if current selection isn't available
        if (sortedYears.length > 0 && !yearSet.has(selectedYear)) {
          setSelectedYear(sortedYears[0]);
        }
      } catch (error) {
        console.error("Production Error: Failed to fetch report years:", error);
      }
    };

    fetchYears();

    // Cleanup function to prevent memory leaks on unmount
    return () => {
      isMounted = false;
    };
  }, [selectedYear]);

  // 1. Initial Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-[#E31E24] font-bold">
          Verifying Permissions...
        </div>
      </div>
    );
  }

  // 2. Profile Sync Check
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#E31E24] mb-4"></div>
        <p className="text-gray-500">Syncing user profile...</p>
      </div>
    );
  }

  // 3. Account Activity Guard
  if (profile.active === false) {
    const handleLogout = async () => {
      await signOut(auth);
      navigate('/login');
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Suspended</h1>
          <p className="text-gray-500 mb-6">Your account has been deactivated. Please contact the administrator.</p>
          <button 
            onClick={handleLogout} 
            className="w-full px-6 py-3 bg-[#E31E24] text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // 4. Main Authenticated UI
  const isPrivileged = profile.role === 'admin' || profile.role === 'super-dev';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        userEmail={user.email}
        role={profile.role}
        years={years}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
      />

      <main className="p-4 max-w-7xl mx-auto">
        <Routes>
          {/* Protected Admin Routes - Only mounted if role matches */}
          {isPrivileged && (
            <>
              <Route path="/portal/admin/invite" element={<InviteUser />} />
              <Route path="/portal/admin/users" element={<UserManagement />} />
              <Route path="/portal/admin/reports" element={<ReportManagement />} />
            </>
          )}

          {/* Fallback/Home Route */}
          <Route 
            path="*" 
            element={<PortalHome profile={profile} selectedYear={selectedYear} />} 
          />
        </Routes>
      </main>
    </div>
  );
};

export default AppAuthenticated;