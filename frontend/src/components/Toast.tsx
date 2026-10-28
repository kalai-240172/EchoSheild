import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

const TYPE_STYLES = {
  success: { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', color: '#22c55e', icon: '✓' },
  error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#ef4444', icon: '✗' },
  warning: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#f59e0b', icon: '⚠' },
  info: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', color: '#3b82f6', icon: 'ℹ' },
};

export default function Toast({ message, type = 'info', onClose, duration = 4000 }: ToastProps) {
  const s = TYPE_STYLES[type];

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="toast flex items-start gap-3"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: '#e2e8f0' }}
    >
      <span className="text-lg font-bold flex-shrink-0" style={{ color: s.color }}>{s.icon}</span>
      <span className="text-sm leading-relaxed">{message}</span>
      <button className="ml-auto flex-shrink-0 text-slate-400 hover:text-white" onClick={onClose}>×</button>
    </div>
  );
}

// Toast container hook
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastProps['type'] }>>([]);
  const idRef = React.useRef(0);

  const showToast = (message: string, type: ToastProps['type'] = 'info') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" style={{ maxWidth: '380px' }}>
      {toasts.map(t => (
        <div key={t.id}>
          <Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}
