import { useState } from "react";
import TabsBar from "../../components/TabsBar";
import SizTab from "./SizTab";
import RequestsTab from "./RequestsTab";
import AddSizTab from "./AddSizTab";
import ControlTab from "./ControlTab";

const TABS = ["СИЗ", "Запросы на СИЗ", "Добавить СИЗ сотруднику", "Контроль"];

function AdminPage({ login, onLogout }) {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <div className="sied-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", borderBottom: "1px solid #d9d9d9" }}>
        <span>Вы вошли как: <b>{login}</b> (admin)</span>
        <button className="btn btn-outline" style={{ minWidth: "auto", padding: "6px 16px" }} onClick={onLogout}>
          Выйти
        </button>
      </div>
      <TabsBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      <div className="sied-content">
        {activeTab === "СИЗ" && <SizTab />}
        {activeTab === "Запросы на СИЗ" && <RequestsTab />}
        {activeTab === "Добавить СИЗ сотруднику" && <AddSizTab />}
        {activeTab === "Контроль" && <ControlTab />}
      </div>
    </div>
  );
}

export default AdminPage;
