import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import Modal from "../../components/Modal";
import { useToast } from "../../components/Toast";
import { Alert, Chip, EmptyRow, PageHead, SkeletonRows, StatusBadge } from "../../components/ui";
import { IconClipboard } from "../../components/Icons";
import { formatDateTime } from "../../utils";

const COLUMNS = ["ID запроса", "Дата запроса", "Статус"];
const MAX_COMMENT = 500;

function RequestsTab() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  async function load() {
    setError(null);
    try {
      setRequests(await apiFetch("/employee/requests"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openModal() {
    setComment("");
    setModalError(null);
    setOpen(true);
  }

  async function submit() {
    setSubmitting(true);
    setModalError(null);
    try {
      await apiFetch("/employee/requests", {
        method: "POST",
        body: JSON.stringify({ comment: comment.trim() || null }),
      });
      setOpen(false);
      await load();
      toast.success("Запрос отправлен администратору");
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const count = (s) => requests.filter((r) => r.status === s).length;

  return (
    <>
      <PageHead title="Список исходящих запросов на СИЗ" subtitle="Ваши запросы на дополнительные средства защиты и их статус." />

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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={COLUMNS.length} />
              ) : requests.length === 0 ? (
                <EmptyRow colSpan={COLUMNS.length} title="Запросов пока нет" text="Нажмите «Запросить дополнительные СИЗ», чтобы создать первый" />
              ) : (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td className="cell-id">{req.id}</td>
                    <td>{formatDateTime(req.date)}</td>
                    <td><StatusBadge status={req.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sied-actions-center">
        <button className="btn btn-primary" onClick={openModal}>
          Запросить дополнительные СИЗ
        </button>
      </div>

      {open && (
        <Modal
          icon={<IconClipboard size={22} />}
          title="Новый запрос на СИЗ"
          subtitle="Опишите, что именно вам требуется — администратор рассмотрит запрос."
          submitLabel="Отправить"
          submitting={submitting}
          error={modalError}
          onClose={() => setOpen(false)}
          onSubmit={submit}
        >
          <div className="field">
            <label className="field-label" htmlFor="rq-comment">Комментарий</label>
            <textarea id="rq-comment" className="input textarea" rows={5} maxLength={MAX_COMMENT} placeholder="Например: нужны новые защитные перчатки, старые порвались" value={comment} onChange={(e) => setComment(e.target.value)} />
            <div className="field-hint field-counter">{comment.length} / {MAX_COMMENT} · необязательно</div>
          </div>
        </Modal>
      )}
    </>
  );
}

export default RequestsTab;
