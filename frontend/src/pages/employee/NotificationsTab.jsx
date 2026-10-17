import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import { useToast } from "../../components/Toast";
import { Alert, Chip, EmptyRow, PageHead, SkeletonRows } from "../../components/ui";
import { formatDateTime } from "../../utils";

const COLUMNS = ["Дата уведомления", "Название СИЗ"];

function NotificationsTab() {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/employee/notifications")
      .then(setNotifications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleClear() {
    if (notifications.length === 0) {
      toast.info("Уведомлений нет.");
      return;
    }
    try {
      await apiFetch("/employee/notifications/clear", { method: "POST" });
      setNotifications([]);
      toast.success("Уведомления очищены");
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <PageHead title="Список уведомлений о просроченной сдаче СИЗ" subtitle="Сдайте перечисленные СИЗ как можно скорее." />

      {error && <Alert tone="error">{error}</Alert>}

      <div className="table-card">
        <div className="table-meta">
          <Chip tone={notifications.length ? "danger" : "success"}>Уведомлений: {notifications.length}</Chip>
        </div>
        <div className="table-wrapper table-scroll">
          <table className="sied-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={COLUMNS.length} />
              ) : notifications.length === 0 ? (
                <EmptyRow colSpan={COLUMNS.length} title="Уведомлений нет" text="Просроченных СИЗ за вами не числится" />
              ) : (
                notifications.map((note) => (
                  <tr key={note.id}>
                    <td className="notification-date">{formatDateTime(note.date)}</td>
                    <td className="cell-strong">{note.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sied-actions-center">
        <button className="btn btn-outline" onClick={handleClear}>
          Очистить уведомления
        </button>
      </div>
    </>
  );
}

export default NotificationsTab;
