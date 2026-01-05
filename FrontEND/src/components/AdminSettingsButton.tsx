import React, { useState } from 'react';
import { AdminPanelModal } from './AdminPanelModal';

export const AdminSettingsButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#0f3460',
          border: '2px solid #4ecca3',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#4ecca3';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#0f3460';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title="Admin Settings (Password Protected)"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: '#fff' }}
        >
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m-6-6h6m6 0h-6"></path>
          <path d="M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24M19.78 19.78l-4.24-4.24M7.46 7.46L3.22 3.22"></path>
        </svg>
      </button>

      <AdminPanelModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
