import api from "./client";

/**
 * All patient portal endpoints use /portal/* and authenticate
 * via the X-Patient-Token header (set automatically by api/client.js).
 */

/** GET /portal/appointments */
export async function getPatientAppointments() {
  const res = await api.get("/portal/appointments");
  return res.data;
}

/** GET /portal/doctors */
export async function getDoctors() {
  const res = await api.get("/portal/doctors");
  return res.data;
}

/**
 * GET /portal/availability/{doctor_id}?start_date=X&end_date=Y
 */
export async function getDoctorAvailability(doctorId, startDate, endDate) {
  const res = await api.get(`/portal/availability/${doctorId}`, {
    params: { start_date: startDate, end_date: endDate },
  });
  return res.data;
}

/**
 * POST /portal/book
 */
export async function bookAppointment(payload) {
  const res = await api.post("/portal/book", payload);
  return res.data;
}

/**
 * POST /portal/appointments/{id}/cancel
 */
export async function cancelAppointment(appointmentId, reason) {
  const res = await api.post(`/portal/appointments/${appointmentId}/cancel`, { reason });
  return res.data;
}
