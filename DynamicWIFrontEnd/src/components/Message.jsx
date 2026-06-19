import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Message({ type = 'error', message = '' }) {
  const [visible, setVisible] = useState(!!message);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message || !visible) return null;

  const toastClass = type === 'success' ? 'bg-success text-white' : 'bg-danger text-white';
  const icon = type === 'success' ? '✓' : '✕';

  return (
    <div
      className="toast show position-fixed top-0 end-0 m-3 d-flex align-items-center"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{ minWidth: '250px', zIndex: 1055 }}
    >
      <div className={`${toastClass} d-flex align-items-center w-100 rounded`}>
        <div className="me-2 px-2">{icon}</div>
        <div className="toast-body flex-grow-1">{message}</div>
        <button
          type="button"
          className="btn-close btn-close-white me-2 m-auto"
          aria-label="Close"
          onClick={() => setVisible(false)}
        />
      </div>
    </div>
  );
}