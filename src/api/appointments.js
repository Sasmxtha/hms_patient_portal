import api from "./client";

/**
 * All patient portal endpoints use /portal/* and authenticate
 * via the X-Patient-Token header (set automatically by api/client.js).
 */

const MOCK_DOCTORS = [
  {
    id: 1,
    firstname: "Sarah",
    lastname: "Connor",
    specialization: "Cardiology",
    experience: 15,
    consultation_fee: 500,
    is_active: true
  },
  {
    id: 2,
    firstname: "John",
    lastname: "Smith",
    specialization: "General Physician",
    experience: 8,
    consultation_fee: 300,
    is_active: true
  }
];

const MOCK_AVAILABILITY = {
  availability_details: [
    {
      date: "",
      is_available: true,
      slots: [
        { time: "09:00:00", available: true },
        { time: "09:30:00", available: true },
        { time: "10:00:00", available: true },
        { time: "10:30:00", available: false },
        { time: "14:00:00", available: true },
        { time: "15:00:00", available: true },
      ]
    }
  ]
};

let MOCK_APPOINTMENTS = [];

/** GET /portal/appointments */
export async function getPatientAppointments() {
  try {
    const res = await api.get("/portal/appointments");
    return res.data;
  } catch (err) {
    return MOCK_APPOINTMENTS;
  }
}

/** GET /portal/doctors */
export async function getDoctors() {
  try {
    const res = await api.get("/portal/doctors");
    return res.data;
  } catch (err) {
    return MOCK_DOCTORS;
  }
}

/**
 * GET /portal/availability/{doctor_id}?start_date=X&end_date=Y
 */
export async function getDoctorAvailability(doctorId, startDate, endDate) {
  try {
    const res = await api.get(`/portal/availability/${doctorId}`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return res.data;
  } catch (err) {
    // Generate dates dynamically based on request
    const mock = JSON.parse(JSON.stringify(MOCK_AVAILABILITY));
    mock.availability_details[0].date = startDate;
    return mock;
  }
}

// --- Helpers ---

function getDoctorTokenPrefix(firstname) {
  if (!firstname) return "DOC";
  const name = firstname.toUpperCase().trim();
  const vowels = new Set(["A", "E", "I", "O", "U"]);
  let consonants = [];
  for (let char of name) {
    if (/[A-Z]/.test(char) && !vowels.has(char)) {
      consonants.push(char);
    }
  }

  let prefix = "";
  if (consonants.length >= 3) {
    prefix = consonants.slice(0, 3).join("");
  } else if (consonants.length > 0) {
    prefix = consonants.join("");
    for (let char of name) {
      if (/[A-Z]/.test(char) && prefix.length < 3) {
        if (!prefix.includes(char)) {
          prefix += char;
        }
      }
    }
    prefix = prefix.padEnd(3, "X").substring(0, 3);
  } else {
    prefix = name.padEnd(3, "X").substring(0, 3);
  }
  return prefix;
}

/**
 * POST /portal/book
 */
export async function bookAppointment(payload) {
  try {
    const res = await api.post("/portal/book", payload);
    return res.data;
  } catch (err) {
    const doctor = MOCK_DOCTORS.find((d) => d.id === payload.doctor_id) || {
      firstname: "Mock",
      lastname: "Doctor",
    };
    const prefix = getDoctorTokenPrefix(doctor.firstname);
    const tokenId = prefix + String(Math.floor(Math.random() * 900) + 100);

    const newAppt = {
      appointment_id: Math.floor(Math.random() * 10000),
      doctor_name: `Dr. ${doctor.firstname} ${doctor.lastname}`,
      appointment_date: payload.appointment_date || payload.AppointmentDate,
      appointment_time: payload.appointment_time || payload.AppointmentTime,
      appointment_status: "Scheduled",
      token_id: tokenId,
      cancelled: false,
    };
    MOCK_APPOINTMENTS.push(newAppt);

    return {
      success: true,
      message: "Mock Appointment Booked",
      appointment: newAppt,
      token_id: tokenId,
    };
  }
}

/**
 * POST /portal/appointments/{id}/cancel
 */
export async function cancelAppointment(appointmentId, reason) {
  try {
    const res = await api.post(`/portal/appointments/${appointmentId}/cancel`, {
      reason,
    });
    return res.data;
  } catch (err) {
    MOCK_APPOINTMENTS = MOCK_APPOINTMENTS.filter(
      (a) => a.appointment_id !== appointmentId
    );
    return { success: true, message: "Mock Appointment Cancelled" };
  }
}
