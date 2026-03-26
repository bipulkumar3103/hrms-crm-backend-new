import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

/**
 * OnboardingGoogle Component
 * handles company creation for users who authenticated via Google
 * but are not yet associated with a tenant.
 */
const OnboardingGoogle = ({ api, saveToken }) => {
    const [companyName, setCompanyName] = useState('');
    const [companyDomain, setCompanyDomain] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Attempt to suggest a domain based on the user's email from the JWT
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.sub && decoded.sub.includes('@')) {
                    const emailDomain = decoded.sub.split('@')[1];
                    // Basic filter to avoid common public providers as suggestions
                    const commonProviders = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'hotmail.com'];
                    if (!commonProviders.includes(emailDomain.toLowerCase())) {
                        setCompanyDomain(emailDomain);
                    }
                }
            } catch (e) {
                console.error("Error decoding token for domain suggestion", e);
            }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!companyName || !companyDomain) {
            setError('Please fill in both the company name and domain.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post('/onboarding/google/create-company', {
                company_name: companyName,
                company_domain: companyDomain
            });

            if (response.data && response.data.access_token) {
                // Save the new token which now includes the company_id and superadmin role
                saveToken(response.data.access_token);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create company. Please try again.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl overflow-hidden p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome!</h2>
                    <p className="text-sm text-gray-600">
                        You've successfully signed in with Google. To get started, we need to set up your organization's workspace.
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                            Company Name
                        </label>
                        <input
                            id="companyName"
                            type="text"
                            required
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                            placeholder="e.g. Acme Corp"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="companyDomain" className="block text-sm font-medium text-gray-700">
                            Company Domain
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                id="companyDomain"
                                type="text"
                                required
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                placeholder="example.com"
                                value={companyDomain}
                                onChange={(e) => setCompanyDomain(e.target.value)}
                            />
                        </div>
                        <p className="mt-2 text-xs text-gray-500 italic">
                            This domain will be used to automatically link future team members.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 disabled:bg-indigo-400"
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Workspace...
                            </span>
                        ) : (
                            'Create My Company'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default OnboardingGoogle;