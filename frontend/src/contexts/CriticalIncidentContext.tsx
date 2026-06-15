import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface CriticalIncident {
  incidentId: string;
  serviceName: string;
  severity: 'low' | 'medium' | 'high';
  isDemo?: boolean;
}

interface CriticalIncidentContextType {
  isOpen: boolean;
  incident: CriticalIncident | null;
  triggerCriticalAlert: (incident: CriticalIncident, options?: { force?: boolean }) => void;
  closeCriticalAlert: () => void;
}

const SESSION_DEMO_KEY = 'stageTrace:criticalDemoShown';
const SESSION_DISMISSED_KEY = 'stageTrace:dismissedIncidents';

const CriticalIncidentContext = createContext<
  CriticalIncidentContextType | undefined
>(undefined);

function getDismissedIds(): string[] {
  try {
    const raw = sessionStorage.getItem(SESSION_DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function addDismissedId(id: string) {
  try {
    const ids = getDismissedIds();
    if (!ids.includes(id)) {
      ids.push(id);
      sessionStorage.setItem(SESSION_DISMISSED_KEY, JSON.stringify(ids));
    }
  } catch (e) {
    // ignore
  }
}

export const CriticalIncidentProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [incident, setIncident] = useState<CriticalIncident | null>(null);

  const triggerCriticalAlert = (newIncident: CriticalIncident, options?: { force?: boolean }) => {
    try {
      // If forced (manual demo button), bypass storage checks and always open
      if (options?.force) {
        setIncident(newIncident);
        setIsOpen(true);
        return;
      }

      // Demo flow: only show once per session
      if (newIncident.isDemo) {
        if (sessionStorage.getItem(SESSION_DEMO_KEY) === 'true') return;
        sessionStorage.setItem(SESSION_DEMO_KEY, 'true');
      } else {
        // Real data: avoid re-triggering for the same incident or if dismissed
        const dismissed = getDismissedIds();
        if (dismissed.includes(newIncident.incidentId)) return;
        if (incident && incident.incidentId === newIncident.incidentId && isOpen) return;
      }

      setIncident(newIncident);
      setIsOpen(true);
    } catch (e) {
      // fallback to safe behaviour
      setIncident(newIncident);
      setIsOpen(true);
    }
  };

  const closeCriticalAlert = () => {
    try {
      if (incident) {
        if (incident.isDemo) {
          sessionStorage.setItem(SESSION_DEMO_KEY, 'true');
        } else {
          addDismissedId(incident.incidentId);
        }
      }
    } catch (e) {
      // ignore storage errors
    }

    setIsOpen(false);
    setIncident(null);
  };

  return (
    <CriticalIncidentContext.Provider
      value={{
        isOpen,
        incident,
        triggerCriticalAlert,
        closeCriticalAlert,
      }}
    >
      {children}
    </CriticalIncidentContext.Provider>
  );
};

export const useCriticalIncident = () => {
  const context = useContext(CriticalIncidentContext);
  if (context === undefined) {
    throw new Error(
      'useCriticalIncident must be used within CriticalIncidentProvider'
    );
  }
  return context;
};
