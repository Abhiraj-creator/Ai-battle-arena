export const getToken = () => localStorage.getItem("token");

export const getStoredUser = () => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

export const saveAuth = ({ token, user }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const authHeaders = () => ({
  "Authorization": `Bearer ${getToken()}`
});

export async function fetchCurrentUser() {
  const token = getToken();
  if (!token) return null;

  const res = await fetch("/api/auth/me", {
    headers: authHeaders()
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.user;
}

export async function authenticate(mode, values) {
  const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
  const body = mode === "signup"
    ? { name: values.name, email: values.email, password: values.password }
    : { email: values.email, password: values.password };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Failed to ${mode === "signup" ? "sign up" : "sign in"}`);
  }

  return data;
}
