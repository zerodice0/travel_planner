'use client';

import { useRef, useEffect, useState } from 'react';

export interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  icon?: string;
  buttonText?: string;
  onClose: () => void;
}

export function AlertDialog({ 
  isOpen, 
  title, 
  message, 
  icon = 'ℹ️', 
  buttonText = '확인',
  onClose 
}: AlertDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.showModal();
    } else if (!isOpen && dialogRef.current) {
      dialogRef.current.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  return (
    <dialog 
      ref={dialogRef}
      className="backdrop:bg-black backdrop:bg-opacity-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-0 p-0 max-w-sm w-full"
      onClick={(e) => {
        // backdrop 클릭 시 다이얼로그 닫기
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <span className="text-yellow-600 dark:text-yellow-400 text-2xl">{icon}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {message}
        </p>
        
        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </dialog>
  );
}

// Hook for managing AlertDialog state
export function useAlertDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    icon?: string;
    buttonText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    icon: 'ℹ️',
    buttonText: '확인'
  });

  const showAlert = (
    title: string, 
    message: string, 
    icon?: string, 
    buttonText?: string
  ) => {
    setDialog({
      isOpen: true,
      title,
      message,
      icon: icon || 'ℹ️',
      buttonText: buttonText || '확인'
    });
  };

  const hideAlert = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  return {
    dialog,
    showAlert,
    hideAlert
  };
}