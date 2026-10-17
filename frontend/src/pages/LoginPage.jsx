import { useState } from "react";
import { IconBell, IconBox, IconLock, IconShield, IconUser } from "../components/Icons";
import { Alert } from "../components/ui";

function LoginPage({ onLogin, error }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onLogin(login, password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <aside className="login-aside">
        <div className="brand brand-lg">
          <span className="brand-mark">
            <IconShield size={26} />
          </span>
          <span className="brand-name">СИЗ Трекер</span>
        </div>
        <h2 className="aside-title">Все средства защиты — под контролем</h2>
        <ul className="aside-list">
          <li><IconBox size={20} /> Каталог СИЗ и выдача сотрудникам</li>
          <li><IconBell size={20} /> Контроль сроков и уведомления о просрочках</li>
          <li><IconShield size={20} /> Запросы на дополнительные СИЗ</li>
        </ul>
      </aside>

      <main className="login-main">
        <form className="login-form" onSubmit={handleSubmit}>
          <h1 className="login-title">ВХОД</h1>
          <p className="login-sub">Введите логин и пароль, чтобы продолжить</p>

          <div className="form-row">
            <label htmlFor="login">Логин</label>
            <div className="input-icon">
              <IconUser size={18} />
              <input id="login" type="text" autoComplete="username" autoFocus value={login} onChange={(e) => setLogin(e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="password">Пароль</label>
            <div className="input-icon">
              <IconLock size={18} />
              <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <button type="submit" className="btn btn-primary login-button" disabled={submitting}>
            {submitting ? "Входим…" : "Войти"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default LoginPage;
