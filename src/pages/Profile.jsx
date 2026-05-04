import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Activity,
  Shield,
  User,
  Edit3,
  Check,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { getPatient, clearSession } from "../store/auth";

function InfoRow({ icon: Icon, label, value, editable, name, onChange, editMode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="mt-0.5 p-2 bg-teal-50 rounded-lg text-teal-600 flex-shrink-0">
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        {editable && editMode ? (
          <input
            name={name}
            value={value || ""}
            onChange={onChange}
            className="w-full text-sm font-medium text-gray-800 border-b-2 border-teal-400 bg-transparent outline-none pb-0.5"
          />
        ) : (
          <p className="text-sm font-medium text-gray-800 truncate">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(getPatient);
  const [draft, setDraft] = useState(getPatient);
  const [editMode, setEditMode] = useState(false);

  if (!patient) {
    navigate("/login", { replace: true });
    return null;
  }

  const firstName = patient.firstname || "Patient";
  const lastName = patient.lastname || "";
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();

  function handleChange(e) {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  }

  function handleSave() {
    setPatient(draft);
    localStorage.setItem("patient_info", JSON.stringify(draft));
    setEditMode(false);
  }

  function handleCancel() {
    setDraft(patient);
    setEditMode(false);
  }

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-[#115E59] px-5 pt-12 pb-20 relative">
        <div className="flex justify-between items-center">
          <h1 className="text-white text-base font-bold tracking-wide">My Profile</h1>
          {editMode ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors"
                aria-label="Cancel"
              >
                <X size={17} />
              </button>
              <button
                onClick={handleSave}
                className="bg-white text-teal-700 p-2 rounded-full hover:bg-teal-50 transition-colors"
                aria-label="Save"
              >
                <Check size={17} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-colors"
              aria-label="Edit profile"
            >
              <Edit3 size={17} />
            </button>
          )}
        </div>
      </div>

      {/* Avatar card — overlaps header */}
      <div className="px-5 -mt-14 z-10 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-md">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {editMode ? (
              <div className="flex gap-2">
                <input
                  name="firstname"
                  value={draft.firstname || ""}
                  onChange={handleChange}
                  className="w-1/2 text-base font-bold text-gray-800 border-b-2 border-teal-400 bg-transparent outline-none"
                  placeholder="First name"
                />
                <input
                  name="lastname"
                  value={draft.lastname || ""}
                  onChange={handleChange}
                  className="w-1/2 text-base font-bold text-gray-800 border-b-2 border-teal-400 bg-transparent outline-none"
                  placeholder="Last name"
                />
              </div>
            ) : (
              <h2 className="text-base font-bold text-gray-800 truncate">
                {firstName} {lastName}
              </h2>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {patient.gender && (
                <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  {patient.gender}
                </span>
              )}
              {patient.age && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                  Age {patient.age}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4 pb-8">
        {/* Contact info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-3 pb-1">
            Contact Information
          </p>
          <InfoRow
            icon={Phone}
            label="Mobile"
            value={editMode ? draft.contact_number : patient.contact_number}
            editable
            name="contact_number"
            onChange={handleChange}
            editMode={editMode}
          />
          <InfoRow
            icon={Mail}
            label="Email"
            value={editMode ? draft.email_id : patient.email_id}
            editable
            name="email_id"
            onChange={handleChange}
            editMode={editMode}
          />
          <InfoRow
            icon={MapPin}
            label="Address"
            value={editMode ? draft.address : patient.address}
            editable
            name="address"
            onChange={handleChange}
            editMode={editMode}
          />
        </div>

        {/* Personal details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-3 pb-1">
            Personal Details
          </p>
          <InfoRow
            icon={Calendar}
            label="Date of Birth"
            value={patient.dob}
            editable={false}
            editMode={false}
          />
          <InfoRow
            icon={Activity}
            label="Primary Condition"
            value={editMode ? draft.disease : patient.disease}
            editable
            name="disease"
            onChange={handleChange}
            editMode={editMode}
          />
          <InfoRow
            icon={Shield}
            label="ABHA ID"
            value={patient.ABDM_ABHA_id}
            editable={false}
            editMode={false}
          />
        </div>

        {/* Last visit */}
        {(patient.last_visited_doctor || patient.last_visited_date) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pt-3 pb-1">
              Last Visit
            </p>
            <InfoRow
              icon={User}
              label="Doctor"
              value={patient.last_visited_doctor}
              editable={false}
              editMode={false}
            />
            <InfoRow
              icon={Calendar}
              label="Date"
              value={patient.last_visited_date}
              editable={false}
              editMode={false}
            />
          </div>
        )}

        {/* Quick links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {[
            { label: "My Appointments", path: "/appointments" },
            { label: "Lab Reports", path: "/lab-reports" },
            { label: "Health Records", path: "/records" },
            { label: "Billing & Payments", path: "/billing" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-700">{item.label}</span>
              <ChevronRight size={17} className="text-gray-400" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
