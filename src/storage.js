// ─────────────────────────────────────────────────────────────
// Google Apps Script Web App URL
// After you deploy your Apps Script, paste the URL below.
// See README.md for step-by-step instructions.
// ─────────────────────────────────────────────────────────────
const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || "https://script.google.com/macros/library/d/1ijMnCeq3qIi7z5K9JE1FzmIivHGwxc8g5kMNxO0XFZ-wmK0hfWyxGGYR/1";

export async function storageGet() {
  try {
    const r = await fetch(SCRIPT_URL);
    if (!r.ok) return null;
    const text = await r.text();
    if (!text || text === "null") return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function storageSet(data) {
  try {
    // no-cors avoids the Apps Script CORS redirect issue on POST.
    // The data is still written server-side even without a readable response.
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(data),
    });
    return true;
  } catch {
    return false;
  }
}
