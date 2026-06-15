import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { CriticalIncidentModal } from './components/CriticalIncidentModal';
import { CriticalIncidentProvider, useCriticalIncident } from './contexts/CriticalIncidentContext';
import Dashboard from './pages/Dashboard';
import IncidentReport from './pages/IncidentReport';
import DriftHistory from './pages/DriftHistory';
import Settings from './pages/Settings';

function AppContent() {
  const { isOpen, incident, closeCriticalAlert } = useCriticalIncident();

  return (
    <>
      <BrowserRouter>
        <Toaster position="top-right" theme="system" />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="incidents" element={<IncidentReport />} />
            <Route path="incidents/:incidentId" element={<IncidentReport />} />
            <Route path="drift-history" element={<DriftHistory />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>

      {incident && (
        <CriticalIncidentModal
          isOpen={isOpen}
          onClose={closeCriticalAlert}
          incidentId={incident.incidentId}
          serviceName={incident.serviceName}
          severity={incident.severity}
        />
      )}
    </>
  );
}

function App() {
  return (
    <CriticalIncidentProvider>
      <AppContent />
    </CriticalIncidentProvider>
  );
}

export default App;
