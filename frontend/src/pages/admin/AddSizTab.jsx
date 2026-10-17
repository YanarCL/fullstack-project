import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";
import {
  Alert,
  Badge,
  Chip,
  EmptyRow,
  PageHead,
  SkeletonRows,
} from "../../components/ui";
import { IconSearch, IconTrash, IconUserPlus } from "../../components/Icons";
import {
  addDaysISO,
  formatDate,
  initials,
  isOverdue,
  todayISO,
} from "../../utils";

const COLUMNS = [
  "Название СИЗ",
  "Тип",
  "Статус",
  "Дата получения",
  "Срок сдачи",
];

function AssignModal({ employee, onClose, onAssigned }) {
  const [catalog, setCatalog] = useState(null);
  const [equipmentId, setEquipmentId] = useState("");
  const [issuedAt, setIssuedAt] = useState(todayISO());
  const [dueAt, setDueAt] = useState("");
  const [dueTouched, setDueTouched] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch("/admin/equipment")
      .then(setCatalog)
      .catch((err) => {
        setCatalog([]);
        setError(err.message);
      });
  }, []);

  const chosen = catalog?.find((e) => String(e.id) === String(equipmentId));

  // Срок сдачи подставляется по сроку эксплуатации, пока его не меняли вручную
  function suggestDue(eq, issued) {
    if (eq?.lifespanWeeks) setDueAt(addDaysISO(issued, eq.lifespanWeeks * 7));
  }

  function onEquipmentChange(id) {
    setError(null);
    setEquipmentId(id);
    if (!dueTouched)
      suggestDue(
        catalog.find((e) => String(e.id) === id),
        issuedAt,
      );
  }

  function onIssuedChange(value) {
    setIssuedAt(value);
    if (!dueTouched) suggestDue(chosen, value);
  }

  async function submit() {
    setError(null);
    if (!equipmentId) return setError("Выберите СИЗ из каталога");
    if (!issuedAt) return setError("Укажите дату получения");
    if (dueAt && dueAt < issuedAt)
      return setError("Срок сдачи не может быть раньше даты получения");

    setSubmitting(true);
    try {
      const created = await apiFetch(`/admin/employees/${employee.id}/siz`, {
        method: "POST",
        body: JSON.stringify({
          equipment_id: Number(equipmentId),
          issued_at: issuedAt,
          due_at: dueAt || null,
        }),
      });
      onAssigned(created);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Выдать СИЗ сотруднику"
      subtitle={`Сотрудник: ${employee.name}`}
      icon={<IconUserPlus size={22} />}
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Добавить"
      submitting={submitting}
      error={error}
    >
      {catalog && catalog.length === 0 && !error && (
        <Alert tone="warn">
          Каталог пуст — сначала добавьте СИЗ на вкладке «СИЗ».
        </Alert>
      )}

      <div className="field">
        <label className="field-label" htmlFor="as-eq">
          СИЗ из каталога <span className="req">*</span>
        </label>
        <select
          id="as-eq"
          className="input"
          value={equipmentId}
          onChange={(e) => onEquipmentChange(e.target.value)}
          disabled={!catalog}
        >
          <option value="">
            {catalog ? "Выберите СИЗ…" : "Загрузка каталога…"}
          </option>
          {(catalog || []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
              {e.type ? ` · ${e.type}` : ""}
            </option>
          ))}
        </select>
        {chosen?.lifespanWeeks && (
          <div className="field-hint">
            Срок эксплуатации: {chosen.lifespanWeeks} нед.
          </div>
        )}
      </div>

      <div className="field-grid">
        <div className="field">
          <label className="field-label" htmlFor="as-issued">
            Дата получения <span className="req">*</span>
          </label>
          <input
            id="as-issued"
            className="input"
            type="date"
            value={issuedAt}
            onChange={(e) => onIssuedChange(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="as-due">
            Срок сдачи
          </label>
          <input
            id="as-due"
            className="input"
            type="date"
            min={issuedAt || undefined}
            value={dueAt}
            onChange={(e) => {
              setDueAt(e.target.value);
              setDueTouched(true);
            }}
          />
        </div>
      </div>
      {chosen?.lifespanWeeks && !dueTouched && dueAt && (
        <div className="field-hint hint-gap">
          Срок сдачи подставлен по сроку эксплуатации — его можно изменить.
        </div>
      )}
    </Modal>
  );
}

function AddSizTab() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null); // { id, name, login }
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  async function loadItems(empId) {
    setLoadingItems(true);
    try {
      setItems(await apiFetch(`/admin/employees/${empId}/siz`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingItems(false);
    }
  }

  async function selectEmployee(emp) {
    setSelectedEmployee(emp);
    setCandidates([]);
    setError(null);
    await loadItems(emp.id);
  }

  async function handleSearch() {
    setError(null);
    try {
      const results = await apiFetch(
        `/admin/employees/search?q=${encodeURIComponent(search)}`,
      );
      if (results.length === 0) {
        setCandidates([]);
        toast.info("Сотрудники не найдены");
      } else if (results.length === 1) {
        await selectEmployee(results[0]);
      } else {
        setCandidates(results);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function handleAdd() {
    if (!selectedEmployee) {
      toast.info("Сначала найдите и выберите сотрудника.");
      return;
    }
    setAddOpen(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/admin/inventory/${toDelete.id}`, { method: "DELETE" });
      const name = toDelete.name;
      setToDelete(null);
      await loadItems(selectedEmployee.id);
      toast.success(`Выдача «${name}» удалена`);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const statusTone = (s) =>
    s === "Сдано" ? "success" : s === "Выдано" ? "info" : "neutral";
  const overdueCount = items.filter((i) =>
    isOverdue(i.dueAt, i.status === "Сдано"),
  ).length;

  return (
    <>
      <PageHead
        title="Выдача СИЗ сотруднику"
        subtitle="Найдите сотрудника, чтобы увидеть выданные ему СИЗ и оформить новую выдачу."
      />

      <div className="search-row">
        <div className="search-field">
          <IconSearch size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Имя или логин сотрудника"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button className="btn btn-primary btn-search" onClick={handleSearch}>
          Найти
        </button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {candidates.length > 1 && (
        <ul className="candidate-list">
          <li className="candidate-head">
            Найдено сотрудников: {candidates.length} — выберите нужного
          </li>
          {candidates.map((c) => (
            <li
              key={c.id}
              className="candidate"
              onClick={() => selectEmployee(c)}
            >
              <span className="avatar avatar-sm">{initials(c.name)}</span>
              <span className="candidate-name">{c.name}</span>
              <span className="candidate-login">{c.login}</span>
            </li>
          ))}
        </ul>
      )}

      {selectedEmployee && (
        <div className="employee-card">
          <span className="avatar avatar-lg">
            {initials(selectedEmployee.name)}
          </span>
          <div className="employee-main">
            <div className="employee-name">{selectedEmployee.name}</div>
            <div className="employee-login">
              Логин: {selectedEmployee.login}
            </div>
          </div>
          <div className="employee-stats">
            <Chip>Выдано позиций: {items.length}</Chip>
            {overdueCount > 0 && (
              <Chip tone="danger">Просрочено: {overdueCount}</Chip>
            )}
          </div>
        </div>
      )}

      <div className="table-card">
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
              {loadingItems ? (
                <SkeletonRows cols={COLUMNS.length + 1} rows={3} />
              ) : items.length === 0 ? (
                <EmptyRow
                  colSpan={COLUMNS.length + 1}
                  title={
                    selectedEmployee
                      ? "У сотрудника пока нет СИЗ"
                      : "Сотрудник не выбран"
                  }
                  text={
                    selectedEmployee
                      ? "Нажмите «Добавить СИЗ сотруднику», чтобы оформить выдачу"
                      : "Введите имя или логин и нажмите «Найти»"
                  }
                />
              ) : (
                items.map((item) => {
                  const returned = item.status === "Сдано";
                  const late = isOverdue(item.dueAt, returned);
                  return (
                    <tr key={item.id}>
                      <td className="cell-strong">{item.name}</td>
                      <td>{item.type || "—"}</td>
                      <td>
                        {item.status ? (
                          <Badge tone={statusTone(item.status)}>
                            {item.status}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{formatDate(item.receivedAt)}</td>
                      <td className={late ? "cell-late" : ""}>
                        {formatDate(item.dueAt)}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setDeleteError(null);
                            setToDelete(item);
                          }}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sied-actions-center">
        <button className="btn btn-outline" onClick={handleAdd}>
          Добавить СИЗ сотруднику
        </button>
      </div>

      {addOpen && selectedEmployee && (
        <AssignModal
          employee={selectedEmployee}
          onClose={() => setAddOpen(false)}
          onAssigned={async (created) => {
            setAddOpen(false);
            await loadItems(selectedEmployee.id);
            toast.success(
              `«${created.name}» выдано сотруднику ${selectedEmployee.name}`,
            );
          }}
        />
      )}

      {toDelete && (
        <Modal
          tone="danger"
          size="sm"
          icon={<IconTrash size={22} />}
          title="Удалить выдачу СИЗ?"
          subtitle={`«${toDelete.name}» будет удалено у сотрудника ${selectedEmployee?.name}. Связанные уведомления тоже удалятся.`}
          submitLabel="Удалить"
          submitting={deleting}
          error={deleteError}
          onClose={() => setToDelete(null)}
          onSubmit={confirmDelete}
        />
      )}
    </>
  );
}

export default AddSizTab;
