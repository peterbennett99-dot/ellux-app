import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { useApp } from '../lib/store';

const icons = {
  success: <CheckCircle size={16} className="text-green-400" />,
  error: <XCircle size={16} className="text-red-400" />,
  warning: <AlertCircle size={16} className="text-amber-400" />,
  info: <Info size={16} className="text-blue-400" />,
};

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 fade-in glass flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl max-w-sm w-[90vw]"
      style={{ borderColor: 'rgba(0,198,255,0.2)' }}
    >
      {icons[toast.type] || icons.info}
      <span className="text-sm text-slate-200">{toast.message}</span>
    </div>
  );
}
