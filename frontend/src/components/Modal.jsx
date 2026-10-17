import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Alert } from "./ui";

/**
 * Универсальное модальное окно-форма.
 *  - закрывается по Esc и по клику на затемнённый фон (пока не идёт сохранение);
 *  - Enter внутри поля отправляет форму;
 *  - tone="danger" — красная кнопка подтверждения (для удаления).
 */
function Modal({
  title,
  subtitle,
  icon,
  onClose,
  onSubmit,
  submitLabel = "Сохранить",
  cancelLabel = "Отмена",
  submitting = false,
  tone = "primary",
  size = "md",
  error = null,
  children,
}) {
  const dialogRef = useRef(null);

  // Esc + блокировка прокрутки страницы под окном
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, submitting]);

  // фокус на первое поле при открытии
  useEffect(() => {
    const el = dialogRef.current?.querySelector("input:not([type=hidden]), select, textarea");
    (el || dialogRef.current)?.focus();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!submitting) onSubmit?.();
  }

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <form
        ref={dialogRef}
        tabIndex={-1}
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="modal-header">
          {icon && <div className={`modal-icon modal-icon-${tone}`}>{icon}</div>}
          <div>
            <h3 className="modal-title">{title}</h3>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
        </div>

        <div className="modal-body">
          {error && <Alert tone="error">{error}</Alert>}
          {children}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            {cancelLabel}
          </button>
          <button
            type="submit"
            className={`btn ${tone === "danger" ? "btn-danger" : "btn-primary"}`}
            disabled={submitting}
          >
            {submitting ? "Подождите…" : submitLabel}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

export default Modal;
