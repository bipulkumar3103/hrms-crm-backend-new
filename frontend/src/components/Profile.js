import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Header from './dynamic/Header';
import Card from './dynamic/Card';

const componentMap = {
  header: Header,
  card: Card,
};

const getValue = (obj, path) => path.split('.').reduce((o, p) => (o ? o[p] : null), obj);

const bindData = (ui, data) => {
  const boundUI = { ...ui };
  const traverse = (obj) => {
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        if (obj[key].bind) {
          obj[key] = getValue(data, obj[key].bind);
        } else {
          traverse(obj[key]);
        }
      }
    }
  };
  traverse(boundUI);
  return boundUI;
};

function Profile({ token }) {
  const [uiStructure, setUiStructure] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');

  const fetchUiAndData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [uiRes, dataRes] = await Promise.all([
        axios.get('/api/v1/ui/profile', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/v1/company/me', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const boundUI = bindData(uiRes.data, dataRes.data);
      setUiStructure(boundUI);
      setProfileData(dataRes.data);
    } catch (err) {
      setError('Failed to load dashboard. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUiAndData();
  }, [fetchUiAndData]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadStatus('');
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('logo', selectedFile);

    try {
      setUploadStatus('Uploading...');
      setUploadError('');

      await axios.post('/api/v1/uploads/company-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setUploadStatus('Upload successful! Refreshing data...');
      setSelectedFile(null); // Reset file input
      
      // **CORRECTED LOGIC: Re-fetch all data to ensure UI consistency**
      await fetchUiAndData();
      setUploadStatus('Upload and refresh complete!');

    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed.');
      setUploadStatus('');
      console.error(err);
    }
  };

  useEffect(() => {
    if (profileData?.theme_bg_color) {
      document.body.style.backgroundColor = profileData.theme_bg_color;
    } else {
        document.body.style.backgroundColor = '#f3f4f6'; // default
    }
    return () => {
        document.body.style.backgroundColor = '';
    }
  }, [profileData]);

  if (!profileData && loading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading Dashboard...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-red-500">{error}</p></div>;
  }

  if (!uiStructure || !profileData) {
    return <div className="flex justify-center items-center min-h-screen"><p>No UI or data available.</p></div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Company Logo</h2>
        {profileData.logo_original_url && (
            <div className="mb-4">
                <p className="text-gray-600 mb-2">Current Logo:</p>
                <img src={profileData.logo_original_url} alt="Company Logo" className="max-w-xs h-auto rounded-lg shadow-sm" />
            </div>
        )}
        <div className="space-y-4">
            <div>
                <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-700">
                    {profileData.logo_original_url ? 'Upload a new logo' : 'Upload a logo'}
                </label>
                <input
                    id="logo-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border border-gray-200 file:bg-[var(--theme-secondary,#e0e7ff)] file:text-[var(--theme-primary,#3730A3)] hover:file:opacity-90 file:font-bold file:transition-all cursor-pointer"
                />
            </div>
            <button
                onClick={handleUpload}
                disabled={!selectedFile || uploadStatus === 'Uploading...'}
                className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2.5 border border-transparent font-bold rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-gray-400 transition-all font-sans"
                style={{ backgroundColor: 'var(--theme-primary, #3730A3)' }}
            >
                {uploadStatus.includes('Uploading') ? 'Uploading...' : 'Upload Logo'}
            </button>
            {uploadStatus && !uploadError && <p className="text-green-600 mt-2">{uploadStatus}</p>}
            {uploadError && <p className="text-red-600 mt-2">{uploadError}</p>}
        </div>
      </div>

      {uiStructure.components.map(component => {
          const Component = componentMap[component.type];
          if (!Component) {
              console.warn(`Unknown component type: ${component.type}`);
              return null;
          }
          return <Component key={component.id} config={component.config} theme={profileData} token={token} />;
      })}
    </div>
  );
}

export default Profile;
