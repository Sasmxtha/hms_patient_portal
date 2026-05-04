import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Calendar, Clock, User, ChevronDown,
  ChevronLeft, ChevronRight, AlertCircle,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { getDoctors, getDoctorAvailability, bookAppointment } from "../api/appointments";
import dayjs from "dayjs";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt12(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// ─── Date strip (horizontal scrollable week) ──────────────────────────────────

function DateStrip({ selected, onChange, minDate, maxDate }) {
  // Show 14 days starting from today
  const days = Array.from({ length: 14 }, (_, i) =>
    dayjs(minDate).add(i, "day")
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      {days.map((d) => {
        const val     = d.format("YYYY-MM-DD");
        const isToday = val === dayjs().format("YYYY-MM-DD");
        const active  = val === selected;
        const past    = d.isBefore(dayjs(), "day");

        return (
          <button
            key={val}
            disabled={past}
            onClick={() => onChange(val)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl border-2 transition-all select-none
              ${past
                ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                : active
                ? "border-teal-600 bg-teal-600 shadow-lg shadow-teal-600/25"
                : "border-gray-200 bg-white hover:border-teal-300 active:scale-95"
              }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wide
              ${active ? "text-teal-100" : "text-gray-400"}`}>
              {d.format("ddd")}
            </span>
            <span className={`text-lg font-extrabold leading-tight
              ${active ? "text-white" : past ? "text-gray-300" : "text-gray-800"}`}>
              {d.format("D")}
            </span>
            {isToday && !active && (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Slot grid ────────────────────────────────────────────────────────────────

function SlotGrid({ slots, selected, onSelect }) {
  if (!slots || slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 bg-white rounded-2xl border border-gray-100">
        <Clock size={28} className="text-gray-300 mb-2" />
        <p className="text-sm font-semibold text-gray-500">No slots for this date</p>
        <p className="text-xs text-gray-400 mt-1">Try a different date or doctor</p>
      </div>
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          Available
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          Booked
        </span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
          <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" />
          Selected
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {slots.map((slot) => {
          const isSelected = slot.time === selected;
          const isBooked   = !slot.available;

          return (
            <button
              key={slot.time}
              disabled={isBooked}
              onClick={() => !isBooked && onSelect(slot.time)}
              className={`
                relative py-3 px-1 rounded-xl text-xs font-bold border-2 transition-all
                active:scale-95 select-none
                ${isBooked
                  ? "bg-red-50 border-red-200 text-red-400 cursor-not-allowed"
                  : isSelected
                  ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/30 scale-105"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 hover:scale-105"
                }
              `}
            >
              {fmt12(slot.time)}
              {isBooked && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const navigate = useNavigate();

  const [doctors,        setDoctors]        = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate,   setSelectedDate]   = useState(dayjs().format("YYYY-MM-DD"));
  const [availability,   setAvailability]   = useState(null);
  const [selectedSlot,   setSelectedSlot]   = useState("");
  const [reason,         setReason]         = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots,   setLoadingSlots]   = useState(false);
  const [booking,        setBooking]        = useState(false);
  const [error,          setError]          = useState("");
  const [confirmed,      setConfirmed]      = useState(false);
  const [bookedAppt,     setBookedAppt]     = useState(null);

  const today   = dayjs().format("YYYY-MM-DD");
  const maxDate = dayjs().add(30, "day").format("YYYY-MM-DD");

  // Load doctors
  useEffect(() => {
    getDoctors()
      .then((data) => {
        const active = (Array.isArray(data) ? data : []).filter((d) => d.is_active !== false);
        setDoctors(active);
        if (active.length > 0) setSelectedDoctor(String(active[0].id));
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDoctors(false));
  }, []);

  // Load slots when doctor or date changes
  const fetchSlots = useCallback(() => {
    if (!selectedDoctor || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot("");
    setAvailability(null);
    getDoctorAvailability(selectedDoctor, selectedDate, selectedDate)
      .then((data) => setAvailability(data))
      .catch(() => setAvailability(null))
      .finally(() => setLoadingSlots(false));
  }, [selectedDoctor, selectedDate]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // Get flat slot list for selected date
  const dayEntry = availability?.availability_details?.find((d) => d.date === selectedDate);
  const slots    = dayEntry?.slots ?? [];

  // Book
  async function handleBook() {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !reason.trim()) {
      setError("Please select a doctor, date, time slot, and enter a reason.");
      return;
    }
    setBooking(true);
    setError("");
    try {
      const data = await bookAppointment({
        doctor_id:        parseInt(selectedDoctor),
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        reason:           reason.trim(),
        payment_method:   "Cash",
      });
      setBookedAppt(data);
      setConfirmed(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  const selectedDoctorObj = doctors.find((d) => String(d.id) === selectedDoctor);

  // ── Confirmed screen ────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="flex flex-col min-h-full bg-white">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Success animation */}
          <div className="w-28 h-28 bg-teal-50 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-teal-100">
            <CheckCircle2 size={60} className="text-teal-500" strokeWidth={1.5} />
          </div>

          <h2 className="text-2xl font-extrabold text-gray-800 text-center mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-gray-500 text-center text-sm mb-6 leading-relaxed">
            Your appointment has been successfully booked.
          </p>

          {/* Booking details card */}
          <div className="w-full bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-3 mb-8">
            {[
              { icon: User,     label: "Doctor", value: bookedAppt?.doctor_name || selectedDoctorObj ? `Dr. ${selectedDoctorObj?.firstname} ${selectedDoctorObj?.lastname}` : "—" },
              { icon: Calendar, label: "Date",   value: bookedAppt?.appointment_date || selectedDate },
              { icon: Clock,    label: "Time",   value: fmt12(bookedAppt?.appointment_time || selectedSlot) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-bold text-gray-800">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Token badge */}
          {bookedAppt?.token_id && (
            <div className="w-full bg-teal-600 rounded-2xl px-6 py-4 text-center mb-6 shadow-lg shadow-teal-600/25">
              <p className="text-teal-200 text-xs font-bold uppercase tracking-widest mb-1">
                Your Queue Token
              </p>
              <p className="text-4xl font-extrabold text-white tracking-wider">
                #{bookedAppt.token_id}
              </p>
              <p className="text-teal-200 text-xs mt-1">Show this at the reception</p>
            </div>
          )}

          <div className="flex gap-3 w-full">
            <button
              onClick={() => navigate("/appointments")}
              className="flex-1 py-4 rounded-2xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 active:scale-[0.98]"
            >
              View Appointments
            </button>
            <button
              onClick={() => { setConfirmed(false); setSelectedSlot(""); setReason(""); fetchSlots(); }}
              className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors active:scale-[0.98]"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking form ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <PageHeader title="Book Appointment" back />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-5 pb-32">

          {/* ── Doctor selector ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Select Doctor
            </p>
            {loadingDoctors ? (
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ) : doctors.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} />
                No doctors available. Please contact the clinic.
              </div>
            ) : (
              <div className="space-y-2">
                {doctors.map((d) => {
                  const active = String(d.id) === selectedDoctor;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDoctor(String(d.id))}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left active:scale-[0.98]
                        ${active
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-100 bg-gray-50 hover:border-teal-200"
                        }`}
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0
                        ${active ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                        {d.firstname[0]}{d.lastname[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${active ? "text-teal-800" : "text-gray-800"}`}>
                          Dr. {d.firstname} {d.lastname}
                        </p>
                        {d.specialization && (
                          <p className="text-xs text-gray-500 truncate">{d.specialization}</p>
                        )}
                      </div>
                      {d.consultation_fee && (
                        <span className={`text-xs font-bold flex-shrink-0 ${active ? "text-teal-700" : "text-gray-500"}`}>
                          ₹{d.consultation_fee}
                        </span>
                      )}
                      {active && (
                        <div className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Date strip ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Select Date
            </p>
            <DateStrip
              selected={selectedDate}
              onChange={(d) => setSelectedDate(d)}
              minDate={today}
              maxDate={maxDate}
            />
            {/* Full date display */}
            <p className="text-xs font-semibold text-teal-700 mt-3 text-center">
              {dayjs(selectedDate).format("dddd, D MMMM YYYY")}
            </p>
          </div>

          {/* ── Slot grid ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Available Slots
              </p>
              {!loadingSlots && slots.length > 0 && (
                <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                  {slots.filter((s) => s.available).length} free
                </span>
              )}
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-4 gap-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !dayEntry?.is_available ? (
              <div className="flex flex-col items-center py-6 text-center">
                <Clock size={28} className="text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-500">
                  {dayEntry?.is_on_leave ? "Doctor is on leave" : "No schedule on this day"}
                </p>
                <p className="text-xs text-gray-400 mt-1">Try a different date</p>
              </div>
            ) : (
              <SlotGrid
                slots={slots}
                selected={selectedSlot}
                onSelect={setSelectedSlot}
              />
            )}
          </div>

          {/* ── Reason ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
              Reason for Visit
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Fever, follow-up, routine check-up…"
              rows={3}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-50 outline-none focus:border-teal-500 focus:bg-white text-gray-800 font-medium resize-none transition-colors placeholder-gray-400 text-sm"
            />
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* ── Booking summary ── */}
          {selectedSlot && reason.trim() && selectedDoctorObj && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider mb-3">
                Booking Summary
              </p>
              <div className="space-y-2">
                {[
                  { icon: User,     value: `Dr. ${selectedDoctorObj.firstname} ${selectedDoctorObj.lastname}` },
                  { icon: Calendar, value: dayjs(selectedDate).format("dddd, D MMMM YYYY") },
                  { icon: Clock,    value: fmt12(selectedSlot) },
                ].map(({ icon: Icon, value }) => (
                  <div key={value} className="flex items-center gap-2 text-sm text-teal-800 font-semibold">
                    <Icon size={14} className="text-teal-600 flex-shrink-0" />
                    {value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky confirm button ── */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-2 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent pt-4 z-40">
        <button
          onClick={handleBook}
          disabled={booking || !selectedSlot || !reason.trim() || doctors.length === 0}
          className="w-full bg-teal-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-teal-600/30 hover:bg-teal-700 transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98] text-base"
        >
          {booking ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Booking…
            </span>
          ) : selectedSlot ? (
            `Confirm — ${fmt12(selectedSlot)}`
          ) : (
            "Select a Time Slot"
          )}
        </button>
      </div>
    </div>
  );
}
