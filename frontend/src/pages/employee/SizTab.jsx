import { useEffect, useState } from "react";
import { apiFetch } from "../../api";

const COLUMNS = [
  "ID СИЗ",
  "Название СИЗ",
  "Тип",
  "Дата получения",
  "Срок сдачи",
  "Сдано",
];

function SizTab() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/employee/siz");
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleReturn(id) {
    if (!window.confirm("Отметить этот СИЗ как сданный?")) return;
    try {
      await apiFetch(`/employee/siz/${id}/return`, { method: "POST" });
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
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
                <td colSpan={COLUMNS.length + 1} className="empty-row">
                  Загрузка...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="empty-row">
                  Нет данных
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>{item.receivedAt}</td>
                  <td>{item.dueAt}</td>
                  <td className={item.returned ? "status-yes" : "status-no"}>
                    {item.returned ? "Да" : "Нет"}
                  </td>
                  <td>
                    {!item.returned && (
                      <button
                        className="btn btn-outline"
                        style={{ minWidth: "auto", padding: "6px 12px" }}
                        onClick={() => handleReturn(item.id)}
                      >
                        Сдать
                      </button>
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

export default SizTab;
