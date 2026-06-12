import React from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import SchemaEngine from './DynamicUIRenderer/SchemaEngine';
import { useAuth } from '../context/AuthContext';

/**
 * DynamicPage is a wrapper around SchemaEngine that automatically 
 * extracts the current route and passes it to the renderer.
 * This allows admins to create arbitrary pages in the Craft Builder.
 */
const DynamicPage = () => {
  const location = useLocation();
  const { token } = useAuth();
  const { setBreadcrumbContext } = useOutletContext();
  
  // Strip /dashboard prefix if we are fetching from the builder's perspective
  // This ensures that a route saved as "/employee/test" matches "/dashboard/employee/test"
  const currentRoute = location.pathname.startsWith('/dashboard') 
    ? location.pathname.replace('/dashboard', '') || '/' 
    : location.pathname;

  // We also keep the full path as a fallback if the stripped one doesn't exist
  // SchemaEngine will handle the fetch.

  // Sync breadcrumbs if needed (optional)
  React.useEffect(() => {
    if (setBreadcrumbContext) {
      const pageName = currentRoute.split('/').pop();
      setBreadcrumbContext(pageName.charAt(0).toUpperCase() + pageName.slice(1));
    }
  }, [currentRoute, setBreadcrumbContext]);

  return (
    <div className="animate-in fade-in duration-500">
      <SchemaEngine 
        route={currentRoute} 
        dataSource="/ui/context" // Standard UI context for data binding ({{full_name}}, etc.)
        token={token}
      />
    </div>
  );
};

export default DynamicPage;
