import React, { useEffect } from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}) => {
  // Close on Escape key for convenience
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close" onClick={onCancel}>
          ×
        </button>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-buttons">
          <button className="modal-btn confirm-modal-btn" onClick={onConfirm}>
            Continue
          </button>
          <button className="modal-btn cancel-modal-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
