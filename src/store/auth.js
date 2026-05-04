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
  // If old session is missing facility_id, force re-login so the new
  // facility_id field gets populated from the updated verify-otp response.
  if (!patient.facility_id) {
    clearSession();
    return false;
  }
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
