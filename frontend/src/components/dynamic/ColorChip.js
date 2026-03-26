import React from 'react';

function ColorChip({ color }) {
  return (
    <div className="flex items-center">
      <div 
        className="w-6 h-6 rounded-full border-2 border-gray-300 mr-2"
        style={{ backgroundColor: color }}
      ></div>
      <span className="font-mono text-sm">{color}</span>
    </div>
  );
}

export default ColorChip;
