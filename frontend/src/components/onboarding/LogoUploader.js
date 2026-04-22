import React, { useState, useRef } from 'react';
import { api } from '../../utils/api';
import { FiUploadCloud, FiImage, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LogoUploader = ({ companyId }) => {
    const { login, refreshStatus } = useAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files && e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(selectedFile);
        }
    };

    const triggerFileInput = () => {
        if (!isUploading) fileInputRef.current?.click();
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
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            const newToken = response.data.access_token;
            if (newToken) {
                login(newToken);
                await refreshStatus();
                navigate('/dashboard');
            } else {
                throw new Error("Initialization failed securely.");
            }
        } catch (err) {
            setError('Asset upload failed. Please verify the dimensions/format.');
            console.error(err);
            setIsUploading(false); // only re-enable if failed
        }
    };

    return (
        <div className="w-full mt-4">
            
            {/* The Dropzone / Preview Area */}
            <motion.div 
                whileHover={{ scale: preview ? 1 : 1.01, backgroundColor: preview ? '#fff' : '#f8fafc' }}
                whileTap={{ scale: 0.99 }}
                onClick={triggerFileInput}
                className={`relative w-full h-[220px] rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all border-2
                            ${preview ? 'border-transparent shadow-lg' : 'border-dashed border-gray-300'}`}
                style={{ overflow: 'hidden' }}
            >
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/png, image/jpeg, image/svg+xml" 
                    onChange={handleFileChange}
                />

                <AnimatePresence mode="wait">
                    {preview ? (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50"
                        >
                            <img src={preview} alt="Environment Logo" className="w-[120px] h-[120px] object-contain mb-4 filter drop-shadow-sm" />
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-white shadow-sm border border-gray-100 rounded-full font-medium text-xs text-gray-600">
                                <FiImage /> {file?.name}
                            </div>
                            
                            {/* Hover overlay hint */}
                            <div className="absolute inset-0 bg-white/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <div className="px-5 py-2.5 bg-white shadow-md border border-gray-200 rounded-xl font-bold text-gray-700 text-sm flex items-center gap-2">
                                    <FiRefreshCw /> Replace Asset
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center px-6 text-center"
                        >
                            <div className="w-16 h-16 bg-[var(--theme-secondary,#e0e7ff)] text-[var(--theme-primary,#3730A3)] rounded-full flex items-center justify-center mb-4">
                                <FiUploadCloud size={28} />
                            </div>
                            <h3 className="text-[15px] font-bold text-gray-800 tracking-tight">Click or Drag to Upload</h3>
                            <p className="text-[13px] text-gray-500 mt-1 max-w-[250px]">SVG, PNG, or JPG (max. 5MB). We recommend a transparent background.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-medium flex items-center justify-center gap-2">
                    {error}
                </motion.div>
            )}

            <div className="mt-8">
                <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="nx-btn-primary"
                >
                    {isUploading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 
                            Finalizing Environment...
                        </>
                    ) : (
                        <>
                            Complete Administration Setup <FiCheck size={18} />
                        </>
                    )}
                </button>
                <div align="center">
                    <button 
                        onClick={async () => {
                            // Optionally let them skip logo directly
                            setIsUploading(true);
                            await refreshStatus();
                            navigate('/dashboard');
                        }}
                        disabled={isUploading}
                        className="mt-4 text-[13px] font-semibold text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer"
                    >
                        Skip uploading an asset for now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoUploader;
