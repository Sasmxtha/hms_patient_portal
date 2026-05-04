import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, CalendarPlus, FlaskConical, FileText, CreditCard, ChevronRight, Calendar, Clock,
} from "lucide-react";
import { getPatient } from "../store/auth";
import { getPatientAppointments } from "../api/appointments";
import dayjs from "dayjs";

const QUICK_ACTIONS = [
  { label: "Book Appt",   icon: CalendarPlus, path: "/book",        color: "bg-teal-50 text-teal-600" },
  { label: "Lab Reports", icon: FlaskConical,  path: "/lab-reports", color: "bg-purple-50 text-purple-600" },
  { label: "Records",     icon: FileText,      path: "/records",     color: "bg-blue-50 text-blue-600" },
  { label: "Billing",     icon: CreditCard,    path: "/billing",     color: "bg-orange-50 text-orange-600" },
];

const STATUS_COLOR = {
  Scheduled: "bg-blue-100 text-blue-700",
  Waiting:   "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-600",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const patient = getPatient();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const firstName = patient?.firstname ?? "Patient";
  const lastName  = patient?.lastname  ?? "";
  const initials  = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  useEffect(() => {
    getPatientAppointments()
      .then((d) => setAppointments(Array.isArray(d) ? d : []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  const today    = dayjs().format("YYYY-MM-DD");
  const upcoming = appointments
    .filter((a) => !a.cancelled && a.appointment_date >= today)
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
    .slice(0, 3);
  const recent = appointments
    .filter((a) => !a.cancelled && a.appointment_date < today)
    .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
    .slice(0, 2);

  return (
    <div className="flex flex-col bg-gray-50 pb-6">
      {/* Hero */}
      <div className="bg-[#115E59] px-6 pt-12 pb-24 rounded-b-[2.5rem]">
        <div className="flex justify-between items-center text-white mb-6">
          <div>
            <h1 className="text-2xl font-bold">Hello, {firstName}! 👋</h1>
            <p className="text-teal-200 text-sm mt-0.5">Hope you are feeling well today.</p>
          </div>
          <button className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-colors">
            <Bell size={22} />
          </button>
        </div>

        {/* Patient card */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-700 rounded-2xl p-5 border border-teal-600/40 shadow-lg relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/5 rounded-full blur-xl" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">{firstName} {lastName}</p>
              {patient?.disease && <p className="text-teal-200 text-xs mt-0.5">{patient.disease}</p>}
            </div>
          </div>
          {patient?.last_visited_doctor && (
            <div className="mt-4 pt-4 border-t border-teal-600/30">
              <p className="text-teal-300 text-[11px] font-semibold uppercase tracking-wider mb-0.5">Last Visit</p>
              <p className="text-white text-sm font-semibold">
                {patient.last_visited_doctor}
                {patient.last_visited_date && (
                  <span className="text-teal-200 font-normal"> · {patient.last_visited_date}</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 -mt-12 z-10 space-y-6">
        {/* Quick actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ label, icon: Icon, path, color }) => (
            <button key={label} onClick={() => navigate(path)} className="flex flex-col items-center gap-1.5 group">
              <div className={`p-3 rounded-xl ${color} group-hover:opacity-80 transition-opacity`}>
                <Icon size={22} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>

        {/* Upcoming appointments */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upcoming Appointments</h2>
            <button onClick={() => navigate("/appointments")} className="text-teal-600 text-xs font-bold hover:underline">View All</button>
          </div>
          {loading ? (
            <div className="bg-white rounded-2xl p-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <Calendar size={28} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">No upcoming appointments</p>
              <button onClick={() => navigate("/book")} className="mt-3 text-teal-600 text-sm font-bold hover:underline">Book one now →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => <AppointmentCard key={a.appointment_id} appt={a} />)}
            </div>
          )}
        </section>

        {/* Recent visits */}
        {recent.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Visits</h2>
              <button onClick={() => navigate("/appointments")} className="text-teal-600 text-xs font-bold hover:underline">View All</button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {recent.map((a) => (
                <div key={a.appointment_id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => navigate("/appointments")}>
                  <div className="p-2 bg-gray-100 rounded-xl text-gray-500"><Calendar size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{a.reason || "Consultation"}</p>
                    <p className="text-xs text-gray-400">{a.appointment_date}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Patient info */}
        {patient && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Your Details</h2>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {[
                { label: "Full Name",    value: `${firstName} ${lastName}`.trim() },
                { label: "Gender",       value: patient.gender },
                { label: "Age",          value: patient.age ? `${patient.age} years` : null },
                { label: "Date of Birth",value: patient.dob },
                { label: "Mobile",       value: patient.contact_number },
                { label: "Email",        value: patient.email_id },
                { label: "ABHA ID",      value: patient.ABDM_ABHA_id },
              ].filter((r) => r.value).map((row) => (
                <div key={row.label} className="flex justify-between items-center px-4 py-3">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{row.label}</span>
                  <span className="text-sm font-medium text-gray-800 text-right max-w-[55%] truncate">{row.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ appt }) {
  const statusCls = STATUS_COLOR[appt.appointment_status] || "bg-gray-100 text-gray-600";
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm font-bold text-gray-800">{appt.reason || "Consultation"}</p>
          {appt.doctor_name && <p className="text-xs text-gray-500 mt-0.5">{appt.doctor_name}</p>}
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusCls}`}>
          {appt.appointment_status || "Scheduled"}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Calendar size={13} />{appt.appointment_date}</span>
        <span className="flex items-center gap-1"><Clock size={13} />{appt.appointment_time || "—"}</span>
        {appt.token_id && (
          <span className="ml-auto font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">#{appt.token_id}</span>
        )}
      </div>
    </div>
  );
}
