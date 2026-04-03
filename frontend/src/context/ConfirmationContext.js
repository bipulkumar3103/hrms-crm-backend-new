import React, { createContext, useContext, useState, useCallback } from 'react';
import PremiumConfirmation from '../components/PremiumConfirmation';

const ConfirmationContext = createContext();

export const useConfirmation = () => useContext(ConfirmationContext);

export const ConfirmationProvider = ({ children }) => {
    const [state, setState] = useState({
        isOpen: false,
        title: '',
        message: '',
        resolve: null
    });

    const confirm = useCallback(({ title, message }) => {
        setState({
            isOpen: true,
            title: title || 'Are you sure?',
            message: message || 'This action cannot be undone.',
            resolve: null
        });

        return new Promise((res) => {
            setState(prev => ({ ...prev, resolve: res }));
        });
    }, []);

    const handleConfirm = () => {
        if (state.resolve) state.resolve(true);
        setState({ isOpen: false, title: '', message: '', resolve: null });
    };

    const handleCancel = () => {
        if (state.resolve) state.resolve(false);
        setState({ isOpen: false, title: '', message: '', resolve: null });
    };

    return (
        <ConfirmationContext.Provider value={{ confirm }}>
            {children}
            {state.isOpen && (
                <PremiumConfirmation 
                    title={state.title} 
                    message={state.message} 
                    onConfirm={handleConfirm} 
                    onCancel={handleCancel} 
                />
            )}
        </ConfirmationContext.Provider>
    );
};

