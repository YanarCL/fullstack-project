import { IconAlert, IconInbox, IconInfo, IconXCircle } from "./Icons";

export const STATUS_LABELS = {
  pending: "Ожидает",
  approved: "Одобрено",
  rejected: "Отклонено",
};

const STATUS_TONES = {
  pending: "warn",
  approved: "success",
  rejected: "danger",
};

/** Заголовок раздела: название + подзаголовок. */
export function PageHead({ title, subtitle }) {
  return (
    <div className="page-head">
      <h2 className="page-title">{title}</h2>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
  );
}

/** Небольшая «таблетка» со счётчиком/пометкой. */
export function Chip({ tone = "neutral", children }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

/** Цветной бейдж статуса. */
export function Badge({ tone = "neutral", children }) {
  return (
    <span className={`badge badge-${tone}`}>
      <i className="badge-dot" />
      {children}
    </span>
  );
}

/** Бейдж статуса запроса (pending / approved / rejected). */
export function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONES[status] ?? "neutral"}>{STATUS_LABELS[status] ?? status}</Badge>;
}

/** Блок сообщения (ошибка / подсказка). */
export function Alert({ tone = "error", children }) {
  const icon = tone === "error" ? <IconXCircle size={18} /> : tone === "warn" ? <IconAlert size={18} /> : <IconInfo size={18} />;
  return (
    <div className={`alert alert-${tone}`} role={tone === "error" ? "alert" : undefined}>
      <span className="alert-icon">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

/** Строки-«скелетоны» на время загрузки. */
export function SkeletonRows({ cols, rows = 5 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} className="skeleton-row">
      {Array.from({ length: cols }).map((__, c) => (
        <td key={c}>
          <span className="skeleton" style={{ width: `${55 + ((r * 7 + c * 13) % 35)}%` }} />
        </td>
      ))}
    </tr>
  ));
}

/** Пустое состояние таблицы. */
export function EmptyRow({ colSpan, title = "Нет данных", text }) {
  return (
    <tr className="empty-state-row">
      <td colSpan={colSpan}>
        <div className="empty-state">
          <span className="empty-icon">
            <IconInbox size={30} />
          </span>
          <div className="empty-title">{title}</div>
          {text && <div className="empty-text">{text}</div>}
        </div>
      </td>
    </tr>
  );
}
