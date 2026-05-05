/**
 * Simple auth helpers — reads/writes localStorage.
 * No external state library needed for this small app.
 */

export function getPatient() {
  try {
    const raw = localStorage.getItem("patient_info");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem("patient_token") || null;
}

export function isLoggedIn() {
  const token = getToken();
  const patient = getPatient();
  if (!token || !patient) return false;
  // The backend doesn't currently provide a facility_id in the patient info.
  // We remove the check here to avoid an immediate logout after successful verification.
  return true;
}

export function saveSession(token, patient) {
  localStorage.setItem("patient_token", token);
  localStorage.setItem("patient_info", JSON.stringify(patient));
}

export function clearSession() {
  localStorage.removeItem("patient_token");
  localStorage.removeItem("patient_info");
}
