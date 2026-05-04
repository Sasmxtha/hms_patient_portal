import { useEffect, useState } from "react";
import { CreditCard, Calendar, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import { getBilling } from "../api/records";

export default function BillingPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    getBilling()
      .then((d) => setBills(Array.isArray(d) ? d : []))
      .catch(() => setBills([]))
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = bills.filter((b) => b.payment_status).reduce((s, b) => s + (b.total_amount || 0), 0);
  const totalDue  = bills.filter((b) => !b.payment_status).reduce((s, b) => s + (b.total_amount || 0), 0);

  function toggleExpand(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <PageHeader title="Billing & Payments" />

      {!loading && bills.length > 0 && (
        <div className="px-4 pt-4 grid grid-cols-2 gap-3">
          <SummaryCard label="Total Paid" amount={totalPaid} icon={CheckCircle} color="bg-green-50 text-green-600" amountColor="text-green-700" />
          <SummaryCard label="Amount Due"  amount={totalDue}  icon={Clock}       color="bg-red-50 text-red-500"   amountColor="text-red-600" />
        </div>
      )}

      <div className="p-4 flex-1">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        ) : bills.length === 0 ? (
          <EmptyState icon={<CreditCard size={28} />} title="No billing records" subtitle="Your billing history will appear here after your visits." />
        ) : (
          <div className="space-y-3">
            {bills.map((bill, idx) => (
              <BillCard
                key={bill.appointment_id || idx}
                bill={bill}
                expanded={!!expanded[bill.appointment_id || idx]}
                onToggle={() => toggleExpand(bill.appointment_id || idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, amount, icon: Icon, color, amountColor }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-2`}><Icon size={18} /></div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-extrabold mt-0.5 ${amountColor}`}>₹{amount.toLocaleString("en-IN")}</p>
    </div>
  );
}

function BillCard({ bill, expanded, onToggle }) {
  const lineItems = bill.line_items || [];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors">
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${bill.payment_status ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
          <CreditCard size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{bill.reason || "Consultation"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-gray-400"><Calendar size={11} />{bill.date}</span>
            {bill.doctor_name && <span className="text-xs text-gray-400">· {bill.doctor_name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-extrabold text-gray-800">₹{(bill.total_amount || 0).toLocaleString("en-IN")}</p>
            <StatusBadge label={bill.payment_status ? "Paid" : "Unpaid"} />
          </div>
          {lineItems.length > 0 && (expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />)}
        </div>
      </button>

      {expanded && lineItems.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Breakdown</p>
          </div>
          <div className="divide-y divide-gray-50">
            {lineItems.map((item, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-2.5">
                <p className="text-sm text-gray-700 font-medium">{item.name}</p>
                <p className="text-sm font-bold text-gray-800">₹{(item.amount || 0).toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-sm font-bold text-gray-700">Total</p>
            <p className="text-base font-extrabold text-gray-900">₹{(bill.total_amount || 0).toLocaleString("en-IN")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
