import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import EmployeePage from "./pages/employee/EmployeePage";
import AdminPage from "./pages/admin/AdminPage";
import { getSession, saveSession, clearSession, apiFetch } from "./api";
import { ToastProvider } from "./components/Toast";
import "./App.css";

function App() {
  const [session, setSession] = useState(() => getSession());
  const [loginError, setLoginError] = useState(null);

  async function handleLogin(login, password) {
    setLoginError(null);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      });
      const user = {
        employee_id: data.employee_id,
        role: data.role,
        name: data.name,
      };
      saveSession(data.access_token, user);
      setSession({ token: data.access_token, user });
    } catch (err) {
      setLoginError(err.message);
    }
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  let screen;
  if (!session) {
    screen = <LoginPage onLogin={handleLogin} error={loginError} />;
  } else if (session.user.role === "admin") {
    screen = <AdminPage login={session.user.name} onLogout={handleLogout} />;
  } else {
    screen = <EmployeePage login={session.user.name} onLogout={handleLogout} />;
  }

  return <ToastProvider>{screen}</ToastProvider>;
}

export default App;
