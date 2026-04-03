import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '../context/AlertContext';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiAlertTriangle } from 'react-icons/fi';

const PremiumAlert = () => {
    const { alerts, removeAlert } = useAlert();

    const getAlertStyle = (type) => {
        switch (type) {
            case 'success':
                return { bg: 'bg-[#f0fdf4]/95', border: 'border-[#bbf7d0]', text: 'text-[#166534]', icon: <FiCheckCircle className="text-[#22c55e]" size={20} /> };
            case 'error':
                return { bg: 'bg-[#fef2f2]/95', border: 'border-[#fecaca]', text: 'text-[#991b1b]', icon: <FiAlertCircle className="text-[#ef4444]" size={20} /> };
            case 'warning':
                return { bg: 'bg-[#fffbeb]/95', border: 'border-[#fde68a]', text: 'text-[#92400e]', icon: <FiAlertTriangle className="text-[#f59e0b]" size={20} /> };
            case 'info':
            default:
                return { bg: 'bg-[#eff6ff]/95', border: 'border-[#bfdbfe]', text: 'text-[#1e3a8a]', icon: <FiInfo className="text-[#3b82f6]" size={20} /> };
        }
    };

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-[380px] w-full pointer-events-none">
            <AnimatePresence>
                {alerts.map((alert) => {
                    const style = getAlertStyle(alert.type);
                    return (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: 20, scale: 0.98 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            className={`pointer-events-auto flex items-start gap-4 p-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border backdrop-blur-xl ${style.bg} ${style.border}`}
                        >
                            <div className="flex-shrink-0 mt-1">{style.icon}</div>
                            <div className="flex-1 space-y-1">
                                <div className={`text-[13px] font-black uppercase tracking-widest ${style.text}`}>
                                    {alert.title}
                                </div>
                                <div className={`text-[12.5px] font-medium leading-relaxed opacity-80 ${style.text}`}>
                                    {alert.message}
                                </div>
                            </div>
                            <button 
                                onClick={() => removeAlert(alert.id)} 
                                className={`flex-shrink-0 ${style.text} opacity-30 hover:opacity-100 transition-opacity p-1`}
                            >
                                <FiX size={16} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default PremiumAlert;
