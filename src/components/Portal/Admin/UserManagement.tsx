import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Plus, User, Shield, HardDrive, Mail, Calendar, MoreVertical} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Real-time listener with error handling
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const userList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(userList);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Listen Error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Control access levels and monitor system personnel.</p>
        </div>
        
        <button 
          onClick={() => navigate('/portal/admin/invite')}
          className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95"
        >
          <Plus size={18} />
          <span>Invite Personnel</span>
        </button>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-[10px] uppercase font-bold tracking-[0.15em]">
                <th className="px-6 py-5">Personnel</th>
                <th className="px-6 py-5">Access Level</th>
                <th className="px-6 py-5">System Status</th>
                <th className="px-6 py-5">Registration Date</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-700">
              {loading ? (
                // SKELETON LOADING STATE
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-6">
                      <div className="h-4 bg-gray-100 rounded-md w-full"></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                    No users found in the system.
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/80 transition-colors group">
                  {/* USER INFO */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-red-50 rounded-full flex items-center justify-center text-[#E31E24] font-bold text-xs border border-red-100">
                        {u.email?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm">{u.email}</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Mail size={10} /> Internal Account
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* ROLE BADGE */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                      u.role === 'super-dev' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                      u.role === 'admin' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 
                      'bg-gray-50 text-gray-600 border border-gray-100'
                    }`}>
                      {u.role === 'super-dev' ? <HardDrive size={12} /> : u.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                      {u.role}
                    </span>
                  </td>

                  {/* STATUS INDICATOR */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${u.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-400'}`}></div>
                      <span className={`text-xs font-medium ${u.active ? 'text-green-700' : 'text-red-700'}`}>
                        {u.active ? 'Active' : 'Revoked'}
                      </span>
                    </div>
                  </td>

                  {/* JOINED DATE */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <Calendar size={13} />
                      {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString('en-ZA') : 'Pending...'}
                    </div>
                  </td>

                  {/* ACTION MENU (Placeholder for Edit/Revoke) */}
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-white rounded-lg text-gray-300 hover:text-gray-600 transition-all border border-transparent hover:border-gray-100 shadow-none hover:shadow-sm">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;