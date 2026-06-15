import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface CriticalIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string;
  serviceName: string;
  severity: 'low' | 'medium' | 'high';
}

export const CriticalIncidentModal = ({
  isOpen,
  onClose,
  incidentId,
  serviceName,
  severity,
}: CriticalIncidentModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(onClose, 8000);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md animate-critical-pulse"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Outer glow effect */}
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            boxShadow: '0 0 40px rgba(255, 0, 0, 0.6), 0 0 80px rgba(255, 0, 0, 0.3)',
            animation: 'critical-glow-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />

        {/* Modal card */}
        <div
          className="relative rounded-lg border-2 bg-[#0b0e14] p-6 backdrop-blur-xl"
          style={{
            borderColor: '#ff4444',
            boxShadow: '0 0 30px rgba(255, 0, 0, 0.5), inset 0 0 20px rgba(255, 0, 0, 0.1)',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-red-500 hover:text-red-400 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          {/* Alert Icon */}
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle
              size={48}
              className="text-red-500 animate-pulse"
              style={{ animation: 'critical-bounce 0.8s ease-in-out infinite' }}
            />
          </div>

          {/* Critical Label */}
          <div className="text-center mb-4">
            <div
              className="text-3xl font-black tracking-widest"
              style={{
                color: '#ff4444',
                textShadow: '0 0 20px rgba(255, 0, 0, 0.8)',
              }}
            >
              CRITICAL
            </div>
            <div className="text-xs uppercase tracking-widest text-red-400/60 mt-1">
              Incident Detected
            </div>
          </div>

          {/* Incident Details */}
          <div className="space-y-4 mb-6">
            {/* Incident ID */}
            <div className="bg-[rgba(255,0,0,0.05)] rounded-lg border border-red-600/30 p-4">
              <div className="text-xs uppercase tracking-widest text-red-400/70 mb-1">
                Incident Number
              </div>
              <div className="text-lg font-mono font-bold text-white break-all">
                {incidentId}
              </div>
            </div>

            {/* Service Name */}
            <div className="bg-[rgba(255,0,0,0.05)] rounded-lg border border-red-600/30 p-4">
              <div className="text-xs uppercase tracking-widest text-red-400/70 mb-1">
                Service
              </div>
              <div className="text-lg font-bold text-red-300">
                {serviceName}
              </div>
            </div>

            {/* Severity Badge */}
            <div className="bg-[rgba(255,0,0,0.05)] rounded-lg border border-red-600/30 p-4">
              <div className="text-xs uppercase tracking-widest text-red-400/70 mb-1">
                Severity Level
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{
                    backgroundColor: '#ff4444',
                    boxShadow: '0 0 10px rgba(255, 0, 0, 0.8)',
                  }}
                />
                <div className="text-lg font-bold text-red-300 uppercase">
                  {severity}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                window.location.href = `/incidents/${incidentId}`;
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,0,0,0.6)]"
            >
              Review Incident
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-red-500 text-red-400 hover:text-red-300 hover:border-red-400 font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          </div>

          {/* Auto-dismiss timer message */}
          <div className="text-xs text-center text-red-400/50 mt-4">
            Modal auto-dismisses in 8 seconds
          </div>
        </div>
      </div>
    </div>
  );
};
