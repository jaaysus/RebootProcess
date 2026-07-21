import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import AdminDashboard from './pages/EngineerSpace/Admin/AdminDashboard';
import ProcessTechnicianDashboard from './pages/EngineerSpace/Process/ProcessTechnicianDashboard';
import Station from './components/Station';
import OperatorSpace from './pages/OperatorSpace/OperatorSpace';
import Home from './pages/Home';
import UsersTable from './pages/EngineerSpace/Admin/UsersTable';
import OperatorsTable from './pages/EngineerSpace/Admin/OperatorsTable';
import Editor from './modules/editor/Editor';
import WireDataDisplay from './pages/EngineerSpace/Process/WireDataDisplay';
import ModuleLists from './pages/EngineerSpace/Process/ModuleLists';

function App() {
  return (
    <Routes>
      <Route path="/"                 element={<Home />} />
      <Route path="/auth"             element={<Auth />} />
      <Route path="/station/:stationId" element={<Station />} />
      <Route path="/operator"         element={<OperatorSpace />} />
      <Route path="/editor/*" element={<ProtectedRoute requiredRoles={['Admin', 'Process Technician']}><Editor /></ProtectedRoute>} />
      <Route path="/wire-data" element={<ProtectedRoute requiredRoles={['Admin', 'Process Technician']}><WireDataDisplay /></ProtectedRoute>} />
      <Route path="/admin"     element={<ProtectedRoute requiredRoles={['Admin']}                      ><AdminDashboard /></ProtectedRoute>} />
      <Route path="/users"     element={<ProtectedRoute requiredRoles={['Admin']}                      ><UsersTable /></ProtectedRoute>} />
      <Route path="/operators" element={<ProtectedRoute requiredRoles={['Admin', 'Process Technician']}><OperatorsTable /></ProtectedRoute>} />
      <Route path="/module-lists" element={<ProtectedRoute requiredRoles={['Admin', 'Process Technician']}><ModuleLists /></ProtectedRoute>} />
      <Route path="/process"   element={<ProtectedRoute requiredRoles={['Process Technician']}         ><ProcessTechnicianDashboard /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;