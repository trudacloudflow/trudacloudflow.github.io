import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebase';
import { 
  UserPlus, 
  Copy, 
  CheckCircle2, 
  Mail, 
  AlertCircle, 
  Loader2,
  ExternalLink
} from 'lucide-react';

const InviteUser = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setGeneratedLink('');
    setCopied(false);

    try {
      const inviteUserFn = httpsCallable(functions, 'inviteUser');
      const result: any = await inviteUserFn({ email: email.trim().toLowerCase(), role });

      if (result.data?.success) {
        const { setupLink, isNewUser } = result.data;
        setGeneratedLink(setupLink);
        setMessage({ 
          type: 'success', 
          text: isNewUser ? "New account initialized successfully." : "User already exists. Link refreshed." 
        });
        setEmail('');
      }
    } catch (error: any) {
      console.error("Invite Error:", error);
      setMessage({ type: 'error', text: error.message || "Failed to generate invite." });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openMailClient = () => {
    const subject = encodeURIComponent("Access Your Truda Debtors Portal");
    const body = encodeURIComponent(
      `Hello,\n\nPlease use the link below to set your password and access the Truda Debtors Portal:\n\n${generatedLink}\n\nNote: This link is for one-time use and expires in 1 hour.`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-md">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <UserPlus size={18} className="text-[#E31E24]" />
        </div>
        <h3 className="font-bold text-gray-800">Invite Personnel</h3>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 ml-1 mb-1.5 tracking-wider">
              Corporate Email
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#E31E24] focus:ring-4 focus:ring-red-50 outline-none transition-all text-sm"
              placeholder="e.g. employee@truda.co.za"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 ml-1 mb-1.5 tracking-wider">
              Access Level
            </label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#E31E24] outline-none transition-all text-sm appearance-none cursor-pointer"
              disabled={loading}
            >
              <option value="user">Standard User (Read-only)</option>
              <option value="admin">Administrator (Upload/Edit)</option>
              <option value="super-dev">Developer (System Access)</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black active:scale-[0.98] transition-all disabled:bg-gray-200 flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Generate Secure Link"}
          </button>
        </form>

        {/* FEEDBACK & ACTIONS */}
        {message && (
          <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 size={18} className="text-green-600 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="text-red-600 mt-0.5" />
            )}
            <p className={`text-xs font-medium ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </div>
        )}

        {generatedLink && (
          <div className="mt-4 space-y-3 animate-in zoom-in-95 duration-300">
            <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">Secret Invite URL</span>
                {copied && <span className="text-[9px] font-bold text-green-400 uppercase">Copied!</span>}
              </div>
              <div className="flex gap-3">
                <input 
                  readOnly 
                  value={generatedLink} 
                  className="text-xs w-full bg-transparent border-none focus:ring-0 text-gray-300 truncate font-mono"
                />
                <button 
                  onClick={copyToClipboard}
                  className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
                  title="Copy Link"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <button 
              onClick={openMailClient}
              className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Mail size={14} className="text-[#E31E24]" />
              Send via Email Client
              <ExternalLink size={12} className="opacity-30" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteUser;