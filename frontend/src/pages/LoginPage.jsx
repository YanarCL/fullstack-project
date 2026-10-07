import { useState } from "react";

function LoginPage({ onLogin, error }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onLogin(login, password);
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1 className="login-title">ВХОД</h1>

        <div className="form-row">
          <label htmlFor="login">Логин</label>
          <input
            id="login"
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
        </div>

        <div className="form-row">
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="login-button">
          Войти
        </button>

        {error && (
          <p style={{ color: "#c0392b", textAlign: "center", marginTop: 16 }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

export default LoginPage;
