import { useEffect, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Database,
  Plus,
  FileEdit,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

// 1. Define the Report Interface for strict typing
interface Report {
  id: string;
  month: string;
  year: number;
  viewLink: string;
  status?: string;
  updatedAt?: Timestamp;
}

type PortalHomeProps = {
  profile: {
    role: 'user' | 'admin' | 'super-dev';
    active: boolean;
  };
  selectedYear: number;
};

const PortalHome = ({ profile, selectedYear }: PortalHomeProps) => {
  const navigate = useNavigate();
  const role = profile?.role;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Production Fix: Sorting by multiple fields requires a composite index in Firestore.
    // If you haven't created the index yet, this query will fail.
    // We'll simplify the query to sort by updatedAt and handle month sorting in the UI logic.
    const q = query(
      collection(db, 'reports'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];

      setReports(reportData);
      setLoading(false);
    }, (error) => {
      console.error("PortalHome Snapshot Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // FILTER BY YEAR & SORT BY MONTH (Production Logic)
  const monthOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const filteredReports = reports
    .filter((r) => r.year === selectedYear)
    .sort((a, b) => monthOrder.indexOf(b.month) - monthOrder.indexOf(a.month));

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* CONTROL PANEL */}
      {(role === 'super-dev' || role === 'admin') && (
        <div
          className={`border rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 ${
            role === 'super-dev'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg text-white ${
                role === 'super-dev' ? 'bg-amber-500' : 'bg-blue-500'
              }`}
            >
              <ShieldCheck size={20} />
            </div>

            <div>
              <h3 className={`font-bold text-sm ${
                  role === 'super-dev' ? 'text-amber-900' : 'text-blue-900'
              }`}>
                {role === 'super-dev' ? 'Super Dev Console' : 'Admin Control Panel'}
              </h3>
              <p className={role === 'super-dev' ? 'text-amber-700 text-[11px]' : 'text-blue-700 text-[11px]'}>
                {role === 'super-dev' ? 'System Administration Mode' : 'Report Management Mode'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center">
            {role === 'super-dev' && (
              <>
                <button 
                  disabled // Placeholder for actual NAS sync logic
                  className="bg-white border border-amber-300 text-amber-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-100 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Database size={14} /> Sync NAS
                </button>

                <button
                  onClick={() => navigate('/portal/admin/users')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Plus size={14} /> Manage Users
                </button>
              </>
            )}

            <button
              onClick={() => navigate('/portal/admin/reports')}
              className={`text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm ${
                role === 'super-dev' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <FileEdit size={14} /> Manage Reports
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Truda Debtor Reports</h1>
        <p className="text-gray-500 text-sm">Showing reports for {selectedYear}</p>
      </div>

      {/* LOADING / GRID */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <Loader2 className="animate-spin text-[#E31E24]" size={40} />
          <p className="text-gray-400 text-sm mt-4 italic">Fetching latest data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-[#E31E24] p-6 hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                <h3 className="text-xl font-bold text-gray-800">
                  {report.month} {report.year}
                </h3>

                <p className="text-[10px] uppercase font-bold text-gray-400 mt-2 mb-4 tracking-widest">
                  STATUS: <span className="text-green-600">{report.status || 'Verified'}</span>
                </p>

                <div className="space-y-2">
                  <a
                    href={report.viewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#E31E24] text-white py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors font-bold shadow-sm text-xs no-underline uppercase tracking-tight"
                  >
                    <Download size={14} /> Download Excel
                  </a>

                  <a
                    href={report.viewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white border border-gray-200 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-gray-700 text-xs font-semibold no-underline uppercase tracking-tight"
                  >
                    <FileSpreadsheet size={14} /> Preview
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center border-2 border-dashed border-gray-200 rounded-2xl">
              <Database className="text-gray-200 mb-4" size={48} />
              <p className="text-gray-400 font-medium text-center px-4">
                No debtor reports archived for {selectedYear} yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PortalHome;