import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../redux/slices/userSlice';
import { useNavigate } from 'react-router-dom';
import { MdDashboard } from 'react-icons/md';
import { FaUsers, FaCarSide, FaTools, FaFileAlt, FaList, FaPlug, FaProjectDiagram } from 'react-icons/fa';
import './Navbar.css';

export default function AppNavbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user || {});

  const name = user?.fullName || 'User';
  const role = user?.role || '';

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/auth');
  };

  const handleHomeNav = () => {
    if (role === 'Admin') navigate('/admin');
    else if (role === 'Process Technician') navigate('/process');
  };

  return (
    <nav className="navbar app-navbar navbar-light bg-white shadow-sm border-bottom">
      <div className="container-fluid d-flex align-items-center flex-wrap gap-2">

        {/* Logo */}
        <span className="navbar-brand d-flex align-items-center" style={{ cursor: 'pointer' }} onClick={handleHomeNav}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/02/Lear_Corporation_logo.svg"
            alt="Lear Corporation Logo"
            style={{ height: '38px' }}
          />
        </span>

        <ul className="navbar-nav flex-row flex-wrap align-items-center gap-1 gap-md-2 mb-0 me-auto">
          {role === 'Admin' && (
            <>
              <li className="nav-item">
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin')} title="Dashboard">
                  <span className="nav-text">Dashboard</span>
                  <MdDashboard className="nav-icon" aria-hidden="true" />
                </span>
              </li>
              <li className="nav-item">
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/users')} title="Users">
                  <span className="nav-text">Users</span>
                  <FaUsers className="nav-icon" aria-hidden="true" />
                </span>
              </li>
              <li className="nav-item">
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/operators')} title="Operators">
                  <span className="nav-text">Operators</span>
                  <FaTools className="nav-icon" aria-hidden="true" />
                </span>
              </li>
              <li className="nav-item">
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/projects')} title="Projects">
                  <span className="nav-text">Projects</span>
                  <FaCarSide className="nav-icon" aria-hidden="true" />
                </span>
              </li>
            </>
          )}

          {role === 'Process Technician' && (
            <>
              <li className="nav-item">
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/process')} title="Dashboard">
                  <span className="nav-text">Dashboard</span>
                  <MdDashboard className="nav-icon" aria-hidden="true" />
                </span>
              </li>
              <li className="nav-item">
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/operators')} title="Operators">
                  <span className="nav-text">Operators</span>
                  <FaTools className="nav-icon" aria-hidden="true" />
                </span>
              </li>
              <li className="nav-item">
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/projects')} title="Projects">
                  <span className="nav-text">Projects</span>
                  <FaCarSide className="nav-icon" aria-hidden="true" />
                </span>
              </li>
              <li className="nav-item">
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/work-instructions')} title="Work Instructions">
                  <span className="nav-text">Work Instructions</span>
                  <FaFileAlt className="nav-icon" aria-hidden="true" />
                </span>
              </li>
            </>
          )}

          {(role === 'Admin' || role === 'Process Technician') && (
            <>
              <li className="nav-item">
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/editor/epns')} title="EPNs">
                  <span className="nav-text">EPNs</span>
                  <FaList className="nav-icon" aria-hidden="true" />
                </span>
              </li>
              <li className="nav-item">
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/editor/connectors')} title="Connectors">
                  <span className="nav-text">Connectors</span>
                  <FaPlug className="nav-icon" aria-hidden="true" />
                </span>
              </li>
              <li className="nav-item">
                <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/editor/wires')} title="Wires">
                  <span className="nav-text">Wires</span>
                  <FaProjectDiagram className="nav-icon" aria-hidden="true" />
                </span>
              </li>
            </>
          )}
        </ul>

        {/* Right side */}
        <div className="d-flex align-items-center gap-2 gap-md-3 ms-auto">
          <span className="text-dark fw-semibold navbar-user">
            {name}{' '}
            {role && <span className="badge bg-danger text-white ms-1">{role}</span>}
          </span>
          <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
        </div>

      </div>
    </nav>
  );
}