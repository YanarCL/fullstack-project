import { useEffect, useState } from "react";
import { apiFetch } from "../../api";

const COLUMNS = [
  "Имя сотрудника",
  "Название СИЗ",
  "Срок сдачи",
  "На сколько дней просрочено",
];

function ControlTab() {
  const [overdueItems, setOverdueItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/admin/control/overdue");
      setOverdueItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleNotifyAll() {
    try {
      const res = await apiFetch("/admin/control/notify-all", { method: "POST" });
      alert(`Уведомления отправлены: ${res.notified}`);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

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
              <tr>
                <td colSpan={COLUMNS.length} className="empty-row">Загрузка...</td>
              </tr>
            ) : overdueItems.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="empty-row">Нет данных</td>
              </tr>
            ) : (
              overdueItems.map((row, index) => (
                <tr key={index}>
                  <td>{row.employeeName}</td>
                  <td>{row.sizName}</td>
                  <td>{row.dueAt}</td>
                  <td className="overdue-days">{row.overdueDays}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="sied-actions-center">
        <button className="btn btn-danger" onClick={handleNotifyAll}>
          Уведомить всех
        </button>
      </div>
    </>
  );
}

export default ControlTab;
