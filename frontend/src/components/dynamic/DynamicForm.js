import React, { useState } from 'react';
import { api } from '../../utils/api';

function DynamicForm({ config, token, currentRoute }) {
  const [formData, setFormData] = useState({});
  const [status, setStatus] = useState({ loading: false, message: '', type: '' });

  const handleChange = (e, fieldName) => {
    setFormData({ ...formData, [fieldName]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let endpoint = config.submitEndpoint || '/forms/submit';
    
    // Normalize: strip backend domain and /api/v1 prefix to avoid doubling with baseURL
    endpoint = endpoint.replace(/^https?:\/\/[^\/]+/, '');
    endpoint = endpoint.replace(/^\/?api\/v1/, '');
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;

    try {
      setStatus({ loading: true, message: '', type: '' });
      
      // Normalize the source route: Prefer the passed route prop, fallback to window location
      let srcRoute = currentRoute || window.location.pathname;
      srcRoute = srcRoute.replace(/^\/?api\/v1/, '');

      // Build the submission payload with metadata so the backend can identify the form
      const payload = {
        ...formData,
        __form_name__: config.title || 'Unnamed Form',
        __source_route__: srcRoute,
      };

      await api.post(endpoint, payload);
      setStatus({ loading: false, message: config.successMessage || "Successfully submitted!", type: "success" });
      setFormData({}); // Reset form
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Unknown error';
      setStatus({ loading: false, message: "Submission failed: " + errMsg, type: "error" });
    }
  };

  const formStyle = config.style || {};

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6" style={formStyle}>
      {config.title && <h3 className="text-xl font-bold text-gray-800 mb-4">{config.title}</h3>}
      {status.message && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {status.message}
          </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {config.fields && config.fields.map((field, idx) => (
          <div key={idx}>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
                {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'textarea' ? (
                <textarea 
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(e, field.name)}
                  placeholder={field.placeholder || ''}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  rows="4"
                />
            ) : (
                <input 
                  type={field.type || 'text'} 
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(e, field.name)}
                  placeholder={field.placeholder || ''}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            )}
          </div>
        ))}
        <div className="pt-2">
            <button 
                type="submit" 
                disabled={status.loading}
                className="px-6 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50 transition-all"
                style={{ backgroundColor: 'var(--theme-primary)' }}
            >
                {status.loading ? 'Submitting...' : (config.submitLabel || 'Submit')}
            </button>
        </div>
      </form>
    </div>
  );
}

export default DynamicForm;
