export const API_ORIGIN = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const API = `${API_ORIGIN}/api`;

export async function getInstitutions() {
  const r = await fetch(`${API}/institutions`);
  return r.json();
}

export async function getInspections() {
  const r = await fetch(`${API}/inspections`);
  return r.json();
}

export async function getPending() {
  const r = await fetch(`${API}/pending`);
  return r.json();
}

export async function submitInspection(payload, photoFile) {
  const fd = new FormData();
  fd.append("institution_id", payload.institutionId);
  fd.append("inspector", payload.inspector);
  fd.append("attendance", payload.attendance);
  fd.append("expected", payload.expected);
  fd.append("facility_ok", payload.facilityOk);
  fd.append("hygiene_ok", payload.hygieneOk);
  fd.append("documents_ok", payload.documentsOk);
  fd.append("notes", payload.notes || "");
  fd.append("photo", photoFile);
  const r = await fetch(`${API}/inspections`, { method: "POST", body: fd });
  if (!r.ok) throw new Error("Failed to submit inspection");
  return r.json();
}

export async function triggerSurprise() {
  const r = await fetch(`${API}/pending/surprise`, { method: "POST" });
  if (!r.ok) throw new Error("Failed to trigger surprise inspection");
  return r.json();
}

export async function resetDemo() {
  const r = await fetch(`${API}/reset`, { method: "POST" });
  return r.json();
}
