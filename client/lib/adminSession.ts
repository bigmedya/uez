/** localStorage’daki admin oturumundan Bearer token döndürür (yoksa null). */
export function getAdminBearerToken(): string | null {
  try {
    const stored = localStorage.getItem("adminSession");
    if (!stored) return null;
    const session = JSON.parse(stored) as { token?: string };
    return typeof session.token === "string" ? session.token : null;
  } catch {
    return null;
  }
}
