import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, Mail, ArrowLeft, UserCheck, RefreshCw } from "lucide-react";
import { sendOtp, verifyOtp } from "../api/auth";
import { saveSession, isLoggedIn } from "../store/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = email, 2 = otp
  const [email, setEmail] = useState("");
  const [patientName, setPatientName] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) navigate("/", { replace: true });
  }, [navigate]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  async function handleSendOtp(e) {
    e?.preventDefault();
    if (!isValidEmail(email)) return;
    setLoading(true);
    setError("");
    try {
      const data = await sendOtp(email.trim().toLowerCase());
      setPatientName(data.patient_name);
      setDevOtp(data.dev_otp || "");
      setStep(2);
      setTimer(30);
      setOtp(["", "", "", "", "", ""]);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 404) {
        setError("This email is not registered. Please contact the clinic.");
      } else if (!err.response) {
        // Network error — backend is likely not running or CORS issue
        setError(
          "Cannot reach the server. Make sure the backend is running at " +
            (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000") +
            "."
        );
      } else {
        setError(detail || `Error ${err.response.status}: Something went wrong. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  function handleOtpChange(index, value) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  function handleOtpKeyDown(e, index) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }

  async function handleVerifyOtp() {
    if (!otp.every((d) => d !== "")) return;
    setLoading(true);
    setError("");
    try {
      const data = await verifyOtp(email.trim().toLowerCase(), otp.join(""));
      saveSession(data.token, data.patient);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-2xl">
        {/* Hero header */}
        <div className="bg-[#115E59] text-white px-6 pt-14 pb-10 flex flex-col items-center rounded-b-[2.5rem] shadow-lg relative">
          {step === 2 && (
            <button
              onClick={() => { setStep(1); setError(""); setDevOtp(""); setOtp(["","","","","",""]); }}
              className="absolute top-14 left-6 text-teal-100 hover:text-white"
              aria-label="Back"
            >
              <ArrowLeft size={22} />
            </button>
          )}
          <div className="bg-white/10 p-4 rounded-2xl mb-4 shadow-inner">
            <HeartPulse size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide">HFlow Patient</h1>
          <p className="text-teal-200 text-sm mt-1">Your Health, In Your Hands</p>
        </div>

        {/* Form area */}
        <div className="flex-1 px-7 py-8 flex flex-col">
          {step === 1 ? (
            /* ── Email step ── */
            <form onSubmit={handleSendOtp} className="flex flex-col flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome Back!</h2>
              <p className="text-gray-500 text-sm mb-8">
                Enter your registered email to access your health records and appointments.
              </p>

              <label className="text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl focus-within:border-teal-500 bg-gray-50 overflow-hidden transition-colors mb-2">
                <span className="px-4 text-gray-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value.trim()); setError(""); }}
                  className="flex-1 py-4 pr-4 bg-transparent outline-none font-medium text-gray-800 placeholder-gray-400"
                  placeholder="you@example.com"
                  autoFocus
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!isValidEmail(email) || loading}
                className="mt-auto w-full bg-teal-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-600/25 hover:bg-teal-700 transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
              >
                {loading ? "Checking…" : "Send OTP"}
              </button>
            </form>
          ) : (
            /* ── OTP step ── */
            <div className="flex flex-col flex-1">
              {/* Patient name confirmation */}
              <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3 mb-6">
                <div className="bg-teal-100 text-teal-700 p-2 rounded-full">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-[11px] text-teal-600 font-bold uppercase tracking-wide">
                    Registered Patient
                  </p>
                  <p className="text-sm font-bold text-teal-800">{patientName}</p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-1">Verify OTP</h2>
              <p className="text-gray-500 text-sm mb-5">
                A 6-digit OTP was sent to{" "}
                <span className="font-semibold text-gray-800">{email}</span>
              </p>

              {/* Dev OTP hint */}
              {devOtp && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-xs text-amber-700 font-semibold">
                    Dev mode — OTP:{" "}
                    <span className="tracking-widest font-bold text-amber-900">{devOtp}</span>
                  </p>
                </div>
              )}

              {/* OTP boxes */}
              <div className="flex justify-between gap-2 mb-6">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => handleOtpKeyDown(e, i)}
                    className="w-12 h-14 border-2 border-gray-200 rounded-xl text-center text-xl font-bold text-teal-700 focus:border-teal-500 focus:bg-teal-50 outline-none transition-all"
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-500 text-sm font-medium text-center mb-3">{error}</p>
              )}

              {/* Resend */}
              <div className="text-center mb-auto">
                <button
                  onClick={() => timer === 0 && handleSendOtp()}
                  disabled={timer > 0 || loading}
                  className={`text-sm font-semibold flex items-center gap-1.5 mx-auto transition-colors ${
                    timer > 0 ? "text-gray-400 cursor-default" : "text-teal-600 hover:underline"
                  }`}
                >
                  <RefreshCw size={14} />
                  {timer > 0
                    ? `Resend in 0:${timer < 10 ? `0${timer}` : timer}`
                    : "Resend OTP"}
                </button>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={!otp.every((d) => d !== "") || loading}
                className="mt-6 w-full bg-teal-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-teal-600/25 hover:bg-teal-700 transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
              >
                {loading ? "Verifying…" : "Verify & Login"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
