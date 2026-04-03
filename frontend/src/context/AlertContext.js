import React, { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext();

export const useAlert = () => {
    return useContext(AlertContext);
};

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);

    const showAlert = useCallback((message, type = 'success', duration = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setAlerts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }, duration);
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
