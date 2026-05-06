import api from "./client";

/**
 * Send OTP to patient email.
 * Returns { success, message, patient_name, dev_otp? }
 */
export async function sendOtp(email) {
  const res = await api.post("/patient/auth/send-otp", { email });
  return res.data;
}

/**
 * Verify OTP and get patient session.
 * Returns { success, token, patient }
 */
export async function verifyOtp(email, otp) {
  const res = await api.post("/patient/auth/verify-otp", { email, otp });
  return res.data;
}
/**
 * Get patient profile.
 */
export async function getProfile() {
  const res = await api.get("/portal/profile");
  return res.data;
}

/**
 * Update patient profile.
 */
export async function updateProfile(payload) {
  const res = await api.patch("/portal/profile", payload);
  return res.data;
}
