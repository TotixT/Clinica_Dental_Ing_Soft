import React from 'react';
import { Loader2 } from 'lucide-react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', message = 'Cargando...' }) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${sizeClasses[size]}`}>
        <Loader2 className="spinner-icon" />
        {message && <p className="spinner-message">{message}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;