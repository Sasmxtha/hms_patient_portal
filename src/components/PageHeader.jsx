import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Reusable teal header bar.
 * Props:
 *   title      — string
 *   back       — boolean (show back arrow)
 *   right      — ReactNode (optional right slot)
 */
export default function PageHeader({ title, back = false, right }) {
  const navigate = useNavigate();
  return (
    <div className="bg-[#115E59] text-white px-5 pt-12 pb-5 flex items-center relative">
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="absolute left-5 text-teal-100 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>
      )}
      <h1 className="w-full text-center text-base font-bold tracking-wide">{title}</h1>
      {right && <div className="absolute right-5">{right}</div>}
    </div>
  );
}
