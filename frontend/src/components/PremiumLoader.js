import React from 'react';
import { motion } from 'framer-motion';

const PremiumLoader = ({ message = "Loading...", fullScreen = true }) => {
    
    // Core loader geometric animation
    const LoaderElement = () => (
        <div className="relative flex flex-col items-center justify-center p-8">
            {/* The Outer Spinning Dashed Ring */}
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute w-24 h-24 rounded-full border-[3px] border-dashed shadow-sm"
                style={{ borderColor: 'var(--theme-secondary)', opacity: 0.4 }}
            />
            {/* The Secondary Reverse Spinning Solid Ring */}
            <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute w-16 h-16 rounded-full border-2 border-r-transparent border-l-transparent shadow-sm"
                style={{ borderTopColor: 'var(--theme-primary)', borderBottomColor: 'var(--theme-primary)' }}
            />
            {/* Central Pulsing Orb */}
            <motion.div 
                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-4 h-4 rounded-full bg-[var(--theme-primary,#3730A3)] shadow-[0_0_15px_rgba(55,48,163,0.6)]"
            />
            
            {/* Sophisticated Text Below */}
            {message && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute top-28 whitespace-nowrap"
                >
                    <span className="text-[13px] font-bold tracking-widest uppercase text-gray-500 bg-clip-text text-transparent bg-gradient-to-r from-gray-500 to-gray-400">
                        {message}
                    </span>
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="h-[2px] mt-2 rounded-full"
                        style={{ background: `linear-gradient(to right, transparent, var(--theme-primary), transparent)` }}
                    />
                </motion.div>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#f0f4f8]/80 backdrop-blur-md">
                <LoaderElement />
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center rounded-[20px] bg-white/50 backdrop-blur-sm border border-gray-100/50">
            <LoaderElement />
        </div>
    );
};

export default PremiumLoader;
