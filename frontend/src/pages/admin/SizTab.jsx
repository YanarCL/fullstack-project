import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../api";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";
import {
  Alert,
  Chip,
  EmptyRow,
  PageHead,
  SkeletonRows,
} from "../../components/ui";
import {
  IconBox,
  IconEdit,
  IconSearch,
  IconTrash,
} from "../../components/Icons";
import { plural } from "../../utils";

const COLUMNS = [
  "ID СИЗ",
  "Название СИЗ",
  "Тип",
  "Срок эксплуатации (в рабочих неделях)",
];
const NEW_TYPE = "__new__";

function AddEquipmentModal({ types, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [newType, setNewType] = useState("");
  const [lifespan, setLifespan] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    const cleanName = name.trim();
    if (!cleanName) return setError("Укажите название СИЗ");
    if (typeId === NEW_TYPE && !newType.trim())
      return setError("Введите название нового типа");

    let weeks = null;
    if (lifespan.trim() !== "") {
      weeks = Number(lifespan);
      if (!Number.isInteger(weeks) || weeks <= 0) {
        return setError("Срок эксплуатации — целое число недель больше нуля");
      }
    }

    setSubmitting(true);
    try {
      const created = await apiFetch("/admin/equipment", {
        method: "POST",
        body: JSON.stringify({
          name: cleanName,
          type_id: typeId && typeId !== NEW_TYPE ? Number(typeId) : null,
          type_name: typeId === NEW_TYPE ? newType.trim() : null,
          lifespan_weeks: weeks,
        }),
      });
      onCreated(created);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Новое СИЗ"
      subtitle="Позиция будет добавлена в каталог"
      icon={<IconBox size={22} />}
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Добавить"
      submitting={submitting}
      error={error}
    >
      <div className="field">
        <label className="field-label" htmlFor="eq-name">
          Название СИЗ <span className="req">*</span>
        </label>
        <input
          id="eq-name"
          className="input"
          maxLength={150}
          placeholder="Например, Каска защитная"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="eq-type">
          Тип
        </label>
        <select
          id="eq-type"
          className="input"
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
        >
          <option value="">— не указан —</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
          <option value={NEW_TYPE}>＋ Новый тип…</option>
        </select>
        {typeId === NEW_TYPE && (
          <input
            className="input input-gap"
            maxLength={100}
            placeholder="Название нового типа"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            autoFocus
          />
        )}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="eq-life">
          Срок эксплуатации, недель
        </label>
        <input
          id="eq-life"
          className="input"
          type="number"
          min="1"
          step="1"
          placeholder="Можно оставить пустым"
          value={lifespan}
          onChange={(e) => setLifespan(e.target.value)}
        />
      </div>
    </Modal>
  );
}

/* ---------- вкладка ---------- */

function SizTab() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [drafts, setDrafts] = useState({}); // id -> { name, typeId, lifespan } — несохранённые правки
  const [invalid, setInvalid] = useState(() => new Set());
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [nudge, setNudge] = useState(false);
  const headCheck = useRef(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [eq, tp] = await Promise.all([
        apiFetch("/admin/equipment"),
        apiFetch("/admin/types"),
      ]);
      setItems(eq);
      setTypes(tp);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Поиск — по уже загруженному каталогу, чтобы не терять несохранённые правки
  const visible = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.type || "").toLowerCase().includes(q),
    );
  }, [items, appliedSearch]);

  const original = (item) => ({
    name: item.name,
    typeId: item.typeId ?? "",
    lifespan: item.lifespanWeeks ?? "",
  });
  const valueOf = (item) => drafts[item.id] ?? original(item);
  const same = (a, b) =>
    a.name === b.name &&
    String(a.typeId) === String(b.typeId) &&
    String(a.lifespan) === String(b.lifespan);

  function patch(item, field, value) {
    const next = { ...valueOf(item), [field]: value };
    setDrafts((prev) => {
      const copy = { ...prev };
      if (same(next, original(item))) delete copy[item.id];
      else copy[item.id] = next;
      return copy;
    });
    setInvalid((prev) => {
      if (!prev.has(item.id)) return prev;
      const n = new Set(prev);
      n.delete(item.id);
      return n;
    });
  }

  const allSelected =
    visible.length > 0 && visible.every((i) => selected.has(i.id));
  const someSelected = visible.some((i) => selected.has(i.id));

  useEffect(() => {
    if (headCheck.current)
      headCheck.current.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  function toggleRow(id) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const n = new Set(prev);
      if (allSelected) visible.forEach((i) => n.delete(i.id));
      else visible.forEach((i) => n.add(i.id));
      return n;
    });
  }

  function onRowClick(e, id) {
    if (e.target.closest("input, select, textarea, label, button")) return;
    toggleRow(id);
  }

  function handleSearch() {
    setAppliedSearch(search);
  }

  function handleAdd() {
    setAddOpen(true);
  }

  async function handleEdit() {
    const ids = Object.keys(drafts)
      .map(Number)
      .filter((id) => items.some((i) => i.id === id));
    if (ids.length === 0) {
      toast.info(
        "Нет изменений. Поправьте данные прямо в таблице и нажмите «Редактировать», чтобы сохранить.",
      );
      return;
    }

    const payload = [];
    for (const id of ids) {
      const d = drafts[id];
      const name = d.name.trim();
      let weeks = null;
      const fail = (msg) => {
        setInvalid(new Set([id]));
        toast.error(`СИЗ №${id}: ${msg}`);
      };
      if (!name) return fail("название не может быть пустым");
      if (String(d.lifespan).trim() !== "") {
        weeks = Number(d.lifespan);
        if (!Number.isInteger(weeks) || weeks <= 0)
          return fail("срок эксплуатации — целое число больше нуля");
      }
      payload.push({
        id,
        name,
        type_id: d.typeId === "" ? null : Number(d.typeId),
        lifespan_weeks: weeks,
      });
    }

    setSaving(true);
    try {
      await apiFetch("/admin/equipment/bulk-update", {
        method: "PUT",
        body: JSON.stringify({ items: payload }),
      });
      setDrafts({});
      setInvalid(new Set());
      await load();
      toast.success(
        `Сохранено: ${payload.length} ${plural(payload.length, ["запись", "записи", "записей"])}`,
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (selected.size === 0) {
      toast.info("Сначала выделите строки, которые нужно удалить.");
      setNudge(true);
      setTimeout(() => setNudge(false), 1400);
      return;
    }
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch("/admin/equipment/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: [...selected] }),
      });
      setSelected(new Set(res.failed.map((f) => f.id))); // невыполненные остаются выделенными
      setDrafts((prev) => {
        const copy = { ...prev };
        res.deleted.forEach((id) => delete copy[id]);
        return copy;
      });
      await load();
      setDeleteOpen(false);
      if (res.deleted.length) toast.success(`Удалено: ${res.deleted.length}`);
      if (res.failed.length) {
        const f = res.failed[0];
        const label = f.name ? `«${f.name}»` : `№${f.id}`;
        toast.error(
          res.failed.length === 1
            ? `Не удалено ${label}: ${f.reason}`
            : `Не удалено позиций: ${res.failed.length}. Например, ${label}: ${f.reason}`,
        );
      }
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const selectedItems = items.filter((i) => selected.has(i.id));
  const dirtyCount = Object.keys(drafts).length;

  return (
    <>
      <PageHead
        title="Каталог СИЗ"
        subtitle="Справочник средств индивидуальной защиты: добавляйте позиции, правьте данные прямо в таблице, удаляйте выделенные строки."
      />

      <div className="search-row">
        <div className="search-field">
          <IconSearch size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Поиск по названию или типу"
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

      <div className="table-card">
        <div className="table-meta">
          <Chip>Всего: {items.length}</Chip>
          {appliedSearch.trim() && (
            <Chip tone="info">Найдено: {visible.length}</Chip>
          )}
          {selected.size > 0 && (
            <Chip tone="primary">Выделено: {selected.size}</Chip>
          )}
          {dirtyCount > 0 && (
            <Chip tone="warn">Не сохранено: {dirtyCount}</Chip>
          )}
          <span className="table-hint">
            <IconEdit size={15} /> Кликните по значению, чтобы изменить ·
            выделяйте строки галочками
          </span>
        </div>

        <div className={`table-wrapper table-scroll ${nudge ? "nudge" : ""}`}>
          <table className="sied-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    ref={headCheck}
                    type="checkbox"
                    className="checkbox"
                    aria-label="Выделить все строки"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={visible.length === 0}
                  />
                </th>
                {COLUMNS.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={COLUMNS.length + 1} />
              ) : visible.length === 0 ? (
                <EmptyRow
                  colSpan={COLUMNS.length + 1}
                  title={
                    items.length === 0 ? "Каталог пуст" : "Ничего не найдено"
                  }
                  text={
                    items.length === 0
                      ? "Нажмите «Добавить», чтобы создать первую позицию"
                      : "Попробуйте изменить поисковый запрос"
                  }
                />
              ) : (
                visible.map((item) => {
                  const v = valueOf(item);
                  const isSel = selected.has(item.id);
                  const cls = [
                    isSel ? "row-selected" : "",
                    drafts[item.id] ? "row-dirty" : "",
                    invalid.has(item.id) ? "row-invalid" : "",
                  ].join(" ");
                  return (
                    <tr
                      key={item.id}
                      className={`row-clickable ${cls}`}
                      onClick={(e) => onRowClick(e, item.id)}
                    >
                      <td className="col-check">
                        <input
                          type="checkbox"
                          className="checkbox"
                          aria-label={`Выделить «${item.name}»`}
                          checked={isSel}
                          onChange={() => toggleRow(item.id)}
                        />
                      </td>
                      <td className="cell-id">{item.id}</td>
                      <td>
                        <input
                          className="cell-input"
                          value={v.name}
                          maxLength={150}
                          aria-label="Название СИЗ"
                          onChange={(e) => patch(item, "name", e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="cell-input"
                          value={v.typeId}
                          aria-label="Тип"
                          onChange={(e) =>
                            patch(item, "typeId", e.target.value)
                          }
                        >
                          <option value="">—</option>
                          {types.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="cell-input cell-num"
                          type="number"
                          min="1"
                          step="1"
                          value={v.lifespan}
                          placeholder="—"
                          aria-label="Срок эксплуатации, недель"
                          onChange={(e) =>
                            patch(item, "lifespan", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sied-actions-three">
        <button className="btn btn-outline" onClick={handleAdd}>
          Добавить
        </button>
        <button
          className="btn btn-outline"
          onClick={handleEdit}
          disabled={saving}
        >
          Редактировать
        </button>
        <button className="btn btn-outline" onClick={handleDelete}>
          Удалить
        </button>
      </div>

      {addOpen && (
        <AddEquipmentModal
          types={types}
          onClose={() => setAddOpen(false)}
          onCreated={async (created) => {
            setAddOpen(false);
            await load();
            toast.success(`СИЗ «${created.name}» добавлено в каталог`);
          }}
        />
      )}

      {deleteOpen && (
        <Modal
          tone="danger"
          size="sm"
          icon={<IconTrash size={22} />}
          title={`Удалить ${selected.size} ${plural(selected.size, ["позицию", "позиции", "позиций"])}?`}
          subtitle="Действие нельзя отменить. Позиции, уже выданные сотрудникам, удалены не будут."
          submitLabel="Удалить"
          submitting={deleting}
          error={deleteError}
          onClose={() => setDeleteOpen(false)}
          onSubmit={confirmDelete}
        >
          <ul className="confirm-list">
            {selectedItems.slice(0, 6).map((i) => (
              <li key={i.id}>
                <span className="cell-id">№{i.id}</span> {i.name}
              </li>
            ))}
            {selectedItems.length > 6 && (
              <li className="confirm-more">
                и ещё {selectedItems.length - 6}…
              </li>
            )}
          </ul>
        </Modal>
      )}
    </>
  );
}

export default SizTab;
