import React from 'react';

function Header({ config, theme }) {
  const { title, subtitle } = config;

  return (
    <header 
        className="p-6 mb-8 rounded-lg shadow-md"
        style={{ 
            backgroundColor: theme.theme_secondary_color,
            borderColor: theme.theme_primary_color,
            borderWidth: '2px',
            borderStyle: 'solid',
        }}
    >
      <h1 
        className="text-4xl font-bold"
        style={{ color: theme.theme_text_color }}
      >
        {title}
      </h1>
      {subtitle && (
        <p 
            className="text-xl mt-1"
            style={{ color: theme.theme_text_color, opacity: 0.8 }}
        >
            {subtitle}
        </p>
      )}
    </header>
  );
}

export default Header;
