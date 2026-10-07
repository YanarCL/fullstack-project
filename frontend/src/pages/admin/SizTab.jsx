import { useEffect, useState } from "react";
import { apiFetch } from "../../api";

const COLUMNS = [
  "ID СИЗ",
  "Название СИЗ",
  "Тип",
  "Срок эксплуатации (в рабочих неделях)",
];

function SizTab() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load(searchValue = "") {
    setLoading(true);
    setError(null);
    try {
      const qs = searchValue ? `?search=${encodeURIComponent(searchValue)}` : "";
      const data = await apiFetch(`/admin/equipment${qs}`);
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

  function handleSearch() {
    load(search);
  }

  async function handleAdd() {
    const name = window.prompt("Название нового СИЗ:");
    if (!name) return;
    const lifespanRaw = window.prompt("Срок эксплуатации, недель (можно оставить пустым):", "");
    try {
      await apiFetch("/admin/equipment", {
        method: "POST",
        body: JSON.stringify({
          name,
          type_id: null,
          lifespan_weeks: lifespanRaw ? Number(lifespanRaw) : null,
        }),
      });
      load(search);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleEdit() {
    if (!selectedId) {
      alert("Сначала выберите строку (кликните по ней).");
      return;
    }
    const current = items.find((i) => i.id === selectedId);
    const name = window.prompt("Название СИЗ:", current?.name ?? "");
    if (!name) return;
    const lifespanRaw = window.prompt(
      "Срок эксплуатации, недель:",
      current?.lifespanWeeks ?? ""
    );
    try {
      await apiFetch(`/admin/equipment/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          type_id: null,
          lifespan_weeks: lifespanRaw ? Number(lifespanRaw) : null,
        }),
      });
      load(search);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete() {
    if (!selectedId) {
      alert("Сначала выберите строку (кликните по ней).");
      return;
    }
    if (!window.confirm("Удалить выбранный СИЗ из каталога?")) return;
    try {
      await apiFetch(`/admin/equipment/${selectedId}`, { method: "DELETE" });
      setSelectedId(null);
      load(search);
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="btn btn-primary btn-search" onClick={handleSearch}>
          Найти
        </button>
      </div>

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
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="empty-row">Нет данных</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    cursor: "pointer",
                    background: selectedId === item.id ? "#e8ecf3" : undefined,
                  }}
                >
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.type}</td>
                  <td>{item.lifespanWeeks}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="sied-actions-three">
        <button className="btn btn-outline" onClick={handleAdd}>Добавить</button>
        <button className="btn btn-outline" onClick={handleEdit}>Редактировать</button>
        <button className="btn btn-outline" onClick={handleDelete}>Удалить</button>
      </div>
    </>
  );
}

export default SizTab;
