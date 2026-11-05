import { API_URL } from "./apiService";

export function getStoredToken() {
  try {
    return localStorage.getItem("supportpilot-token") || "";
  } catch {
    return "";
  }
}

export function getStoredUser() {
  try {
    const rawUser = localStorage.getItem("supportpilot-user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

export function clearStoredAuth() {
  localStorage.removeItem("supportpilot-token");
  localStorage.removeItem("supportpilot-user");
}

export async function authRequest(type, payload) {
  const endpoint = type === "login" ? "/login" : "/register";

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Authentication failed");
  }

  if (data.token) {
    localStorage.setItem("supportpilot-token", data.token);
  }

  if (data.user) {
    localStorage.setItem("supportpilot-user", JSON.stringify(data.user));
  }

  return data;
}
