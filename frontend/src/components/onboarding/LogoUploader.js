import React, { useState } from 'react';
import { api } from '../../utils/api';
import { FiUploadCloud } from 'react-icons/fi';
import { motion } from 'framer-motion';

const LogoUploader = ({ companyId, setToken }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('logo', file);
        formData.append('company_id', companyId);

        setIsUploading(true);
        setError(null);

        try {
            const response = await api.post('/onboarding/complete-profile/logo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            const newToken = response.data.access_token;
            if (newToken) {
                setToken(newToken);
            } else {
                throw new Error("No new token received from server.");
            }

        } catch (err) {
            setError('Upload failed. Please try again.');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
        >
            <hr className="my-6"/>
            <h3 className="text-xl font-semibold text-gray-700 text-center">Upload Your Company Logo</h3>
            <div className="flex flex-col items-center justify-center space-y-4 mt-4">
                <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-dashed">
                    {preview ? (
                        <img src={preview} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                        <FiUploadCloud size={60} className="text-gray-400" />
                    )}
                </div>
                <div>
                    <input 
                        type="file" 
                        id="logo-upload-onboarding" 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif" 
                        onChange={handleFileChange}
                    />
                    <label 
                        htmlFor="logo-upload-onboarding"
                        className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-50 shadow-sm"
                    >
                        Choose a File
                    </label>
                </div>
                {file && <p className="text-sm text-gray-500">{file.name}</p>}
            </div>
            {error && <p className="text-sm text-red-500 mt-2 text-center">{error}</p>}
            <div className="mt-6 text-center">
                <motion.button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    whileTap={{ scale: 0.95 }}
                    className="w-full max-w-xs justify-center py-3 px-4 border border-transparent rounded-md shadow-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-all duration-300"
                >
                    {isUploading ? 'Uploading & Finishing...' : 'Finish Setup'}
                </motion.button>
            </div>
        </motion.div>
    );
};

export default LogoUploader;