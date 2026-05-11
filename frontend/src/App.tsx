import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import IncidentReport from './pages/IncidentReport';
import DriftHistory from './pages/DriftHistory';
import Settings from './pages/Settings';

function App() {
  return (
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
  );
}

export default App;
