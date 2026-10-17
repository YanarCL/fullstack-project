import { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import { useToast } from "../../components/Toast";
import { Alert, Chip, EmptyRow, PageHead, SkeletonRows } from "../../components/ui";
import { formatDate, plural } from "../../utils";

const COLUMNS = [
  "Имя сотрудника",
  "Название СИЗ",
  "Срок сдачи",
  "На сколько дней просрочено",
];

function ControlTab() {
  const toast = useToast();
  const [overdueItems, setOverdueItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admin/control/overdue")
      .then((data) => setOverdueItems([...data].sort((a, b) => b.overdueDays - a.overdueDays)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleNotifyAll() {
    if (overdueItems.length === 0) {
      toast.info("Просроченных СИЗ нет — уведомлять некого.");
      return;
    }
    try {
      const res = await apiFetch("/admin/control/notify-all", { method: "POST" });
      if (res.notified === 0 && res.skipped > 0) {
        toast.info("Все просроченные уже уведомлены — повторно не отправляем.");
      } else if (res.skipped > 0) {
        toast.success(`Уведомления отправлены: ${res.notified} (ещё ${res.skipped} уже были уведомлены)`);
      } else {
        toast.success(`Уведомления отправлены: ${res.notified}`);
      }
    } catch (err) {
      toast.error(err.message);
    }
  }

  const severe = overdueItems.filter((i) => i.overdueDays > 7).length;

  return (
    <>
      <PageHead title="Контроль сроков сдачи" subtitle="Сотрудники, у которых истёк срок сдачи СИЗ. Самые длительные просрочки — сверху." />

      {error && <Alert tone="error">{error}</Alert>}

      <div className="table-card">
        <div className="table-meta">
          <Chip tone={overdueItems.length ? "danger" : "success"}>Просрочено: {overdueItems.length}</Chip>
          {severe > 0 && <Chip tone="warn">Более недели: {severe}</Chip>}
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
              ) : overdueItems.length === 0 ? (
                <EmptyRow colSpan={COLUMNS.length} title="Просрочек нет" text="Все СИЗ сданы вовремя" />
              ) : (
                overdueItems.map((row) => (
                  <tr key={`${row.inventory_id}`}>
                    <td className="cell-strong">{row.employeeName}</td>
                    <td>{row.sizName}</td>
                    <td>{formatDate(row.dueAt)}</td>
                    <td>
                      <span className={`days-pill ${row.overdueDays > 7 ? "days-high" : "days-low"}`}>
                        {row.overdueDays} {plural(row.overdueDays, ["день", "дня", "дней"])}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
