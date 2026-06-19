import { useSelector } from 'react-redux';
import AppNavbar from '../../../components/Navbar';

export default function ProcessTechnicianDashboard() {
  const { user } = useSelector((state) => state.user || {});
  const name = user?.fullName || 'User';

  return (
    <>
      <AppNavbar />
      <div className="container mt-4">
        <h1>Hello Mr {name}</h1>
      </div>
    </>
  );
}