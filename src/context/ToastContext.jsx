import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaCircleCheck, FaCircleInfo, FaTriangleExclamation, FaXmark } from 'react-icons/fa6';

const ToastContext = createContext();

const iconMap = {
  success: <FaCircleCheck className="text-emerald-400" />,
  error: <FaTriangleExclamation className="text-red-400" />,
  info: <FaCircleInfo className="text-sky-400" />,
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[200] space-y-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-[min(90vw,360px)] rounded-xl border border-white/20 bg-slate-900/90 p-3 text-white shadow-xl backdrop-blur"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">{iconMap[toast.type] || iconMap.info}</span>
                <p className="flex-1 text-sm leading-5">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-white/60 transition hover:text-white"
                  aria-label="Dismiss toast"
                >
                  <FaXmark />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
