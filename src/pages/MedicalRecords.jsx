import { useEffect, useRef, useState } from "react";
import {
  FileText, Pill, FlaskConical, Activity, ChevronDown, ChevronUp,
  Upload, Eye, AlertTriangle, Stethoscope, Plus, X, CheckCircle2,
  ImageIcon, FileIcon, Loader2,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import {
  getDiagnoses,
  getPatientReports,
  getReportFileBlob,
  uploadPatientReport,
} from "../api/records";
import dayjs from "dayjs";

const TABS = ["Diagnoses", "Lab Reports", "Health Records"];

// ─── Allowed file types ───────────────────────────────────────────────────────
const ACCEPT = ".pdf,.jpg,.jpeg,.png";
const MAX_MB  = 10;

export default function MedicalRecordsPage() {
  const [activeTab, setActiveTab]   = useState("Diagnoses");
  const [diagnoses, setDiagnoses]   = useState([]);
  const [reports,   setReports]     = useState([]);   // all uploaded reports
  const [loading,   setLoading]     = useState(true);
  const [expanded,  setExpanded]    = useState({});

  // Upload sheet state
  const [uploadSheet, setUploadSheet] = useState(null); // "lab" | "health" | null
  const [uploadFile,  setUploadFile]  = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDate,  setUploadDate]  = useState(dayjs().format("YYYY-MM-DD"));
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadDone,  setUploadDone]  = useState(false);
  const fileInputRef = useRef(null);

  function loadData() {
    setLoading(true);
    Promise.all([
      getDiagnoses().then(setDiagnoses).catch(() => setDiagnoses([])),
      getPatientReports().then(setReports).catch(() => setReports([])),
    ]).finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  function toggleExpand(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Filter reports by type
  const labReports    = reports.filter((r) => (r.report_type || "").toLowerCase() === "lab");
  const healthReports = reports.filter((r) => (r.report_type || "").toLowerCase() === "health");

  // ── Upload handlers ──────────────────────────────────────────────────────────
  function openUpload(type) {
    setUploadSheet(type);
    setUploadFile(null);
    setUploadTitle("");
    setUploadDate(dayjs().format("YYYY-MM-DD"));
    setUploadError("");
    setUploadDone(false);
  }

  function closeUpload() {
    setUploadSheet(null);
    setUploadFile(null);
    setUploadError("");
    setUploadDone(false);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`File too large. Max ${MAX_MB} MB allowed.`);
      return;
    }
    setUploadError("");
    setUploadFile(file);
    if (!uploadTitle.trim()) {
      setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function handleUpload() {
    if (!uploadFile) { setUploadError("Please select a file."); return; }
    if (!uploadDate)  { setUploadError("Please select a date."); return; }
    setUploading(true);
    setUploadError("");
    try {
      await uploadPatientReport({
        reportType: uploadSheet,   // "lab" or "health"
        reportDate: uploadDate,
        fileTitle:  uploadTitle.trim() || uploadFile.name,
        file:       uploadFile,
      });
      setUploadDone(true);
      // Refresh reports list
      getPatientReports().then(setReports).catch(() => {});
    } catch (err) {
      setUploadError(err.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <PageHeader title="Health Records" />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 flex sticky top-0 z-10 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
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
        ) : activeTab === "Diagnoses" ? (
          /* ── Diagnoses ── */
          diagnoses.length === 0 ? (
            <EmptyState
              icon={<FileText size={28} />}
              title="No diagnosis records"
              subtitle="Your diagnosis history will appear here after your visits."
            />
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
        ) : activeTab === "Lab Reports" ? (
          /* ── Lab Reports ── */
          <ReportsTab
            reports={labReports}
            type="lab"
            emptyTitle="No lab reports uploaded"
            emptySubtitle="Upload your lab reports — blood tests, X-rays, scans, etc."
            onUpload={() => openUpload("lab")}
          />
        ) : (
          /* ── Health Records ── */
          <ReportsTab
            reports={healthReports}
            type="health"
            emptyTitle="No health records uploaded"
            emptySubtitle="Upload prescriptions, discharge summaries, or any health documents."
            onUpload={() => openUpload("health")}
          />
        )}
      </div>

      {/* ── Upload bottom sheet ── */}
      {uploadSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={!uploading ? closeUpload : undefined}
          />

          <div className="relative bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800">
                Upload {uploadSheet === "lab" ? "Lab Report" : "Health Record"}
              </h3>
              {!uploading && (
                <button
                  onClick={closeUpload}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {uploadDone ? (
              /* Success state */
              <div className="flex flex-col items-center py-6">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 size={36} className="text-teal-600" />
                </div>
                <p className="text-base font-bold text-gray-800 mb-1">Uploaded!</p>
                <p className="text-sm text-gray-500 mb-5">Your file has been saved.</p>
                <button
                  onClick={closeUpload}
                  className="w-full py-3.5 rounded-2xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File picker */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-2xl p-5 flex flex-col items-center gap-2 transition-colors ${
                    uploadFile
                      ? "border-teal-400 bg-teal-50"
                      : "border-gray-200 bg-gray-50 hover:border-teal-300"
                  }`}
                >
                  {uploadFile ? (
                    <>
                      <FileIcon size={28} className="text-teal-600" />
                      <p className="text-sm font-bold text-teal-700 text-center break-all">
                        {uploadFile.name}
                      </p>
                      <p className="text-xs text-teal-500">
                        {(uploadFile.size / 1024).toFixed(1)} KB · Tap to change
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload size={28} className="text-gray-400" />
                      <p className="text-sm font-semibold text-gray-600">
                        Tap to select file
                      </p>
                      <p className="text-xs text-gray-400">PDF, JPG, PNG · Max {MAX_MB} MB</p>
                    </>
                  )}
                </button>

                {/* Title */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Blood Test — May 2026"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-teal-500 bg-gray-50 focus:bg-white transition-colors placeholder-gray-400"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                    Report Date
                  </label>
                  <input
                    type="date"
                    value={uploadDate}
                    max={dayjs().format("YYYY-MM-DD")}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-teal-500 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>

                {/* Error */}
                {uploadError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-600 text-sm font-medium">{uploadError}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleUpload}
                  disabled={uploading || !uploadFile}
                  className="w-full py-4 rounded-2xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition-colors disabled:opacity-50 active:scale-[0.98]"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Uploading…
                    </span>
                  ) : (
                    "Upload File"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reports Tab (Lab / Health) ────────────────────────────────────────────────

function ReportsTab({ reports, type, emptyTitle, emptySubtitle, onUpload }) {
  return (
    <div>
      {/* Upload button always visible at top */}
      <button
        onClick={onUpload}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50 text-teal-700 font-bold text-sm hover:bg-teal-100 active:scale-[0.98] transition-all mb-4"
      >
        <Plus size={18} />
        Upload {type === "lab" ? "Lab Report" : "Health Record"}
      </button>

      {reports.length === 0 ? (
        <EmptyState
          icon={type === "lab" ? <FlaskConical size={28} /> : <FileText size={28} />}
          title={emptyTitle}
          subtitle={emptySubtitle}
        />
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportFileCard key={report.upload_id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Diagnosis Card ────────────────────────────────────────────────────────────

function DiagnosisCard({ diag, expanded, onToggle }) {
  const prescriptions = diag.prescriptions || [];
  const labTests      = diag.lab_tests     || [];
  const symptoms      = diag.symptoms      || [];
  const procedures    = diag.procedures    || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
      >
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
          <FileText size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800">
            {diag.chief_complaint || "Consultation"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {diag.diagnosis_date}
            {diag.doctor_name && (
              <span className="ml-2 text-gray-400">· {diag.doctor_name}</span>
            )}
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">

          {/* Vitals */}
          {(diag.vital_bp || diag.vital_hr || diag.vital_temp || diag.vital_spo2) && (
            <Section icon={Activity} title="Vitals" color="text-rose-500 bg-rose-50">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "BP",     value: diag.vital_bp },
                  { label: "HR",     value: diag.vital_hr   ? `${diag.vital_hr} bpm` : null },
                  { label: "Temp",   value: diag.vital_temp ? `${diag.vital_temp}°F` : null },
                  { label: "SpO₂",   value: diag.vital_spo2 ? `${diag.vital_spo2}%` : null },
                  { label: "Weight", value: diag.weight     ? `${diag.weight} kg`    : null },
                  { label: "Height", value: diag.height     ? `${diag.height} cm`    : null },
                ]
                  .filter((v) => v.value)
                  .map(({ label, value }) => (
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
                  <span
                    key={i}
                    className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full"
                  >
                    {s.symptom_name}
                    {s.duration_days && (
                      <span className="text-amber-500 ml-1">· {s.duration_days}d</span>
                    )}
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
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-bold text-gray-800 flex-1 min-w-0">
                        {p.medicine_name || "Medicine"}
                      </p>
                      {p.frequency && (
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full flex-shrink-0">
                          {p.frequency}
                        </span>
                      )}
                    </div>
                    {(p.morning_dosage || p.afternoon_dosage || p.night_dosage) && (
                      <p className="text-xs text-gray-500 mt-1">
                        M: {p.morning_dosage || "0"} · A: {p.afternoon_dosage || "0"} · N:{" "}
                        {p.night_dosage || "0"}
                        {p.duration_days && ` · ${p.duration_days} days`}
                      </p>
                    )}
                    {p.special_instructions && (
                      <p className="text-xs text-gray-400 mt-0.5 italic">
                        {p.special_instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Lab Tests Ordered */}
          {labTests.length > 0 && (
            <Section icon={FlaskConical} title="Lab Tests Ordered" color="text-purple-600 bg-purple-50">
              <div className="flex flex-wrap gap-2">
                {labTests.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full"
                  >
                    {t.test_name || "Lab Test"}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Procedures */}
          {procedures.length > 0 && (
            <Section icon={Stethoscope} title="Procedures Suggested" color="text-indigo-600 bg-indigo-50">
              <div className="space-y-2">
                {procedures.map((pr, i) => {
                  // backend may return procedure_name OR free_text_procedure OR procedure_text
                  const name =
                    pr.procedure_name ||
                    pr.free_text_procedure ||
                    pr.procedure_text ||
                    "Procedure";
                  return (
                    <div
                      key={i}
                      className="bg-indigo-50/60 border border-indigo-100 rounded-xl px-3 py-2.5 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Stethoscope size={14} className="text-indigo-500 flex-shrink-0" />
                          <p className="text-sm font-bold text-gray-800">{name}</p>
                        </div>
                        {pr.prerequisite_text && (
                          <p className="text-xs text-gray-400 mt-0.5 italic pl-5">
                            {pr.prerequisite_text}
                          </p>
                        )}
                      </div>
                      {pr.price != null && pr.price > 0 && (
                        <span className="text-sm font-bold text-indigo-700 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg flex-shrink-0">
                          ₹{Number(pr.price).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Follow-up */}
          {diag.followup_date && (
            <div className="px-4 py-3 bg-teal-50/50">
              <p className="text-xs font-bold text-teal-700">
                📅 Follow-up: {diag.followup_date}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ icon: Icon, title, color, children }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-2.5">
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon size={14} />
        </div>
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</p>
      </div>
      {children}
    </div>
  );
}

// ── Report File Card ──────────────────────────────────────────────────────────

function ReportFileCard({ report }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const ext     = (report.filename || "").split(".").pop().toLowerCase();
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
      <div
        className={`p-3 rounded-xl flex-shrink-0 ${
          isPdf   ? "bg-red-50 text-red-500"
          : isImage ? "bg-blue-50 text-blue-500"
          : "bg-gray-100 text-gray-500"
        }`}
      >
        {isImage ? <ImageIcon size={22} /> : <FileIcon size={22} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 truncate">
          {report.file_title || report.filename}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {report.date}
          {report.file_size > 0 && (
            <span className="ml-2">{(report.file_size / 1024).toFixed(1)} KB</span>
          )}
        </p>
      </div>
      <button
        onClick={handleView}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-bold text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-lg hover:bg-teal-100 active:scale-95 transition-all flex-shrink-0 disabled:opacity-60"
      >
        <Eye size={14} />
        {loading ? "…" : "View"}
      </button>
    </div>
  );
}
