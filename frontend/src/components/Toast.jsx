import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconCheckCircle, IconInfo, IconXCircle } from "./Icons";

const ToastContext = createContext(null);

const ICONS = {
  success: <IconCheckCircle size={20} />,
  error: <IconXCircle size={20} />,
  info: <IconInfo size={20} />,
};

/** Всплывающие уведомления вместо alert(). Использование: const toast = useToast(); toast.success("Готово"). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = ++counter.current;
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      setTimeout(() => remove(id), type === "error" ? 6500 : 4000);
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="toast-stack" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast toast-${t.type}`}
              role={t.type === "error" ? "alert" : "status"}
              onClick={() => remove(t.id)}
            >
              <span className="toast-icon">{ICONS[t.type]}</span>
              <span className="toast-text">{t.message}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast нужно вызывать внутри <ToastProvider>");
  return ctx;
}
