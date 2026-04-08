import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiTrash2, FiClock, FiUser, FiZap, 
  FiChevronDown, FiChevronUp, FiLayout, FiDatabase,
  FiMail, FiCompass, FiActivity
} from 'react-icons/fi';
import { api } from '../../../utils/api';
import { useAlert } from '../../../context/AlertContext';
import { useConfirmation } from '../../../context/ConfirmationContext';

export const EliteSubmissions = () => {
  const { showAlert } = useAlert();
  const { confirm } = useConfirmation();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      // We use the new generic API endpoint we just set up in the backend
      const res = await api.get('/submissions');
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error('Analysis handshake failed', err);
      showAlert("Encryption Protocol: Failed to synchronize submission data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: 'Dismantle Data Record?',
      message: `You are about to permanently purge the submission architecture from "${name}". This action cannot be reversed by the Enterprise Framework.`
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/submissions/${id}`);
      setSubmissions(prev => prev.filter(s => s.id !== id));
      showAlert("Protocol: Data record successfully dismantled.", "success");
    } catch {
      showAlert("Purge Violation: Failed to deconstruct the submission entry.", "error");
    }
  };

  const filteredSubmissions = submissions.filter(s => 
    s.form_name?.toLowerCase().includes(filter.toLowerCase()) ||
    s.submitter_name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header Architecture */}
      <div className="p-8 lg:p-12 border-b border-gray-50 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-theme-primary text-white shadow-lg">
                <FiActivity size={20} />
              </div>
              <h2 className="text-3xl font-semibold text-slate-900 tracking-tight italic">Form Analysis</h2>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 ml-1">
              Real-time administrative data flow monitoring
            </p>
          </div>

          <div className="relative w-full lg:w-96 group">
            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-theme-primary transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Scan for personnel or form title..."
              className="w-full pl-14 pr-8 py-4 bg-white border border-slate-200 rounded-3xl text-[11px] font-semibold focus:ring-4 focus:ring-theme-secondary/50 outline-none transition-all shadow-sm"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Registry Table */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-theme-primary rounded-full animate-spin mb-6"></div>
            <p className="text-[10px] font-semibold text-theme-primary">Synchronizing Registry...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <FiDatabase size={64} className="mb-6 opacity-20" />
            <p className="text-[10px] font-semibold italic text-center">No active data packets detected in this sector.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((sub, idx) => (
              <motion.div 
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group border transition-all duration-500 rounded-[2rem] overflow-hidden ${expandedId === sub.id ? 'border-theme-secondary bg-theme-secondary/30' : 'border-slate-50 bg-white hover:border-theme-secondary hover:shadow-xl hover:shadow-theme-secondary/50'}`}
              >
                <div className="flex flex-col lg:flex-row items-center p-6 lg:px-10 lg:py-8 gap-8">
                  {/* Personnel Identity */}
                  <div className="flex items-center gap-5 w-full lg:w-72 flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-theme-primary flex items-center justify-center text-white font-semibold text-xl shadow-lg group-hover:scale-110 transition-transform overflow-hidden">
                      {sub.submitter_avatar ? (
                        <img 
                          src={sub.submitter_avatar} 
                          alt="Personnel" 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        sub.submitter_name?.charAt(0)
                      )}
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-slate-900 tracking-tight">{sub.submitter_name}</h4>
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 mt-1">
                        <FiMail className="opacity-50" /> {sub.submitter_email}
                      </div>
                    </div>
                  </div>

                  {/* Context Meta */}
                  <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-semibold text-slate-300">Protocol Layer</span>
                      <div className="flex">
                        <span className="bg-theme-secondary text-theme-primary px-3 py-1 rounded-lg text-[10px] font-semibold border border-theme-secondary">
                          {sub.form_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-semibold text-slate-300">Access Point</span>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 truncate">
                        <FiCompass className="text-slate-300" /> {sub.source_route}
                      </div>
                    </div>

                    <div className="hidden lg:flex flex-col gap-1.5">
                      <span className="text-[9px] font-semibold text-slate-300">Timestamp</span>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                        <FiClock className="text-slate-300" /> {new Date(sub.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <button 
                      onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-semibold transition-all ${expandedId === sub.id ? 'bg-theme-primary text-white shadow-xl shadow-theme-secondary' : 'bg-slate-50 text-slate-400 hover:bg-theme-secondary hover:text-theme-primary'}`}
                    >
                      {expandedId === sub.id ? 'Collapse Meta' : 'Examine Sync'}
                    </button>
                    <button 
                      onClick={() => handleDelete(sub.id, sub.submitter_name)}
                      className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Expanded Intelligence Data */}
                <AnimatePresence>
                  {expandedId === sub.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-theme-secondary/50"
                    >
                      <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-white/50">
                        {Object.entries(sub.data || {}).map(([key, value]) => (
                          <div key={key} className="bg-white p-5 rounded-3xl border border-theme-secondary shadow-sm transition-all hover:bg-theme-secondary/20">
                            <label className="block text-[9px] font-semibold text-slate-300 mb-2">{key}</label>
                            <div className="text-[13px] font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                              {String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-10 pb-10">
                        <div className="flex items-center gap-2 p-4 bg-slate-900 rounded-3xl text-theme-primary mb-2">
                           <FiZap className="fill-theme-primary/20" />
                           <span className="text-[10px] font-semibold">API Data Capture Root: /api/v1/{sub.form_slug}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
      `}</style>
    </div>
  );
};
