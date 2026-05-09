// ─────────────────────────────────────────────────────────────
// Google Apps Script Web App URL
// After you deploy your Apps Script, paste the URL below.
// See README.md for step-by-step instructions.
// ─────────────────────────────────────────────────────────────
const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbyoooV_l7FmZZTlE3Q5cHsn8AayAYTy509CFDl0omPU8qbJ14Rdoo-BJJHE2G6rWyNtog/exec";

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
