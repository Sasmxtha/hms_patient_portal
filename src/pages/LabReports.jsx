import { useEffect, useState } from "react";
import { FlaskConical, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { getLabResults } from "../api/records";

export default function LabReportsPage() {
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    getLabResults()
      .then((d) => setLabResults(Array.isArray(d) ? d : []))
      .catch(() => setLabResults([]))
      .finally(() => setLoading(false));
  }, []);

  function toggleExpand(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <PageHeader title="Lab Reports" />
      <div className="p-4 flex-1">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : labResults.length === 0 ? (
          <EmptyState
            icon={<FlaskConical size={28} />}
            title="No lab reports yet"
            subtitle="Your lab results will appear here once they are uploaded by the clinic."
          />
        ) : (
          <div className="space-y-4">
            {labResults.map((result) => (
              <LabResultCard
                key={result.result_id}
                result={result}
                expanded={!!expanded[result.result_id]}
                onToggle={() => toggleExpand(result.result_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LabResultCard({ result, expanded, onToggle }) {
  const items = result.items || [];
  const abnormalCount = items.filter((i) => i.is_abnormal).length;
  const hasCritical = abnormalCount > 0;

  // Group by section
  const sections = {};
  for (const item of items) {
    const sec = item.section || "Results";
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(item);
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${hasCritical ? "border-red-200" : "border-gray-100"}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors">
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${hasCritical ? "bg-red-50 text-red-500" : "bg-purple-50 text-purple-600"}`}>
          <FlaskConical size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800">Token #{result.token_number}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {result.appointment_date || result.token_date}
            {result.reported_at && <span className="ml-2 text-gray-400">· Reported {result.reported_at.slice(0, 10)}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasCritical ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
              <AlertTriangle size={11} />{abnormalCount} Abnormal
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
              <CheckCircle size={11} />All Normal
            </span>
          )}
          {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          {Object.entries(sections).map(([section, sectionItems]) => (
            <div key={section}>
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{section}</p>
              </div>
              <div className="divide-y divide-gray-50">
                {sectionItems.map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between px-4 py-3 ${item.is_abnormal ? "bg-red-50/40" : ""}`}>
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.test_name}</p>
                      {item.normal_range_text && <p className="text-[11px] text-gray-400 mt-0.5">Normal: {item.normal_range_text}</p>}
                      {item.remarks && <p className="text-[11px] text-gray-500 mt-0.5 italic">{item.remarks}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${item.is_abnormal ? "text-red-600" : "text-gray-800"}`}>
                        {item.result_value}
                        {item.unit_text && <span className="text-xs font-normal text-gray-400 ml-1">{item.unit_text}</span>}
                      </p>
                      {item.is_abnormal && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500 justify-end mt-0.5">
                          <AlertTriangle size={10} />Abnormal
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
