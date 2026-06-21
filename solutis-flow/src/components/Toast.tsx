/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const toast = {
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
  };

  const getToastDetails = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          iconColor: 'text-emerald-600',
          icon: <CheckCircle2 className="w-5 h-5" />,
          title: 'Sucesso',
        };
      case 'error':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          iconColor: 'text-rose-600',
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Erro',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-900',
          iconColor: 'text-blue-600',
          icon: <Info className="w-5 h-5" />,
          title: 'Notificação',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast container floating at the top-right corner */}
      <div 
        id="toast-container" 
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none p-4"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const details = getToastDetails(t.type);
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: 50 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`w-full ${details.bg} border rounded-2xl shadow-xl flex items-start gap-3 p-4 pointer-events-auto overflow-hidden relative select-none`}
              >
                {/* Decorative border line */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'}`} />

                <div className={`${details.iconColor} shrink-0 mt-0.5 ml-1`}>
                  {details.icon}
                </div>

                <div className="flex-1 min-w-0 pr-4 pl-1">
                  <h4 className="text-xs font-black tracking-tight leading-none uppercase mb-1.5 text-slate-800">
                    {details.title}
                  </h4>
                  <p className="text-xs font-medium text-slate-700 leading-normal">
                    {t.message}
                  </p>
                </div>

                <button
                  onClick={() => removeToast(t.id)}
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-0.5 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
