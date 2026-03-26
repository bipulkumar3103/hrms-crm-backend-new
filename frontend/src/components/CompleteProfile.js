
import React, { useState, useEffect } from 'react';
import LogoUploader from './onboarding/LogoUploader'; // Make sure the path is correct
import { api } from '../utils/api';

function CompleteProfile({ setToken }) {
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    website: '',
    theme_primary_color: '#4338ca', 
    theme_secondary_color: '#c7d2fe',
    theme_accent_color: '#db2777', 
    theme_bg_color: '#f5f3ff',
    theme_text_color: '#1f2937'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [companyId, setCompanyId] = useState(null); // To store the ID of the created company

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/onboarding/complete-profile/details', formData);
      
      if (response.data && response.data.company_id) {
        setCompanyId(response.data.company_id);
        // Do not set token or reload yet. Move to the logo upload step.
      } else {
        throw new Error("Failed to create company profile details.");
      }

    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Profile update failed. Please check your data.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Profile details submission failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const ColorInput = ({ label, name, value }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="mt-1 flex items-center">
            <input id={name} name={name} type="color" value={value} onChange={handleChange} className="w-10 h-10 p-1 border-gray-300 rounded-md"/>
            <input type="text" value={value} onChange={handleChange} name={name} className="ml-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
    </div>
  );

  if (companyId) {
    // If we have a company ID, show the logo uploader
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className={`w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 md:p-12 transition-all duration-500 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
                <LogoUploader companyId={companyId} setToken={setToken} />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className={`w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 md:p-12 transition-all duration-1000 ${isMounted ? 'opacity-100 transform-none' : 'opacity-0 -translate-y-10'}`}>
        
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">Complete Your Company Profile</h1>
            <p className="text-gray-500 mt-2">Step 1 of 2: Provide your company details.</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                    <input id="address" name="address" type="text" required placeholder="123 Main St, Anytown USA" className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" value={formData.address} onChange={handleChange} />
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input id="phone" name="phone" type="tel" required placeholder="(555) 123-4567" className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" value={formData.phone} onChange={handleChange} />
                </div>
            </div>

             <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">Company Website</label>
                <input id="website" name="website" type="url" required placeholder="https://www.yourcompany.com" className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" value={formData.website} onChange={handleChange} />
            </div>

            <hr className="my-6"/>
            <h3 className="text-xl font-semibold text-gray-700 text-center">Brand Your Dashboard</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <ColorInput label="Primary" name="theme_primary_color" value={formData.theme_primary_color} />
                <ColorInput label="Secondary" name="theme_secondary_color" value={formData.theme_secondary_color} />
                <ColorInput label="Accent" name="theme_accent_color" value={formData.theme_accent_color} />
                <ColorInput label="Background" name="theme_bg_color" value={formData.theme_bg_color} />
                <ColorInput label="Text" name="theme_text_color" value={formData.theme_text_color} />
            </div>

          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>}

          <button type="submit" disabled={isLoading} className="w-full flex justify-.center py-3 px-4 border border-transparent rounded-md shadow-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-all duration-300 transform hover:scale-105">
            {isLoading ? 'Saving Details...' : 'Continue to Logo Upload'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfile;
