import React, { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext();

export const useAlert = () => {
    return useContext(AlertContext);
};

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);

    const showAlert = useCallback((input, type = 'success', duration = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        
        let alertData = { id, type, duration };

        if (typeof input === 'object' && input !== null) {
            alertData = { 
                ...alertData, 
                title: input.title || (input.type || type).toUpperCase(),
                message: input.message || '',
                type: input.type || type,
                duration: input.duration || duration
            };
        } else {
            alertData = { 
                ...alertData, 
                title: type.toUpperCase(),
                message: input,
                type: type
            };
        }

        setAlerts(prev => [...prev, alertData]);

        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, alertData.duration || 4000);
    }, []);

    const removeAlert = useCallback((id) => {
        setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, []);

    return (
        <AlertContext.Provider value={{ alerts, showAlert, removeAlert }}>
            {children}
        </AlertContext.Provider>
    );
};
