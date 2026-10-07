import { useState } from "react";
import { apiFetch } from "../../api";

const COLUMNS = ["Название СИЗ", "Дата получения", "Срок сдачи"];

function AddSizTab() {
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null); // { id, name }
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  async function handleSearch() {
    setError(null);
    try {
      const results = await apiFetch(`/admin/employees/search?q=${encodeURIComponent(search)}`);
      setCandidates(results);
      if (results.length === 1) {
        await selectEmployee(results[0]);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function selectEmployee(emp) {
    setSelectedEmployee(emp);
    setCandidates([]);
    try {
      const siz = await apiFetch(`/admin/employees/${emp.id}/siz`);
      setItems(siz);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdd() {
    if (!selectedEmployee) {
      alert("Сначала найдите и выберите сотрудника.");
      return;
    }
    const equipmentIdRaw = window.prompt(
      "ID СИЗ из каталога (см. вкладку «СИЗ»):"
    );
    if (!equipmentIdRaw) return;
    const dueAt = window.prompt("Срок сдачи (ГГГГ-ММ-ДД), необязательно:", "");
    try {
      await apiFetch(`/admin/employees/${selectedEmployee.id}/siz`, {
        method: "POST",
        body: JSON.stringify({
          equipment_id: Number(equipmentIdRaw),
          due_at: dueAt || null,
        }),
      });
      selectEmployee(selectedEmployee);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(invId) {
    if (!window.confirm("Удалить эту выдачу СИЗ сотруднику?")) return;
    try {
      await apiFetch(`/admin/inventory/${invId}`, { method: "DELETE" });
      selectEmployee(selectedEmployee);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <>
      <div className="search-row">
        <input
          type="text"
          className="search-input"
          placeholder="Имя или логин сотрудника"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="btn btn-primary btn-search" onClick={handleSearch}>
          Найти
        </button>

        {selectedEmployee && (
          <div className="selected-badge">Выбран: {selectedEmployee.name}</div>
        )}
      </div>

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      {candidates.length > 1 && (
        <ul style={{ border: "1px solid #d9d9d9", borderRadius: 4, marginBottom: 16 }}>
          {candidates.map((c) => (
            <li
              key={c.id}
              style={{ padding: "8px 16px", cursor: "pointer" }}
              onClick={() => selectEmployee(c)}
            >
              {c.name} ({c.login})
            </li>
          ))}
        </ul>
      )}

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
            {items.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="empty-row">
                  Нет данных
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.receivedAt}</td>
                  <td>{item.dueAt}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ minWidth: "auto", padding: "6px 10px" }}
                      onClick={() => handleDelete(item.id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="sied-actions-center">
        <button className="btn btn-outline" onClick={handleAdd}>
          Добавить СИЗ сотруднику
        </button>
      </div>
    </>
  );
}

export default AddSizTab;
