import api from "./client";

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

/** GET /portal/availability/{doctor_id}?start_date=X&end_date=Y */
export async function getDoctorAvailability(doctorId, startDate, endDate) {
  const res = await api.get(`/portal/availability/${doctorId}`, {
    params: { start_date: startDate, end_date: endDate },
  });
  return res.data;
}

/** POST /portal/book */
export async function bookAppointment(payload) {
  const res = await api.post("/portal/book", payload);
  return res.data;
}

/** DELETE /portal/appointments/{id} — removes a Scheduled appointment */
export async function deleteAppointment(appointmentId) {
  const res = await api.delete(`/portal/appointments/${appointmentId}`);
  return res.data;
}
