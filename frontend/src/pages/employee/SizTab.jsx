import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";
import { Alert, Badge, Chip, EmptyRow, PageHead, SkeletonRows } from "../../components/ui";
import { IconBox } from "../../components/Icons";
import { formatDate, isOverdue } from "../../utils";

const COLUMNS = [
  "ID СИЗ",
  "Название СИЗ",
  "Тип",
  "Дата получения",
  "Срок сдачи",
  "Сдано",
];

function SizTab() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toReturn, setToReturn] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  async function load() {
    setError(null);
    try {
      setItems(await apiFetch("/employee/siz"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function confirmReturn() {
    setSubmitting(true);
    setModalError(null);
    try {
      await apiFetch(`/employee/siz/${toReturn.id}/return`, { method: "POST" });
      const name = toReturn.name;
      setToReturn(null);
      await load();
      toast.success(`«${name}» отмечено как сданное`);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const onHands = items.filter((i) => !i.returned).length;
  const late = items.filter((i) => isOverdue(i.dueAt, i.returned)).length;

  return (
    <>
      <PageHead title="Мои СИЗ" subtitle="Средства защиты, выданные вам, и сроки их сдачи." />

      {error && <Alert tone="error">{error}</Alert>}

      <div className="table-card">
        <div className="table-meta">
          <Chip>Всего выдано: {items.length}</Chip>
          <Chip tone="info">На руках: {onHands}</Chip>
          {late > 0 && <Chip tone="danger">Просрочено: {late}</Chip>}
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
              ) : items.length === 0 ? (
                <EmptyRow colSpan={COLUMNS.length + 1} title="Вам пока ничего не выдано" />
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="cell-id">{item.id}</td>
                    <td className="cell-strong">{item.name}</td>
                    <td>{item.type || "—"}</td>
                    <td>{formatDate(item.receivedAt)}</td>
                    <td className={isOverdue(item.dueAt, item.returned) ? "cell-late" : ""}>{formatDate(item.dueAt)}</td>
                    <td>
                      <Badge tone={item.returned ? "success" : "danger"}>{item.returned ? "Да" : "Нет"}</Badge>
                    </td>
                    <td>
                      {!item.returned && (
                        <button className="btn btn-outline btn-sm" onClick={() => { setModalError(null); setToReturn(item); }}>
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
      </div>

      {toReturn && (
        <Modal
          size="sm"
          icon={<IconBox size={22} />}
          title="Отметить СИЗ как сданный?"
          subtitle={`«${toReturn.name}» (№${toReturn.id})`}
          submitLabel="Подтвердить"
          submitting={submitting}
          error={modalError}
          onClose={() => setToReturn(null)}
          onSubmit={confirmReturn}
        />
      )}
    </>
  );
}

export default SizTab;
