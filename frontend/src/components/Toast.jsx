import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((msg, sub) => {
    setToast({ msg, sub });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3400);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div style={{ position: 'fixed', left: '50%', bottom: 30, zIndex: 90, transform: 'translateX(-50%)', animation: 'toastIn .28s cubic-bezier(.2,.8,.2,1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, background: 'var(--primary)', color: '#fff', padding: '13px 20px 13px 16px', borderRadius: 12, boxShadow: '0 12px 30px -10px rgba(0,0,0,.35)', maxWidth: 380 }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,.16)', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <div>
              <div style={{ font: '600 14px var(--ui)' }}>{toast.msg}</div>
              {toast.sub && <div style={{ font: '400 13px var(--ui)', opacity: 0.78, marginTop: 1 }}>{toast.sub}</div>}
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
