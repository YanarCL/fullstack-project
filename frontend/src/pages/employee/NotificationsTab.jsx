import { useEffect, useState } from "react";
import { apiFetch } from "../../api";

const COLUMNS = ["Дата уведомления", "Название СИЗ"];

function NotificationsTab() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/employee/notifications");
      setNotifications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleClear() {
    try {
      await apiFetch("/employee/notifications/clear", { method: "POST" });
      setNotifications([]);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <h2 className="section-title">
        Список уведомлений о просроченной сдаче СИЗ
      </h2>

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      <div className="table-wrapper">
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
              <tr>
                <td colSpan={COLUMNS.length} className="empty-row">Загрузка...</td>
              </tr>
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="empty-row">Нет данных</td>
              </tr>
            ) : (
              notifications.map((note) => (
                <tr key={note.id}>
                  <td className="notification-date">
                    {new Date(note.date).toLocaleString("ru-RU")}
                  </td>
                  <td>{note.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
