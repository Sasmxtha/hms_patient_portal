const VARIANTS = {
  Scheduled: "bg-blue-50 text-blue-700 border-blue-100",
  Waiting: "bg-amber-50 text-amber-700 border-amber-100",
  Completed: "bg-green-50 text-green-700 border-green-100",
  Cancelled: "bg-red-50 text-red-600 border-red-100",
  Paid: "bg-green-50 text-green-700 border-green-100",
  Unpaid: "bg-red-50 text-red-600 border-red-100",
  Normal: "bg-green-50 text-green-700 border-green-100",
  Abnormal: "bg-red-50 text-red-600 border-red-100",
  Critical: "bg-red-100 text-red-700 border-red-200",
};

export default function StatusBadge({ label }) {
  const cls = VARIANTS[label] || "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}
