import React, { useState } from 'react';
import axios from 'axios';
import ColorChip from './ColorChip';

const getBorderStyle = (style, theme) => {
    if (!style?.border_color_variant) return {};
    return {
        borderColor: theme[`theme_${style.border_color_variant}_color`],
        borderWidth: '2px',
        borderStyle: 'solid',
    }
}

const renderElement = (element, theme, token) => {
    const valueStyle = {
        color: theme.theme_text_color
    };

    switch (element.format) {
        case 'link':
            return <a href={element.value} style={{color: theme.theme_primary_color}} className="hover:underline">{element.value}</a>;
        case 'color_chip':
            return <ColorChip color={element.value} />;
        case 'logo':
            return <LogoUpload value={element.value} token={token} />;
        case 'text':
        default:
            return <span style={valueStyle}>{element.value}</span>;
    }
}

const LogoUpload = ({ value, token }) => {
    const [logo, setLogo] = useState(value);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file to upload.');
            return;
        }

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('logo', selectedFile);

        try {
            const res = await axios.post('/api/v1/company/logo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                }
            });
            setLogo(res.data.data.logo_url);
            setSelectedFile(null);
        } catch (err) {
            console.error(err);
            setError('Failed to upload logo. Please ensure it is a valid image file.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-end">
            <div className="flex items-center space-x-4">
                {logo && <img src={logo} alt="Company Logo" className="h-16 w-16 rounded-lg object-cover"/>}
                <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm"/>
            </div>
            {selectedFile &&
                <button 
                    onClick={handleUpload} 
                    disabled={uploading} 
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {uploading ? 'Uploading...' : 'Upload'}
                </button>
            }
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
}


function Card({ config, theme, token }) {
  const { title, elements, style } = config;

  return (
    <div 
        className={`bg-white rounded-lg shadow-${style?.shadow || 'none'} p-6 mb-6`}
        style={getBorderStyle(style, theme)}
    >
      <h2 
        className="text-2xl font-bold mb-4 border-b pb-2"
        style={{ 
            color: theme.theme_text_color, 
            borderColor: theme.theme_secondary_color 
        }}
      >
          {title}
      </h2>
      <div className="space-y-3">
        {elements.map((el, index) => (
          <div key={index} className="flex justify-between items-center">
            <p style={{color: theme.theme_text_color, opacity: 0.9}} className="font-semibold">{el.label}</p>
            {renderElement(el, theme, token)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Card;
