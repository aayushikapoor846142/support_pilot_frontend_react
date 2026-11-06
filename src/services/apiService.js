const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

export function getApiUrl() {
  if (!apiUrl) {
    throw new Error("VITE_API_URL is required. Set it in your environment before making API requests.");
  }
  return apiUrl;
}

export async function apiRequest(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("supportpilot-token");
  const response = await fetch(`${getApiUrl()}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }
  return result.data;
}
