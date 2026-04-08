import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

const PremiumConfirmation = ({ title, message, onConfirm, onCancel }) => {
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                {/* Backdrop with sophisticated blur */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />
                
                {/* Modal Framework */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-white/20"
                >
                    {/* Header Aesthetic */}
                    <div className="relative h-24 bg-rose-50 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                        <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-inner">
                            <FiAlertTriangle size={28} className="animate-pulse" />
                        </div>
                        <button 
                            onClick={onCancel}
                            className="absolute top-6 right-6 text-rose-300 hover:text-rose-500 transition-colors"
                        >
                            <FiX size={20} />
                        </button>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 text-center">
                        <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                            {title}
                        </h3>
                        <p className="text-gray-500 font-medium leading-relaxed px-2">
                            {message}
                        </p>
                    </div>

                    {/* Action Bar */}
                    <div className="p-8 pt-0 flex gap-4">
                        <button 
                            onClick={onCancel}
                            className="flex-1 px-6 py-4 rounded-2xl bg-gray-50 hover:bg-[var(--theme-secondary,#d3d1ff)] hover:text-[var(--theme-primary)] text-gray-400 hover:text-gray-600 font-black text-xs uppercase tracking-widest transition-all"
                        >
                            Terminate Request
                        </button>
                        <button 
                            onClick={onConfirm}
                            className="flex-1 px-6 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-100 hover:shadow-rose-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Authorize Action
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PremiumConfirmation;
