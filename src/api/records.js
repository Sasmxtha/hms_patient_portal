import api from "./client";

/** GET /portal/lab-results */
export async function getLabResults() {
  const res = await api.get("/portal/lab-results");
  return res.data;
}

/** GET /portal/reports */
export async function getPatientReports() {
  const res = await api.get("/portal/reports");
  return res.data;
}

/**
 * Returns a URL to stream a report file.
 * The X-Patient-Token header is added by the axios interceptor,
 * but for direct window.open() we need to fetch via axios and create a blob URL.
 */
export async function getReportFileBlob(uploadId) {
  const res = await api.get("/portal/reports/file", {
    params: { upload_id: uploadId },
    responseType: "blob",
  });
  return URL.createObjectURL(res.data);
}

/** POST /portal/reports/upload */
export async function uploadPatientReport({ reportType, reportDate, fileTitle, file }) {
  const formData = new FormData();
  formData.append("report_type", reportType);
  formData.append("report_date", reportDate);
  if (fileTitle?.trim()) {
    formData.append("file_title", fileTitle.trim());
  }
  formData.append("file", file);

  try {
    const res = await api.post("/portal/reports/upload", formData);
    return res.data;
  } catch (err) {
    // Some deployments differ on strict trailing-slash handling.
    if (err?.response?.status === 404) {
      const retryRes = await api.post("/portal/reports/upload/", formData);
      return retryRes.data;
    }
    throw err;
  }
}

/** GET /portal/diagnoses */
export async function getDiagnoses() {
  const res = await api.get("/portal/diagnoses");
  return res.data;
}

/** GET /portal/billing */
export async function getBilling() {
  const res = await api.get("/portal/billing");
  return res.data;
}
