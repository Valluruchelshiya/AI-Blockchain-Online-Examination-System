const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

// ---------------- TOKEN HELPERS ----------------
export function setTokens(access, refresh) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function getAccessToken() {
  return localStorage.getItem("access_token");
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// ---------------- GENERIC FETCH ----------------
export async function apiFetch(path, options = {}) {
  const {
    responseType,
    headers: customHeaders,
    skipAuth,
    ...fetchOptions
  } = options;

  const headers = customHeaders || {};
  const token = getAccessToken();

  if (token && !skipAuth) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (responseType !== "blob") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }

  return responseType === "blob" ? res.blob() : res.json();
}
