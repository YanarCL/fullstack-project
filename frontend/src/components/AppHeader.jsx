import { IconShield } from "./Icons";
import { initials } from "../utils";

function AppHeader({ name, roleLabel, onLogout }) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark">
          <IconShield size={22} />
        </span>
        <div className="brand-text">
          <span className="brand-name">СИЗ Трекер</span>
          <span className="brand-sub">Учёт средств индивидуальной защиты</span>
        </div>
      </div>

      <div className="header-user">
        <span className="avatar">{initials(name)}</span>
        <span className="user-info">
          <span className="user-label">Вы вошли как</span>
          <span className="user-name">
            <b>{name}</b>
            {roleLabel && <span className="role-tag">{roleLabel}</span>}
          </span>
        </span>
        <button className="btn btn-outline btn-sm btn-on-dark" onClick={onLogout}>
          Выйти
        </button>
      </div>
    </header>
  );
}

export default AppHeader;
