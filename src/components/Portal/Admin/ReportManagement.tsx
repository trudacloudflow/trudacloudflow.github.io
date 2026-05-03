import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Added Storage hooks
import { db, functions, storage } from '../../../lib/firebase'; // Ensure 'storage' is exported in your lib
import { 
  Upload, CheckCircle, AlertCircle, ArrowLeft, 
  FileText, Trash2, Edit3, Loader2, ExternalLink, Database, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReportManagement = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  
  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState(new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date()));
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Progress tracker
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Edit State
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [editMonth, setEditMonth] = useState('');
  const [editYear, setEditYear] = useState('');

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // 1. Listen to Reports
  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("year", "desc"), orderBy("month", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(data);
      setReportsLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setReportsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Upload Logic (Optimized for 50MB files)
  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus(null);
    setUploadProgress(0);

    try {
      // Create a reference in the 'temp_uploads' folder
      const storageRef = ref(storage, `temp_reports/${Date.now()}_${file.name}`);
      
      // Use resumable upload for large office files
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(pct);
        }, 
        (error) => {
          setStatus({ type: 'error', msg: "Upload failed: " + error.message });
          setUploading(false);
        }, 
        async () => {
          // Upload to Storage finished, now trigger the Cloud Function to move to Drive
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          try {
            const syncFn = httpsCallable(functions, 'syncStorageToDrive');
            await syncFn({ 
              fileUrl: downloadURL, 
              fileName: file.name, 
              month, 
              year: parseInt(year) 
            });

            setStatus({ type: 'success', msg: `${month} ${year} synced to Drive!` });
            setFile(null);
          } catch (err: any) {
            setStatus({ type: 'error', msg: "Sync Error: " + err.message });
          } finally {
            setUploading(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (error) {
      setStatus({ type: 'error', msg: "System error occurred." });
      setUploading(false);
    }
  };

  // 3. Delete Logic
  const handleDelete = async (reportId: string, driveFileId: string) => {
    if (window.confirm("Delete this record and the file from Google Drive permanently?")) {
      try {
        const deleteFn = httpsCallable(functions, 'deleteReport');
        await deleteFn({ reportDocId: reportId, fileId: driveFileId });
      } catch (err: any) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  // 4. Save Edit
  const handleSaveEdit = async () => {
    if (!editingReport) return;
    try {
      const reportRef = doc(db, "reports", editingReport.id);
      await updateDoc(reportRef, {
        month: editMonth,
        year: parseInt(editYear),
        updatedAt: new Date()
      });
      setEditingReport(null);
      setStatus({ type: 'success', msg: "MetaData updated." });
    } catch (err: any) {
      alert("Update failed: " + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <button 
        onClick={() => navigate('/portal/dashboard')}
        className="flex items-center gap-2 text-gray-400 hover:text-[#E31E24] mb-8 transition-all text-xs font-bold uppercase tracking-widest"
      >
        <ArrowLeft size={14} /> Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: UPLOAD FORM */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-8">
            <div className="bg-gray-900 p-5 text-white">
              <h2 className="font-bold flex items-center gap-2 text-sm uppercase tracking-tighter">
                <Upload size={18} className="text-[#E31E24]" />
                Excel Repository
              </h2>
            </div>
            
            <div className="p-6 space-y-5">
              {status && (
                <div className={`p-4 rounded-xl text-xs font-medium flex gap-3 items-center ${
                  status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {status.msg}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Month</label>
                  <select 
                    value={month} 
                    onChange={(e) => setMonth(e.target.value)} 
                    className="w-full p-3 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:border-[#E31E24] outline-none transition-all"
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Year</label>
                  <input 
                    type="number" 
                    value={year} 
                    onChange={(e) => setYear(e.target.value)} 
                    className="w-full p-3 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:bg-white focus:border-[#E31E24] outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="group relative border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center hover:border-[#E31E24]/30 hover:bg-red-50/30 transition-all cursor-pointer">
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv, .pdf" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)} 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                />
                <Upload size={24} className="mx-auto text-gray-300 mb-2 group-hover:text-[#E31E24] transition-colors" />
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">
                  {file ? file.name : "Drop Excel/PDF Here"}
                </p>
                {file && <p className="text-[9px] text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-[#E31E24] h-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-center font-bold text-gray-400 uppercase tracking-widest">
                    Streaming: {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              <button 
                onClick={handleUpload} 
                disabled={uploading || !file}
                className="w-full bg-[#E31E24] text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest disabled:bg-gray-100 disabled:text-gray-400 flex justify-center items-center gap-3 shadow-lg shadow-red-100 transition-all active:scale-95"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                {uploading ? "Uploading..." : "Commit to Cloud"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIST MANAGEMENT */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-tight">
                <FileText size={18} className="text-[#E31E24]" />
                Report History
              </h2>
              <span className="text-[10px] bg-white border border-gray-100 px-3 py-1 rounded-full font-black text-gray-400 uppercase tracking-widest">
                {reports.length} Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-[10px] uppercase text-gray-400 font-black tracking-widest border-b border-gray-50">
                  <tr>
                    <th className="px-6 py-4">Period</th>
                    <th className="px-6 py-4">File Details</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reportsLoading ? (
                    <tr><td colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-gray-200" size={32} /></td></tr>
                  ) : reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900 text-sm uppercase">{report.month}</span>
                          <span className="text-xs text-[#E31E24] font-bold">{report.year}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <a 
                          href={report.viewLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors group/link"
                        >
                          <div className="p-2 bg-gray-50 rounded-lg group-hover/link:bg-blue-50 transition-colors">
                            <ExternalLink size={14} />
                          </div>
                          <span className="text-xs font-medium truncate max-w-[200px]">{report.fileName || 'View Document'}</span>
                        </a>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingReport(report);
                              setEditMonth(report.month);
                              setEditYear(report.year.toString());
                            }}
                            className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(report.id, report.driveFileId)}
                            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingReport && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-black uppercase text-xs tracking-widest text-gray-400">Modify Period</h3>
              <button onClick={() => setEditingReport(null)} className="text-gray-300 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Month</label>
                  <select 
                    value={editMonth} 
                    onChange={(e) => setEditMonth(e.target.value)} 
                    className="w-full p-3 border border-gray-100 rounded-2xl bg-gray-50 text-sm font-bold outline-none"
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Year</label>
                  <input 
                    type="number" 
                    value={editYear} 
                    onChange={(e) => setEditYear(e.target.value)} 
                    className="w-full p-3 border border-gray-100 rounded-2xl bg-gray-50 text-sm font-bold outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveEdit} className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-gray-200 active:scale-95 transition-all">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;