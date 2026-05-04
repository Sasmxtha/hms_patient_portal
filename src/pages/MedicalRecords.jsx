import { useEffect, useState } from "react";
import { FileText, Pill, FlaskConical, Activity, ChevronDown, ChevronUp, Upload, Eye, AlertTriangle } from "lucide-react";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { getDiagnoses, getPatientReports, getReportFileBlob } from "../api/records";

const TABS = ["Diagnoses", "Uploaded Files"];

export default function MedicalRecordsPage() {
  const [activeTab, setActiveTab] = useState("Diagnoses");
  const [diagnoses, setDiagnoses] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    Promise.all([
      getDiagnoses().then(setDiagnoses).catch(() => setDiagnoses([])),
      getPatientReports().then(setReports).catch(() => setReports([])),
    ]).finally(() => setLoading(false));
  }, []);

  function toggleExpand(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <PageHeader title="Health Records" />

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
        ) : activeTab === "Diagnoses" ? (
          diagnoses.length === 0 ? (
            <EmptyState icon={<FileText size={28} />} title="No diagnosis records" subtitle="Your diagnosis history will appear here after your visits." />
          ) : (
            <div className="space-y-4">
              {diagnoses.map((diag) => (
                <DiagnosisCard
                  key={diag.diagnosis_id}
                  diag={diag}
                  expanded={!!expanded[diag.diagnosis_id]}
                  onToggle={() => toggleExpand(diag.diagnosis_id)}
                />
              ))}
            </div>
          )
        ) : (
          reports.length === 0 ? (
            <EmptyState icon={<Upload size={28} />} title="No uploaded files" subtitle="Reports uploaded by the clinic will appear here." />
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportFileCard key={report.upload_id} report={report} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function DiagnosisCard({ diag, expanded, onToggle }) {
  const prescriptions = diag.prescriptions || [];
  const labTests      = diag.lab_tests    || [];
  const symptoms      = diag.symptoms     || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0"><FileText size={20} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800">{diag.chief_complaint || "Consultation"}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {diag.diagnosis_date}
            {diag.doctor_name && <span className="ml-2 text-gray-400">· {diag.doctor_name}</span>}
          </p>
        </div>
        {expanded ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {/* Vitals */}
          {(diag.vital_bp || diag.vital_hr || diag.vital_temp || diag.vital_spo2) && (
            <Section icon={Activity} title="Vitals" color="text-rose-500 bg-rose-50">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "BP",     value: diag.vital_bp },
                  { label: "HR",     value: diag.vital_hr   ? `${diag.vital_hr} bpm`  : null },
                  { label: "Temp",   value: diag.vital_temp ? `${diag.vital_temp}°F`  : null },
                  { label: "SpO₂",   value: diag.vital_spo2 ? `${diag.vital_spo2}%`  : null },
                  { label: "Weight", value: diag.weight     ? `${diag.weight} kg`     : null },
                  { label: "Height", value: diag.height     ? `${diag.height} cm`     : null },
                ].filter((v) => v.value).map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                    <p className="text-sm font-bold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Symptoms */}
          {symptoms.length > 0 && (
            <Section icon={AlertTriangle} title="Symptoms" color="text-amber-500 bg-amber-50">
              <div className="flex flex-wrap gap-2">
                {symptoms.map((s, i) => (
                  <span key={i} className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full">
                    {s.symptom_name}
                    {s.duration_days && <span className="text-amber-500 ml-1">· {s.duration_days}d</span>}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Prescriptions */}
          {prescriptions.length > 0 && (
            <Section icon={Pill} title="Prescriptions" color="text-teal-600 bg-teal-50">
              <div className="space-y-2">
                {prescriptions.map((p, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-gray-800">{p.medicine_name || `Medicine #${p.medicine_id}`}</p>
                      {p.frequency && (
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">{p.frequency}</span>
                      )}
                    </div>
                    {(p.morning_dosage || p.afternoon_dosage || p.night_dosage) && (
                      <p className="text-xs text-gray-500 mt-1">
                        M: {p.morning_dosage || "0"} · A: {p.afternoon_dosage || "0"} · N: {p.night_dosage || "0"}
                        {p.duration_days && ` · ${p.duration_days} days`}
                      </p>
                    )}
                    {p.special_instructions && <p className="text-xs text-gray-400 mt-0.5 italic">{p.special_instructions}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Lab Tests */}
          {labTests.length > 0 && (
            <Section icon={FlaskConical} title="Lab Tests Ordered" color="text-purple-600 bg-purple-50">
              <div className="flex flex-wrap gap-2">
                {labTests.map((t, i) => (
                  <span key={i} className="text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full">
                    {t.test_name || `Test #${t.test_id}`}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {diag.followup_date && (
            <div className="px-4 py-3 bg-teal-50/50">
              <p className="text-xs font-bold text-teal-700">Follow-up: {diag.followup_date}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, color, children }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-2.5">
        <div className={`p-1.5 rounded-lg ${color}`}><Icon size={14} /></div>
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</p>
      </div>
      {children}
    </div>
  );
}

function ReportFileCard({ report }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const ext = report.filename?.split(".").pop()?.toLowerCase() || "";
  const isPdf   = ext === "pdf";
  const isImage = ["jpg", "jpeg", "png"].includes(ext);

  async function handleView() {
    if (blobUrl) { window.open(blobUrl, "_blank"); return; }
    setLoading(true);
    try {
      const url = await getReportFileBlob(report.upload_id);
      setBlobUrl(url);
      window.open(url, "_blank");
    } catch {
      alert("Could not load file. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
      <div className={`p-3 rounded-xl flex-shrink-0 ${isPdf ? "bg-red-50 text-red-500" : isImage ? "bg-blue-50 text-blue-500" : "bg-gray-100 text-gray-500"}`}>
        <FileText size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 truncate">{report.file_title || report.filename}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {report.date}
          {report.file_size > 0 && <span className="ml-2">{(report.file_size / 1024).toFixed(1)} KB</span>}
        </p>
      </div>
      <button
        onClick={handleView}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors flex-shrink-0 disabled:opacity-60"
      >
        <Eye size={14} />{loading ? "…" : "View"}
      </button>
    </div>
  );
}
