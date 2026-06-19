import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const handleEngineerSpaceClick = () => {
    const localToken = localStorage.getItem('authToken');
    const localUser = localStorage.getItem('user');

    if (localToken && localUser) {
      const user = JSON.parse(localUser);
      const role = user?.role;

      if (role === 'Admin') navigate('/admin');
      else if (role === 'Process Technician') navigate('process');
      else navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        gap: 40,
        justifyContent: 'center',
        alignItems: 'center',
        background: '#111',
      }}
    >
      <button
        onClick={handleEngineerSpaceClick}
        style={{
          padding: '40px 80px',
          fontSize: 28,
          cursor: 'pointer',
        }}
      >
        Engineer Space
      </button>

      <button
        onClick={() => navigate('operator')}
        style={{
          padding: '40px 80px',
          fontSize: 28,
          cursor: 'pointer',
        }}
      >
        Operator Space
      </button>
    </div>
  );
}

export default Home;
