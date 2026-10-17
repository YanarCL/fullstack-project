import { useState } from "react";
import TabsBar from "../../components/TabsBar";
import AppHeader from "../../components/AppHeader";
import { IconAlert, IconBox, IconClipboard, IconUserPlus } from "../../components/Icons";
import SizTab from "./SizTab";
import RequestsTab from "./RequestsTab";
import AddSizTab from "./AddSizTab";
import ControlTab from "./ControlTab";

const TABS = ["СИЗ", "Запросы на СИЗ", "Добавить СИЗ сотруднику", "Контроль"];

const ICONS = {
  "СИЗ": <IconBox size={18} />,
  "Запросы на СИЗ": <IconClipboard size={18} />,
  "Добавить СИЗ сотруднику": <IconUserPlus size={18} />,
  "Контроль": <IconAlert size={18} />,
};

function AdminPage({ login, onLogout }) {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <div className="sied-page">
      <AppHeader name={login} roleLabel="Администратор" onLogout={onLogout} />
      <TabsBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} icons={ICONS} />

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
