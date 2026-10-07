import { useEffect, useState } from "react";
import { apiFetch } from "../../api";

const COLUMNS = ["ID запроса", "Дата запроса", "Статус"];

const STATUS_LABELS = {
  pending: "Ожидает",
  approved: "Одобрено",
  rejected: "Отклонено",
};

function RequestsTab() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/employee/requests");
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleNewRequest() {
    const comment = window.prompt("Комментарий к запросу (необязательно):", "");
    if (comment === null) return; // отмена
    try {
      await apiFetch("/employee/requests", {
        method: "POST",
        body: JSON.stringify({ comment: comment || null }),
      });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <h2 className="section-title">Список исходящих запросов на СИЗ</h2>

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
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="empty-row">Нет данных</td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td>{new Date(req.date).toLocaleString("ru-RU")}</td>
                  <td className={`status-${req.status}`}>
                    {STATUS_LABELS[req.status] ?? req.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="sied-actions-center">
        <button className="btn btn-primary" onClick={handleNewRequest}>
          Запросить дополнительные СИЗ
        </button>
      </div>
    </>
  );
}

export default RequestsTab;
