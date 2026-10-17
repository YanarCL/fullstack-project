import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import { useToast } from "../../components/Toast";
import { Alert, Chip, EmptyRow, PageHead, SkeletonRows, StatusBadge } from "../../components/ui";

const COLUMNS = ["ID запроса", "ID сотрудника", "Имя сотрудника", "Цех", "Комментарий", "Статус"];

function RequestsTab() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setError(null);
    try {
      setRequests(await apiFetch("/admin/requests"));
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
      await apiFetch(`/admin/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast.success(status === "approved" ? `Запрос №${id} одобрен` : `Запрос №${id} отклонён`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const count = (s) => requests.filter((r) => r.status === s).length;

  return (
    <>
      <PageHead title="Список запросов на СИЗ" subtitle="Запросы сотрудников на дополнительные средства защиты." />

      {error && <Alert tone="error">{error}</Alert>}

      <div className="table-card">
        <div className="table-meta">
          <Chip>Всего: {requests.length}</Chip>
          <Chip tone="warn">Ожидают: {count("pending")}</Chip>
          <Chip tone="success">Одобрено: {count("approved")}</Chip>
          <Chip tone="danger">Отклонено: {count("rejected")}</Chip>
        </div>
        <div className="table-wrapper table-scroll">
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
                <SkeletonRows cols={COLUMNS.length + 1} />
              ) : requests.length === 0 ? (
                <EmptyRow colSpan={COLUMNS.length + 1} title="Запросов пока нет" />
              ) : (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td className="cell-id">{req.id}</td>
                    <td>{req.employeeId}</td>
                    <td className="cell-strong">{req.employeeName}</td>
                    <td>{req.shop || "—"}</td>
                    <td className="cell-comment">{req.comment || "—"}</td>
                    <td><StatusBadge status={req.status} /></td>
                    <td>
                      {req.status === "pending" && (
                        <div className="row-actions">
                          <button className="btn btn-outline btn-sm" onClick={() => updateStatus(req.id, "approved")}>
                            Одобрить
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => updateStatus(req.id, "rejected")}>
                            Отклонить
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default RequestsTab;
