export function getBackendBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL
  if (!raw || raw === "undefined") {
    return "http://127.0.0.1:8000"
  }
  return raw.replace(/\/$/, "")
}

export async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json()
    const d = data?.detail
    if (typeof d === "string") return d
    if (Array.isArray(d)) {
      return d.map((e: { msg?: string }) => e.msg ?? JSON.stringify(e)).join("; ")
    }
    if (d != null) return JSON.stringify(d)
  } catch {
    /* ignore */
  }
  return response.statusText || `Request failed (${response.status})`
}
