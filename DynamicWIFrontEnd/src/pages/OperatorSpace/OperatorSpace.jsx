import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import './OperatorSpace.css';
import scannerLogo from '../../assets/scanner.svg';
import { api } from '../../redux/api';
import { loginSuccess, logout as logoutAction } from '../../redux/slices/operatorSlice';

function OperatorSpace() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [status, setStatus] = useState('idle');
  const [bannerText, setBannerText] = useState('');
  const [badgeNum, setBadgeNum] = useState('');
  const [password, setPassword] = useState('');
  const [phase, setPhase] = useState('badge'); // badge | password
  const [operator, setOperator] = useState(
    JSON.parse(localStorage.getItem('op_user'))
  );

  const badgeInputRef = useRef(null);
  const lockedRef = useRef(false);

  // ================= RESTORE SESSION =================
  useEffect(() => {
    const token = localStorage.getItem('op_token');
    const user = localStorage.getItem('op_user');
    if (token && user) setOperator(JSON.parse(user));
  }, []);

  // ================= FOCUS =================
  useEffect(() => {
    if (phase === 'badge') badgeInputRef.current?.focus();
  }, [phase]);

  // ================= PASSWORD SCAN (PASTE) =================
  useEffect(() => {
    if (phase !== 'password') return;

    const handlePaste = (e) => {
      if (lockedRef.current) return;

      const scanned = e.clipboardData.getData('text').trim();
      if (!scanned) return;

      setPassword(scanned);
      lockedRef.current = true;

      handleLogin(badgeNum, scanned);
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [phase, badgeNum]);

  // ================= LOGIN =================
  const handleLogin = async (badge, pass) => {
    try {
      const res = await api.post('/operators/login', {
        badge: badge.toUpperCase(),
        password: pass
      });

      dispatch(loginSuccess(res.data));
      setOperator(res.data.operatorInfo);

      setBannerText('Access Granted');
      setStatus('success');

      setTimeout(() => {
        setStatus('idle');
        setBannerText('');
        lockedRef.current = false;
        setPhase('badge');
        setBadgeNum('');
        setPassword('');
      }, 1000);

    } catch (err) {
      setBannerText('Access Denied');
      setStatus('error');

      setTimeout(() => {
        setStatus('idle');
        setBannerText('');
        lockedRef.current = false;
        setPhase('badge');
        setPassword('');
        badgeInputRef.current?.focus();
      }, 1400);
    }
  };

  // ================= BADGE ENTER =================
  const handleBadgeSubmit = () => {
    if (!badgeNum.trim()) return;
    setPhase('password'); // switch to scan mode
  };

  // ================= LOGOUT =================
  const handleLogout = async () => {
    try { await api.post('/operators/logout'); } catch {}
    dispatch(logoutAction());
    setOperator(null);
    setPhase('badge');
    setBadgeNum('');
    setPassword('');
    badgeInputRef.current?.focus();
  };

  return (
    <div className="scan-page">
      {status !== 'idle' && (
        <div className={`scan-banner ${status}`}>
          {bannerText}
        </div>
      )}

      {!operator ? (
        <>
          {phase === 'badge' && (
            <div className="badgeNum-entry">
              <input
                ref={badgeInputRef}
                type="text"
                placeholder="Enter Badge Number"
                value={badgeNum}
                onChange={(e) => setBadgeNum(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBadgeSubmit()}
              />
              <button onClick={handleBadgeSubmit}>Enter</button>
            </div>
          )}

          {phase === 'password' && (
            <div className="scan-header">
              <div className="scanner-logo">
                <img src={scannerLogo} alt="Scanner Logo" />
              </div>
              <div className="scan-text">
                Scan Password<span className="dots"></span>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="scan-header">
            <div className="scanner-logo">
              <img src={scannerLogo} alt="Scanner Logo" />
            </div>
            <div className="scan-text">
              Waiting for scan<span className="dots"></span>
            </div>
          </div>

          <div
            className="operator-name"
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              color: 'green',
              fontSize: '4em',
            }}
          >
            {operator.fullName}
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: 'min(35vw, 300px)',
              height: 'min(12vh, 120px)',
              fontSize: 'clamp(16px, 2vw, 20px)',
              cursor: 'pointer',
              position: 'absolute',
              bottom: '10px',
              right: '10px',
            }}
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}

export default OperatorSpace;
