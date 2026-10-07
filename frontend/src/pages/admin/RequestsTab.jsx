import { useEffect, useState } from "react";
import { apiFetch } from "../../api";

const COLUMNS = ["ID запроса", "ID сотрудника", "Имя сотрудника", "Цех", "Статус"];

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
      const data = await apiFetch("/admin/requests");
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

  async function updateStatus(id, status) {
    try {
      await apiFetch(`/admin/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <h2 className="section-title">Список запросов на СИЗ</h2>

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      <div className="table-wrapper">
        <table className="sied-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col}>{col}</th>
              ))}
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="empty-row">Загрузка...</td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="empty-row">Нет данных</td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td>{req.employeeId}</td>
                  <td>{req.employeeName}</td>
                  <td>{req.shop}</td>
                  <td className={`status-${req.status}`}>
                    {STATUS_LABELS[req.status] ?? req.status}
                  </td>
                  <td style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    {req.status === "pending" && (
                      <>
                        <button
                          className="btn btn-outline"
                          style={{ minWidth: "auto", padding: "6px 10px" }}
                          onClick={() => updateStatus(req.id, "approved")}
                        >
                          Одобрить
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ minWidth: "auto", padding: "6px 10px" }}
                          onClick={() => updateStatus(req.id, "rejected")}
                        >
                          Отклонить
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default RequestsTab;
