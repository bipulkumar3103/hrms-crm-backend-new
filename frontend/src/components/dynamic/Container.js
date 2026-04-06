import React from 'react';

const Container = ({ config, children }) => {
  const {
    width = '100%',
    height = 'auto',
    padding = '0px',
    margin = '0px',
    backgroundColor = 'transparent',
    borderRadius = '0px',
    borderWidth = '0px',
    borderStyle = 'solid',
    borderColor = 'transparent',
    flexDirection = 'column',
    alignItems = 'stretch',
    justifyContent = 'flex-start',
    gap = '0px',
  } = config || {};

  const style = {
    width,
    height,
    padding,
    margin,
    backgroundColor,
    borderRadius,
    borderWidth,
    borderStyle,
    borderColor,
    display: 'flex',
    flexDirection,
    alignItems,
    justifyContent,
    gap,
    boxSizing: 'border-box'
  };

  return (
    <div style={style}>
      {children}
    </div>
  );
};

export default Container;
