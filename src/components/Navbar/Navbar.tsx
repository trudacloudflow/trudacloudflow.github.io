import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Link, useLocation } from 'react-router-dom';

type NavbarProps = {
  userEmail: string | null;
  role?: string;
  years: number[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
};

const Navbar = ({
  userEmail,
  role,
  years,
  selectedYear,
  onSelectYear,
}: NavbarProps) => {
  const location = useLocation();
  
  // Production Logic: Match the permissions used in the Router
  const isSuperDev = role === 'super-dev';
  const isAdmin = role === 'admin' || isSuperDev;
  
  // Check if we are currently on an admin page to highlight the "Admin" section
  const isAdminPage = location.pathname.includes('/portal/admin');

  return (
    <nav className="w-full bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">

        {/* Top Row: Branding & User Profile */}
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/Truda-Logo-Red-2022_CMYK.png"
                alt="Truda Logo"
                className="h-8 sm:h-10 cursor-pointer"
              />
              <span className="text-gray-300">|</span>
              <img
                src="/airflow.jpeg"
                alt="Cloudflow Logo"
                className="h-7 sm:h-10"
              />
            </Link>
          </div>

          <div className="flex items-center space-x-3">
            {/* Admin Quick-Link: Only visible to Admins/SuperDevs */}
            {isAdmin && (
              <Link 
                to="/portal/admin/reports"
                className={`hidden md:block px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  isAdminPage 
                    ? 'bg-[#E31E24] text-white' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Management Console
              </Link>
            )}

            <div className="hidden sm:block text-right border-r border-gray-200 pr-3">
              <p
                className={`text-[10px] uppercase font-bold tracking-tighter ${
                  isSuperDev ? 'text-amber-500' : isAdmin ? 'text-blue-500' : 'text-gray-400'
                }`}
              >
                {isSuperDev ? 'Super Dev' : isAdmin ? 'Admin' : 'Staff'}
              </p>
              <p className="text-xs font-medium text-gray-700">
                {userEmail?.split('@')[0]}
              </p>
            </div>

            <button
              onClick={() => signOut(auth)}
              className="bg-red-50 text-[#E31E24] px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#E31E24] hover:text-white transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Bottom Row: Navigation & Year Selection */}
        <div className="flex items-center justify-between border-t border-gray-50 pt-2 pb-2">
          <div className="flex space-x-6 overflow-x-auto no-scrollbar text-sm font-bold text-gray-500">
            {/* Home Link */}
            <Link 
              to="/" 
              className={`pb-1 whitespace-nowrap ${!isAdminPage ? 'text-[#E31E24] border-b-2 border-[#E31E24]' : 'hover:text-gray-800'}`}
            >
              Reports Dashboard
            </Link>

            {/* Year Toggles: Only show if we aren't on an admin page (for clarity) */}
            {!isAdminPage && (
              <>
                <span className="text-gray-200">|</span>
                {years.length === 0 ? (
                  <p className="text-xs text-gray-400 self-center italic">Initializing reports...</p>
                ) : (
                  years.map((year) => (
                    <button
                      key={year}
                      onClick={() => onSelectYear(year)}
                      className={`whitespace-nowrap pb-1 transition-all ${
                        year === selectedYear && !isAdminPage
                          ? 'text-[#E31E24] border-b-2 border-[#E31E24]'
                          : 'hover:text-gray-800'
                      }`}
                    >
                      {year}
                    </button>
                  ))
                )}
              </>
            )}

            {/* Mobile Admin Link */}
            {isAdmin && (
              <Link 
                to="/portal/admin/reports"
                className={`md:hidden pb-1 whitespace-nowrap ${isAdminPage ? 'text-[#E31E24] border-b-2 border-[#E31E24]' : 'text-blue-500'}`}
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;