import { useState } from "react";
import TabsBar from "../../components/TabsBar";
import AppHeader from "../../components/AppHeader";
import { IconBell, IconBox, IconClipboard } from "../../components/Icons";
import SizTab from "./SizTab";
import RequestsTab from "./RequestsTab";
import NotificationsTab from "./NotificationsTab";

const TABS = ["СИЗ", "Запросы на СИЗ", "Уведомления"];

const ICONS = {
  "СИЗ": <IconBox size={18} />,
  "Запросы на СИЗ": <IconClipboard size={18} />,
  "Уведомления": <IconBell size={18} />,
};

function EmployeePage({ login, onLogout }) {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <div className="sied-page">
      <AppHeader name={login} roleLabel="Сотрудник" onLogout={onLogout} />
      <TabsBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} icons={ICONS} />

      <div className="sied-content">
        {activeTab === "СИЗ" && <SizTab />}
        {activeTab === "Запросы на СИЗ" && <RequestsTab />}
        {activeTab === "Уведомления" && <NotificationsTab />}
      </div>
    </div>
  );
}

export default EmployeePage;
