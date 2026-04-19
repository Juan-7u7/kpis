import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  title, 
  message, 
  confirmText = 'Eliminar', 
  cancelText = 'Cancelar', 
  onConfirm, 
  onCancel 
}) => {
  return (
    <div className="modal-overlay" style={{ zIndex: 10000 }}>
      <div className="confirm-modal-card">
        <button className="confirm-close-btn" onClick={onCancel}>
          <X size={18} />
        </button>
        
        <div className="confirm-icon-container">
          <div className="confirm-icon-bg">
            <AlertTriangle size={28} className="confirm-icon" />
          </div>
        </div>
        
        <h3 className="confirm-title">{title}</h3>
        <div className="confirm-message">{message}</div>
        
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="btn-danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
