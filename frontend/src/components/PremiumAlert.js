import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '../context/AlertContext';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiAlertTriangle } from 'react-icons/fi';

const AlertItem = ({ alert, removeAlert }) => {
    const getAlertStyle = (type) => {
        switch (type) {
            case 'success':
                return { 
                    bg: 'bg-white/95', 
                    border: 'border-[#22c55e]/30', 
                    text: 'text-[#166534]', 
                    accent: 'bg-[#22c55e]',
                    icon: <FiCheckCircle className="text-[#22c55e]" size={20} />,
                    shadow: 'shadow-[0_20px_50px_rgba(34,197,94,0.15)]'
                };
            case 'error':
                return { 
                    bg: 'bg-white/95', 
                    border: 'border-[#ef4444]/30', 
                    text: 'text-[#991b1b]', 
                    accent: 'bg-[#ef4444]',
                    icon: <FiAlertCircle className="text-[#ef4444]" size={20} />,
                    shadow: 'shadow-[0_20px_50px_rgba(239,68,68,0.15)]'
                };
            case 'warning':
                return { 
                    bg: 'bg-white/95', 
                    border: 'border-[#f59e0b]/30', 
                    text: 'text-[#92400e]', 
                    accent: 'bg-[#f59e0b]',
                    icon: <FiAlertTriangle className="text-[#f59e0b]" size={20} />,
                    shadow: 'shadow-[0_20px_50px_rgba(245,158,11,0.15)]'
                };
            case 'info':
            default:
                return { 
                    bg: 'bg-white/95', 
                    border: 'border-[#3b82f6]/30', 
                    text: 'text-[#1e3a8a]', 
                    accent: 'bg-[#3b82f6]',
                    icon: <FiInfo className="text-[#3b82f6]" size={20} />,
                    shadow: 'shadow-[0_20px_50px_rgba(59,130,246,0.15)]'
                };
        }
    };

    const style = getAlertStyle(alert.type);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex flex-col overflow-hidden rounded-[24px] border ${style.bg} ${style.border} ${style.shadow} backdrop-blur-xl`}
        >
            <div className="flex items-start gap-4 p-5">
                <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
                <div className="flex-1 space-y-1">
                    <div className={`text-[12px] font-black uppercase tracking-[0.2em] ${style.text} opacity-90`}>
                        {alert.title}
                    </div>
                    <div className={`text-[13.5px] font-semibold leading-relaxed text-gray-700`}>
                        {alert.message}
                    </div>
                </div>
                <button 
                    onClick={() => removeAlert(alert.id)} 
                    className={`flex-shrink-0 text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100/50 mt-1`}
                >
                    <FiX size={16} />
                </button>
            </div>
            
            {/* Progress Bar Visualizer */}
            <div className="h-[3px] w-full bg-gray-100/50 overflow-hidden">
                <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: (alert.duration || 4000) / 1000, ease: 'linear' }}
                    className={`h-full ${style.accent}`}
                />
            </div>
        </motion.div>
    );
};

const PremiumAlert = () => {
    const { alerts, removeAlert } = useAlert();

    return (
        <div className="fixed top-8 right-8 z-[999999] flex flex-col gap-4 max-w-[400px] w-full pointer-events-none p-4">
            <AnimatePresence mode="popLayout">
                {alerts.map((alert) => (
                    <AlertItem 
                        key={alert.id} 
                        alert={alert} 
                        removeAlert={removeAlert} 
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default PremiumAlert;
