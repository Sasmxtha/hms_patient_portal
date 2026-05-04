import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Plus, X, AlertCircle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { getPatientAppointments, cancelAppointment } from "../api/appointments";
import dayjs from "dayjs";

const TABS = ["Upcoming", "Past", "Cancelled"];

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const today = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    getPatientAppointments()
      .then((d) => setAppointments(Array.isArray(d) ? d : []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = appointments
    .filter((a) => {
      if (activeTab === "Upcoming")  return !a.cancelled && a.appointment_date >= today;
      if (activeTab === "Past")      return !a.cancelled && a.appointment_date < today;
      if (activeTab === "Cancelled") return !!a.cancelled;
      return true;
    })
    .sort((a, b) =>
      activeTab === "Upcoming"
        ? a.appointment_date.localeCompare(b.appointment_date)
        : b.appointment_date.localeCompare(a.appointment_date)
    );

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      await cancelAppointment(cancelTarget.appointment_id, "Cancelled by patient");
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointment_id === cancelTarget.appointment_id
            ? { ...a, cancelled: true, appointment_status: "Cancelled" }
            : a
        )
      );
      setCancelTarget(null);
    } catch (err) {
      setCancelError(err.response?.data?.detail || "Failed to cancel. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <PageHeader
        title="My Appointments"
        right={
          <button onClick={() => navigate("/book")} className="bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors" aria-label="Book">
            <Plus size={20} />
          </button>
        }
      />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4 flex gap-1 sticky top-0 z-10">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab ? "border-teal-600 text-teal-700" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-4 flex-1">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Calendar size={28} />}
            title={`No ${activeTab.toLowerCase()} appointments`}
            subtitle={activeTab === "Upcoming" ? "Book an appointment to get started." : undefined}
            action={
              activeTab === "Upcoming" ? (
                <button onClick={() => navigate("/book")} className="bg-teal-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors">
                  Book Appointment
                </button>
              ) : null
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <AppointmentCard
                key={a.appointment_id}
                appt={a}
                showCancel={activeTab === "Upcoming"}
                onCancel={() => { setCancelTarget(a); setCancelError(""); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full text-red-500"><AlertCircle size={22} /></div>
              <h3 className="text-base font-bold text-gray-800">Cancel Appointment?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Cancel your appointment on <strong>{cancelTarget.appointment_date}</strong> at <strong>{cancelTarget.appointment_time}</strong>?
            </p>
            {cancelError && <p className="text-red-500 text-sm font-medium mb-3">{cancelError}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setCancelTarget(null)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50">Keep It</button>
              <button onClick={handleCancel} disabled={cancelling} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 disabled:opacity-60">
                {cancelling ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appt, showCancel, onCancel }) {
  const status = appt.cancelled ? "Cancelled" : appt.appointment_status || "Scheduled";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-sm font-bold text-gray-800 truncate">{appt.reason || "Consultation"}</p>
          {appt.doctor_name && <p className="text-xs text-gray-500 mt-0.5">{appt.doctor_name}</p>}
        </div>
        <StatusBadge label={status} />
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1"><Calendar size={13} />{appt.appointment_date}</span>
        <span className="flex items-center gap-1"><Clock size={13} />{appt.appointment_time || "—"}</span>
        {appt.appointment_mode && (
          <span className="text-[11px] font-semibold text-gray-400 uppercase">{appt.appointment_mode}</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        {appt.token_id ? (
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">Token #{appt.token_id}</span>
        ) : <span />}
        {showCancel && (
          <button onClick={onCancel} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600">
            <X size={14} />Cancel
          </button>
        )}
      </div>
    </div>
  );
}
