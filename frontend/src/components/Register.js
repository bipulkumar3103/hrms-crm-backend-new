import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// A custom hook for debouncing input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Helper component for displaying validation status
const ValidationIcon = ({ status }) => {
  if (status === 'checking') {
    return <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div></div>;
  }
  if (status === 'valid') {
    return <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-500">✓</div>;
  }
  if (status === 'invalid') {
    return <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-red-500">✗</div>;
  }
  return null;
};

function Register({ setView }) {
  const [formData, setFormData] = useState({ company_name: '', company_domain: '', email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [validation, setValidation] = useState({
    domain: { status: 'idle', message: '' }, // idle, checking, valid, invalid
    email: { status: 'idle', message: '' }
  });

  const debouncedDomain = useDebounce(formData.company_domain, 500);
  const debouncedEmail = useDebounce(formData.email, 500);

  useEffect(() => { setIsMounted(true); }, []);

  const checkAvailability = useCallback(async (field, value, a) => {
    if (value.trim() === '') {
      setValidation(prev => ({ ...prev, [field]: { status: 'idle', message: '' } }));
      return;
    }
    setValidation(prev => ({ ...prev, [field]: { status: 'checking', message: '' } }));
    try {
      const { data } = await axios.post('/api/v1/auth/check-availability', { field, value });
      if (data.available) {
        setValidation(prev => ({ ...prev, [field]: { status: 'valid', message: '' } }));
      } else {
        setValidation(prev => ({ ...prev, [field]: { status: 'invalid', message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken.` } }));
      }
    } catch (error) {
      setValidation(prev => ({ ...prev, [field]: { status: 'invalid', message: 'Error checking availability.' } }));
    }
  }, []);

  useEffect(() => {
    if (debouncedDomain) checkAvailability('domain', debouncedDomain);
  }, [debouncedDomain, checkAvailability]);

  useEffect(() => {
    if (debouncedEmail) checkAvailability('email', debouncedEmail);
  }, [debouncedEmail, checkAvailability]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const canSubmit = 
    formData.company_name &&
    formData.password &&
    validation.domain.status === 'valid' &&
    validation.email.status === 'valid';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
        setFormError('Please fix the errors before submitting.');
        return;
    }
    setIsLoading(true);
    setFormError('');
    try {
      await axios.post('/api/v1/auth/register', formData);
      alert('Registration successful! Please log in to continue.');
      setView('login');
    } catch (err) {
      setFormError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className={`w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 transition-all duration-700 ease-in-out transform ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Create Your Company Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <div className="relative">
                <input name="company_name" type="text" placeholder="Company Name" required value={formData.company_name} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <div className="relative">
                <input name="company_domain" type="text" placeholder="Company Domain (e.g., acme.com)" required value={formData.company_domain} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <ValidationIcon status={validation.domain.status} />
            </div>
            {validation.domain.message && <p className="text-sm text-red-500 mt-1">{validation.domain.message}</p>}
          </div>

          <hr className="my-2"/>
          
          <div>
            <div className="relative">
                <input name="email" type="email" placeholder="Your Admin Email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <ValidationIcon status={validation.email.status} />
            </div>
            {validation.email.message && <p className="text-sm text-red-500 mt-1">{validation.email.message}</p>}
          </div>
          
          <div>
            <div className="relative">
                <input name="password" type="password" placeholder="Password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          
          {formError && <p className="text-sm text-red-600 text-center bg-red-100 p-2 rounded-md">{formError}</p>}

          <button type="submit" disabled={!canSubmit || isLoading} className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300">
            {isLoading ? 'Creating Account...' : 'Create Company Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account? 
          <button onClick={() => setView('login')} className="font-medium text-indigo-600 hover:text-indigo-500">
             Sign In
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
