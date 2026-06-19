import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, children, className = "" }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-box ${className}`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}