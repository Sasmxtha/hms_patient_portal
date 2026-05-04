/**
 * Generic empty state card.
 * Props: icon (ReactNode), title, subtitle, action (ReactNode)
 */
export default function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-gray-700 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 mb-4">{subtitle}</p>}
      {action}
    </div>
  );
}
