import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Адрес backend.
 *
 * ВАЖНО про сети:
 * - Android-эмулятор (AVD) видит localhost хост-машины по специальному адресу 10.0.2.2
 *   (это НЕ опечатка и не твой реальный IP — так работает сетевой мост эмулятора).
 * - Если будешь тестировать на реальном телефоне (не в эмуляторе), подставь сюда
 *   LAN-IP своего ПК, например "http://192.168.1.50:8000" (узнать: ipconfig → IPv4-адрес),
 *   и убедись, что backend запущен с --host 0.0.0.0, а телефон в той же Wi-Fi сети.
 * - Для iOS-симулятора (на Mac) подошёл бы "http://localhost:8000" напрямую.
 */
const BASE_URL =
  Platform.OS === "android" ? "http://10.0.2.2:8000/api" : "http://localhost:8000/api";

const TOKEN_KEY = "siz_token";
const USER_KEY = "siz_user";

export async function saveSession(token, user) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function getSession() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const userRaw = await AsyncStorage.getItem(USER_KEY);
  if (!token || !userRaw) return null;
  try {
    return { token, user: JSON.parse(userRaw) };
  } catch {
    return null;
  }
}

/**
 * Обёртка над fetch: добавляет базовый путь, заголовок Authorization
 * (если есть токен) и парсит JSON. Бросает Error с текстом detail от backend-а.
 * onSessionExpired вызывается при 401 (чтобы приложение откинуло на экран логина).
 */
export async function apiFetch(path, options = {}, onSessionExpired) {
  const session = await getSession();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (session?.token) {
    headers["Authorization"] = `Bearer ${session.token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (networkErr) {
    throw new Error(
      "Не удалось подключиться к backend. Проверь, что uvicorn запущен и " +
        "эмулятор использует адрес 10.0.2.2 (см. комментарий в src/api.js)."
    );
  }

  if (res.status === 401) {
    await clearSession();
    if (onSessionExpired) onSessionExpired();
    throw new Error("Сессия истекла, войдите снова");
  }

  if (!res.ok) {
    let detail = `Ошибка запроса (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}
