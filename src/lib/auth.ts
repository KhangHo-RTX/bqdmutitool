const SESSION_KEY = "bqd_session";

export interface Session {
  username: string;
  loggedInAt: number;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(username: string): void {
  const session: Session = { username, loggedInAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function login(username: string, password: string): boolean {
  if (username === "admin" && password === "admin123") {
    setSession(username);
    return true;
  }
  return false;
}
