import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { motion } from 'framer-motion';
import { FiBox, FiUsers, FiSettings, FiHome, FiBarChart2 } from 'react-icons/fi';

const BrandedDashboard = () => {
    const [company, setCompany] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCompanyData = async () => {
            try {
                const response = await api.get('/company/me');
                console.log("Company data loaded:", response.data);
                setCompany(response.data);
            } catch (err) {
                setError('Failed to load company data.');
                console.error("Error fetching company data:", err);
                if (err.response) {
                    console.error("Error response:", err.response.data);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanyData();
    }, []);

    useEffect(() => {
        // Apply theme colors as CSS variables
        if (company) {
            const root = document.documentElement;
            root.style.setProperty('--theme-primary', company.theme_primary_color || '#4338ca');
            root.style.setProperty('--theme-secondary', company.theme_secondary_color || '#c7d2fe');
            root.style.setProperty('--theme-accent', company.theme_accent_color || '#db2777');
            root.style.setProperty('--theme-bg', company.theme_bg_color || '#f5f3ff');
            root.style.setProperty('--theme-text', company.theme_text_color || '#1f2937');
        }
    }, [company]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><p>Loading Dashboard...</p></div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen"><p className="text-red-500">{error}</p></div>;
    }

    const Card = ({ icon, title, children }) => (
        <motion.div 
            className="p-6 rounded-lg shadow-md bg-white" 
            style={{ color: 'var(--theme-text)' }}
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
        >
            <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 rounded-full" style={{ backgroundColor: 'var(--theme-secondary)'}}>
                    {React.cloneElement(icon, { style: { color: 'var(--theme-primary)'}})}
                </div>
                <h3 className="text-xl font-bold">{title}</h3>
            </div>
            <div>{children}</div>
        </motion.div>
    );

    const NavItem = ({ icon, children, active = false }) => (
        <li>
            <a href="#" className={`flex items-center p-3 rounded-lg font-semibold transition-colors ${
                active 
                ? 'text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={ active ? { backgroundColor: 'var(--theme-primary)' } : {}}
            >
                {React.cloneElement(icon, { className: 'flex-shrink-0' })}
                <span className="ml-4 hidden md:inline">{children}</span>
            </a>
        </li>
    );

    return (
        <div className="flex h-screen bg-gray-50" style={{ color: 'var(--theme-text)' }}>
            {/* Sidebar */}
            <aside className="w-20 md:w-64 flex-shrink-0 bg-white shadow-lg transition-all duration-300">
                <div className="h-24 flex items-center justify-center px-4">
                    <div className="flex items-center justify-center md:justify-start space-x-3 w-full">
                        {company?.logo_original_url && (
                            <img src={company.logo_original_url} alt={`${company.name} Logo`} className="h-10 w-10 object-contain flex-shrink-0" />
                        )}
                        <h1 className="text-xl font-bold truncate hidden md:block" style={{ color: 'var(--theme-primary)' }}>
                            {company?.name || 'Company'}
                        </h1>
                    </div>
                </div>
                <nav className="px-4">
                    <ul className="space-y-2">
                        <NavItem icon={<FiHome size={20} />} active={true}>
                            Dashboard
                        </NavItem>
                        <NavItem icon={<FiUsers size={20} />}>
                            Employees
                        </NavItem>
                        <NavItem icon={<FiBarChart2 size={20} />}>
                            Reports
                        </NavItem>
                        <NavItem icon={<FiSettings size={20} />}>
                            Settings
                        </NavItem>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-end items-center p-4 border-b">
                     <button className="font-semibold text-gray-600 hover:text-gray-800">Logout</button>
                </header>
                <main className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'var(--theme-bg)'}}>
                    <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card icon={<FiBox size={24} />} title="Products">
                            <p>Manage your company's products and inventory.</p>
                        </Card>
                        <Card icon={<FiUsers size={24} />} title="Team">
                            <p>This corresponds to 'Employees' in the sidebar.</p>
                        </Card>
                        <Card icon={<FiSettings size={24} />} title="Settings">
                            <p>Configure your account and application settings.</p>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default BrandedDashboard;