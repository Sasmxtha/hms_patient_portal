import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Plus, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { getPatientAppointments, deleteAppointment } from "../api/appointments";
import dayjs from "dayjs";

const TABS = ["Upcoming", "Past"];

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const today = dayjs().format("YYYY-MM-DD");

  const fetchAppointments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getPatientAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Re-fetch when app comes back into focus (catches staff-deleted rows)
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") fetchAppointments(true);
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchAppointments]);

  const filtered = appointments
    .filter((a) => {
      // exclude cancelled rows from both tabs — they're gone from the patient's view
      if (a.cancelled) return false;
      if (activeTab === "Upcoming") return a.appointment_date >= today;
      if (activeTab === "Past")     return a.appointment_date < today;
      return true;
    })
    .sort((a, b) =>
      activeTab === "Upcoming"
        ? a.appointment_date.localeCompare(b.appointment_date)
        : b.appointment_date.localeCompare(a.appointment_date)
    );

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAppointment(deleteTarget.appointment_id);
      await fetchAppointments(true);
      setDeleteTarget(null);
    } catch (err) {
      const detail = err.response?.data?.detail || "";
      if (err.response?.status === 404 || detail.toLowerCase().includes("not found")) {
        // Already gone — just refresh
        await fetchAppointments(true);
        setDeleteTarget(null);
      } else {
        setDeleteError(detail || "Could not remove appointment. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <PageHeader
        title="My Appointments"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAppointments(true)}
              disabled={refreshing}
              className="bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => navigate("/book")}
              className="bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors"
              aria-label="Book"
            >
              <Plus size={20} />
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4 flex gap-1 sticky top-0 z-10">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-gray-400 hover:text-gray-600"
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
                <button
                  onClick={() => navigate("/book")}
                  className="bg-teal-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-teal-700 transition-colors"
                >
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
                canDelete={(a.appointment_status || "Scheduled") === "Scheduled"}
                onDelete={() => { setDeleteTarget(a); setDeleteError(""); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-full text-red-500">
                <Trash2 size={20} />
              </div>
              <h3 className="text-base font-bold text-gray-800">Remove Appointment?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-1">
              This will permanently remove your appointment with{" "}
              <strong>{deleteTarget.doctor_name}</strong>.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{deleteTarget.appointment_date}</strong> at{" "}
              <strong>
                {deleteTarget.appointment_time
                  ? fmt12(deleteTarget.appointment_time)
                  : "—"}
              </strong>
            </p>
            {deleteError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm font-medium">{deleteError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                Keep It
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Removing…
                  </span>
                ) : (
                  "Yes, Remove"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt12(hhmm) {
  if (!hhmm) return "";
  const [h, m] = String(hhmm).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// ── Appointment Card ──────────────────────────────────────────────────────────

function AppointmentCard({ appt, canDelete, onDelete }) {
  const status      = appt.appointment_status || "Scheduled";
  const isWaiting   = status === "Waiting";
  const isCompleted = status === "Completed";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      {/* Top row */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-sm font-bold text-gray-800 truncate">
            {appt.reason || "Consultation"}
          </p>
          {appt.doctor_name && (
            <p className="text-xs text-gray-500 mt-0.5">{appt.doctor_name}</p>
          )}
        </div>
        <StatusBadge label={status} />
      </div>

      {/* Date / time row */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Calendar size={13} />
          {appt.appointment_date}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={13} />
          {appt.appointment_time ? fmt12(appt.appointment_time) : "—"}
        </span>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        {appt.token_id ? (
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
            Token #{appt.token_id}
          </span>
        ) : (
          <span />
        )}

        {canDelete ? (
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 active:scale-95 transition-all py-1 px-2 rounded-lg hover:bg-red-50"
          >
            <Trash2 size={13} />
            Remove
          </button>
        ) : (isWaiting || isCompleted) ? (
          <span className="text-[11px] font-semibold text-gray-400 italic">
            {isWaiting ? "In queue" : "Completed"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
