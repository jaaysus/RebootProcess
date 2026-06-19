import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, registerUser, fetchRoles } from '../redux/slices/userSlice';
import Message from '../components/Message';
import './Auth.css';

export default function Auth() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    user,
    token,
    loading: reduxLoading,
    registerLoading,
    roles: rolesFromState,
    rolesLoading,
    rolesError,
  } = useSelector((state) => state.user);

  // ── View toggle ──────────────────────────────────────────────────────────
  const [showRegister, setShowRegister] = useState(false);
  const [animating, setAnimating]       = useState(false);

  // ── Login state ──────────────────────────────────────────────────────────
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError,    setLoginError]    = useState('');
  const [loginLoading,  setLoginLoading]  = useState(false);

  // ── Register state ───────────────────────────────────────────────────────
  const [fullName,    setFullName]    = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [badge,       setBadge]       = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [role,        setRole]        = useState('');
  const [regError,   setRegError]   = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // ── Fetch roles once ─────────────────────────────────────────────────────
  useEffect(() => { dispatch(fetchRoles()); }, [dispatch]);

  useEffect(() => {
    if (rolesFromState.length && !role) setRole(rolesFromState[0]);
  }, [rolesFromState, role]);

  // ── Auto-redirect if already logged in ──────────────────────────────────
  useEffect(() => {
    const localToken = localStorage.getItem('authToken');
    const localUser  = localStorage.getItem('user');

    if ((token && user) || (localToken && localUser)) {
      const loggedInUser = user || JSON.parse(localUser);
      const userRole = loggedInUser?.role;

      if      (userRole === 'Admin')              navigate('/admin');
      else if (userRole === 'Process Technician') navigate('/process');
    }
  }, [token, user, navigate]);

  // ── Panel switch ─────────────────────────────────────────────────────────
  const switchTo = (target) => {
    setAnimating(true);
    setTimeout(() => {
      setShowRegister(target === 'register');
      setAnimating(false);
    }, 250);
  };

  // ── Login submit ─────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const resultAction = await dispatch(loginUser({ email: loginEmail, password: loginPassword }));

      if (loginUser.fulfilled.match(resultAction)) {
        const loggedInUser = resultAction.payload.user;
        const userRole = loggedInUser?.role;

        if      (userRole === 'Admin')                                                   navigate('/admin');
        else if (userRole === 'Process Technician' || userRole === 'ProcessTechnician') navigate('/process');
      } else {
        setLoginError(resultAction.payload || 'Login failed. Please try again.');
      }
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Register submit ──────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    try {
      const userData = { fullName, email: regEmail, badge, password: regPassword, role };
      const resultAction = await dispatch(registerUser(userData));

      if (registerUser.fulfilled.match(resultAction)) {
        setFullName(''); setRegEmail(''); setRegPassword(''); setBadge(''); setRole('');
        setRegSuccess('Registered! Contact an Admin for approval.');
        //setTimeout(() => switchTo('login'), 4000);
      } else {
        setRegError(resultAction.payload || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setRegError(err.message || 'Registration failed. Please try again.');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="auth-container">
      <Message type="error" message={loginError} />
      <Message type="error" message={regError || rolesError} />
      <Message type="success" message={regSuccess} />

      <div className="card shadow-sm p-4 auth-card position-relative overflow-hidden">

        {/* ════════════ STATIC HEADER ════════════ */}
        <div className="text-center mb-3">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/02/Lear_Corporation_logo.svg"
            alt="Lear Logo"
            style={{ width: 120 }}
          />
        </div>
        <h2 className="text-center mb-2">Dynamic Digital WI</h2>
        <p className="text-center text-muted mb-4">Engineer Portal</p>

        {/* ════════════ ANIMATED FORM AREA ════════════ */}
        <div className={`auth-panel-wrapper ${animating ? 'auth-panel-fade-out' : 'auth-panel-fade-in'}`}>

          {/* ════════════ LOGIN PANEL ════════════ */}
          {!showRegister && (
            <>
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={loginLoading || reduxLoading}
                  />
                </div>

                <div className="mb-3">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={loginLoading || reduxLoading}
                  />
                </div>

                <button className="btn btn-danger w-100 py-2" disabled={loginLoading || reduxLoading}>
                  {loginLoading || reduxLoading ? 'LOGGING IN...' : 'LOGIN'}
                </button>
              </form>

              <p className="text-center mt-3">
                No account?{' '}
                <span className="auth-link" onClick={() => switchTo('register')}>
                  Register
                </span>
              </p>
            </>
          )}

          {/* ════════════ REGISTER PANEL ════════════ */}
          {showRegister && (
            <>
              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label>Full Name</label>
                  <input
                    className="form-control"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label>Role</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={rolesLoading}
                    required
                  >
                    <option value="">Select role</option>
                    {rolesFromState.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <button className="btn btn-danger w-100 py-2" disabled={registerLoading}>
                  {registerLoading ? 'REGISTERING...' : 'REGISTER'}
                </button>
              </form>

              <p className="text-center mt-3">
                Already have an account?{' '}
                <span className="auth-link" onClick={() => switchTo('login')}>
                  Login
                </span>
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}