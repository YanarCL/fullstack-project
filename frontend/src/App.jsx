import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import EmployeePage from "./pages/employee/EmployeePage";
import AdminPage from "./pages/admin/AdminPage";
import { getSession, saveSession, clearSession, apiFetch } from "./api";
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

  if (!session) {
    return <LoginPage onLogin={handleLogin} error={loginError} />;
  }

  if (session.user.role === "admin") {
    return <AdminPage login={session.user.name} onLogout={handleLogout} />;
  }

  return <EmployeePage login={session.user.name} onLogout={handleLogout} />;
}

export default App;
